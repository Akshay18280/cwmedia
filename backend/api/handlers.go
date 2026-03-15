package api

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"github.com/akshayverma/cwmedia-backend/middleware"
	"github.com/akshayverma/cwmedia-backend/rag"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// Handlers holds API dependencies.
type Handlers struct {
	pipeline       *rag.Pipeline
	maxUploadBytes int64
}

// NewHandlers creates API handlers.
func NewHandlers(pipeline *rag.Pipeline, maxUploadMB int) *Handlers {
	return &Handlers{
		pipeline:       pipeline,
		maxUploadBytes: int64(maxUploadMB) * 1024 * 1024,
	}
}

// HealthCheck returns service status.
func (h *Handlers) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// ChatRequest is the body for POST /api/chat.
type ChatRequest struct {
	Question string `json:"question" binding:"required"`
}

// Chat handles RAG queries.
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

	answer, err := h.pipeline.Query(c.Request.Context(), req.Question)
	if err != nil {
		middleware.RespondError(c, http.StatusInternalServerError, "query_failed", fmt.Sprintf("Failed to process question: %v", err))
		return
	}

	c.JSON(http.StatusOK, gin.H{"answer": answer})
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
		middleware.RespondError(c, http.StatusInternalServerError, "ingestion_failed", fmt.Sprintf("Document processing failed: %v", err))
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  fmt.Sprintf("Document '%s' processed successfully.", header.Filename),
		"filename": header.Filename,
	})
}

// RegisterRoutes sets up all API routes on the given engine.
func (h *Handlers) RegisterRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		api.GET("/health", h.HealthCheck)
		api.POST("/chat", h.Chat)
		api.POST("/documents/upload", h.Upload)
	}
}
