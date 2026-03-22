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
	"time"
)

// WebSearchResult represents a single web search result.
type WebSearchResult struct {
	Title      string  `json:"title"`
	URL        string  `json:"url"`
	Content    string  `json:"content"`
	Score      float64 `json:"score"`
	Confidence string  `json:"confidence,omitempty"` // high, medium, low
	Source     string  `json:"source,omitempty"`      // tavily, gemini, document
}

// WebSearchService performs web research using Tavily (primary) or Gemini (fallback).
type WebSearchService struct {
	llm       LLMProvider
	tavilyKey string
	client    *http.Client
}

// NewWebSearchService creates a web search service.
func NewWebSearchService(llm LLMProvider, tavilyKey string) *WebSearchService {
	return &WebSearchService{
		llm:       llm,
		tavilyKey: tavilyKey,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// HasTavily returns true if Tavily API key is configured.
func (w *WebSearchService) HasTavily() bool {
	return w.tavilyKey != ""
}

// --- Tavily API types ---

type tavilySearchRequest struct {
	Query              string `json:"query"`
	SearchDepth        string `json:"search_depth"`
	MaxResults         int    `json:"max_results"`
	IncludeAnswer      bool   `json:"include_answer"`
	IncludeRawContent  bool   `json:"include_raw_content"`
}

type tavilySearchResponse struct {
	Answer  string         `json:"answer"`
	Results []tavilyResult `json:"results"`
}

type tavilyResult struct {
	Title   string  `json:"title"`
	URL     string  `json:"url"`
	Content string  `json:"content"`
	Score   float64 `json:"score"`
}

// Search performs web search using Tavily (if configured) or Gemini fallback.
func (w *WebSearchService) Search(ctx context.Context, query string, maxResults int) ([]WebSearchResult, error) {
	if w.tavilyKey != "" {
		log.Printf("[SEARCH] Using Tavily for: %.60s...", query)
		results, err := w.searchTavily(ctx, query, maxResults)
		if err == nil && len(results) > 0 {
			log.Printf("[SEARCH] Tavily returned %d results", len(results))
			return results, nil
		}
		if err != nil {
			log.Printf("[SEARCH] Tavily failed, falling back to Gemini: %v", err)
		}
	} else {
		log.Printf("[SEARCH] No Tavily key, using Gemini fallback for: %.60s...", query)
	}

	results, err := w.searchGemini(ctx, query, maxResults)
	if err != nil {
		log.Printf("[SEARCH] Gemini search failed: %v", err)
		return nil, err
	}
	log.Printf("[SEARCH] Gemini returned %d results", len(results))
	return results, nil
}

func (w *WebSearchService) searchTavily(ctx context.Context, query string, maxResults int) ([]WebSearchResult, error) {
	reqBody := tavilySearchRequest{
		Query:             query,
		SearchDepth:       "advanced",
		MaxResults:        maxResults,
		IncludeAnswer:     true,
		IncludeRawContent: false,
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("marshal tavily request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.tavily.com/search", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+w.tavilyKey)

	resp, err := w.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("tavily request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read tavily response: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("tavily error (status %d): %s", resp.StatusCode, string(respBody))
	}

	var tavilyResp tavilySearchResponse
	if err := json.Unmarshal(respBody, &tavilyResp); err != nil {
		return nil, fmt.Errorf("parse tavily response: %w", err)
	}

	var results []WebSearchResult
	for _, r := range tavilyResp.Results {
		confidence := "medium"
		if r.Score > 0.8 {
			confidence = "high"
		} else if r.Score < 0.4 {
			confidence = "low"
		}

		results = append(results, WebSearchResult{
			Title:      r.Title,
			URL:        r.URL,
			Content:    r.Content,
			Score:      r.Score,
			Confidence: confidence,
			Source:      "tavily",
		})
	}

	return results, nil
}

const geminiSearchSystemPrompt = `You are a web research assistant. Given a search query, provide factual, well-sourced information.
Format your response as numbered research findings. Each finding must be on its own line starting with a number.
Each finding should be a self-contained paragraph with specific data, dates, names, and numbers.
Be factual and specific. If you're unsure about something, say so.
Do NOT make up URLs. Focus on factual content only.`

func (w *WebSearchService) searchGemini(ctx context.Context, query string, maxResults int) ([]WebSearchResult, error) {
	prompt := fmt.Sprintf("Research query: %s\n\nProvide %d distinct factual findings. Number each finding (1. 2. 3. etc). Each finding should be a detailed paragraph with specific data.", query, maxResults)

	response, err := w.llm.Generate(ctx, geminiSearchSystemPrompt, prompt, 2048)
	if err != nil {
		return nil, fmt.Errorf("gemini search failed: %w", err)
	}

	return parseGeminiSearchResults(response), nil
}

// SearchWithContext performs a contextual search for a specific research agent.
func (w *WebSearchService) SearchWithContext(ctx context.Context, query string, agentContext string, llmOverride ...LLMProvider) (string, []WebSearchResult, error) {
	// Get web search results first
	searchResults, searchErr := w.Search(ctx, fmt.Sprintf("%s %s", query, agentContext), 5)
	if searchErr != nil {
		log.Printf("[SEARCH] Web search error (non-fatal, continuing with LLM): %v", searchErr)
	}

	// Build context from search results
	var searchContext string
	if len(searchResults) > 0 {
		var parts []string
		for _, r := range searchResults {
			parts = append(parts, fmt.Sprintf("Source: %s\n%s", r.Title, r.Content))
		}
		searchContext = "\n\nWeb Research Results:\n" + strings.Join(parts, "\n---\n")
	}

	systemPrompt := fmt.Sprintf(`You are a specialized research analyst focused on: %s

Analyze the provided research data and your own knowledge. Include:
- Specific data points, statistics, and metrics
- Key trends and patterns
- Notable developments or changes
- Comparative analysis where relevant

For each major claim, indicate your confidence: [HIGH], [MEDIUM], or [LOW].
Be precise and cite timeframes.`, agentContext)

	userPrompt := query + searchContext

	llm := w.llm
	if len(llmOverride) > 0 && llmOverride[0] != nil {
		llm = llmOverride[0]
	}
	log.Printf("[SEARCH] Calling LLM (%s) for agent context (query length: %d chars)", llm.ModelName(), len(userPrompt))
	response, err := llm.Generate(ctx, systemPrompt, userPrompt, 2048)
	if err != nil {
		log.Printf("[SEARCH] LLM contextual search failed: %v", err)
		return "", searchResults, fmt.Errorf("contextual search failed: %w", err)
	}
	log.Printf("[SEARCH] LLM response received (%d chars)", len(response))

	return response, searchResults, nil
}

func parseGeminiSearchResults(response string) []WebSearchResult {
	sections := strings.Split(response, "\n\n")
	var results []WebSearchResult

	for i, section := range sections {
		section = strings.TrimSpace(section)
		if len(section) < 20 {
			continue
		}

		lines := strings.SplitN(section, "\n", 2)
		title := strings.TrimLeft(lines[0], "- •*#1234567890. )")
		if len(title) > 120 {
			title = title[:120] + "..."
		}

		content := section
		if len(lines) > 1 {
			content = lines[1]
		}

		results = append(results, WebSearchResult{
			Title:      title,
			Content:    strings.TrimSpace(content),
			Score:      1.0 - float64(i)*0.1,
			Confidence: "medium",
			Source:     "gemini",
		})

		if len(results) >= 8 {
			break
		}
	}

	return results
}
