package services

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"
)

// ResearchAgent represents a specialized research agent.
type ResearchAgent struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	Description  string `json:"description"`
	SystemPrompt string `json:"-"`
}

// AgentResult holds the output of a single research agent.
type AgentResult struct {
	AgentID    string            `json:"agent_id"`
	AgentName  string            `json:"agent_name"`
	Content    string            `json:"content"`
	Sources    []WebSearchResult `json:"sources,omitempty"`
	Facts      []ExtractedFact   `json:"facts,omitempty"`
	DurationMs int64             `json:"duration_ms"`
	Status     string            `json:"status"` // completed, failed
	Error      string            `json:"error,omitempty"`
}

// ResearchReport is the final structured output.
type ResearchReport struct {
	Title          string               `json:"title"`
	Summary        string               `json:"summary"`
	Sections       []ReportSection      `json:"sections"`
	KeyFindings    []string             `json:"key_findings"`
	DataPoints     []DataPoint          `json:"data_points,omitempty"`
	AgentResults   []AgentResult        `json:"agent_results"`
	Metrics        ResearchMetrics      `json:"metrics"`
	Verification   *VerificationResult  `json:"verification,omitempty"`
	AllSources     []WebSearchResult    `json:"all_sources,omitempty"`
	ResearchPrompts []PromptRecord      `json:"research_prompts,omitempty"`
}

// PromptRecord captures prompts used during research for transparency.
type PromptRecord struct {
	Phase  string `json:"phase"`
	System string `json:"system"`
	User   string `json:"user"`
}

// ReportSection is a named section in the report.
type ReportSection struct {
	Title   string `json:"title"`
	Content string `json:"content"`
	AgentID string `json:"agent_id,omitempty"`
}

// DataPoint represents a quantitative finding for charts.
type DataPoint struct {
	Label    string  `json:"label"`
	Value    float64 `json:"value"`
	Unit     string  `json:"unit,omitempty"`
	Category string  `json:"category,omitempty"`
}

// ResearchMetrics tracks research performance.
type ResearchMetrics struct {
	TotalMs        int64 `json:"total_ms"`
	PlanningMs     int64 `json:"planning_ms"`
	ResearchMs     int64 `json:"research_ms"`
	VerificationMs int64 `json:"verification_ms"`
	SynthesisMs    int64 `json:"synthesis_ms"`
	AgentsUsed     int   `json:"agents_used"`
	TotalSources   int   `json:"total_sources"`
	FactsExtracted int   `json:"facts_extracted"`
	WebSearches    int   `json:"web_searches"`
	RetryCount     int   `json:"retry_count"`
}

