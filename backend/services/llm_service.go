package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

// LLMService handles communication with Google Gemini API.
type LLMService struct {
	model  string
	apiKey string
}

// NewLLMService creates an LLM service for Google Gemini.
func NewLLMService(provider, model, apiKey string) (*LLMService, error) {
	p := strings.ToLower(provider)

	if p != "gemini" {
		return nil, fmt.Errorf("unsupported LLM provider: %s (only 'gemini' is supported)", provider)
	}

	if apiKey == "" {
		return nil, fmt.Errorf("GEMINI_API_KEY is required")
	}

	return &LLMService{
		model:  model,
		apiKey: apiKey,
	}, nil
}

// --- Google Gemini API types ---

type geminiRequest struct {
	Contents         []geminiContent        `json:"contents"`
	SystemInstruction *geminiContent        `json:"systemInstruction,omitempty"`
	GenerationConfig  *geminiGenerationConfig `json:"generationConfig,omitempty"`
}

type geminiContent struct {
	Parts []geminiPart `json:"parts"`
	Role  string       `json:"role,omitempty"`
}

type geminiPart struct {
	Text string `json:"text"`
}

type geminiGenerationConfig struct {
	MaxOutputTokens int     `json:"maxOutputTokens,omitempty"`
	Temperature     float64 `json:"temperature,omitempty"`
}

type geminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
	Error *struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
		Status  string `json:"status"`
	} `json:"error,omitempty"`
}

// GenerateAnswer sends context + question to Gemini and returns the response.
func (s *LLMService) GenerateAnswer(ctx context.Context, contextChunks []string, question string) (string, error) {
	contextText := strings.Join(contextChunks, "\n\n---\n\n")

	systemPrompt := `You are an AI assistant answering questions using provided context.
Only answer based on the context given. If the context does not contain enough information
to answer the question, say so clearly. Do not make up information.`

	userPrompt := fmt.Sprintf("CONTEXT:\n%s\n\nQUESTION:\n%s", contextText, question)

	reqBody := geminiRequest{
		SystemInstruction: &geminiContent{
			Parts: []geminiPart{{Text: systemPrompt}},
		},
		Contents: []geminiContent{
			{
				Role:  "user",
				Parts: []geminiPart{{Text: userPrompt}},
			},
		},
		GenerationConfig: &geminiGenerationConfig{
			MaxOutputTokens: 1024,
			Temperature:     0.3,
		},
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", s.model, s.apiKey)

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("Gemini API request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("Gemini API error (status %d): %s", resp.StatusCode, string(respBody))
	}

	var result geminiResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	if result.Error != nil {
		return "", fmt.Errorf("Gemini error: %s", result.Error.Message)
	}

	if len(result.Candidates) == 0 || len(result.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("no response from Gemini")
	}

	var parts []string
	for _, part := range result.Candidates[0].Content.Parts {
		if part.Text != "" {
			parts = append(parts, part.Text)
		}
	}

	if len(parts) == 0 {
		return "", fmt.Errorf("no text content in Gemini response")
	}

	return strings.Join(parts, "\n"), nil
}
