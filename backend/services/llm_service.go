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

// fallbackModels lists models to try when the primary model's daily quota is exhausted.
var fallbackModels = []string{"gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash-lite", "gemini-2.0-flash"}

// LLMService handles communication with Google Gemini API.
// Includes a rate limiter to respect Gemini free-tier limits.
type LLMService struct {
	model  string
	apiKey string
	// Rate limiter: allows maxConcurrent simultaneous requests with retry on 429
	sem          chan struct{}
	mu           sync.Mutex
	lastCallTime time.Time
	minInterval  time.Duration // minimum time between requests
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
		model:       model,
		apiKey:      apiKey,
		sem:         make(chan struct{}, 5),    // max 5 concurrent requests
		minInterval: 1 * time.Second,          // throttle to ~60 RPM; 429 retry handles bursts
	}, nil
}

// ModelName returns the model identifier.
func (s *LLMService) ModelName() string { return s.model }

// ProviderName returns the provider name.
func (s *LLMService) ProviderName() string { return "gemini" }

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
	MaxOutputTokens int              `json:"maxOutputTokens,omitempty"`
	Temperature     float64          `json:"temperature,omitempty"`
	ThinkingConfig  *thinkingConfig  `json:"thinkingConfig,omitempty"`
}

type thinkingConfig struct {
	ThinkingBudget int `json:"thinkingBudget"`
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

// SystemPrompt is the system instruction sent to the LLM.
const SystemPrompt = `You are an AI assistant answering questions using provided context.
Only answer based on the context given. If the context does not contain enough information
to answer the question, say so clearly. Do not make up information.`

// BuildUserPrompt constructs the user prompt from context chunks and question.
func BuildUserPrompt(contextChunks []string, question string) string {
	contextText := strings.Join(contextChunks, "\n\n---\n\n")
	return fmt.Sprintf("CONTEXT:\n%s\n\nQUESTION:\n%s", contextText, question)
}

// GenerateAnswer sends context + question to Gemini and returns the response.
func (s *LLMService) GenerateAnswer(ctx context.Context, contextChunks []string, question string) (string, error) {
	return s.Generate(ctx, SystemPrompt, BuildUserPrompt(contextChunks, question), 1024)
}

// acquireSlot waits for a rate-limiter slot, enforcing minimum interval between requests.
func (s *LLMService) acquireSlot(ctx context.Context) error {
	// Acquire semaphore slot (limits concurrency)
	select {
	case s.sem <- struct{}{}:
	case <-ctx.Done():
		return ctx.Err()
	}

	// Enforce minimum interval between requests
	s.mu.Lock()
	elapsed := time.Since(s.lastCallTime)
	if elapsed < s.minInterval {
		wait := s.minInterval - elapsed
		s.mu.Unlock()
		log.Printf("[LLM] Rate limiter: waiting %v before next request", wait)
		select {
		case <-time.After(wait):
		case <-ctx.Done():
			<-s.sem // release slot
			return ctx.Err()
		}
		s.mu.Lock()
	}
	s.lastCallTime = time.Now()
	s.mu.Unlock()

	return nil
}

func (s *LLMService) releaseSlot() {
	<-s.sem
}

// doGenerateRequestForModel sends a single Gemini API request for a specific model with retry logic.
func (s *LLMService) doGenerateRequestForModel(ctx context.Context, model string, body []byte) ([]byte, bool, error) {
	maxRetries := 2
	for attempt := 0; attempt <= maxRetries; attempt++ {
		slotStart := time.Now()
		if err := s.acquireSlot(ctx); err != nil {
			log.Printf("[LLM] Failed to acquire slot after %v: %v", time.Since(slotStart), err)
			return nil, false, fmt.Errorf("acquire slot: %w", err)
		}
		log.Printf("[LLM] Slot acquired in %v for %s (attempt %d/%d)", time.Since(slotStart), model, attempt+1, maxRetries+1)

		url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", model, s.apiKey)
		req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(body))
		if err != nil {
			s.releaseSlot()
			return nil, false, err
		}
		req.Header.Set("Content-Type", "application/json")

		apiStart := time.Now()
		resp, err := http.DefaultClient.Do(req)
		s.releaseSlot()
		if err != nil {
			log.Printf("[LLM] HTTP request to %s failed after %v: %v", model, time.Since(apiStart), err)
			return nil, false, fmt.Errorf("Gemini request: %w", err)
		}

		respBody, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		apiDuration := time.Since(apiStart)
		if err != nil {
			return nil, false, fmt.Errorf("failed to read Gemini response: %w", err)
		}

		log.Printf("[LLM] %s responded: status=%d, body=%d bytes, took=%v", model, resp.StatusCode, len(respBody), apiDuration)

		if resp.StatusCode == 429 {
			// Check if it's a daily quota issue (should try fallback) vs per-minute (should retry)
			bodyStr := string(respBody)
			isDailyQuota := strings.Contains(bodyStr, "PerDay") || strings.Contains(bodyStr, "per_day")
			if isDailyQuota {
				log.Printf("[LLM] %s daily quota exhausted, will try fallback model", model)
				return nil, true, nil // signal: try fallback
			}
			if attempt < maxRetries {
				backoff := time.Duration(3*(attempt+1)) * time.Second
				log.Printf("[LLM] %s rate limited (per-minute), retrying in %v", model, backoff)
				select {
				case <-time.After(backoff):
					continue
				case <-ctx.Done():
					return nil, false, ctx.Err()
				}
			}
			return nil, true, nil // exhausted retries, try fallback
		}

		if resp.StatusCode != http.StatusOK {
			errSnippet := string(respBody[:min(500, len(respBody))])
			log.Printf("[LLM] %s error (status %d): %s", model, resp.StatusCode, errSnippet)
			return nil, false, fmt.Errorf("Gemini error (status %d): %s", resp.StatusCode, errSnippet)
		}

		return respBody, false, nil
	}
	return nil, true, nil
}

