package services

import "context"

// LLMProvider is the interface that all LLM providers must implement.
type LLMProvider interface {
	Generate(ctx context.Context, system, user string, maxTokens int) (string, error)
	GenerateStream(ctx context.Context, system, user string, maxTokens int, tokenCh chan<- string) error
	GenerateAnswer(ctx context.Context, contextChunks []string, question string) (string, error)
	GenerateAnswerStream(ctx context.Context, contextChunks []string, question string, tokenCh chan<- string) error
	ModelName() string
	ProviderName() string
}