// ResearchEvent is an SSE event during research.
type ResearchEvent struct {
	Type    string      `json:"type"`
	AgentID string      `json:"agent_id,omitempty"`
	Agent   string      `json:"agent,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Message string      `json:"message,omitempty"`
}

// ResearchService orchestrates multi-agent research.
type ResearchService struct {
	llm          *LLMService
	webSearch    *WebSearchService
	factExtract  *FactExtractor
	verifier     *VerificationAgent
	memory       *ResearchMemory
	agents       []ResearchAgent
}

// NewResearchService creates the full research orchestrator.
func NewResearchService(llm *LLMService, tavilyKey string) *ResearchService {
	ws := NewWebSearchService(llm, tavilyKey)

	agents := []ResearchAgent{
		{
			ID:          "overview",
			Name:        "Overview Analyst",
			Description: "Comprehensive topic overview, background, history, and significance",
			SystemPrompt: `You are an overview research analyst. Provide a comprehensive background of the given topic.
Include: definition, history, current state, key players, significance, and recent developments.
Be factual and structured. Use bullet points for key facts. Include dates and specific names.`,
		},
		{
			ID:          "market",
			Name:        "Market Intelligence",
			Description: "Market size, growth, trends, competitive landscape, and market dynamics",
			SystemPrompt: `You are a market intelligence analyst. Analyze the market aspects of the given topic.
Include: market size (with specific numbers), growth rate, key competitors, market share breakdown, and future projections.
Provide specific numbers, percentages, and dollar amounts. Be data-driven.`,
		},
		{
			ID:          "technical",
			Name:        "Technical Analyst",
			Description: "Technology architecture, innovation, implementation, and technical depth",
			SystemPrompt: `You are a technical research analyst. Deep dive into the technical aspects.
Include: technology stack, architecture, key innovations, patents, R&D investment, technical roadmap.
Be specific about technologies, versions, standards, and implementation details.`,
		},
		{
			ID:          "news",
			Name:        "News Intelligence",
			Description: "Recent news, developments, announcements, partnerships, and events",
			SystemPrompt: `You are a news intelligence analyst. Report on recent developments.
Include: latest news, announcements, partnerships, acquisitions, regulatory updates, and events.
Focus on the most recent and impactful developments. Include dates.`,
		},
		{
			ID:          "competitor",
			Name:        "Competitor Analyst",
			Description: "Competitive analysis, comparative strengths, weaknesses, and positioning",
			SystemPrompt: `You are a competitive intelligence analyst. Analyze the competitive landscape.
Include: top competitors, comparative analysis, strengths vs weaknesses, market positioning, and competitive advantages.
Provide specific comparisons with data points.`,
		},
		{
			ID:          "risks",
			Name:        "Risk Analyst",
			Description: "Risk assessment, challenges, regulatory concerns, and mitigation strategies",
			SystemPrompt: `You are a risk and challenges analyst. Evaluate risks and challenges.
Include: key risks, regulatory concerns, ethical issues, market threats, operational challenges, and mitigation strategies.
Be balanced — identify both risks and opportunities.`,
		},
	}

	return &ResearchService{
		llm:         llm,
		webSearch:   ws,
		factExtract: NewFactExtractor(llm),
		verifier:    NewVerificationAgent(llm),
		memory:      NewResearchMemory(20),
		agents:      agents,
	}
}

// LLM returns the underlying LLM service.
func (r *ResearchService) LLM() *LLMService {
	return r.llm
}

// Memory returns the research memory.
func (r *ResearchService) Memory() *ResearchMemory {
	return r.memory
}

// Research performs full multi-agent research with verification and streaming.
func (r *ResearchService) Research(ctx context.Context, question string, eventCh chan<- ResearchEvent) (*ResearchReport, error) {
	totalStart := time.Now()
	var prompts []PromptRecord

	// Check for previous research context
	previousContext := r.memory.GetContext(question)

	// Phase 1: Planning
	eventCh <- ResearchEvent{Type: "planning", Message: "Analyzing research query and selecting agents..."}

	planStart := time.Now()
	selectedAgents, researchPlan, planPrompt, err := r.planResearch(ctx, question, previousContext)
	if err != nil {
		return nil, fmt.Errorf("planning failed: %w", err)
	}
	planningMs := time.Since(planStart).Milliseconds()
	prompts = append(prompts, planPrompt)

	agentNames := make([]string, len(selectedAgents))
	for i, a := range selectedAgents {
		agentNames[i] = a.Name
	}

	eventCh <- ResearchEvent{
		Type:    "plan_ready",
		Message: fmt.Sprintf("Deploying %d agents: %s", len(selectedAgents), strings.Join(agentNames, ", ")),
		Data: map[string]interface{}{
			"plan":   researchPlan,
			"agents": selectedAgents,
		},
	}

	// Phase 2: Parallel agent execution
	researchStart := time.Now()
	agentResults := r.executeAgents(ctx, selectedAgents, question, previousContext, eventCh)
	researchMs := time.Since(researchStart).Milliseconds()

	// Phase 2.5: Retry logic — if too few results, retry with broader queries
	completedCount := 0
	for _, ar := range agentResults {
		if ar.Status == "completed" && len(ar.Content) > 100 {
			completedCount++
		}
	}
	retryCount := 0
	if completedCount < 2 {
		eventCh <- ResearchEvent{Type: "retry", Message: "Insufficient results. Retrying with broader queries..."}
		retryResults := r.retryWeakAgents(ctx, agentResults, question, eventCh)
		agentResults = retryResults
		retryCount = 1
	}

	// Phase 3: Fact extraction
	eventCh <- ResearchEvent{Type: "extracting", Message: "Extracting structured facts..."}

	var allFacts []ExtractedFact
	var allSources []WebSearchResult
	for i, ar := range agentResults {
		if ar.Status == "completed" {
			facts, _ := r.factExtract.Extract(ctx, ar.Content, question)
			agentResults[i].Facts = facts
			allFacts = append(allFacts, facts...)
			allSources = append(allSources, ar.Sources...)
		}
	}

	// Phase 4: Verification
	eventCh <- ResearchEvent{Type: "verifying", Message: "Cross-referencing facts across sources..."}

	verifyStart := time.Now()
	verification, _ := r.verifier.Verify(ctx, agentResults, allFacts)
	verificationMs := time.Since(verifyStart).Milliseconds()

	if verification != nil {
		eventCh <- ResearchEvent{
			Type:    "verified",
			Message: fmt.Sprintf("Verified %d facts. Overall confidence: %.0f%%", len(verification.VerifiedFacts), verification.OverallConfidence*100),
			Data:    verification,
		}
	}

	// Phase 5: Synthesis
	eventCh <- ResearchEvent{Type: "synthesizing", Message: "Generating structured research report..."}

	synthesisStart := time.Now()
	report, synthPrompt, err := r.synthesize(ctx, question, agentResults, verification)
	if err != nil {
		return nil, fmt.Errorf("synthesis failed: %w", err)
	}
	synthesisMs := time.Since(synthesisStart).Milliseconds()
	prompts = append(prompts, synthPrompt)

	// Count total sources
	totalSources := len(allSources)

	report.AgentResults = agentResults
	report.Verification = verification
	report.AllSources = allSources
	report.ResearchPrompts = prompts
	report.Metrics = ResearchMetrics{
		TotalMs:        time.Since(totalStart).Milliseconds(),
		PlanningMs:     planningMs,
		ResearchMs:     researchMs,
		VerificationMs: verificationMs,
		SynthesisMs:    synthesisMs,
		AgentsUsed:     len(selectedAgents),
		TotalSources:   totalSources,
		FactsExtracted: len(allFacts),
		WebSearches:    len(allSources),
		RetryCount:     retryCount,
	}

	// Store in memory for follow-up queries
	r.memory.Store(fmt.Sprintf("r_%d", time.Now().UnixMilli()), question, report, allFacts)

	eventCh <- ResearchEvent{Type: "report", Data: report}
	eventCh <- ResearchEvent{Type: "done", Message: "Research complete"}

	return report, nil
}

func (r *ResearchService) planResearch(ctx context.Context, question string, previousContext string) ([]ResearchAgent, string, PromptRecord, error) {
	agentList := make([]string, len(r.agents))
	for i, a := range r.agents {
		agentList[i] = fmt.Sprintf("- %s (%s): %s", a.ID, a.Name, a.Description)
	}

	contextNote := ""
	if previousContext != "" {
		contextNote = "\n\nNote: There is previous research context available. Consider this when selecting agents — you may skip agents whose area was already covered unless the new query specifically requires fresh analysis.\n"
	}

	systemPrompt := "You are a research planning coordinator. Select the optimal set of agents and create a focused research plan."
	userPrompt := fmt.Sprintf(`Research question: "%s"
%s
Available research agents:
%s

Select 3-5 agents most relevant to this query. Return ONLY agent IDs as a comma-separated list on the first line.
On the second line, write a 1-2 sentence research plan describing the approach.

Example:
overview,market,competitor,news
Analyze the company's market position, competitive landscape, and recent developments.`, question, contextNote, strings.Join(agentList, "\n"))

	prompt := PromptRecord{Phase: "planning", System: systemPrompt, User: userPrompt}

	response, err := r.llm.Generate(ctx, systemPrompt, userPrompt, 256)
	if err != nil {
		return r.agents[:4], "Default research plan with overview, market, technical, and news analysis.", prompt, nil
	}

	lines := strings.SplitN(strings.TrimSpace(response), "\n", 2)
	agentIDs := strings.Split(strings.TrimSpace(lines[0]), ",")

	plan := "Multi-agent research analysis."
	if len(lines) > 1 {
		plan = strings.TrimSpace(lines[1])
	}

	var selected []ResearchAgent
	agentMap := make(map[string]ResearchAgent)
	for _, a := range r.agents {
		agentMap[a.ID] = a
	}

	for _, id := range agentIDs {
		id = strings.TrimSpace(id)
		if agent, ok := agentMap[id]; ok {
			selected = append(selected, agent)
		}
	}

	if len(selected) < 2 {
		selected = r.agents[:4]
	}

	return selected, plan, prompt, nil
}

