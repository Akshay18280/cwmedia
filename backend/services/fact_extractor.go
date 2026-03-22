package services

import (
	"context"
	"fmt"
	"strings"
)

// ExtractedFact represents a structured fact from research.
type ExtractedFact struct {
	Category   string  `json:"category"`   // financial, product, leadership, market, technical
	Claim      string  `json:"claim"`
	Value      string  `json:"value,omitempty"`
	Unit       string  `json:"unit,omitempty"`
	Timeframe  string  `json:"timeframe,omitempty"`
	Confidence float64 `json:"confidence"` // 0.0 - 1.0
	SourceCount int    `json:"source_count"`
}

// FactExtractor extracts structured facts from research content.
type FactExtractor struct {
	llm LLMProvider
}

// NewFactExtractor creates a fact extractor.
func NewFactExtractor(llm LLMProvider) *FactExtractor {
	return &FactExtractor{llm: llm}
}

const factExtractionPrompt = `You are a fact extraction engine. Extract structured facts from the provided research content.

For each fact, output EXACTLY one line in this format:
CATEGORY|CLAIM|VALUE|UNIT|TIMEFRAME

Categories: financial, product, leadership, market, technical, operational, competitive

Rules:
- VALUE should be numeric when possible (e.g., 61.4, 3200, 89.5)
- UNIT should be the measurement (e.g., billion USD, %, employees, units)
- TIMEFRAME should be specific (e.g., Q3 2025, 2024, FY2025)
- If a field is unknown, use "N/A"
- Extract 5-10 key facts
- Only extract verifiable, specific claims

Example:
financial|Annual revenue|61.4|billion USD|FY2024
market|Market share in GPUs|89.5|%|2024
leadership|CEO|Jensen Huang|N/A|current
product|Latest GPU architecture|Blackwell|N/A|2024`

// Extract extracts structured facts from research text.
func (f *FactExtractor) Extract(ctx context.Context, content string, topic string) ([]ExtractedFact, error) {
	prompt := fmt.Sprintf("Topic: %s\n\nResearch Content:\n%s\n\nExtract all key facts.", topic, truncateContent(content, 3000))

	response, err := f.llm.Generate(ctx, factExtractionPrompt, prompt, 1024)
	if err != nil {
		return nil, fmt.Errorf("fact extraction failed: %w", err)
	}

	return parseFacts(response), nil
}

func parseFacts(response string) []ExtractedFact {
	var facts []ExtractedFact
	lines := strings.Split(response, "\n")

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") || strings.HasPrefix(line, "Example") {
			continue
		}

		parts := strings.SplitN(line, "|", 5)
		if len(parts) < 2 {
			continue
		}

		category := strings.TrimSpace(strings.ToLower(parts[0]))
		// Validate category
		validCategories := map[string]bool{
			"financial": true, "product": true, "leadership": true,
			"market": true, "technical": true, "operational": true, "competitive": true,
		}
		if !validCategories[category] {
			continue
		}

		fact := ExtractedFact{
			Category:    category,
			Claim:       strings.TrimSpace(parts[1]),
			Confidence:  0.7, // Default confidence
			SourceCount: 1,
		}

		if len(parts) >= 3 && strings.TrimSpace(parts[2]) != "N/A" {
			fact.Value = strings.TrimSpace(parts[2])
		}
		if len(parts) >= 4 && strings.TrimSpace(parts[3]) != "N/A" {
			fact.Unit = strings.TrimSpace(parts[3])
		}
		if len(parts) >= 5 && strings.TrimSpace(parts[4]) != "N/A" {
			fact.Timeframe = strings.TrimSpace(parts[4])
		}

		facts = append(facts, fact)
	}

	return facts
}

func truncateContent(content string, maxLen int) string {
	if len(content) <= maxLen {
		return content
	}
	return content[:maxLen] + "..."
}
