package vectorstore

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Chunk represents a stored document chunk with its embedding.
type Chunk struct {
	ID         uuid.UUID
	DocumentID uuid.UUID
	Content    string
	Embedding  []float32
}

// SearchResult is a chunk returned from a similarity search.
type SearchResult struct {
	Content  string
	Distance float64
}

// Store handles vector storage and retrieval via pgvector.
type Store struct {
	pool *pgxpool.Pool
}

// NewStore creates a vector store connected to the given database.
func NewStore(ctx context.Context, databaseURL string) (*Store, error) {
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &Store{pool: pool}, nil
}

// RunMigrations creates the required extension and tables.
func (s *Store) RunMigrations(ctx context.Context) error {
	queries := []string{
		"CREATE EXTENSION IF NOT EXISTS vector",
		`CREATE TABLE IF NOT EXISTS documents (
			id UUID PRIMARY KEY,
			filename TEXT NOT NULL,
			uploaded_at TIMESTAMPTZ DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS chunks (
			id UUID PRIMARY KEY,
			document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
			content TEXT NOT NULL,
			embedding vector(1536)
		)`,
		`CREATE INDEX IF NOT EXISTS chunks_embedding_idx
			ON chunks USING hnsw (embedding vector_cosine_ops)`,
	}

	for _, q := range queries {
		if _, err := s.pool.Exec(ctx, q); err != nil {
			return fmt.Errorf("migration failed on query [%s]: %w", q[:min(len(q), 60)], err)
		}
	}

	return nil
}

// InsertDocument records a new document and returns its ID.
func (s *Store) InsertDocument(ctx context.Context, filename string) (uuid.UUID, error) {
	id := uuid.New()
	_, err := s.pool.Exec(ctx,
		"INSERT INTO documents (id, filename) VALUES ($1, $2)",
		id, filename,
	)
	if err != nil {
		return uuid.Nil, fmt.Errorf("failed to insert document: %w", err)
	}
	return id, nil
}

// InsertChunks stores chunks with their embeddings in a single batch.
func (s *Store) InsertChunks(ctx context.Context, documentID uuid.UUID, contents []string, embeddings [][]float32) error {
	if len(contents) != len(embeddings) {
		return fmt.Errorf("contents and embeddings length mismatch")
	}
	if len(contents) == 0 {
		return nil
	}

	batch := &pgx.Batch{}
	for i := range contents {
		id := uuid.New()
		batch.Queue(
			"INSERT INTO chunks (id, document_id, content, embedding) VALUES ($1, $2, $3, $4)",
			id, documentID, contents[i], pgvectorString(embeddings[i]),
		)
	}

	br := s.pool.SendBatch(ctx, batch)
	defer br.Close()

	for i := 0; i < len(contents); i++ {
		if _, err := br.Exec(); err != nil {
			return fmt.Errorf("failed to insert chunk %d: %w", i, err)
		}
	}

	return nil
}

// Search finds the top-k most similar chunks to the query embedding.
func (s *Store) Search(ctx context.Context, queryEmbedding []float32, topK int) ([]SearchResult, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT content, embedding <-> $1 AS distance
		 FROM chunks
		 ORDER BY embedding <-> $1
		 LIMIT $2`,
		pgvectorString(queryEmbedding), topK,
	)
	if err != nil {
		return nil, fmt.Errorf("similarity search failed: %w", err)
	}
	defer rows.Close()

	var results []SearchResult
	for rows.Next() {
		var r SearchResult
		if err := rows.Scan(&r.Content, &r.Distance); err != nil {
			return nil, fmt.Errorf("failed to scan result: %w", err)
		}
		results = append(results, r)
	}

	return results, nil
}

// Close shuts down the connection pool.
func (s *Store) Close() {
	s.pool.Close()
}

// pgvectorString converts a float32 slice to pgvector string format: [0.1,0.2,...]
func pgvectorString(v []float32) string {
	parts := make([]string, len(v))
	for i, f := range v {
		parts[i] = fmt.Sprintf("%g", f)
	}
	return "[" + strings.Join(parts, ",") + "]"
}