func (r *ResearchService) executeAgents(ctx context.Context, agents []ResearchAgent, question string, previousContext string, eventCh chan<- ResearchEvent) []AgentResult {
	var (
		mu      sync.Mutex
		wg      sync.WaitGroup
		results []AgentResult
	)

	for _, agent := range agents {
		wg.Add(1)
		go func(a ResearchAgent) {
			defer wg.Done()

			eventCh <- ResearchEvent{
				Type:    "agent_start",
				AgentID: a.ID,
				Agent:   a.Name,
				Message: fmt.Sprintf("%s is researching...", a.Name),
			}

			start := time.Now()

			// Agent researches with web search integration
			fullQuery := question
			if previousContext != "" {
				fullQuery = question + "\n\n" + previousContext
			}

			content, sources, err := r.webSearch.SearchWithContext(ctx, fullQuery, a.Description)
			if err != nil {
				mu.Lock()
				results = append(results, AgentResult{
					AgentID:    a.ID,
					AgentName:  a.Name,
					Status:     "failed",
					Error:      err.Error(),
					DurationMs: time.Since(start).Milliseconds(),
				})
				mu.Unlock()

				eventCh <- ResearchEvent{
					Type:    "agent_complete",
					AgentID: a.ID,
					Agent:   a.Name,
					Message: fmt.Sprintf("%s encountered an error", a.Name),
					Data:    map[string]interface{}{"status": "failed", "error": err.Error()},
				}
				return
			}

			durationMs := time.Since(start).Milliseconds()

			result := AgentResult{
				AgentID:    a.ID,
				AgentName:  a.Name,
				Content:    content,
				Sources:    sources,
				DurationMs: durationMs,
				Status:     "completed",
			}

			mu.Lock()
			results = append(results, result)
			mu.Unlock()

			eventCh <- ResearchEvent{
				Type:    "agent_complete",
				AgentID: a.ID,
				Agent:   a.Name,
				Message: fmt.Sprintf("%s completed in %dms", a.Name, durationMs),
				Data:    map[string]interface{}{"status": "completed", "duration_ms": durationMs, "sources": len(sources)},
			}
		}(agent)
	}

	wg.Wait()
	return results
}

