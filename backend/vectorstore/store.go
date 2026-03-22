package vectorstore

import (
	"context"
	"fmt"
	"strings"
	"time"

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
	ChunkID          string  `json:"chunk_id"`
	DocumentFilename string  `json:"document_filename"`
	Content          string  `json:"content"`
	Distance         float64 `json:"distance"`
}

// Store handles vector storage and retrieval via pgvector.
type Store struct {
	pool         *pgxpool.Pool
	embeddingDim int
}

// NewStore creates a vector store connected to the given database.
func NewStore(ctx context.Context, databaseURL string, embeddingDim int) (*Store, error) {
	poolCfg, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse database URL: %w", err)
	}

	poolCfg.MaxConns = 10
	poolCfg.MinConns = 2
	poolCfg.MaxConnLifetime = 30 * time.Minute
	poolCfg.MaxConnIdleTime = 5 * time.Minute
	poolCfg.HealthCheckPeriod = 1 * time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, poolCfg)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	if embeddingDim <= 0 {
		embeddingDim = 1024
	}
	return &Store{pool: pool, embeddingDim: embeddingDim}, nil
}

// Ping checks database connectivity.
func (s *Store) Ping(ctx context.Context) error {
	return s.pool.Ping(ctx)
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
		fmt.Sprintf(`CREATE TABLE IF NOT EXISTS chunks (
			id UUID PRIMARY KEY,
			document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
			content TEXT NOT NULL,
			embedding vector(%d)
		)`, s.embeddingDim),
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
		`SELECT c.id, d.filename, c.content, c.embedding <-> $1 AS distance
		 FROM chunks c
		 JOIN documents d ON c.document_id = d.id
		 ORDER BY c.embedding <-> $1
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
		if err := rows.Scan(&r.ChunkID, &r.DocumentFilename, &r.Content, &r.Distance); err != nil {
			return nil, fmt.Errorf("failed to scan result: %w", err)
		}
		results = append(results, r)
	}

	return results, nil
}

// DocumentInfo represents a stored document with metadata.
type DocumentInfo struct {
	ID         string `json:"id"`
	Filename   string `json:"filename"`
	UploadedAt string `json:"uploaded_at"`
	ChunkCount int    `json:"chunk_count"`
}

// ChunkInfo represents a chunk with a content preview.
type ChunkInfo struct {
	ID      string `json:"id"`
	Content string `json:"content"`
	Preview string `json:"preview"`
}

// StoreStats holds aggregate counts.
type StoreStats struct {
	TotalDocuments int `json:"total_documents"`
	TotalChunks    int `json:"total_chunks"`
}

// ListDocuments returns paginated documents with chunk counts.
func (s *Store) ListDocuments(ctx context.Context, limit, offset int) ([]DocumentInfo, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT d.id, d.filename, d.uploaded_at, COUNT(c.id) AS chunk_count
		 FROM documents d
		 LEFT JOIN chunks c ON c.document_id = d.id
		 GROUP BY d.id, d.filename, d.uploaded_at
		 ORDER BY d.uploaded_at DESC
		 LIMIT $1 OFFSET $2`,
		limit, offset,
	)
	if err != nil {
		return nil, fmt.Errorf("list documents failed: %w", err)
	}
	defer rows.Close()

	var docs []DocumentInfo
	for rows.Next() {
		var d DocumentInfo
		if err := rows.Scan(&d.ID, &d.Filename, &d.UploadedAt, &d.ChunkCount); err != nil {
			return nil, fmt.Errorf("failed to scan document: %w", err)
		}
		docs = append(docs, d)
	}
	if docs == nil {
		docs = []DocumentInfo{}
	}
	return docs, nil
}

// ListChunks returns paginated chunks for a given document.
func (s *Store) ListChunks(ctx context.Context, documentID string, limit, offset int) ([]ChunkInfo, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT id, content FROM chunks WHERE document_id = $1 ORDER BY id LIMIT $2 OFFSET $3`,
		documentID, limit, offset,
	)
	if err != nil {
		return nil, fmt.Errorf("list chunks failed: %w", err)
	}
	defer rows.Close()

	var chunks []ChunkInfo
	for rows.Next() {
		var ch ChunkInfo
		if err := rows.Scan(&ch.ID, &ch.Content); err != nil {
			return nil, fmt.Errorf("failed to scan chunk: %w", err)
		}
		ch.Preview = ch.Content
		if len(ch.Preview) > 200 {
			ch.Preview = ch.Preview[:200]
		}
		chunks = append(chunks, ch)
	}
	if chunks == nil {
		chunks = []ChunkInfo{}
	}
	return chunks, nil
}

// GetStats returns aggregate document and chunk counts.
func (s *Store) GetStats(ctx context.Context) (*StoreStats, error) {
	var stats StoreStats
	err := s.pool.QueryRow(ctx, `SELECT COUNT(*) FROM documents`).Scan(&stats.TotalDocuments)
	if err != nil {
		return nil, fmt.Errorf("count documents failed: %w", err)
	}
	err = s.pool.QueryRow(ctx, `SELECT COUNT(*) FROM chunks`).Scan(&stats.TotalChunks)
	if err != nil {
		return nil, fmt.Errorf("count chunks failed: %w", err)
	}
	return &stats, nil
}

// DocumentCount returns the number of documents (used for seed check).
func (s *Store) DocumentCount(ctx context.Context) (int, error) {
	var count int
	err := s.pool.QueryRow(ctx, `SELECT COUNT(*) FROM documents`).Scan(&count)
	return count, err
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
