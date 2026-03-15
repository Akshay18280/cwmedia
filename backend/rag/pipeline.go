package rag

import (
	"context"
	"fmt"
	"log"

	"github.com/akshayverma/cwmedia-backend/documents"
	"github.com/akshayverma/cwmedia-backend/embeddings"
	"github.com/akshayverma/cwmedia-backend/services"
	"github.com/akshayverma/cwmedia-backend/vectorstore"
)

// Pipeline orchestrates the full RAG flow.
type Pipeline struct {
	embedder *embeddings.Embedder
	store    *vectorstore.Store
	llm      *services.LLMService
	chunkSz  int
	overlap  int
	topK     int
}

// NewPipeline creates a new RAG pipeline.
func NewPipeline(
	embedder *embeddings.Embedder,
	store *vectorstore.Store,
	llm *services.LLMService,
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
func (p *Pipeline) Query(ctx context.Context, question string) (string, error) {
	// Step 1: Embed the question
	qEmbed, err := p.embedder.Embed(ctx, question)
	if err != nil {
		return "", fmt.Errorf("failed to embed question: %w", err)
	}

	// Step 2: Similarity search
	results, err := p.store.Search(ctx, qEmbed, p.topK)
	if err != nil {
		return "", fmt.Errorf("vector search failed: %w", err)
	}

	if len(results) == 0 {
		return "No relevant documents found. Please upload a document first.", nil
	}

	// Step 3: Collect context chunks
	contextChunks := make([]string, len(results))
	for i, r := range results {
		contextChunks[i] = r.Content
	}

	log.Printf("Retrieved %d chunks for question: %q", len(results), question)

	// Step 4: Generate answer via LLM
	answer, err := p.llm.GenerateAnswer(ctx, contextChunks, question)
	if err != nil {
		return "", fmt.Errorf("LLM generation failed: %w", err)
	}

	return answer, nil
}