func (r *ResearchService) retryWeakAgents(ctx context.Context, originalResults []AgentResult, question string, eventCh chan<- ResearchEvent) []AgentResult {
	var updated []AgentResult

	for _, ar := range originalResults {
		if ar.Status == "completed" && len(ar.Content) > 100 {
			updated = append(updated, ar)
			continue
		}

		// Retry failed or weak agent
		eventCh <- ResearchEvent{
			Type:    "agent_start",
			AgentID: ar.AgentID,
			Agent:   ar.AgentName,
			Message: fmt.Sprintf("Retrying %s with broader query...", ar.AgentName),
		}

		start := time.Now()
		content, sources, err := r.webSearch.SearchWithContext(ctx, "comprehensive overview: "+question, ar.AgentName)
		if err != nil {
			updated = append(updated, ar) // Keep original failed result
			continue
		}

		updated = append(updated, AgentResult{
			AgentID:    ar.AgentID,
			AgentName:  ar.AgentName,
			Content:    content,
			Sources:    sources,
			DurationMs: time.Since(start).Milliseconds(),
			Status:     "completed",
		})

		eventCh <- ResearchEvent{
			Type:    "agent_complete",
			AgentID: ar.AgentID,
			Agent:   ar.AgentName,
			Message: fmt.Sprintf("%s retry completed", ar.AgentName),
			Data:    map[string]interface{}{"status": "completed", "retry": true},
		}
	}

	return updated
}

