package rag

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/akshayverma/cwmedia-backend/documents"
	"github.com/akshayverma/cwmedia-backend/embeddings"
	"github.com/akshayverma/cwmedia-backend/services"
	"github.com/akshayverma/cwmedia-backend/vectorstore"
)

// QueryResult is the enriched response from the RAG pipeline.
type QueryResult struct {
	Answer        string                   `json:"answer"`
	Sources       []vectorstore.SearchResult `json:"sources"`
	Metrics       QueryMetrics             `json:"metrics"`
	PromptPreview PromptPreview            `json:"prompt_preview"`
}

// QueryMetrics holds latency breakdown and usage stats.
type QueryMetrics struct {
	TotalMs            int64 `json:"total_ms"`
	EmbedMs            int64 `json:"embed_ms"`
	SearchMs           int64 `json:"search_ms"`
	LLMMs              int64 `json:"llm_ms"`
	ChunksFound        int   `json:"chunks_found"`
	PromptTokensApprox int   `json:"prompt_tokens_approx"`
}

// PromptPreview shows the prompts sent to the LLM.
type PromptPreview struct {
	SystemPrompt string `json:"system_prompt"`
	UserPrompt   string `json:"user_prompt"`
}

// Pipeline orchestrates the full RAG flow.
type Pipeline struct {
	embedder *embeddings.Embedder
	store    *vectorstore.Store
	llm      services.LLMProvider
	chunkSz  int
	overlap  int
	topK     int
}

// NewPipeline creates a new RAG pipeline.
func NewPipeline(
	embedder *embeddings.Embedder,
	store *vectorstore.Store,
	llm services.LLMProvider,
	chunkSize, chunkOverlap, topK int,
) *Pipeline {
	return &Pipeline{
		embedder: embedder,
		store:    store,
		llm:      llm,
		chunkSz:  chunkSize,
		overlap:  chunkOverlap,
		topK:     topK,
	}
}

// Store returns the underlying vector store for direct queries.
func (p *Pipeline) Store() *vectorstore.Store {
	return p.store
}

// IngestDocument processes a file: extract text → chunk → embed → store.
func (p *Pipeline) IngestDocument(ctx context.Context, filePath, filename string) error {
	// Step 1: Extract text
	text, err := documents.ExtractText(filePath)
	if err != nil {
		return fmt.Errorf("text extraction failed: %w", err)
	}

	log.Printf("Extracted %d characters from %s", len(text), filename)

	// Step 2: Chunk
	chunks := documents.SplitTextIntoChunks(text, p.chunkSz, p.overlap)
	if len(chunks) == 0 {
		return fmt.Errorf("no chunks produced from document")
	}

	log.Printf("Split into %d chunks (size=%d, overlap=%d)", len(chunks), p.chunkSz, p.overlap)

	// Step 3: Generate embeddings (batch for efficiency)
	const batchSize = 20
	allEmbeddings := make([][]float32, 0, len(chunks))

	for i := 0; i < len(chunks); i += batchSize {
		end := i + batchSize
		if end > len(chunks) {
			end = len(chunks)
		}

		batch, err := p.embedder.EmbedBatch(ctx, chunks[i:end])
		if err != nil {
			return fmt.Errorf("embedding batch %d-%d failed: %w", i, end, err)
		}
		allEmbeddings = append(allEmbeddings, batch...)
	}

	log.Printf("Generated %d embeddings", len(allEmbeddings))

	// Step 4: Store in vector database
	docID, err := p.store.InsertDocument(ctx, filename)
	if err != nil {
		return fmt.Errorf("failed to record document: %w", err)
	}

	if err := p.store.InsertChunks(ctx, docID, chunks, allEmbeddings); err != nil {
		return fmt.Errorf("failed to store chunks: %w", err)
	}

	log.Printf("Document %s ingested successfully (id=%s, chunks=%d)", filename, docID, len(chunks))
	return nil
}

