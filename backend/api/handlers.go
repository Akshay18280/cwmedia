package api

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/akshayverma/cwmedia-backend/config"
	"github.com/akshayverma/cwmedia-backend/middleware"
	"github.com/akshayverma/cwmedia-backend/rag"
	"github.com/akshayverma/cwmedia-backend/services"
	"github.com/akshayverma/cwmedia-backend/vectorstore"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// Handlers holds API dependencies.
type Handlers struct {
	pipeline       *rag.Pipeline
	config         *config.Config
	research       *services.ResearchService
	maxUploadBytes int64
}

// NewHandlers creates API handlers.
func NewHandlers(pipeline *rag.Pipeline, cfg *config.Config, research *services.ResearchService) *Handlers {
	return &Handlers{
		pipeline:       pipeline,
		config:         cfg,
		research:       research,
		maxUploadBytes: int64(cfg.MaxUploadSizeMB) * 1024 * 1024,
	}
}

// Root returns a welcome message with available endpoints.
func (h *Handlers) Root(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"service": "CWMedia RAG Backend",
		"version": "1.0.0",
		"endpoints": []gin.H{
			{"method": "GET", "path": "/", "description": "This welcome page"},
			{"method": "GET", "path": "/api/health", "description": "Health check"},
			{"method": "GET", "path": "/api/metadata", "description": "Model and pipeline configuration"},
			{"method": "GET", "path": "/api/documents", "description": "List uploaded documents"},
			{"method": "GET", "path": "/api/documents/:id/chunks", "description": "List chunks for a document"},
			{"method": "GET", "path": "/api/stats", "description": "Document and chunk counts"},
			{"method": "POST", "path": "/api/chat", "description": "RAG chat query"},
			{"method": "POST", "path": "/api/documents/upload", "description": "Upload a document"},
			{"method": "POST", "path": "/api/research", "description": "Multi-agent research with SSE streaming"},
			{"method": "GET", "path": "/api/research/history", "description": "Research history"},
			{"method": "DELETE", "path": "/api/research/memory", "description": "Clear research memory"},
		},
	})
}

// HealthCheck returns service status with database connectivity check.
func (h *Handlers) HealthCheck(c *gin.Context) {
	if err := h.pipeline.Store().Ping(c.Request.Context()); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "degraded", "database": "unreachable"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok", "database": "connected"})
}

// Metadata returns model and pipeline configuration.
func (h *Handlers) Metadata(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"llm_provider":         "gemini",
		"llm_model":            h.config.LLMModel,
		"embedding_model":      "local-hash-512d",
		"embedding_dimensions": h.config.EmbeddingDim,
		"vector_db":            "pgvector",
		"similarity_metric":    "cosine",
		"chunk_size":           h.config.ChunkSize,
		"chunk_overlap":        h.config.ChunkOverlap,
		"top_k":                h.config.TopK,
		"max_tokens":           1024,
		"temperature":          0.3,
	})
}

// ChatRequest is the body for POST /api/chat.
type ChatRequest struct {
	Question string `json:"question" binding:"required"`
}

// Chat handles RAG queries and returns enriched results.
func (h *Handlers) Chat(c *gin.Context) {
	var req ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondError(c, http.StatusBadRequest, "invalid_request", "A 'question' field is required.")
		return
	}

	if len(req.Question) > 2000 {
		middleware.RespondError(c, http.StatusBadRequest, "question_too_long", "Question must be under 2000 characters.")
		return
	}

	result, err := h.pipeline.Query(c.Request.Context(), req.Question)
	if err != nil {
		log.Printf("Chat query failed: %v", err)
		middleware.RespondError(c, http.StatusInternalServerError, "query_failed", "Failed to process your question. Please try again.")
		return
	}

	c.JSON(http.StatusOK, result)
}

