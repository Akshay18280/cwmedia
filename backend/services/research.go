package services

import (
	"context"
	"fmt"
	"log"
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
	Title           string               `json:"title"`
	Summary         string               `json:"summary"`
	Sections        []ReportSection      `json:"sections"`
	KeyFindings     []string             `json:"key_findings"`
	DataPoints      []DataPoint          `json:"data_points,omitempty"`
	CompanyProfile  *CompanyProfile      `json:"company_profile,omitempty"`
	FinancialData   []FinancialMetric    `json:"financial_data,omitempty"`
	Competitors     []CompetitorEntry    `json:"competitors,omitempty"`
	SwotAnalysis    *SwotAnalysis        `json:"swot_analysis,omitempty"`
	Timeline        []TimelineEvent      `json:"timeline,omitempty"`
	NewsItems       []NewsItem           `json:"news_items,omitempty"`
	ConfidenceScore *ConfidenceScore     `json:"confidence_score,omitempty"`
	AgentResults    []AgentResult        `json:"agent_results"`
	Metrics         ResearchMetrics      `json:"metrics"`
	Verification    *VerificationResult  `json:"verification,omitempty"`
	AllSources      []WebSearchResult    `json:"all_sources,omitempty"`
	ResearchPrompts []PromptRecord       `json:"research_prompts,omitempty"`
}

// CompanyProfile holds structured company metadata.
type CompanyProfile struct {
	Name        string `json:"name"`
	Founded     string `json:"founded,omitempty"`
	CEO         string `json:"ceo,omitempty"`
	Headquarters string `json:"headquarters,omitempty"`
	Employees   string `json:"employees,omitempty"`
	Industry    string `json:"industry,omitempty"`
	MarketCap   string `json:"market_cap,omitempty"`
	StockTicker string `json:"stock_ticker,omitempty"`
	Website     string `json:"website,omitempty"`
	Description string `json:"description,omitempty"`
}

// FinancialMetric represents a financial data point for charts.
type FinancialMetric struct {
	Label    string  `json:"label"`
	Value    float64 `json:"value"`
	Unit     string  `json:"unit"`
	Category string  `json:"category"` // revenue, profit, growth, valuation
	Period   string  `json:"period,omitempty"`
}

// CompetitorEntry represents a competitor comparison row.
type CompetitorEntry struct {
	Name       string `json:"name"`
	MarketCap  string `json:"market_cap,omitempty"`
	Revenue    string `json:"revenue,omitempty"`
	Strengths  string `json:"strengths,omitempty"`
	Weaknesses string `json:"weaknesses,omitempty"`
	MarketShare string `json:"market_share,omitempty"`
}

// SwotAnalysis holds structured SWOT data.
type SwotAnalysis struct {
	Strengths     []string `json:"strengths"`
	Weaknesses    []string `json:"weaknesses"`
	Opportunities []string `json:"opportunities"`
	Threats       []string `json:"threats"`
}

// TimelineEvent represents a key event in company history.
type TimelineEvent struct {
	Year        string `json:"year"`
	Title       string `json:"title"`
	Description string `json:"description,omitempty"`
	Category    string `json:"category,omitempty"` // founding, ipo, acquisition, product, milestone
}

// NewsItem represents a recent news item with sentiment.
type NewsItem struct {
	Title     string `json:"title"`
	Source    string `json:"source,omitempty"`
	Date      string `json:"date,omitempty"`
	Summary   string `json:"summary"`
	Sentiment string `json:"sentiment"` // positive, neutral, negative
	Impact    string `json:"impact,omitempty"` // high, medium, low
}

// ConfidenceScore represents overall research confidence.
type ConfidenceScore struct {
	Overall      float64 `json:"overall"` // 0-100
	SourceCount  int     `json:"source_count"`
	Reliability  string  `json:"reliability"` // high, medium, low
	DataFreshness string `json:"data_freshness,omitempty"`
	Label        string  `json:"label"` // "High Confidence", etc.
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
	financial    *FinancialDataService
	agents       []ResearchAgent
}

