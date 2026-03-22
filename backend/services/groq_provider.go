package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"
)

// GroqProvider implements LLMProvider for Groq's OpenAI-compatible API.
type GroqProvider struct {
	model       string
	apiKey      string
	sem         chan struct{}
	mu          sync.Mutex
	lastCall    time.Time
	minInterval time.Duration
}

// NewGroqProvider creates a new Groq LLM provider.
func NewGroqProvider(model, apiKey string) (*GroqProvider, error) {
	if apiKey == "" {
		return nil, fmt.Errorf("GROQ_API_KEY is required")
	}
	return &GroqProvider{
		model:       model,
		apiKey:      apiKey,
		sem:         make(chan struct{}, 5),
		minInterval: 2 * time.Second,
	}, nil
}

func (g *GroqProvider) ModelName() string    { return g.model }
func (g *GroqProvider) ProviderName() string { return "groq" }

// --- OpenAI-compatible types ---

type groqRequest struct {
	Model       string         `json:"model"`
	Messages    []groqMessage  `json:"messages"`
	MaxTokens   int            `json:"max_tokens,omitempty"`
	Temperature float64        `json:"temperature,omitempty"`
	Stream      bool           `json:"stream,omitempty"`
}

type groqMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type groqResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
		Type    string `json:"type"`
		Code    string `json:"code"`
	} `json:"error,omitempty"`
}

type groqStreamChunk struct {
	Choices []struct {
		Delta struct {
			Content string `json:"content"`
		} `json:"delta"`
	} `json:"choices"`
}

func (g *GroqProvider) acquireSlot(ctx context.Context) error {
	select {
	case g.sem <- struct{}{}:
	case <-ctx.Done():
		return ctx.Err()
	}
	g.mu.Lock()
	elapsed := time.Since(g.lastCall)
	if elapsed < g.minInterval {
		wait := g.minInterval - elapsed
		g.mu.Unlock()
		select {
		case <-time.After(wait):
		case <-ctx.Done():
			<-g.sem
			return ctx.Err()
		}
		g.mu.Lock()
	}
	g.lastCall = time.Now()
	g.mu.Unlock()
	return nil
}

func (g *GroqProvider) releaseSlot() { <-g.sem }

// Generate sends a non-streaming request to Groq.
func (g *GroqProvider) Generate(ctx context.Context, system, user string, maxTokens int) (string, error) {
	reqBody := groqRequest{
		Model: g.model,
		Messages: []groqMessage{
			{Role: "system", Content: system},
			{Role: "user", Content: user},
		},
		MaxTokens:   maxTokens,
		Temperature: 0.4,
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("marshal: %w", err)
	}

	maxRetries := 3
	for attempt := 0; attempt <= maxRetries; attempt++ {
		if err := g.acquireSlot(ctx); err != nil {
			return "", err
		}

		req, err := http.NewRequestWithContext(ctx, "POST", "https://api.groq.com/openai/v1/chat/completions", bytes.NewReader(body))
		if err != nil {
			g.releaseSlot()
			return "", err
		}
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+g.apiKey)

		resp, err := http.DefaultClient.Do(req)
		g.releaseSlot()
		if err != nil {
			return "", fmt.Errorf("groq request: %w", err)
		}

		respBody, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			return "", fmt.Errorf("read groq response: %w", err)
		}

		if resp.StatusCode == 429 && attempt < maxRetries {
			backoff := time.Duration(5*(attempt+1)) * time.Second
			log.Printf("[Groq] Rate limited (429), retrying in %v (attempt %d/%d)", backoff, attempt+1, maxRetries)
			select {
			case <-time.After(backoff):
				continue
			case <-ctx.Done():
				return "", ctx.Err()
			}
		}

		if resp.StatusCode != http.StatusOK {
			return "", fmt.Errorf("groq error (status %d): %s", resp.StatusCode, string(respBody[:min(500, len(respBody))]))
		}

		var result groqResponse
		if err := json.Unmarshal(respBody, &result); err != nil {
			return "", fmt.Errorf("parse groq response: %w", err)
		}
		if result.Error != nil {
			return "", fmt.Errorf("groq: %s", result.Error.Message)
		}
		if len(result.Choices) == 0 {
			return "", fmt.Errorf("empty groq response")
		}
		return result.Choices[0].Message.Content, nil
	}
	return "", fmt.Errorf("groq: rate limit reached, try another model or wait")
}

// GenerateStream sends a streaming request to Groq.
func (g *GroqProvider) GenerateStream(ctx context.Context, system, user string, maxTokens int, tokenCh chan<- string) error {
	reqBody := groqRequest{
		Model: g.model,
		Messages: []groqMessage{
			{Role: "system", Content: system},
			{Role: "user", Content: user},
		},
		MaxTokens:   maxTokens,
		Temperature: 0.4,
		Stream:      true,
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Errorf("marshal: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.groq.com/openai/v1/chat/completions", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+g.apiKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("groq stream request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("groq error (status %d): %s", resp.StatusCode, string(respBody))
	}

	buf := make([]byte, 4096)
	var lineBuf []byte
	for {
		n, readErr := resp.Body.Read(buf)
		if n > 0 {
			lineBuf = append(lineBuf, buf[:n]...)
			for {
				idx := bytes.IndexByte(lineBuf, '\n')
				if idx < 0 {
					break
				}
				line := string(bytes.TrimSpace(lineBuf[:idx]))
				lineBuf = lineBuf[idx+1:]
				if !strings.HasPrefix(line, "data: ") {
					continue
				}
				data := strings.TrimPrefix(line, "data: ")
				if data == "" || data == "[DONE]" {
					continue
				}
				var chunk groqStreamChunk
				if err := json.Unmarshal([]byte(data), &chunk); err != nil {
					continue
				}
				for _, c := range chunk.Choices {
					if c.Delta.Content != "" {
						select {
						case tokenCh <- c.Delta.Content:
						case <-ctx.Done():
							return ctx.Err()
						}
					}
				}
			}
		}
		if readErr != nil {
			if readErr == io.EOF {
				break
			}
			return fmt.Errorf("stream read: %w", readErr)
		}
	}
	return nil
}

// GenerateAnswer implements LLMProvider using the standard RAG prompt.
func (g *GroqProvider) GenerateAnswer(ctx context.Context, contextChunks []string, question string) (string, error) {
	userPrompt := BuildUserPrompt(contextChunks, question)
	return g.Generate(ctx, SystemPrompt, userPrompt, 1024)
}

// GenerateAnswerStream implements LLMProvider using the standard RAG prompt with streaming.
func (g *GroqProvider) GenerateAnswerStream(ctx context.Context, contextChunks []string, question string, tokenCh chan<- string) error {
	userPrompt := BuildUserPrompt(contextChunks, question)
	return g.GenerateStream(ctx, SystemPrompt, userPrompt, 1024, tokenCh)
}