// Upload handles document uploads via multipart form.
func (h *Handlers) Upload(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, h.maxUploadBytes)

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		middleware.RespondError(c, http.StatusBadRequest, "upload_failed", "Failed to read uploaded file. Max size is 20 MB.")
		return
	}
	defer file.Close()

	// Validate extension
	ext := filepath.Ext(header.Filename)
	allowed := map[string]bool{".pdf": true, ".txt": true, ".md": true}
	if !allowed[ext] {
		middleware.RespondError(c, http.StatusBadRequest, "unsupported_type", "Only PDF, TXT, and Markdown files are supported.")
		return
	}

	// Validate file content type via magic bytes
	headerBytes := make([]byte, 512)
	n, _ := file.Read(headerBytes)
	contentType := http.DetectContentType(headerBytes[:n])
	validContentTypes := map[string]bool{
		"application/pdf":          ext == ".pdf",
		"text/plain; charset=utf-8": ext == ".txt" || ext == ".md",
		"application/octet-stream":  ext == ".md",
		"text/plain":                ext == ".txt" || ext == ".md",
	}
	if !validContentTypes[contentType] {
		middleware.RespondError(c, http.StatusBadRequest, "invalid_content", "File content does not match its extension.")
		return
	}
	file.Seek(0, 0)

	// Save to temp file
	tmpDir := os.TempDir()
	tmpPath := filepath.Join(tmpDir, fmt.Sprintf("%s%s", uuid.New().String(), ext))
	if err := c.SaveUploadedFile(header, tmpPath); err != nil {
		middleware.RespondError(c, http.StatusInternalServerError, "save_failed", "Failed to save uploaded file.")
		return
	}
	defer os.Remove(tmpPath)

	// Run ingestion pipeline
	if err := h.pipeline.IngestDocument(c.Request.Context(), tmpPath, header.Filename); err != nil {
		log.Printf("Document ingestion failed: %v", err)
		middleware.RespondError(c, http.StatusInternalServerError, "ingestion_failed", "Document processing failed. Please try again.")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  fmt.Sprintf("Document '%s' processed successfully.", header.Filename),
		"filename": header.Filename,
	})
}

// parsePagination extracts limit and offset from query params (defaults: limit=50, offset=0, max limit=100).
func parsePagination(c *gin.Context) (limit, offset int) {
	limit = 50
	offset = 0
	if v := c.Query("limit"); v != "" {
		if parsed, err := strconv.Atoi(v); err == nil && parsed > 0 {
			limit = parsed
			if limit > 100 {
				limit = 100
			}
		}
	}
	if v := c.Query("offset"); v != "" {
		if parsed, err := strconv.Atoi(v); err == nil && parsed >= 0 {
			offset = parsed
		}
	}
	return
}

// ListDocuments returns paginated uploaded documents.
func (h *Handlers) ListDocuments(c *gin.Context) {
	limit, offset := parsePagination(c)
	docs, err := h.pipeline.Store().ListDocuments(c.Request.Context(), limit, offset)
	if err != nil {
		log.Printf("List documents failed: %v", err)
		middleware.RespondError(c, http.StatusInternalServerError, "list_failed", "Failed to list documents.")
		return
	}
	c.JSON(http.StatusOK, gin.H{"documents": docs, "limit": limit, "offset": offset})
}

// ListChunks returns paginated chunks for a specific document.
func (h *Handlers) ListChunks(c *gin.Context) {
	docID := c.Param("id")
	if _, err := uuid.Parse(docID); err != nil {
		middleware.RespondError(c, http.StatusBadRequest, "invalid_id", "Document ID must be a valid UUID.")
		return
	}
	limit, offset := parsePagination(c)
	chunks, err := h.pipeline.Store().ListChunks(c.Request.Context(), docID, limit, offset)
	if err != nil {
		log.Printf("List chunks failed: %v", err)
		middleware.RespondError(c, http.StatusInternalServerError, "list_failed", "Failed to list chunks.")
		return
	}
	c.JSON(http.StatusOK, gin.H{"chunks": chunks, "limit": limit, "offset": offset})
}

// Stats returns aggregate document and chunk counts.
func (h *Handlers) Stats(c *gin.Context) {
	stats, err := h.pipeline.Store().GetStats(c.Request.Context())
	if err != nil {
		log.Printf("Stats query failed: %v", err)
		middleware.RespondError(c, http.StatusInternalServerError, "stats_failed", "Failed to get stats.")
		return
	}
	c.JSON(http.StatusOK, stats)
}