// doGenerateRequest sends a Gemini API request, falling back to alternative models if quota is exhausted.
func (s *LLMService) doGenerateRequest(ctx context.Context, body []byte) ([]byte, error) {
	requestStart := time.Now()
	log.Printf("[LLM] Starting request to %s (body: %d bytes)", s.model, len(body))

	// Try primary model
	respBody, shouldFallback, err := s.doGenerateRequestForModel(ctx, s.model, body)
	if err != nil {
		return nil, err
	}
	if !shouldFallback {
		log.Printf("[LLM] Request completed via %s in %v", s.model, time.Since(requestStart))
		return respBody, nil
	}

	// Try fallback models
	for _, fallback := range fallbackModels {
		if fallback == s.model {
			continue // skip primary model
		}
		log.Printf("[LLM] Trying fallback model: %s", fallback)
		respBody, shouldFallback, err = s.doGenerateRequestForModel(ctx, fallback, body)
		if err != nil {
			log.Printf("[LLM] Fallback %s failed: %v", fallback, err)
			continue
		}
		if !shouldFallback {
			log.Printf("[LLM] Request completed via fallback %s in %v", fallback, time.Since(requestStart))
			return respBody, nil
		}
		log.Printf("[LLM] Fallback %s also rate limited, trying next", fallback)
	}

	log.Printf("[LLM] All models exhausted after %v", time.Since(requestStart))
	return nil, fmt.Errorf("Gemini: all models rate limited (primary: %s, tried %d fallbacks)", s.model, len(fallbackModels))
}

