package vectorstore

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"sort"
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
	hasPgvector  bool
}

// NewStore creates a vector store connected to the given database.
func NewStore(ctx context.Context, databaseURL string, embeddingDim int) (*Store, error) {
	poolCfg, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse database URL: %w", err)
	}

	poolCfg.MaxConns = 5
	poolCfg.MinConns = 0
	poolCfg.MaxConnLifetime = 30 * time.Minute
	poolCfg.MaxConnIdleTime = 5 * time.Minute
	poolCfg.HealthCheckPeriod = 1 * time.Minute
	poolCfg.ConnConfig.ConnectTimeout = 15 * time.Second

	pool, err := pgxpool.NewWithConfig(ctx, poolCfg)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Retry ping up to 3 times (Render free DB may wake slowly)
	for i := 0; i < 3; i++ {
		if err = pool.Ping(ctx); err == nil {
			break
		}
		log.Printf("Database ping attempt %d failed: %v, retrying...", i+1, err)
		time.Sleep(3 * time.Second)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to ping database after retries: %w", err)
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
	// Try to enable pgvector; fall back to TEXT-based storage if unavailable
	_, err := s.pool.Exec(ctx, "CREATE EXTENSION IF NOT EXISTS vector")
	if err == nil {
		s.hasPgvector = true
		log.Println("pgvector extension enabled")
	} else {
		s.hasPgvector = false
		log.Printf("pgvector not available (%v), using TEXT fallback for embeddings", err)
	}

	// Create documents table
	if _, err := s.pool.Exec(ctx, `CREATE TABLE IF NOT EXISTS documents (
		id UUID PRIMARY KEY,
		filename TEXT NOT NULL,
		uploaded_at TIMESTAMPTZ DEFAULT NOW()
	)`); err != nil {
		return fmt.Errorf("migration failed on documents table: %w", err)
	}

	// Create chunks table with appropriate embedding column type
	if s.hasPgvector {
		q := fmt.Sprintf(`CREATE TABLE IF NOT EXISTS chunks (
			id UUID PRIMARY KEY,
			document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
			content TEXT NOT NULL,
			embedding vector(%d)
		)`, s.embeddingDim)
		if _, err := s.pool.Exec(ctx, q); err != nil {
			return fmt.Errorf("migration failed on chunks table: %w", err)
		}

		if _, err := s.pool.Exec(ctx, `CREATE INDEX IF NOT EXISTS chunks_embedding_idx
			ON chunks USING hnsw (embedding vector_cosine_ops)`); err != nil {
			// HNSW index may fail on some versions; log and continue
			log.Printf("Warning: could not create HNSW index: %v", err)
		}
	} else {
		// Fallback: store embeddings as TEXT (JSON array)
		if _, err := s.pool.Exec(ctx, `CREATE TABLE IF NOT EXISTS chunks (
			id UUID PRIMARY KEY,
			document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
			content TEXT NOT NULL,
			embedding TEXT DEFAULT '[]'
		)`); err != nil {
			return fmt.Errorf("migration failed on chunks table: %w", err)
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
		var embVal interface{}
		if s.hasPgvector {
			embVal = pgvectorString(embeddings[i])
		} else {
			b, _ := json.Marshal(embeddings[i])
			embVal = string(b)
		}
		batch.Queue(
			"INSERT INTO chunks (id, document_id, content, embedding) VALUES ($1, $2, $3, $4)",
			id, documentID, contents[i], embVal,
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
	if s.hasPgvector {
		return s.searchPgvector(ctx, queryEmbedding, topK)
	}
	return s.searchFallback(ctx, queryEmbedding, topK)
}

func (s *Store) searchPgvector(ctx context.Context, queryEmbedding []float32, topK int) ([]SearchResult, error) {
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

func (s *Store) searchFallback(ctx context.Context, queryEmbedding []float32, topK int) ([]SearchResult, error) {
	// Load all chunks and compute cosine distance in Go
	rows, err := s.pool.Query(ctx,
		`SELECT c.id, d.filename, c.content, c.embedding
		 FROM chunks c
		 JOIN documents d ON c.document_id = d.id`)
	if err != nil {
		return nil, fmt.Errorf("fallback search failed: %w", err)
	}
	defer rows.Close()

	type scored struct {
		SearchResult
		dist float64
	}
	var all []scored

	for rows.Next() {
		var id, filename, content, embText string
		if err := rows.Scan(&id, &filename, &content, &embText); err != nil {
			return nil, fmt.Errorf("failed to scan chunk: %w", err)
		}
		var emb []float32
		if err := json.Unmarshal([]byte(embText), &emb); err != nil {
			continue // skip malformed embeddings
		}
		dist := cosineDistance(queryEmbedding, emb)
		all = append(all, scored{SearchResult{id, filename, content, dist}, dist})
	}

	sort.Slice(all, func(i, j int) bool { return all[i].dist < all[j].dist })
	if len(all) > topK {
		all = all[:topK]
	}

	results := make([]SearchResult, len(all))
	for i, s := range all {
		results[i] = s.SearchResult
	}
	return results, nil
}

func cosineDistance(a, b []float32) float64 {
	if len(a) != len(b) || len(a) == 0 {
		return 1.0
	}
	var dot, normA, normB float64
	for i := range a {
		dot += float64(a[i]) * float64(b[i])
		normA += float64(a[i]) * float64(a[i])
		normB += float64(b[i]) * float64(b[i])
	}
	denom := math.Sqrt(normA) * math.Sqrt(normB)
	if denom == 0 {
		return 1.0
	}
	return 1.0 - dot/denom
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
