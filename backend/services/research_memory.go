package services

import (
	"sync"
	"time"
)

// ResearchMemoryEntry stores a previous research result.
type ResearchMemoryEntry struct {
	ID        string           `json:"id"`
	Query     string           `json:"query"`
	Report    *ResearchReport  `json:"report"`
	Facts     []ExtractedFact  `json:"facts,omitempty"`
	CreatedAt time.Time        `json:"created_at"`
}

// ResearchMemory provides in-memory research context storage.
type ResearchMemory struct {
	mu      sync.RWMutex
	entries []ResearchMemoryEntry
	maxSize int
}

// NewResearchMemory creates a research memory with a max entry count.
func NewResearchMemory(maxSize int) *ResearchMemory {
	return &ResearchMemory{
		entries: make([]ResearchMemoryEntry, 0),
		maxSize: maxSize,
	}
}

// Store saves a research result to memory.
func (m *ResearchMemory) Store(id, query string, report *ResearchReport, facts []ExtractedFact) {
	m.mu.Lock()
	defer m.mu.Unlock()

	entry := ResearchMemoryEntry{
		ID:        id,
		Query:     query,
		Report:    report,
		Facts:     facts,
		CreatedAt: time.Now(),
	}

	m.entries = append(m.entries, entry)

	// Trim to maxSize
	if len(m.entries) > m.maxSize {
		m.entries = m.entries[len(m.entries)-m.maxSize:]
	}
}

// GetContext returns relevant context from previous research for follow-up queries.
func (m *ResearchMemory) GetContext(query string) string {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if len(m.entries) == 0 {
		return ""
	}

	// Return the most recent research summary as context
	var contextParts []string
	// Use last 3 entries max
	start := len(m.entries) - 3
	if start < 0 {
		start = 0
	}

	for _, entry := range m.entries[start:] {
		if entry.Report != nil {
			part := "Previous research on \"" + entry.Query + "\": " + entry.Report.Summary
			if len(entry.Report.KeyFindings) > 0 {
				part += " Key findings: "
				for i, f := range entry.Report.KeyFindings {
					if i >= 3 {
						break
					}
					part += f + "; "
				}
			}
			contextParts = append(contextParts, part)
		}
	}

	if len(contextParts) == 0 {
		return ""
	}

	return "PREVIOUS RESEARCH CONTEXT:\n" + joinStrings(contextParts, "\n\n")
}

// GetHistory returns all stored research entries.
func (m *ResearchMemory) GetHistory() []ResearchMemoryEntry {
	m.mu.RLock()
	defer m.mu.RUnlock()

	result := make([]ResearchMemoryEntry, len(m.entries))
	copy(result, m.entries)
	return result
}

// Clear removes all stored research.
func (m *ResearchMemory) Clear() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.entries = m.entries[:0]
}

func joinStrings(parts []string, sep string) string {
	result := ""
	for i, p := range parts {
		if i > 0 {
			result += sep
		}
		result += p
	}
	return result
}