// NewResearchService creates the full research orchestrator.
func NewResearchService(llm *LLMService, tavilyKey string) *ResearchService {
	ws := NewWebSearchService(llm, tavilyKey)

	agents := []ResearchAgent{
		{
			ID:          "overview",
			Name:        "Overview Analyst",
			Description: "Company/topic overview, history, leadership, key metrics, and product ecosystem",
			SystemPrompt: `You are a senior research analyst specializing in company profiles and industry overviews.
Provide investment-grade analysis including:
- Company founding, history, and key milestones with exact dates
- Leadership team (CEO, CTO, key executives) with backgrounds
- Core products and services with market positioning
- Employee count, headquarters, and global presence
- Mission statement and strategic vision
- Recent organizational changes or pivots

Format company metadata as:
COMPANY_PROFILE:
name|[company name]
founded|[year]
ceo|[CEO name]
headquarters|[city, country]
employees|[count]
industry|[sector]
market_cap|[value]
stock_ticker|[ticker]
website|[url]

Format key milestones as:
TIMELINE:
[year]|[event title]|[brief description]|[category: founding/ipo/acquisition/product/milestone]

Be precise with numbers and dates. Cite sources.`,
		},
		{
			ID:          "market",
			Name:        "Market Intelligence",
			Description: "Market size, financial performance, growth metrics, and valuation analysis",
			SystemPrompt: `You are a senior financial analyst. Provide data-driven market and financial analysis including:
- Market capitalization and valuation metrics (P/E ratio, EV/EBITDA)
- Revenue figures with year-over-year growth rates
- Profit margins (gross, operating, net) with trends
- Key financial ratios and performance indicators
- Market size and share estimates with CAGR projections
- Stock performance and analyst consensus

Format financial data as pipe-separated values:
FINANCIAL_DATA:
[metric label]|[numeric value]|[unit: $B, %, ratio]|[category: revenue/profit/growth/valuation]|[period: FY2024]

Include at least 8-12 quantitative data points for chart visualization.
Be precise — use exact figures from earnings reports and financial filings.`,
		},
		{
			ID:          "technical",
			Name:        "Technical Analyst",
			Description: "Technology stack, R&D, patents, product architecture, and innovation pipeline",
			SystemPrompt: `You are a technology research analyst specializing in product and R&D analysis.
Provide deep technical analysis including:
- Core technology stack and architecture decisions
- Key patents and intellectual property
- R&D investment as % of revenue and absolute figures
- AI/ML capabilities and technology strategy
- Product roadmap and upcoming launches
- Developer ecosystem and API strategy
- Cloud infrastructure and scalability approach
- Technical moats and competitive advantages

Be specific about technology choices, versions, and implementation approaches.
Include specific patent numbers, R&D dollar amounts, and technical benchmarks.`,
		},
		{
			ID:          "news",
			Name:        "News Intelligence",
			Description: "Breaking news, sentiment analysis, partnerships, regulatory updates, and market impact",
			SystemPrompt: `You are a news intelligence analyst producing institutional-grade news briefings.
Analyze recent developments including:
- Latest earnings, announcements, and press releases
- Partnership and M&A activity
- Regulatory developments and compliance updates
- Executive changes and organizational news
- Product launches and market expansion
- Industry trends affecting the subject

Format each news item as:
NEWS_ITEM:
[title]|[source]|[date]|[1-2 sentence summary]|[sentiment: positive/neutral/negative]|[impact: high/medium/low]

Include 5-10 recent news items. Assess overall news sentiment.
Focus on items from the last 3-6 months.`,
		},
		{
			ID:          "competitor",
			Name:        "Competitor Analyst",
			Description: "Competitive landscape, market positioning, comparative analysis, and SWOT",
			SystemPrompt: `You are a competitive intelligence analyst at a top strategy firm.
Produce a professional competitive analysis including:
- Top 4-6 direct competitors with market positioning
- Market share comparison with specific percentages
- Revenue and valuation comparisons
- Competitive advantages and disadvantages for each player
- Product feature comparison matrix
- Barriers to entry and competitive moats

Format competitor data as:
COMPETITOR:
[name]|[market cap]|[revenue]|[key strength]|[key weakness]|[market share]

Also produce a SWOT analysis:
SWOT:
S|[strength point]
S|[strength point]
W|[weakness point]
W|[weakness point]
O|[opportunity point]
O|[opportunity point]
T|[threat point]
T|[threat point]

Include 3-5 items per SWOT category. Be specific and actionable.`,
		},
		{
			ID:          "risks",
			Name:        "Strategic Analyst",
			Description: "Risk assessment, strategic outlook, growth catalysts, and investment thesis",
			SystemPrompt: `You are a senior strategy consultant producing C-suite level analysis.
Provide strategic assessment including:
- Key growth catalysts and expansion opportunities
- Risk factors categorized by severity (high/medium/low)
- Regulatory and geopolitical risks
- Technology disruption risks
- ESG considerations and sustainability strategy
- 1-year, 3-year, and 5-year strategic outlook
- Bull case and bear case scenarios
- Strategic recommendations

Be balanced and nuanced. Quantify risks where possible.
Include probability assessments for key scenarios.`,
		},
	}

	return &ResearchService{
		llm:         llm,
		webSearch:   ws,
		factExtract: NewFactExtractor(llm),
		verifier:    NewVerificationAgent(llm),
		memory:      NewResearchMemory(20),
		financial:   NewFinancialDataService(),
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
			"agents": agentNames,
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

	// Phase 5.5: Financial data enrichment — fetch live market data if ticker is detected
	if ticker := DetectTicker(question, report.CompanyProfile); ticker != "" {
		if quote, err := r.financial.FetchQuote(ctx, ticker); err == nil {
			liveMetrics := QuoteToFinancialMetrics(quote)
			if len(liveMetrics) > 0 {
				// Merge live data: prepend live metrics, keep LLM-extracted ones that don't overlap
				liveLabels := make(map[string]bool)
				for _, m := range liveMetrics {
					liveLabels[m.Label] = true
				}
				for _, m := range report.FinancialData {
					if !liveLabels[m.Label] {
						liveMetrics = append(liveMetrics, m)
					}
				}
				report.FinancialData = liveMetrics
				log.Printf("Financial data: enriched with %d live metrics for %s", len(liveMetrics), ticker)
			}
			// Enrich company profile with live data
			if report.CompanyProfile != nil && quote.LongName != "" && report.CompanyProfile.Name == "" {
				report.CompanyProfile.Name = quote.LongName
			}
			if report.CompanyProfile != nil && report.CompanyProfile.StockTicker == "" {
				report.CompanyProfile.StockTicker = ticker
			}
		} else {
			log.Printf("Financial data: could not fetch live data for %s: %v", ticker, err)
		}
	}

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
		// Fallback to default agents but log the failure
		log.Printf("Research planning LLM failed, using default agents: %v", err)
		return r.agents[:4], "Default research plan (planning LLM unavailable) — deploying overview, market, technical, and news agents.", prompt, nil
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

	systemPrompt := `You are a senior research synthesis specialist at a top-tier investment research firm.
Create professional, publication-ready research reports comparable to institutional investment research.
Be data-driven and precise. Include specific numbers, percentages, and metrics.
Structure your output for both human reading and machine parsing.`

	userPrompt := fmt.Sprintf(`Research Question: %s

Agent Research Outputs:
%s
%s

Create a professional intelligence report. Format EXACTLY as follows:

TITLE: [Professional report title — e.g., "Apple Inc. — Strategic Intelligence Report Q1 2026"]

SUMMARY: [4-5 sentence executive summary with key metrics and strategic assessment]

KEY_FINDINGS:
- [Finding 1 with specific data point]
- [Finding 2 with specific data point]
- [Finding 3 with specific data point]
- [Finding 4 with specific data point]
- [Finding 5 with specific data point]
- [Finding 6 with specific data point]

COMPANY_PROFILE:
name|[company/subject name]
founded|[year or N/A]
ceo|[CEO name or N/A]
headquarters|[location or N/A]
employees|[count or N/A]
industry|[sector]
market_cap|[value or N/A]
stock_ticker|[ticker or N/A]
website|[url or N/A]
description|[1-sentence description]

FINANCIAL_DATA:
[metric]|[value]|[unit]|[category]|[period]
(Include 8-12 data points. Categories: revenue, profit, growth, valuation, market)

COMPETITOR:
[name]|[market cap]|[revenue]|[key strength]|[key weakness]|[market share]
(Include 4-6 competitors)

SWOT:
S|[strength]
S|[strength]
S|[strength]
W|[weakness]
W|[weakness]
W|[weakness]
O|[opportunity]
O|[opportunity]
O|[opportunity]
T|[threat]
T|[threat]
T|[threat]

TIMELINE:
[year]|[event]|[description]|[category]
(Include 5-8 key milestones. Categories: founding, ipo, acquisition, product, milestone)

NEWS_ITEM:
[title]|[source]|[date]|[summary]|[sentiment]|[impact]
(Include 5-8 recent news items. Sentiment: positive/neutral/negative. Impact: high/medium/low)

CONFIDENCE:
[overall_score 0-100]|[source_count]|[reliability: high/medium/low]|[data_freshness]

SECTION: Executive Summary
[3-4 paragraphs with a comprehensive strategic overview, key financial highlights, and investment thesis]

SECTION: Company Overview
[2-3 paragraphs on company history, mission, leadership, and organizational structure]

SECTION: Financial Performance
[3-4 paragraphs analyzing revenue trends, profitability, growth metrics, and financial health]

SECTION: Market Position & Strategy
[2-3 paragraphs on market share, competitive positioning, go-to-market strategy]

SECTION: Product & Technology
[2-3 paragraphs on product portfolio, technology stack, R&D investment, innovation pipeline]

SECTION: Competitive Landscape
[2-3 paragraphs on key competitors, market dynamics, and competitive advantages/disadvantages]

SECTION: News & Developments
[2-3 paragraphs on recent news, partnerships, regulatory updates, and market impact]

SECTION: SWOT Analysis
[2-3 paragraphs expanding on the structured SWOT data above with strategic context]

SECTION: Strategic Outlook
[2-3 paragraphs on 1-3-5 year outlook, growth catalysts, risk factors, and strategic recommendations]

SECTION: Conclusion
[1-2 paragraphs with final assessment, confidence level, and key takeaways]`, question, strings.Join(agentOutputs, "\n\n---\n\n"), verificationNote)

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

	// Track which structured block we're parsing
	currentBlock := ""

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)

		// Detect block headers
		switch {
		case strings.HasPrefix(trimmed, "TITLE:"):
			currentBlock = ""
			report.Title = strings.TrimSpace(strings.TrimPrefix(trimmed, "TITLE:"))
			continue
		case strings.HasPrefix(trimmed, "SUMMARY:"):
			currentBlock = ""
			report.Summary = strings.TrimSpace(strings.TrimPrefix(trimmed, "SUMMARY:"))
			continue
		case trimmed == "KEY_FINDINGS:":
			currentBlock = "key_findings"
			continue
		case trimmed == "COMPANY_PROFILE:":
			currentBlock = "company_profile"
			report.CompanyProfile = &CompanyProfile{}
			continue
		case trimmed == "FINANCIAL_DATA:":
			currentBlock = "financial_data"
			continue
		case trimmed == "DATA_POINTS:":
			currentBlock = "data_points"
			continue
		case strings.HasPrefix(trimmed, "COMPETITOR:") && !strings.HasPrefix(trimmed, "COMPETITOR: "):
			currentBlock = "competitor"
			continue
		case strings.HasPrefix(trimmed, "SWOT:") && !strings.HasPrefix(trimmed, "SWOT: "):
			currentBlock = "swot"
			report.SwotAnalysis = &SwotAnalysis{}
			continue
		case strings.HasPrefix(trimmed, "TIMELINE:") && !strings.HasPrefix(trimmed, "TIMELINE: "):
			currentBlock = "timeline"
			continue
		case strings.HasPrefix(trimmed, "NEWS_ITEM:") && !strings.HasPrefix(trimmed, "NEWS_ITEM: "):
			currentBlock = "news_item"
			continue
		case strings.HasPrefix(trimmed, "CONFIDENCE:") && !strings.HasPrefix(trimmed, "CONFIDENCE: "):
			currentBlock = "confidence"
			continue
		case strings.HasPrefix(trimmed, "SECTION:"):
			currentBlock = "section"
			if currentSection != nil {
				currentSection.Content = strings.TrimSpace(strings.Join(sectionContent, "\n"))
				report.Sections = append(report.Sections, *currentSection)
			}
			currentSection = &ReportSection{
				Title: strings.TrimSpace(strings.TrimPrefix(trimmed, "SECTION:")),
			}
			sectionContent = nil
			continue
		}

		// Parse content based on current block
		if trimmed == "" && currentBlock != "section" {
			if currentBlock != "" && currentBlock != "key_findings" {
				currentBlock = ""
			}
			continue
		}

		switch currentBlock {
		case "key_findings":
			if strings.HasPrefix(trimmed, "- ") {
				report.KeyFindings = append(report.KeyFindings, strings.TrimPrefix(trimmed, "- "))
			}

		case "company_profile":
			if report.CompanyProfile != nil {
				parts := strings.SplitN(trimmed, "|", 2)
				if len(parts) == 2 {
					key := strings.TrimSpace(parts[0])
					val := strings.TrimSpace(parts[1])
					if val == "N/A" || val == "" {
						continue
					}
					switch key {
					case "name":
						report.CompanyProfile.Name = val
					case "founded":
						report.CompanyProfile.Founded = val
					case "ceo":
						report.CompanyProfile.CEO = val
					case "headquarters":
						report.CompanyProfile.Headquarters = val
					case "employees":
						report.CompanyProfile.Employees = val
					case "industry":
						report.CompanyProfile.Industry = val
					case "market_cap":
						report.CompanyProfile.MarketCap = val
					case "stock_ticker":
						report.CompanyProfile.StockTicker = val
					case "website":
						report.CompanyProfile.Website = val
					case "description":
						report.CompanyProfile.Description = val
					}
				}
			}

		case "financial_data":
			parts := strings.SplitN(trimmed, "|", 5)
			if len(parts) >= 3 {
				var value float64
				fmt.Sscanf(strings.TrimSpace(parts[1]), "%f", &value)
				unit := strings.TrimSpace(parts[2])
				category := ""
				if len(parts) >= 4 {
					category = strings.TrimSpace(parts[3])
				}
				period := ""
				if len(parts) >= 5 {
					period = strings.TrimSpace(parts[4])
				}
				report.FinancialData = append(report.FinancialData, FinancialMetric{
					Label:    strings.TrimSpace(parts[0]),
					Value:    value,
					Unit:     unit,
					Category: category,
					Period:   period,
				})
				// Also add to DataPoints for backward compatibility
				report.DataPoints = append(report.DataPoints, DataPoint{
					Label:    strings.TrimSpace(parts[0]),
					Value:    value,
					Unit:     unit,
					Category: category,
				})
			}

		case "data_points":
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
				report.DataPoints = append(report.DataPoints, DataPoint{
					Label:    strings.TrimSpace(parts[0]),
					Value:    value,
					Unit:     unit,
					Category: category,
				})
			}

		case "competitor":
			parts := strings.SplitN(trimmed, "|", 6)
			if len(parts) >= 2 {
				entry := CompetitorEntry{Name: strings.TrimSpace(parts[0])}
				if len(parts) >= 2 {
					entry.MarketCap = strings.TrimSpace(parts[1])
				}
				if len(parts) >= 3 {
					entry.Revenue = strings.TrimSpace(parts[2])
				}
				if len(parts) >= 4 {
					entry.Strengths = strings.TrimSpace(parts[3])
				}
				if len(parts) >= 5 {
					entry.Weaknesses = strings.TrimSpace(parts[4])
				}
				if len(parts) >= 6 {
					entry.MarketShare = strings.TrimSpace(parts[5])
				}
				report.Competitors = append(report.Competitors, entry)
			}

		case "swot":
			if report.SwotAnalysis != nil {
				parts := strings.SplitN(trimmed, "|", 2)
				if len(parts) == 2 {
					category := strings.TrimSpace(parts[0])
					item := strings.TrimSpace(parts[1])
					switch category {
					case "S":
						report.SwotAnalysis.Strengths = append(report.SwotAnalysis.Strengths, item)
					case "W":
						report.SwotAnalysis.Weaknesses = append(report.SwotAnalysis.Weaknesses, item)
					case "O":
						report.SwotAnalysis.Opportunities = append(report.SwotAnalysis.Opportunities, item)
					case "T":
						report.SwotAnalysis.Threats = append(report.SwotAnalysis.Threats, item)
					}
				}
			}

		case "timeline":
			parts := strings.SplitN(trimmed, "|", 4)
			if len(parts) >= 2 {
				event := TimelineEvent{
					Year:  strings.TrimSpace(parts[0]),
					Title: strings.TrimSpace(parts[1]),
				}
				if len(parts) >= 3 {
					event.Description = strings.TrimSpace(parts[2])
				}
				if len(parts) >= 4 {
					event.Category = strings.TrimSpace(parts[3])
				}
				report.Timeline = append(report.Timeline, event)
			}

		case "news_item":
			parts := strings.SplitN(trimmed, "|", 6)
			if len(parts) >= 4 {
				item := NewsItem{
					Title:   strings.TrimSpace(parts[0]),
					Source:  strings.TrimSpace(parts[1]),
					Date:    strings.TrimSpace(parts[2]),
					Summary: strings.TrimSpace(parts[3]),
				}
				if len(parts) >= 5 {
					item.Sentiment = strings.TrimSpace(parts[4])
				}
				if len(parts) >= 6 {
					item.Impact = strings.TrimSpace(parts[5])
				}
				report.NewsItems = append(report.NewsItems, item)
			}

		case "confidence":
			parts := strings.SplitN(trimmed, "|", 4)
			if len(parts) >= 3 {
				var score float64
				fmt.Sscanf(strings.TrimSpace(parts[0]), "%f", &score)
				var sourceCount int
				fmt.Sscanf(strings.TrimSpace(parts[1]), "%d", &sourceCount)
				label := "Moderate Confidence"
				if score >= 80 {
					label = "High Confidence"
				} else if score < 50 {
					label = "Low Confidence"
				}
				cs := &ConfidenceScore{
					Overall:     score,
					SourceCount: sourceCount,
					Reliability: strings.TrimSpace(parts[2]),
					Label:       label,
				}
				if len(parts) >= 4 {
					cs.DataFreshness = strings.TrimSpace(parts[3])
				}
				report.ConfidenceScore = cs
			}
			currentBlock = ""

		case "section":
			if currentSection != nil {
				sectionContent = append(sectionContent, line)
			}
		}
	}

	if currentSection != nil {
		currentSection.Content = strings.TrimSpace(strings.Join(sectionContent, "\n"))
		report.Sections = append(report.Sections, *currentSection)
	}

	if report.Title == "" {
		report.Title = "Research Report"
	}

	// Clean up empty company profile
	if report.CompanyProfile != nil && report.CompanyProfile.Name == "" {
		report.CompanyProfile = nil
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
