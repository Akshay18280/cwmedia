package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/akshayverma/cwmedia-backend/api"
	"github.com/akshayverma/cwmedia-backend/config"
	"github.com/akshayverma/cwmedia-backend/embeddings"
	"github.com/akshayverma/cwmedia-backend/middleware"
	"github.com/akshayverma/cwmedia-backend/rag"
	"github.com/akshayverma/cwmedia-backend/services"
	"github.com/akshayverma/cwmedia-backend/vectorstore"
	"github.com/gin-gonic/gin"
)

func main() {
	// Load config
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	ctx := context.Background()

	// Initialize vector store
	store, err := vectorstore.NewStore(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer store.Close()

	// Run migrations
	if err := store.RunMigrations(ctx); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}
	log.Println("Database migrations completed")

	// Initialize embedder
	embedder := embeddings.NewEmbedder(cfg.OpenAIKey, cfg.EmbeddingModel)

	// Initialize LLM service
	llm, err := services.NewLLMService(cfg.LLMProvider, cfg.LLMModel, cfg.OpenAIKey, cfg.AnthropicKey)
	if err != nil {
		log.Fatalf("Failed to initialize LLM service: %v", err)
	}

	// Initialize RAG pipeline
	pipeline := rag.NewPipeline(embedder, store, llm, cfg.ChunkSize, cfg.ChunkOverlap, cfg.TopK)

	// Set up Gin
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(middleware.ErrorHandler())
	r.Use(middleware.CORSMiddleware(cfg.AllowedOrigins))

	// Rate limiting on mutation endpoints
	rl := middleware.NewRateLimiter(cfg.RateLimitPerMin)
	r.Use(rl.Middleware())

	// Register routes
	handlers := api.NewHandlers(pipeline, cfg.MaxUploadSizeMB)
	handlers.RegisterRoutes(r)

	// Start server with graceful shutdown
	addr := fmt.Sprintf(":%s", cfg.Port)
	srv := &http.Server{
		Addr:         addr,
		Handler:      r,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 60 * time.Second,
	}

	go func() {
		log.Printf("RAG backend listening on %s", addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server stopped")
}
