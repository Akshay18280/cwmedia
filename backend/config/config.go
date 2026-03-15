package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port            string
	DatabaseURL     string
	OpenAIKey       string
	AnthropicKey    string
	LLMProvider     string // "openai" or "anthropic"
	LLMModel        string
	EmbeddingModel  string
	ChunkSize       int
	ChunkOverlap    int
	TopK            int
	AllowedOrigins  string
	RateLimitPerMin int
	MaxUploadSizeMB int
}

func Load() (*Config, error) {
	// Load .env file if it exists (ignore error in production)
	_ = godotenv.Load()

	chunkSize, _ := strconv.Atoi(getEnv("CHUNK_SIZE", "512"))
	chunkOverlap, _ := strconv.Atoi(getEnv("CHUNK_OVERLAP", "50"))
	topK, _ := strconv.Atoi(getEnv("TOP_K", "5"))
	rateLimit, _ := strconv.Atoi(getEnv("RATE_LIMIT_PER_MIN", "10"))
	maxUpload, _ := strconv.Atoi(getEnv("MAX_UPLOAD_SIZE_MB", "20"))

	cfg := &Config{
		Port:            getEnv("PORT", "8080"),
		DatabaseURL:     getEnv("DATABASE_URL", "postgres://raguser:ragpass@postgres:5432/ragdb?sslmode=disable"),
		OpenAIKey:       os.Getenv("OPENAI_API_KEY"),
		AnthropicKey:    os.Getenv("ANTHROPIC_API_KEY"),
		LLMProvider:     getEnv("LLM_PROVIDER", "openai"),
		LLMModel:        getEnv("LLM_MODEL", "gpt-4o-mini"),
		EmbeddingModel:  getEnv("EMBEDDING_MODEL", "text-embedding-3-small"),
		ChunkSize:       chunkSize,
		ChunkOverlap:    chunkOverlap,
		TopK:            topK,
		AllowedOrigins:  getEnv("ALLOWED_ORIGINS", "http://localhost:5173"),
		RateLimitPerMin: rateLimit,
		MaxUploadSizeMB: maxUpload,
	}

	if cfg.OpenAIKey == "" {
		return nil, fmt.Errorf("OPENAI_API_KEY is required")
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
