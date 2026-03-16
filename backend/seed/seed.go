package seed

import (
	"context"
	"log"
	"os"
	"path/filepath"

	"github.com/akshayverma/cwmedia-backend/rag"
	"github.com/akshayverma/cwmedia-backend/vectorstore"
)

func writeTempFile(filename, content string) (string, error) {
	path := filepath.Join(os.TempDir(), "seed-"+filename)
	return path, os.WriteFile(path, []byte(content), 0644)
}

func removeTempFile(path string) {
	_ = os.Remove(path)
}

// exampleDoc holds an embedded example document.
type exampleDoc struct {
	Filename string
	Content  string
}

var exampleDocs = []exampleDoc{
	{
		Filename: "rag-architecture-overview.md",
		Content: `# Retrieval-Augmented Generation (RAG) Architecture Overview

Retrieval-Augmented Generation (RAG) is a technique that enhances large language models by grounding their responses in external knowledge. Instead of relying solely on the model's training data, RAG systems retrieve relevant documents at query time and include them as context for the LLM.

## Core Components

A typical RAG pipeline consists of four stages:

1. **Document Ingestion**: Raw documents (PDFs, text files, markdown) are ingested into the system. The text is extracted, cleaned, and split into smaller chunks for efficient retrieval.

2. **Embedding Generation**: Each chunk is converted into a dense vector representation (embedding) that captures its semantic meaning. These embeddings enable similarity-based search rather than simple keyword matching.

3. **Vector Storage**: Embeddings are stored in a vector database (such as pgvector, Pinecone, or Weaviate) with HNSW or IVFFlat indexes for fast approximate nearest-neighbor search.

4. **Query Pipeline**: When a user asks a question, it is embedded using the same model, the most similar chunks are retrieved, and they are passed as context to the LLM to generate a grounded answer.

## Why RAG Matters

RAG addresses several fundamental limitations of standalone LLMs:
- **Hallucination reduction**: By grounding answers in retrieved context, the model is less likely to fabricate information.
- **Knowledge freshness**: Documents can be updated without retraining the model.
- **Domain specificity**: Organizations can build knowledge bases tailored to their specific domain.
- **Auditability**: Users can verify answers by inspecting the source chunks that informed the response.

## Chunking Strategies

Effective chunking is critical for retrieval quality. Common strategies include:
- **Fixed-size chunking**: Split text every N tokens with optional overlap. Simple and predictable.
- **Semantic chunking**: Split at paragraph or section boundaries to preserve context.
- **Recursive chunking**: Attempt splits at paragraph level, fall back to sentences, then tokens.

Chunk size is a trade-off: smaller chunks improve precision but lose context; larger chunks preserve context but reduce retrieval granularity.`,
	},
	{
		Filename: "vector-databases-explained.md",
		Content: `# Vector Databases Explained

Vector databases are specialized storage systems designed for high-dimensional vector data. They power similarity search in AI applications including RAG systems, recommendation engines, image search, and anomaly detection.

## How Vector Search Works

Traditional databases search by exact matches or range queries. Vector databases instead find the "nearest neighbors" to a query vector using distance metrics:

- **Cosine Similarity**: Measures the angle between vectors. Values range from -1 to 1, where 1 means identical direction. Best for text embeddings where magnitude is less important than direction.
- **Euclidean Distance (L2)**: Measures straight-line distance between points. Smaller values mean more similar. Sensitive to vector magnitude.
- **Inner Product (Dot Product)**: Combines both direction and magnitude. Often used when vectors are normalized.

## Indexing Algorithms

Exact nearest-neighbor search requires comparing the query against every vector, which is O(n). Vector databases use approximate nearest-neighbor (ANN) algorithms:

- **HNSW (Hierarchical Navigable Small World)**: Builds a multi-layer graph where each layer is a "small world" network. Offers excellent recall and query speed. Used by pgvector, Qdrant, and Weaviate.
- **IVFFlat (Inverted File with Flat Quantization)**: Partitions vectors into clusters using k-means, then searches only relevant clusters. Faster to build but lower recall than HNSW.
- **ScaNN (Scalable Nearest Neighbors)**: Google's algorithm using asymmetric hashing. Optimized for large-scale deployments.

## pgvector: PostgreSQL Extension

pgvector brings vector operations directly into PostgreSQL, eliminating the need for a separate vector database:

- Supports vectors up to 2000 dimensions
- HNSW and IVFFlat index types
- Cosine, L2, and inner product distance operators
- Full SQL compatibility — join vectors with relational data
- ACID transactions and existing PostgreSQL tooling

This is particularly powerful for RAG systems where document metadata (filenames, timestamps, access controls) lives alongside vector embeddings in the same database.

## Embedding Dimensions

Modern embedding models produce vectors with varying dimensions:
- 384 dimensions: MiniLM, all-MiniLM-L6-v2 (fast, lightweight)
- 512 dimensions: Custom hash-based embeddings (zero-cost, local)
- 768 dimensions: BERT-base, sentence-transformers
- 1024 dimensions: Cohere embed-v3
- 1536 dimensions: OpenAI text-embedding-ada-002
- 3072 dimensions: OpenAI text-embedding-3-large

Higher dimensions capture more nuance but increase storage and search costs.`,
	},
	{
		Filename: "prompt-engineering-best-practices.md",
		Content: `# Prompt Engineering Best Practices

Prompt engineering is the practice of designing inputs to large language models to reliably produce desired outputs. In RAG systems, prompt design directly impacts answer quality, hallucination rates, and response consistency.

## System Prompts for RAG

The system prompt establishes the LLM's behavior and constraints:

**Essential instructions:**
- "Answer only based on the provided context." — Prevents hallucination by constraining the model to retrieved information.
- "If the context does not contain enough information, say so." — Encourages honest uncertainty rather than fabrication.
- "Do not make up information." — Explicit anti-hallucination guardrail.

**Effective system prompt example:**
"You are an AI assistant answering questions using provided context. Only answer based on the context given. If the context does not contain enough information to answer the question, say so clearly. Do not make up information."

## Context Window Management

Modern LLMs have limited context windows (8K-128K tokens). RAG systems must balance:
- **Number of chunks**: More chunks provide more context but consume tokens and may introduce noise.
- **Chunk ordering**: Place most relevant chunks first, as LLMs exhibit "lost in the middle" behavior where information in the center of long contexts is less attended to.
- **Context formatting**: Clear separators between chunks help the model distinguish sources.

## Temperature Settings

Temperature controls response randomness:
- **0.0-0.3**: Deterministic, factual responses. Best for RAG where accuracy matters.
- **0.4-0.7**: Balanced creativity. Suitable for summarization tasks.
- **0.8-1.0**: Creative, varied responses. Not recommended for factual RAG.

For RAG applications, a temperature of 0.1-0.3 is recommended to maximize factual accuracy.

## Structured Output Techniques

When you need specific output formats:
- **Few-shot examples**: Provide 2-3 examples of desired input-output pairs in the prompt.
- **Output schema specification**: "Respond in JSON with keys: answer, confidence, sources."
- **Chain of thought**: "Think step by step" improves reasoning on complex queries.

## Common Pitfalls

1. **Over-stuffing context**: Including too many chunks dilutes relevance and wastes tokens.
2. **Vague instructions**: "Be helpful" is less effective than "Answer using only the provided context."
3. **Missing edge cases**: Not handling "no relevant context found" leads to hallucinated answers.
4. **Ignoring token limits**: Exceeding the context window silently truncates information.
5. **Static prompts**: Not iterating on prompts based on observed failures.

## Evaluation

Measure RAG prompt quality with:
- **Faithfulness**: Does the answer only contain information from the context?
- **Relevance**: Does the answer address the user's question?
- **Completeness**: Does the answer cover all relevant information from the context?
- **Conciseness**: Is the answer appropriately brief without omitting key details?`,
	},
}

// LoadExampleDocuments seeds the database with example documents if empty.
func LoadExampleDocuments(ctx context.Context, store *vectorstore.Store, pipeline *rag.Pipeline) error {
	count, err := store.DocumentCount(ctx)
	if err != nil {
		return err
	}
	if count > 0 {
		log.Printf("Seed: database already has %d documents, skipping", count)
		return nil
	}

	log.Println("Seed: loading example documents...")

	for _, doc := range exampleDocs {
		// Write content to temp file for the pipeline
		tmpFile, err := writeTempFile(doc.Filename, doc.Content)
		if err != nil {
			log.Printf("Seed: failed to create temp file for %s: %v", doc.Filename, err)
			continue
		}

		if err := pipeline.IngestDocument(ctx, tmpFile, doc.Filename); err != nil {
			log.Printf("Seed: failed to ingest %s: %v", doc.Filename, err)
			removeTempFile(tmpFile)
			continue
		}

		removeTempFile(tmpFile)
		log.Printf("Seed: loaded %s", doc.Filename)
	}

	log.Println("Seed: example documents loaded successfully")
	return nil
}
