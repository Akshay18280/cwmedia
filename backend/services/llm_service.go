package services

import (
	"context"
	"fmt"
	"strings"

	openai "github.com/sashabaranov/go-openai"
)

// LLMService handles communication with LLM providers.
type LLMService struct {
	provider string
	model    string
	client   *openai.Client
}

// NewLLMService creates an LLM service for the given provider.
func NewLLMService(provider, model, openaiKey, anthropicKey string) (*LLMService, error) {
	svc := &LLMService{
		provider: strings.ToLower(provider),
		model:    model,
	}

	switch svc.provider {
	case "openai":
		if openaiKey == "" {
			return nil, fmt.Errorf("OPENAI_API_KEY is required for openai provider")
		}
		svc.client = openai.NewClient(openaiKey)
	case "anthropic":
		// Use the openai-compatible client with Anthropic base URL
		if anthropicKey == "" {
			return nil, fmt.Errorf("ANTHROPIC_API_KEY is required for anthropic provider")
		}
		cfg := openai.DefaultConfig(anthropicKey)
		cfg.BaseURL = "https://api.anthropic.com/v1"
		svc.client = openai.NewClientWithConfig(cfg)
	default:
		return nil, fmt.Errorf("unsupported LLM provider: %s", provider)
	}

	return svc, nil
}

// GenerateAnswer sends context + question to the LLM and returns the response.
func (s *LLMService) GenerateAnswer(ctx context.Context, contextChunks []string, question string) (string, error) {
	contextText := strings.Join(contextChunks, "\n\n---\n\n")

	systemPrompt := `You are an AI assistant answering questions using provided context.
Only answer based on the context given. If the context does not contain enough information
to answer the question, say so clearly. Do not make up information.`

	userPrompt := fmt.Sprintf("CONTEXT:\n%s\n\nQUESTION:\n%s", contextText, question)

	resp, err := s.client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model: s.model,
		Messages: []openai.ChatCompletionMessage{
			{Role: openai.ChatMessageRoleSystem, Content: systemPrompt},
			{Role: openai.ChatMessageRoleUser, Content: userPrompt},
		},
		MaxTokens:   1024,
		Temperature: 0.3,
	})
	if err != nil {
		return "", fmt.Errorf("LLM request failed: %w", err)
	}

	if len(resp.Choices) == 0 {
		return "", fmt.Errorf("no response from LLM")
	}

	return resp.Choices[0].Message.Content, nil
}