func (r *ResearchService) synthesize(ctx context.Context, question string, results []AgentResult, verification *VerificationResult) (*ResearchReport, PromptRecord, error) {
	var agentOutputs []string
	for _, ar := range results {
		if ar.Status == "completed" {
			output := fmt.Sprintf("### %s\n%s", ar.AgentName, ar.Content)
			if len(ar.Facts) > 0 {
				output += "\n\nExtracted Facts:"
				for _, f := range ar.Facts {
					output += fmt.Sprintf("\n- [%s] %s", f.Category, f.Claim)
					if f.Value != "" {
						output += fmt.Sprintf(": %s %s", f.Value, f.Unit)
					}
				}
			}
			agentOutputs = append(agentOutputs, output)
		}
	}

	if len(agentOutputs) == 0 {
		return &ResearchReport{
			Title:   "Research Report",
			Summary: "Unable to complete research — all agents encountered errors.",
		}, PromptRecord{}, nil
	}

	verificationNote := ""
	if verification != nil && len(verification.VerifiedFacts) > 0 {
		verificationNote = "\n\nVerification Results:"
		for _, vf := range verification.VerifiedFacts {
			verificationNote += fmt.Sprintf("\n- [%.0f%% confidence] %s", vf.ConfidenceScore*100, vf.Claim)
		}
		if len(verification.Warnings) > 0 {
			verificationNote += "\n\nWarnings: " + strings.Join(verification.Warnings, "; ")
		}
	}

	systemPrompt := `You are a senior research synthesis specialist. Create structured, professional research reports.
Be data-driven and precise. Include specific numbers, percentages, and metrics.
For each section, cite which research agent provided the information.`

	userPrompt := fmt.Sprintf(`Research Question: %s

Agent Research Outputs:
%s
%s

Create a professional research report. Format EXACTLY as follows:

TITLE: [Concise, professional report title]

SUMMARY: [3-4 sentence executive summary with key numbers]

KEY_FINDINGS:
- [Finding 1 with specific data]
- [Finding 2 with specific data]
- [Finding 3 with specific data]
- [Finding 4 with specific data]
- [Finding 5 with specific data]

DATA_POINTS:
[metric label]|[numeric_value]|[unit]|[category]
(Include 4-8 quantitative data points for charts. Categories: financial, market, technical, growth)

SECTION: Executive Summary
[2-3 paragraphs summarizing the research]

SECTION: Market Analysis
[2-3 paragraphs on market position, size, and dynamics]

SECTION: Competitive Landscape
[2-3 paragraphs on competitors and positioning]

SECTION: Technology & Innovation
[2-3 paragraphs on technical aspects]

SECTION: Recent Developments
[2-3 paragraphs on news and developments]

SECTION: Risks & Challenges
[2-3 paragraphs on risks and opportunities]

SECTION: Future Outlook
[2-3 paragraphs on predictions and trajectory]`, question, strings.Join(agentOutputs, "\n\n---\n\n"), verificationNote)

	prompt := PromptRecord{Phase: "synthesis", System: systemPrompt, User: userPrompt}

	response, err := r.llm.Generate(ctx, systemPrompt, userPrompt, 4096)
	if err != nil {
		return r.fallbackReport(question, results), prompt, nil
	}

	return parseResearchReport(response), prompt, nil
}

