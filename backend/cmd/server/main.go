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

	// Initialize provider registry
	registry := services.NewProviderRegistry(cfg.LLMModel)

	// Register Gemini models
	llm, err := services.NewLLMService("gemini", cfg.LLMModel, cfg.GeminiKey)
	if err != nil {
		log.Fatalf("Failed to initialize LLM service: %v", err)
	}
	registry.Register(cfg.LLMModel, "Gemini 2.5 Flash", "free", llm)

	// Register flash-lite as a separate model (higher free-tier quota)
	llmLite, err := services.NewLLMService("gemini", "gemini-2.5-flash-lite", cfg.GeminiKey)
	if err == nil {
		registry.Register("gemini-2.5-flash-lite", "Gemini 2.5 Flash Lite", "free", llmLite)
		log.Println("LLM: Gemini 2.5 Flash Lite registered")
	}

	log.Printf("LLM: Google Gemini primary (%s)", cfg.LLMModel)

	// Register Groq models (optional — only if API key is set)
	if cfg.GroqKey != "" {
		groqModels := []struct{ id, name string }{
			{"llama-3.3-70b-versatile", "Llama 3.3 70B"},
			{"mixtral-8x7b-32768", "Mixtral 8x7B"},
			{"gemma2-9b-it", "Gemma 2 9B"},
		}
		for _, m := range groqModels {
			groq, err := services.NewGroqProvider(m.id, cfg.GroqKey)
			if err == nil {
				registry.Register(m.id, m.name, "free", groq)
				log.Printf("LLM: Groq (%s) registered", m.id)
			}
		}
	}

	// Initialize RAG pipeline
	pipeline := rag.NewPipeline(embedder, store, llm, cfg.ChunkSize, cfg.ChunkOverlap, cfg.TopK)

	// Initialize research service
	research := services.NewResearchService(llm, registry, cfg.TavilyKey)
	if cfg.TavilyKey != "" {
		log.Println("Research service initialized with Tavily web search + multi-agent orchestration")
	} else {
		log.Println("Research service initialized with Gemini knowledge search + multi-agent orchestration")
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

	handlers := api.NewHandlers(pipeline, cfg, research, registry)
	handlers.RegisterRoutes(r)

	addr := fmt.Sprintf(":%s", cfg.Port)
	srv := &http.Server{
		Addr:           addr,
		Handler:        r,
		ReadTimeout:    30 * time.Second,
		WriteTimeout:   180 * time.Second,
		IdleTimeout:    120 * time.Second,
		MaxHeaderBytes: 1 << 20, // 1 MB
	}

	// Start HTTP server FIRST so Render sees it as healthy
	go func() {
		log.Printf("RAG backend listening on %s", addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	// Seed example documents in background (non-blocking)
	go func() {
		if err := seed.LoadExampleDocuments(ctx, store, pipeline); err != nil {
			log.Printf("Warning: failed to seed example documents: %v", err)
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