// Generate sends a system prompt and user prompt to Gemini with custom max tokens.
func (s *LLMService) Generate(ctx context.Context, system, user string, maxTokens int) (string, error) {
	log.Printf("[LLM] Generate called: model=%s, maxTokens=%d, systemLen=%d, userLen=%d", s.model, maxTokens, len(system), len(user))
	reqBody := geminiRequest{
		SystemInstruction: &geminiContent{
			Parts: []geminiPart{{Text: system}},
		},
		Contents: []geminiContent{
			{Role: "user", Parts: []geminiPart{{Text: user}}},
		},
		GenerationConfig: &geminiGenerationConfig{
			MaxOutputTokens: maxTokens,
			Temperature:     0.4,
			ThinkingConfig:  &thinkingConfig{ThinkingBudget: 0},
		},
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("marshal: %w", err)
	}

	respBody, err := s.doGenerateRequest(ctx, body)
	if err != nil {
		return "", err
	}

	var result geminiResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", fmt.Errorf("parse: %w", err)
	}
	if result.Error != nil {
		return "", fmt.Errorf("Gemini: %s", result.Error.Message)
	}
	if len(result.Candidates) == 0 || len(result.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("empty Gemini response")
	}

	var parts []string
	for _, p := range result.Candidates[0].Content.Parts {
		if p.Text != "" {
			parts = append(parts, p.Text)
		}
	}
	return strings.Join(parts, "\n"), nil
}

// GenerateStream sends a system+user prompt to Gemini with SSE streaming.
func (s *LLMService) GenerateStream(ctx context.Context, system, user string, maxTokens int, tokenCh chan<- string) error {
	reqBody := geminiRequest{
		SystemInstruction: &geminiContent{
			Parts: []geminiPart{{Text: system}},
		},
		Contents: []geminiContent{
			{Role: "user", Parts: []geminiPart{{Text: user}}},
		},
		GenerationConfig: &geminiGenerationConfig{
			MaxOutputTokens: maxTokens,
			Temperature:     0.4,
			ThinkingConfig:  &thinkingConfig{ThinkingBudget: 0},
		},
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Errorf("marshal: %w", err)
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:streamGenerateContent?alt=sse&key=%s", s.model, s.apiKey)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("Gemini stream request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, readErr := io.ReadAll(resp.Body)
		if readErr != nil {
			return fmt.Errorf("Gemini error (status %d), failed to read body: %w", resp.StatusCode, readErr)
		}
		return fmt.Errorf("Gemini error (status %d): %s", resp.StatusCode, string(respBody))
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
				var chunk geminiResponse
				if err := json.Unmarshal([]byte(data), &chunk); err != nil {
					continue
				}
				for _, c := range chunk.Candidates {
					for _, p := range c.Content.Parts {
						if p.Text != "" {
							select {
							case tokenCh <- p.Text:
							case <-ctx.Done():
								return ctx.Err()
							}
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

// GenerateAnswerStream sends context + question to Gemini using streaming and sends tokens to the channel.
func (s *LLMService) GenerateAnswerStream(ctx context.Context, contextChunks []string, question string, tokenCh chan<- string) error {
	userPrompt := BuildUserPrompt(contextChunks, question)

	reqBody := geminiRequest{
		SystemInstruction: &geminiContent{
			Parts: []geminiPart{{Text: SystemPrompt}},
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
			ThinkingConfig:  &thinkingConfig{ThinkingBudget: 0},
		},
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %w", err)
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:streamGenerateContent?alt=sse&key=%s", s.model, s.apiKey)

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("Gemini streaming request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, readErr := io.ReadAll(resp.Body)
		if readErr != nil {
			return fmt.Errorf("Gemini API error (status %d), failed to read body: %w", resp.StatusCode, readErr)
		}
		return fmt.Errorf("Gemini API error (status %d): %s", resp.StatusCode, string(respBody))
	}

	// Parse SSE stream from Gemini
	buf := make([]byte, 4096)
	var lineBuf []byte

	for {
		n, readErr := resp.Body.Read(buf)
		if n > 0 {
			lineBuf = append(lineBuf, buf[:n]...)

			// Process complete lines
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

				var chunk geminiResponse
				if err := json.Unmarshal([]byte(data), &chunk); err != nil {
					continue
				}

				for _, candidate := range chunk.Candidates {
					for _, part := range candidate.Content.Parts {
						if part.Text != "" {
							select {
							case tokenCh <- part.Text:
							case <-ctx.Done():
								return ctx.Err()
							}
						}
					}
				}
			}
		}

		if readErr != nil {
			if readErr == io.EOF {
				break
			}
			return fmt.Errorf("stream read error: %w", readErr)
		}
	}

	return nil
}
