package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port            string
	DatabaseURL     string
	GeminiKey       string
	LLMModel        string
	EmbeddingDim    int
	ChunkSize       int
	ChunkOverlap    int
	TopK            int
	AllowedOrigins  string
	RateLimitPerMin int
	MaxUploadSizeMB int
	TavilyKey       string
	GroqKey         string
	XAIKey          string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	chunkSize, _ := strconv.Atoi(getEnv("CHUNK_SIZE", "512"))
	chunkOverlap, _ := strconv.Atoi(getEnv("CHUNK_OVERLAP", "50"))
	topK, _ := strconv.Atoi(getEnv("TOP_K", "5"))
	rateLimit, _ := strconv.Atoi(getEnv("RATE_LIMIT_PER_MIN", "10"))
	maxUpload, _ := strconv.Atoi(getEnv("MAX_UPLOAD_SIZE_MB", "20"))
	embeddingDim, _ := strconv.Atoi(getEnv("EMBEDDING_DIM", "512"))

	// Google Gemini API key — must be set via environment variable or .env file
	geminiKey := getEnv("GEMINI_API_KEY", "")

	cfg := &Config{
		Port:            getEnv("PORT", "8080"),
		DatabaseURL:     getEnv("DATABASE_URL", "postgres://localhost:5432/ragdb?sslmode=disable"),
		GeminiKey:       geminiKey,
		LLMModel:        getEnv("LLM_MODEL", "gemini-2.5-flash"),
		EmbeddingDim:    embeddingDim,
		ChunkSize:       chunkSize,
		ChunkOverlap:    chunkOverlap,
		TopK:            topK,
		AllowedOrigins:  getEnv("ALLOWED_ORIGINS", "http://localhost:5173,https://carelwave.com"),
		RateLimitPerMin: rateLimit,
		MaxUploadSizeMB: maxUpload,
		TavilyKey:       getEnv("TAVILY_API_KEY", ""),
		GroqKey:         getEnv("GROQ_API_KEY", ""),
		XAIKey:          getEnv("XAI_API_KEY", ""),
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
