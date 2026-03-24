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

// XAIProvider implements LLMProvider for xAI's OpenAI-compatible Grok API.
type XAIProvider struct {
	model       string
	apiKey      string
	sem         chan struct{}
	mu          sync.Mutex
	lastCall    time.Time
	minInterval time.Duration
}

// NewXAIProvider creates a new xAI (Grok) LLM provider.
func NewXAIProvider(model, apiKey string) (*XAIProvider, error) {
	if apiKey == "" {
		return nil, fmt.Errorf("XAI_API_KEY is required")
	}
	return &XAIProvider{
		model:       model,
		apiKey:      apiKey,
		sem:         make(chan struct{}, 5),
		minInterval: 1 * time.Second,
	}, nil
}

func (x *XAIProvider) ModelName() string    { return x.model }
func (x *XAIProvider) ProviderName() string { return "xai" }

func (x *XAIProvider) acquireSlot(ctx context.Context) error {
	select {
	case x.sem <- struct{}{}:
	case <-ctx.Done():
		return ctx.Err()
	}
	x.mu.Lock()
	elapsed := time.Since(x.lastCall)
	if elapsed < x.minInterval {
		wait := x.minInterval - elapsed
		x.mu.Unlock()
		select {
		case <-time.After(wait):
		case <-ctx.Done():
			<-x.sem
			return ctx.Err()
		}
		x.mu.Lock()
	}
	x.lastCall = time.Now()
	x.mu.Unlock()
	return nil
}

func (x *XAIProvider) releaseSlot() { <-x.sem }

// Generate sends a non-streaming request to xAI.
func (x *XAIProvider) Generate(ctx context.Context, system, user string, maxTokens int) (string, error) {
	reqBody := groqRequest{
		Model: x.model,
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
		if err := x.acquireSlot(ctx); err != nil {
			return "", fmt.Errorf("acquire slot: %w", err)
		}

		req, err := http.NewRequestWithContext(ctx, "POST", "https://api.x.ai/v1/chat/completions", bytes.NewReader(body))
		if err != nil {
			x.releaseSlot()
			return "", err
		}
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+x.apiKey)

		start := time.Now()
		resp, err := http.DefaultClient.Do(req)
		x.releaseSlot()
		if err != nil {
			return "", fmt.Errorf("xai request: %w", err)
		}

		respBody, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			return "", fmt.Errorf("read xai response: %w", err)
		}

		log.Printf("[XAI] %s responded: status=%d, body=%d bytes, took=%v", x.model, resp.StatusCode, len(respBody), time.Since(start))

		if resp.StatusCode == 429 && attempt < maxRetries {
			backoff := time.Duration(5*(attempt+1)) * time.Second
			log.Printf("[XAI] Rate limited (429), retrying in %v (attempt %d/%d)", backoff, attempt+1, maxRetries)
			select {
			case <-time.After(backoff):
				continue
			case <-ctx.Done():
				return "", ctx.Err()
			}
		}

		if resp.StatusCode != http.StatusOK {
			return "", fmt.Errorf("xai error (status %d): %s", resp.StatusCode, string(respBody[:min(500, len(respBody))]))
		}

		var result groqResponse
		if err := json.Unmarshal(respBody, &result); err != nil {
			return "", fmt.Errorf("parse xai response: %w", err)
		}
		if result.Error != nil {
			return "", fmt.Errorf("xai: %s", result.Error.Message)
		}
		if len(result.Choices) == 0 {
			return "", fmt.Errorf("empty xai response")
		}
		return result.Choices[0].Message.Content, nil
	}
	return "", fmt.Errorf("xai: rate limit reached, try another model or wait")
}

// GenerateStream sends a streaming request to xAI.
func (x *XAIProvider) GenerateStream(ctx context.Context, system, user string, maxTokens int, tokenCh chan<- string) error {
	reqBody := groqRequest{
		Model: x.model,
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

	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.x.ai/v1/chat/completions", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+x.apiKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("xai stream request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("xai error (status %d): %s", resp.StatusCode, string(respBody))
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
func (x *XAIProvider) GenerateAnswer(ctx context.Context, contextChunks []string, question string) (string, error) {
	userPrompt := BuildUserPrompt(contextChunks, question)
	return x.Generate(ctx, SystemPrompt, userPrompt, 1024)
}

// GenerateAnswerStream implements LLMProvider using the standard RAG prompt with streaming.
func (x *XAIProvider) GenerateAnswerStream(ctx context.Context, contextChunks []string, question string, tokenCh chan<- string) error {
	userPrompt := BuildUserPrompt(contextChunks, question)
	return x.GenerateStream(ctx, SystemPrompt, userPrompt, 1024, tokenCh)
}
