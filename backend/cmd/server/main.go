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
	"github.com/akshayverma/cwmedia-backend/seed"
	"github.com/akshayverma/cwmedia-backend/services"
	"github.com/akshayverma/cwmedia-backend/vectorstore"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	ctx := context.Background()

	// Initialize vector store
	store, err := vectorstore.NewStore(ctx, cfg.DatabaseURL, cfg.EmbeddingDim)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer store.Close()

	if err := store.RunMigrations(ctx); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}
	log.Println("Database migrations completed")

	// Initialize local embedder (no external API needed)
	embedder := embeddings.NewEmbedder(cfg.EmbeddingDim)
	log.Printf("Embeddings: local hash-based (%d dims)", cfg.EmbeddingDim)

	// Initialize Google Gemini LLM service
	llm, err := services.NewLLMService("gemini", cfg.LLMModel, cfg.GeminiKey)
	if err != nil {
		log.Fatalf("Failed to initialize LLM service: %v", err)
	}
	log.Printf("LLM: Google Gemini (%s)", cfg.LLMModel)

	// Initialize RAG pipeline
	pipeline := rag.NewPipeline(embedder, store, llm, cfg.ChunkSize, cfg.ChunkOverlap, cfg.TopK)

	// Initialize research service
	research := services.NewResearchService(llm, cfg.TavilyKey)
	if cfg.TavilyKey != "" {
		log.Println("Research service initialized with Tavily web search + multi-agent orchestration")
	} else {
		log.Println("Research service initialized with Gemini knowledge search + multi-agent orchestration")
	}

	// Seed example documents if database is empty
	if err := seed.LoadExampleDocuments(ctx, store, pipeline); err != nil {
		log.Printf("Warning: failed to seed example documents: %v", err)
	}

	// Set up Gin
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(middleware.ErrorHandler())
	r.Use(middleware.SecurityHeaders())
	r.Use(middleware.CORSMiddleware(cfg.AllowedOrigins))

	rl := middleware.NewRateLimiter(cfg.RateLimitPerMin)
	defer rl.Stop()
	r.Use(rl.Middleware())

	handlers := api.NewHandlers(pipeline, cfg, research)
	handlers.RegisterRoutes(r)

	addr := fmt.Sprintf(":%s", cfg.Port)
	srv := &http.Server{
		Addr:         addr,
		Handler:      r,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 180 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	go func() {
		log.Printf("RAG backend listening on %s", addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

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