// Query runs the retrieval + generation pipeline for a user question.
func (p *Pipeline) Query(ctx context.Context, question string) (*QueryResult, error) {
	totalStart := time.Now()

	// Step 1: Embed the question
	embedStart := time.Now()
	qEmbed, err := p.embedder.Embed(ctx, question)
	if err != nil {
		return nil, fmt.Errorf("failed to embed question: %w", err)
	}
	embedMs := time.Since(embedStart).Milliseconds()

	// Step 2: Similarity search
	searchStart := time.Now()
	results, err := p.store.Search(ctx, qEmbed, p.topK)
	if err != nil {
		return nil, fmt.Errorf("vector search failed: %w", err)
	}
	searchMs := time.Since(searchStart).Milliseconds()

	if len(results) == 0 {
		return &QueryResult{
			Answer:  "No relevant documents found. Please upload a document first.",
			Sources: []vectorstore.SearchResult{},
			Metrics: QueryMetrics{
				TotalMs:     time.Since(totalStart).Milliseconds(),
				EmbedMs:     embedMs,
				SearchMs:    searchMs,
				ChunksFound: 0,
			},
			PromptPreview: PromptPreview{
				SystemPrompt: services.SystemPrompt,
				UserPrompt:   question,
			},
		}, nil
	}

	// Step 3: Collect context chunks
	contextChunks := make([]string, len(results))
	for i, r := range results {
		contextChunks[i] = r.Content
	}

	log.Printf("Retrieved %d chunks for question: %q", len(results), question)

	// Build prompt preview
	userPrompt := services.BuildUserPrompt(contextChunks, question)

	// Step 4: Generate answer via LLM
	llmStart := time.Now()
	answer, err := p.llm.GenerateAnswer(ctx, contextChunks, question)
	if err != nil {
		return nil, fmt.Errorf("LLM generation failed: %w", err)
	}
	llmMs := time.Since(llmStart).Milliseconds()

	totalMs := time.Since(totalStart).Milliseconds()

	return &QueryResult{
		Answer:  answer,
		Sources: results,
		Metrics: QueryMetrics{
			TotalMs:            totalMs,
			EmbedMs:            embedMs,
			SearchMs:           searchMs,
			LLMMs:              llmMs,
			ChunksFound:        len(results),
			PromptTokensApprox: len(strings.Fields(userPrompt)),
		},
		PromptPreview: PromptPreview{
			SystemPrompt: services.SystemPrompt,
			UserPrompt:   userPrompt,
		},
	}, nil
}

// StepEvent represents a pipeline step for SSE streaming.
type StepEvent struct {
	Step       string `json:"step"`
	Status     string `json:"status"`
	DurationMs int64  `json:"duration_ms,omitempty"`
	ChunksFound int   `json:"chunks_found,omitempty"`
}

// StreamCallbacks holds SSE event callbacks.
type StreamCallbacks struct {
	OnStep    func(StepEvent)
	OnToken   func(string)
	OnSources func([]vectorstore.SearchResult)
	OnMetrics func(QueryMetrics)
}

// QueryStream runs the RAG pipeline with streaming LLM output.
func (p *Pipeline) QueryStream(ctx context.Context, question string, cb StreamCallbacks) error {
	totalStart := time.Now()

	// Step 1: Embed
	cb.OnStep(StepEvent{Step: "embedding", Status: "started"})
	embedStart := time.Now()
	qEmbed, err := p.embedder.Embed(ctx, question)
	if err != nil {
		return fmt.Errorf("failed to embed question: %w", err)
	}
	embedMs := time.Since(embedStart).Milliseconds()
	cb.OnStep(StepEvent{Step: "embedding", Status: "completed", DurationMs: embedMs})

	// Step 2: Search
	cb.OnStep(StepEvent{Step: "search", Status: "started"})
	searchStart := time.Now()
	results, err := p.store.Search(ctx, qEmbed, p.topK)
	if err != nil {
		return fmt.Errorf("vector search failed: %w", err)
	}
	searchMs := time.Since(searchStart).Milliseconds()
	cb.OnStep(StepEvent{Step: "search", Status: "completed", DurationMs: searchMs, ChunksFound: len(results)})

	if len(results) == 0 {
		cb.OnToken("No relevant documents found. Please upload a document first.")
		cb.OnSources([]vectorstore.SearchResult{})
		cb.OnMetrics(QueryMetrics{
			TotalMs:  time.Since(totalStart).Milliseconds(),
			EmbedMs:  embedMs,
			SearchMs: searchMs,
		})
		return nil
	}

	// Step 3: Retrieve context
	cb.OnStep(StepEvent{Step: "retrieve", Status: "started"})
	contextChunks := make([]string, len(results))
	for i, r := range results {
		contextChunks[i] = r.Content
	}
	cb.OnStep(StepEvent{Step: "retrieve", Status: "completed"})
	cb.OnSources(results)

	// Step 4: Build prompt
	cb.OnStep(StepEvent{Step: "prompt", Status: "started"})
	userPrompt := services.BuildUserPrompt(contextChunks, question)
	cb.OnStep(StepEvent{Step: "prompt", Status: "completed", DurationMs: 0})

	// Step 5: Generate (streaming)
	cb.OnStep(StepEvent{Step: "generate", Status: "started"})
	llmStart := time.Now()
	tokenCh := make(chan string, 64)

	errCh := make(chan error, 1)
	go func() {
		defer close(tokenCh)
		errCh <- p.llm.GenerateAnswerStream(ctx, contextChunks, question, tokenCh)
	}()

	for token := range tokenCh {
		cb.OnToken(token)
	}

	if err := <-errCh; err != nil {
		return fmt.Errorf("LLM streaming failed: %w", err)
	}

	llmMs := time.Since(llmStart).Milliseconds()
	cb.OnStep(StepEvent{Step: "generate", Status: "completed", DurationMs: llmMs})

	totalMs := time.Since(totalStart).Milliseconds()
	cb.OnMetrics(QueryMetrics{
		TotalMs:            totalMs,
		EmbedMs:            embedMs,
		SearchMs:           searchMs,
		LLMMs:              llmMs,
		ChunksFound:        len(results),
		PromptTokensApprox: len(strings.Fields(userPrompt)),
	})

	return nil
}