func (r *ResearchService) fallbackReport(question string, results []AgentResult) *ResearchReport {
	var sections []ReportSection
	var findings []string

	for _, ar := range results {
		if ar.Status == "completed" {
			sections = append(sections, ReportSection{
				Title:   ar.AgentName + " Analysis",
				Content: ar.Content,
				AgentID: ar.AgentID,
			})
			if lines := strings.SplitN(ar.Content, "\n", 2); len(lines) > 0 {
				finding := strings.TrimLeft(lines[0], "- •*#")
				if len(finding) > 10 {
					findings = append(findings, finding)
				}
			}
		}
	}

	return &ResearchReport{
		Title:       fmt.Sprintf("Research: %s", question),
		Summary:     fmt.Sprintf("Multi-agent analysis of: %s", question),
		Sections:    sections,
		KeyFindings: findings,
	}
}

func parseResearchReport(response string) *ResearchReport {
	report := &ResearchReport{}
	lines := strings.Split(response, "\n")
	var currentSection *ReportSection
	var sectionContent []string

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)

		if strings.HasPrefix(trimmed, "TITLE:") {
			report.Title = strings.TrimSpace(strings.TrimPrefix(trimmed, "TITLE:"))
		} else if strings.HasPrefix(trimmed, "SUMMARY:") {
			report.Summary = strings.TrimSpace(strings.TrimPrefix(trimmed, "SUMMARY:"))
		} else if trimmed == "KEY_FINDINGS:" {
			continue
		} else if strings.HasPrefix(trimmed, "- ") && report.Title != "" && len(report.Sections) == 0 && currentSection == nil {
			report.KeyFindings = append(report.KeyFindings, strings.TrimPrefix(trimmed, "- "))
		} else if strings.HasPrefix(trimmed, "DATA_POINTS:") {
			continue
		} else if strings.Contains(trimmed, "|") && !strings.HasPrefix(trimmed, "SECTION:") && currentSection == nil {
			parts := strings.SplitN(trimmed, "|", 4)
			if len(parts) >= 2 {
				var value float64
				fmt.Sscanf(strings.TrimSpace(parts[1]), "%f", &value)
				unit := ""
				if len(parts) >= 3 {
					unit = strings.TrimSpace(parts[2])
				}
				category := ""
				if len(parts) >= 4 {
					category = strings.TrimSpace(parts[3])
				}
				if value != 0 || strings.TrimSpace(parts[1]) == "0" {
					report.DataPoints = append(report.DataPoints, DataPoint{
						Label:    strings.TrimSpace(parts[0]),
						Value:    value,
						Unit:     unit,
						Category: category,
					})
				}
			}
		} else if strings.HasPrefix(trimmed, "SECTION:") {
			if currentSection != nil {
				currentSection.Content = strings.TrimSpace(strings.Join(sectionContent, "\n"))
				report.Sections = append(report.Sections, *currentSection)
			}
			currentSection = &ReportSection{
				Title: strings.TrimSpace(strings.TrimPrefix(trimmed, "SECTION:")),
			}
			sectionContent = nil
		} else if currentSection != nil {
			sectionContent = append(sectionContent, line)
		}
	}

	if currentSection != nil {
		currentSection.Content = strings.TrimSpace(strings.Join(sectionContent, "\n"))
		report.Sections = append(report.Sections, *currentSection)
	}

	if report.Title == "" {
		report.Title = "Research Report"
	}

	return report
}

// IsResearchQuery detects whether a question is a research-style query.
func IsResearchQuery(question string) bool {
	q := strings.ToLower(question)
	keywords := []string{
		"research", "analyze", "analysis", "compare", "investigate",
		"deep dive", "report", "comprehensive", "market", "trend",
		"evaluate", "assessment", "study", "explore", "overview",
		"landscape", "competitive", "benchmark", "forecast", "outlook",
	}
	for _, kw := range keywords {
		if strings.Contains(q, kw) {
			return true
		}
	}
	return len(question) > 80
}