// ChatStream handles SSE streaming RAG queries.
func (h *Handlers) ChatStream(c *gin.Context) {
	var req ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondError(c, http.StatusBadRequest, "invalid_request", "A 'question' field is required.")
		return
	}

	if len(req.Question) > 2000 {
		middleware.RespondError(c, http.StatusBadRequest, "question_too_long", "Question must be under 2000 characters.")
		return
	}

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no")

	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		middleware.RespondError(c, http.StatusInternalServerError, "streaming_unsupported", "Streaming not supported")
		return
	}

	writeSSE := func(event string, data interface{}) {
		jsonData, _ := json.Marshal(data)
		fmt.Fprintf(c.Writer, "event: %s\ndata: %s\n\n", event, string(jsonData))
		flusher.Flush()
	}

	cb := rag.StreamCallbacks{
		OnStep: func(step rag.StepEvent) {
			writeSSE("step", step)
		},
		OnToken: func(text string) {
			writeSSE("token", map[string]string{"text": text})
		},
		OnSources: func(sources []vectorstore.SearchResult) {
			writeSSE("sources", sources)
		},
		OnMetrics: func(metrics rag.QueryMetrics) {
			writeSSE("metrics", metrics)
		},
	}

	if err := h.pipeline.QueryStream(c.Request.Context(), req.Question, cb); err != nil {
		writeSSE("error", map[string]string{"message": err.Error()})
		return
	}

	writeSSE("done", map[string]interface{}{})
}

// ResearchRequest is the body for POST /api/research.
type ResearchRequest struct {
	Question string `json:"question" binding:"required"`
}

// ResearchStream handles SSE streaming research queries with multi-agent orchestration.
func (h *Handlers) ResearchStream(c *gin.Context) {
	var req ResearchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondError(c, http.StatusBadRequest, "invalid_request", "A 'question' field is required.")
		return
	}

	if len(req.Question) > 5000 {
		middleware.RespondError(c, http.StatusBadRequest, "question_too_long", "Research question must be under 5000 characters.")
		return
	}

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no")

	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		middleware.RespondError(c, http.StatusInternalServerError, "streaming_unsupported", "Streaming not supported")
		return
	}

	// Enforce a 3-minute timeout on research to prevent indefinite runs
	researchCtx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Minute)
	defer cancel()

	eventCh := make(chan services.ResearchEvent, 64)

	go func() {
		defer close(eventCh)
		_, err := h.research.Research(researchCtx, req.Question, eventCh)
		if err != nil {
			select {
			case eventCh <- services.ResearchEvent{Type: "error", Message: err.Error()}:
			case <-researchCtx.Done():
			}
		}
	}()

	for {
		select {
		case <-c.Request.Context().Done():
			// Client disconnected — cancel research context so goroutine exits
			cancel()
			return
		case event, ok := <-eventCh:
			if !ok {
				return // channel closed, research complete
			}
			jsonData, _ := json.Marshal(event)
			fmt.Fprintf(c.Writer, "event: %s\ndata: %s\n\n", event.Type, string(jsonData))
			flusher.Flush()
		}
	}
}

// ResearchHistory returns stored research results.
func (h *Handlers) ResearchHistory(c *gin.Context) {
	history := h.research.Memory().GetHistory()
	// Return lightweight summaries only
	type historyItem struct {
		ID        string `json:"id"`
		Query     string `json:"query"`
		Title     string `json:"title"`
		CreatedAt string `json:"created_at"`
	}
	var items []historyItem
	for _, entry := range history {
		title := "Research"
		if entry.Report != nil {
			title = entry.Report.Title
		}
		items = append(items, historyItem{
			ID:        entry.ID,
			Query:     entry.Query,
			Title:     title,
			CreatedAt: entry.CreatedAt.Format("2006-01-02T15:04:05Z"),
		})
	}
	c.JSON(http.StatusOK, gin.H{"history": items})
}

// ClearResearchMemory clears all research memory.
func (h *Handlers) ClearResearchMemory(c *gin.Context) {
	h.research.Memory().Clear()
	c.JSON(http.StatusOK, gin.H{"message": "Research memory cleared"})
}

// RegisterRoutes sets up all API routes on the given engine.
func (h *Handlers) RegisterRoutes(r *gin.Engine) {
	r.GET("/", h.Root)

	api := r.Group("/api")
	{
		api.GET("/health", h.HealthCheck)
		api.GET("/metadata", h.Metadata)
		api.GET("/documents", h.ListDocuments)
		api.GET("/documents/:id/chunks", h.ListChunks)
		api.GET("/stats", h.Stats)
		api.POST("/chat", h.Chat)
		api.POST("/chat/stream", h.ChatStream)
		api.POST("/research", h.ResearchStream)
		api.GET("/research/history", h.ResearchHistory)
		api.DELETE("/research/memory", h.ClearResearchMemory)
		api.POST("/documents/upload", h.Upload)
	}
}
