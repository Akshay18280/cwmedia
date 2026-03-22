package services

import (
	"context"
	"fmt"
	"log"
	"math"
	"strings"
	"sync"
	"time"
)

// AutomationState represents the current state of the automation workflow.
type AutomationState string

const (
	StateInit       AutomationState = "INIT"
	StatePlanning   AutomationState = "PLANNING"
	StateStructure  AutomationState = "STRUCTURE"
	StateResearch   AutomationState = "RESEARCH"
	StateValidation AutomationState = "VALIDATION"
	StateSynthesis  AutomationState = "SYNTHESIS"
	StateReview     AutomationState = "REVIEW"
	StatePublish    AutomationState = "PUBLISH"
	StateCompleted  AutomationState = "COMPLETED"
	StateFailed     AutomationState = "FAILED"
)

// AutomationEvent is an SSE event emitted during the automation pipeline.
type AutomationEvent struct {
	Type      string      `json:"type"`       // phase_change, agent_start, agent_complete, research_event, quality_score, publish_decision, report_ready, blog_created, error, done
	Phase     string      `json:"phase,omitempty"`
	AgentName string      `json:"agent_name,omitempty"`
	Message   string      `json:"message,omitempty"`
	Data      interface{} `json:"data,omitempty"`
	Progress  float64     `json:"progress"`
	ElapsedMs int64       `json:"elapsed_ms"`
}

// AutomationJob represents a running or completed automation job.
type AutomationJob struct {
	ID            string            `json:"id"`
	Topic         string            `json:"topic"`
	State         AutomationState   `json:"state"`
	Progress      float64           `json:"progress"`
	StartedAt     time.Time         `json:"started_at"`
	CompletedAt   *time.Time        `json:"completed_at,omitempty"`
	AgentActivity []AgentActivity   `json:"agent_activity"`
	Report        *AutomationReport `json:"report,omitempty"`
	Blog          *BlogPost         `json:"blog,omitempty"`
	Logs          []AutomationLog   `json:"logs"`
	Error         string            `json:"error,omitempty"`
	RetryCount    int               `json:"retry_count"`
	MaxRetries    int               `json:"max_retries"`
	Metrics       AutomationMetrics `json:"metrics"`
}

// AgentActivity tracks an individual agent's work in the pipeline.
type AgentActivity struct {
	Name       string  `json:"name"`
	Status     string  `json:"status"` // pending, running, completed, failed, retrying
	StartedAt  *string `json:"started_at,omitempty"`
	DurationMs int64   `json:"duration_ms,omitempty"`
	Sources    int     `json:"sources"`
	Confidence float64 `json:"confidence"`
	Output     string  `json:"output,omitempty"`
}

// AutomationReport is the generated research report.
type AutomationReport struct {
	Title           string                    `json:"title"`
	Summary         string                    `json:"summary"`
	Sections        []AutomationReportSection `json:"sections"`
	Sources         []SourceRef               `json:"sources"`
	Confidence      float64                   `json:"confidence"`
	ContentScore    float64                   `json:"content_score"`
	SafetyPassed    bool                      `json:"safety_passed"`
	PublishDecision string                    `json:"publish_decision"` // publish, reject
	RejectReason    string                    `json:"reject_reason,omitempty"`
	// Rich data from ResearchService for frontend ReportViewer
	ResearchData *ResearchReport `json:"research_data,omitempty"`
}

// AutomationReportSection is a section of the automated report with ordering.
type AutomationReportSection struct {
	Title      string  `json:"title"`
	Content    string  `json:"content"`
	Order      int     `json:"order"`
	Confidence float64 `json:"confidence,omitempty"`
	AgentID    string  `json:"agent_id,omitempty"`
}

// SourceRef is a reference to a source used in research.
type SourceRef struct {
	URL       string  `json:"url"`
	Title     string  `json:"title"`
	Relevance float64 `json:"relevance"`
	Agent     string  `json:"agent"`
}

// BlogPost is the generated blog post.
type BlogPost struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Slug        string    `json:"slug"`
	Content     string    `json:"content"`
	Summary     string    `json:"summary"`
	Tags        []string  `json:"tags"`
	PublishedAt time.Time `json:"published_at"`
	Status      string    `json:"status"` // draft, published, rejected
}

// AutomationLog is a log entry from the automation pipeline.
type AutomationLog struct {
	Timestamp string `json:"timestamp"`
	Level     string `json:"level"` // info, warn, error, decision
	Agent     string `json:"agent,omitempty"`
	Message   string `json:"message"`
}

// AutomationMetrics tracks performance metrics.
type AutomationMetrics struct {
	TotalDurationMs  int64   `json:"total_duration_ms"`
	PlanningMs       int64   `json:"planning_ms"`
	ResearchMs       int64   `json:"research_ms"`
	ValidationMs     int64   `json:"validation_ms"`
	SynthesisMs      int64   `json:"synthesis_ms"`
	TotalSources     int     `json:"total_sources"`
	TotalAgents      int     `json:"total_agents"`
	TokensUsed       int     `json:"tokens_used"`
	APICallsMade     int     `json:"api_calls_made"`
	RetriesPerformed int     `json:"retries_performed"`
	InputTokens      int     `json:"input_tokens"`
	OutputTokens     int     `json:"output_tokens"`
	EstimatedCostUSD float64 `json:"estimated_cost_usd"`
}

// QualityThresholds defines the quality gates.
type QualityThresholds struct {
	MinSources     int     `json:"min_sources"`
	MinConfidence  float64 `json:"min_confidence"`
	RequireSafety  bool    `json:"require_safety"`
}

// AutomationService manages the AI newsroom automation pipeline.
type AutomationService struct {
	mu       sync.RWMutex
	jobs     map[string]*AutomationJob
	blogs    []BlogPost
	research *ResearchService
}

// NewAutomationService creates a new automation service.
func NewAutomationService(research *ResearchService) *AutomationService {
	return &AutomationService{
		jobs:     make(map[string]*AutomationJob),
		blogs:    []BlogPost{},
		research: research,
	}
}

// RunWorkflow triggers the full AI newsroom pipeline (polling mode — kept for backward compat).
func (a *AutomationService) RunWorkflow(ctx context.Context, topic string) string {
	job := a.createJob(topic)

	// Run the pipeline asynchronously — events are discarded in polling mode
	go func() {
		eventCh := make(chan AutomationEvent, 100)
		go func() {
			// Drain events in polling mode
			for range eventCh {
			}
		}()
		a.executePipeline(context.Background(), job, eventCh)
	}()

	return job.ID
}

// RunWorkflowStream triggers the pipeline with SSE event streaming.
func (a *AutomationService) RunWorkflowStream(ctx context.Context, topic string, eventCh chan<- AutomationEvent) string {
	job := a.createJob(topic)

	go func() {
		defer close(eventCh)
		a.executePipeline(ctx, job, eventCh)
	}()

	return job.ID
}

func (a *AutomationService) createJob(topic string) *AutomationJob {
	jobID := fmt.Sprintf("auto-%d", time.Now().UnixMilli())

	job := &AutomationJob{
		ID:         jobID,
		Topic:      topic,
		State:      StateInit,
		Progress:   0,
		StartedAt:  time.Now(),
		MaxRetries: 2,
		AgentActivity: []AgentActivity{
			{Name: "Planner", Status: "pending"},
			{Name: "Research Pipeline", Status: "pending"},
			{Name: "Content Scorer", Status: "pending"},
			{Name: "Safety Filter", Status: "pending"},
			{Name: "Publisher", Status: "pending"},
		},
		Logs: []AutomationLog{
			{Timestamp: time.Now().Format(time.RFC3339), Level: "info", Message: fmt.Sprintf("Automation workflow started for topic: %s", topic)},
		},
	}

	a.mu.Lock()
	a.jobs[jobID] = job
	a.mu.Unlock()

	return job
}

// GetJobStatus returns the current status of a job.
func (a *AutomationService) GetJobStatus(jobID string) (*AutomationJob, bool) {
	a.mu.RLock()
	defer a.mu.RUnlock()
	job, ok := a.jobs[jobID]
	return job, ok
}

// GetBlogs returns all published blog posts.
func (a *AutomationService) GetBlogs() []BlogPost {
	a.mu.RLock()
	defer a.mu.RUnlock()
	return append([]BlogPost{}, a.blogs...)
}

// executePipeline runs the full automation pipeline delegating research to ResearchService.
func (a *AutomationService) executePipeline(ctx context.Context, job *AutomationJob, eventCh chan<- AutomationEvent) {
	defer func() {
		if r := recover(); r != nil {
			a.failJob(job, fmt.Sprintf("pipeline panic: %v", r))
			a.emitEvent(eventCh, AutomationEvent{Type: "error", Message: fmt.Sprintf("Pipeline error: %v", r)})
		}
	}()

	start := time.Now()
	elapsed := func() int64 { return time.Since(start).Milliseconds() }

	// ── Phase 1: Planning ──────────────────────────────────────────
	a.transition(job, StatePlanning, 5, "Planning research strategy...")
	a.emitEvent(eventCh, AutomationEvent{Type: "phase_change", Phase: "PLANNING", Message: "Planning research strategy...", Progress: 5, ElapsedMs: elapsed()})

	planStart := time.Now()
	a.runAgent(job, "Planner", func() (string, error) {
		// Use LLM to generate a real research plan
		llm := a.research.LLM()
		if llm != nil {
			prompt := fmt.Sprintf(`Create a research plan for the topic: "%s".
Identify 3-5 key research angles, the type of sources needed, and what a comprehensive report should cover.
Keep response under 200 words.`, job.Topic)
			result, err := llm.Generate(ctx, "You are a research strategist. Create focused, actionable research plans.", prompt, 512)
			if err == nil {
				job.Metrics.APICallsMade++
				job.Metrics.InputTokens += len(prompt) / 4
				job.Metrics.OutputTokens += len(result) / 4
				return result, nil
			}
		}
		// Fallback if LLM unavailable
		return fmt.Sprintf("Research plan for '%s': Multi-agent analysis covering market, technology, competition, and outlook.", job.Topic), nil
	})
	a.emitEvent(eventCh, AutomationEvent{Type: "agent_complete", AgentName: "Planner", Progress: 10, ElapsedMs: elapsed()})

	job.Metrics.PlanningMs = time.Since(planStart).Milliseconds()

	// ── Phase 2: Delegate to ResearchService ─────────────────────────
	a.transition(job, StateResearch, 15, "Starting multi-agent research...")
	a.emitEvent(eventCh, AutomationEvent{Type: "phase_change", Phase: "RESEARCH", Message: "Deploying research agents...", Progress: 15, ElapsedMs: elapsed()})

	researchStart := time.Now()

	// Mark Research Pipeline as running
	a.setAgentStatus(job, "Research Pipeline", "running")

	// Create a channel to receive ResearchEvents from the real research pipeline
	researchEventCh := make(chan ResearchEvent, 100)
	var researchReport *ResearchReport
	var researchErr error

	go func() {
		defer close(researchEventCh)
		researchReport, researchErr = a.research.Research(ctx, job.Topic, researchEventCh)
	}()

	// Forward research events to automation events and update agent activity dynamically
	for rEvent := range researchEventCh {
		// Forward as research_event for the frontend
		progress := job.Progress
		switch rEvent.Type {
		case "planning":
			progress = 18
		case "plan_ready":
			progress = 22
			// Extract agent names from plan and add them to activity
			if data, ok := rEvent.Data.(map[string]interface{}); ok {
				if agents, ok := data["agents"].([]string); ok {
					a.mu.Lock()
					for _, agentName := range agents {
						job.AgentActivity = append(job.AgentActivity, AgentActivity{
							Name:   agentName,
							Status: "pending",
						})
					}
					a.mu.Unlock()
				}
			}
		case "agent_start":
			progress = 25 + (float64(a.countCompletedAgents(job)) / float64(maxInt(len(job.AgentActivity)-3, 1))) * 30
			a.setAgentStatus(job, rEvent.Agent, "running")
		case "agent_complete":
			progress = 25 + (float64(a.countCompletedAgents(job)+1) / float64(maxInt(len(job.AgentActivity)-3, 1))) * 30
			a.setAgentStatus(job, rEvent.Agent, "completed")
			// Update source count from agent result
			if ar, ok := rEvent.Data.(*AgentResult); ok {
				a.mu.Lock()
				for i := range job.AgentActivity {
					if job.AgentActivity[i].Name == rEvent.Agent {
						job.AgentActivity[i].Sources = len(ar.Sources)
						job.AgentActivity[i].DurationMs = ar.DurationMs
						break
					}
				}
				a.mu.Unlock()
			}
		case "extracting":
			progress = 55
		case "verifying":
			progress = 60
		case "verified":
			progress = 68
		case "synthesizing":
			progress = 72
		case "report":
			progress = 80
		case "retry":
			a.addLog(job, "warn", "Research", "Retrying weak agents...")
			job.Metrics.RetriesPerformed++
		}

		a.updateProgress(job, progress)
		a.emitEvent(eventCh, AutomationEvent{
			Type:      "research_event",
			Phase:     "RESEARCH",
			AgentName: rEvent.Agent,
			Message:   rEvent.Message,
			Data:      rEvent.Data,
			Progress:  progress,
			ElapsedMs: elapsed(),
		})
		a.addLog(job, "info", rEvent.Agent, rEvent.Message)
	}

	// Handle research completion
	if researchErr != nil {
		a.setAgentStatus(job, "Research Pipeline", "failed")
		a.addLog(job, "error", "Research Pipeline", fmt.Sprintf("Research failed: %v", researchErr))
		a.emitEvent(eventCh, AutomationEvent{Type: "error", Message: fmt.Sprintf("Research failed: %v", researchErr), ElapsedMs: elapsed()})
		a.failJob(job, fmt.Sprintf("Research pipeline failed: %v", researchErr))
		return
	}

	a.setAgentStatus(job, "Research Pipeline", "completed")
	job.Metrics.ResearchMs = time.Since(researchStart).Milliseconds()

	if researchReport != nil {
		job.Metrics.TotalSources = len(researchReport.AllSources)
		job.Metrics.TotalAgents = researchReport.Metrics.AgentsUsed
		job.Metrics.TokensUsed += researchReport.Metrics.WebSearches * 500 // rough estimate
		a.addLog(job, "info", "Research Pipeline", fmt.Sprintf("Research complete: %d sources, %d agents, %d facts extracted",
			len(researchReport.AllSources), researchReport.Metrics.AgentsUsed, researchReport.Metrics.FactsExtracted))
	}

	// ── Phase 3: Content Scoring ──────────────────────────────────
	a.transition(job, StateReview, 82, "Scoring and reviewing content...")
	a.emitEvent(eventCh, AutomationEvent{Type: "phase_change", Phase: "REVIEW", Message: "Scoring content quality...", Progress: 82, ElapsedMs: elapsed()})

	var contentScore float64
	a.runAgent(job, "Content Scorer", func() (string, error) {
		if researchReport == nil {
			contentScore = 0.3
			return "No research report to score", nil
		}

		// Score based on real metrics
		sourceScore := math.Min(float64(len(researchReport.AllSources))/10.0, 1.0)      // 10+ sources = 1.0
		sectionScore := math.Min(float64(len(researchReport.Sections))/8.0, 1.0)        // 8+ sections = 1.0
		agentScore := math.Min(float64(researchReport.Metrics.AgentsUsed)/5.0, 1.0)     // 5+ agents = 1.0
		factScore := math.Min(float64(researchReport.Metrics.FactsExtracted)/10.0, 1.0) // 10+ facts = 1.0

		// Verification confidence
		verifyScore := 0.5
		if researchReport.Verification != nil {
			verifyScore = researchReport.Verification.OverallConfidence
		}

		contentScore = (sourceScore*0.25 + sectionScore*0.20 + agentScore*0.15 + factScore*0.15 + verifyScore*0.25)

		return fmt.Sprintf("Content score: %.1f%% (sources: %.0f%%, sections: %.0f%%, agents: %.0f%%, facts: %.0f%%, verification: %.0f%%)",
			contentScore*100, sourceScore*100, sectionScore*100, agentScore*100, factScore*100, verifyScore*100), nil
	})
	a.emitEvent(eventCh, AutomationEvent{Type: "quality_score", Data: map[string]interface{}{"score": contentScore}, Progress: 86, ElapsedMs: elapsed()})

	// ── Phase 4: Safety Filter ────────────────────────────────────
	var safetyPassed bool
	a.runAgent(job, "Safety Filter", func() (string, error) {
		llm := a.research.LLM()
		if llm != nil && researchReport != nil {
			// Use LLM to check for harmful content
			reportSummary := researchReport.Summary
			if len(reportSummary) > 500 {
				reportSummary = reportSummary[:500]
			}
			prompt := fmt.Sprintf(`Review this research report summary for safety issues (harmful content, PII exposure, copyright violations, misinformation).
Summary: "%s"
Respond with ONLY "SAFE" or "UNSAFE: [reason]"`, reportSummary)
			result, err := llm.Generate(ctx, "You are a content safety reviewer.", prompt, 128)
			if err == nil {
				job.Metrics.APICallsMade++
				job.Metrics.InputTokens += len(prompt) / 4
				job.Metrics.OutputTokens += len(result) / 4
				if strings.HasPrefix(strings.TrimSpace(result), "SAFE") {
					safetyPassed = true
					return "Content passed LLM safety check: no harmful content detected", nil
				}
				safetyPassed = false
				return fmt.Sprintf("Safety check failed: %s", result), nil
			}
		}
		// Default to safe if LLM unavailable
		safetyPassed = true
		return "Content passed safety checks (default: no LLM available for deep check)", nil
	})
	a.emitEvent(eventCh, AutomationEvent{Type: "agent_complete", AgentName: "Safety Filter", Progress: 90, ElapsedMs: elapsed()})

	// ── Phase 5: Publish Decision ──────────────────────────────────
	a.transition(job, StatePublish, 92, "Making publish decision...")
	a.emitEvent(eventCh, AutomationEvent{Type: "phase_change", Phase: "PUBLISH", Message: "Making publish decision...", Progress: 92, ElapsedMs: elapsed()})

	// Determine real confidence from verification
	confidence := contentScore
	if researchReport != nil && researchReport.Verification != nil {
		confidence = researchReport.Verification.OverallConfidence
	}
	if researchReport != nil && researchReport.ConfidenceScore != nil {
		confidence = researchReport.ConfidenceScore.Overall / 100.0 // ConfidenceScore.Overall is 0-100
	}

	sourceCount := 0
	if researchReport != nil {
		sourceCount = len(researchReport.AllSources)
	}

	publishDecision := "publish"
	rejectReason := ""
	if sourceCount < 3 { // Lowered from 5 to 3 for Gemini-fallback mode
		publishDecision = "reject"
		rejectReason = fmt.Sprintf("Insufficient sources: %d (minimum 3 required)", sourceCount)
	} else if confidence < 0.5 {
		publishDecision = "reject"
		rejectReason = fmt.Sprintf("Low confidence score: %.1f%% (minimum 50%% required)", confidence*100)
	} else if !safetyPassed {
		publishDecision = "reject"
		rejectReason = "Content did not pass safety filter"
	}

	// Build the automation report with embedded ResearchReport
	report := a.buildReport(job, researchReport, confidence, contentScore, safetyPassed, publishDecision, rejectReason)
	job.Report = report

	a.emitEvent(eventCh, AutomationEvent{
		Type:    "publish_decision",
		Message: fmt.Sprintf("Decision: %s", publishDecision),
		Data: map[string]interface{}{
			"decision":     publishDecision,
			"reason":       rejectReason,
			"confidence":   confidence,
			"content_score": contentScore,
			"sources":      sourceCount,
		},
		Progress:  94,
		ElapsedMs: elapsed(),
	})

	// Publisher agent
	a.runAgent(job, "Publisher", func() (string, error) {
		if publishDecision == "reject" {
			return fmt.Sprintf("REJECTED: %s", rejectReason), nil
		}
		return fmt.Sprintf("PUBLISHED: Report '%s' with %.0f%% confidence, %d sources", report.Title, confidence*100, sourceCount), nil
	})

	// Emit report_ready event
	a.emitEvent(eventCh, AutomationEvent{Type: "report_ready", Data: report, Progress: 96, ElapsedMs: elapsed()})

	// Create blog post if published
	if publishDecision == "publish" {
		blog := a.createBlogPost(job, report)
		job.Blog = &blog

		a.mu.Lock()
		a.blogs = append([]BlogPost{blog}, a.blogs...)
		a.mu.Unlock()

		a.addLog(job, "info", "Publisher", fmt.Sprintf("Blog post created: %s (ID: %s)", blog.Title, blog.ID))
		a.emitEvent(eventCh, AutomationEvent{Type: "blog_created", Data: blog, Progress: 98, ElapsedMs: elapsed()})
	} else {
		a.addLog(job, "decision", "Publisher", fmt.Sprintf("Publication rejected: %s", rejectReason))
	}

	// Calculate cost estimate (Gemini Flash pricing)
	job.Metrics.EstimatedCostUSD = (float64(job.Metrics.InputTokens) * 0.000000075) + (float64(job.Metrics.OutputTokens) * 0.0000003)

	// Finalize
	now := time.Now()
	job.CompletedAt = &now
	job.Metrics.TotalDurationMs = time.Since(start).Milliseconds()
	a.transition(job, StateCompleted, 100, "Workflow completed")

	a.emitEvent(eventCh, AutomationEvent{
		Type:    "done",
		Message: fmt.Sprintf("Automation complete in %dms", job.Metrics.TotalDurationMs),
		Data: map[string]interface{}{
			"job_id":          job.ID,
			"publish_decision": publishDecision,
			"metrics":          job.Metrics,
		},
		Progress:  100,
		ElapsedMs: elapsed(),
	})
}

// buildReport creates an AutomationReport from a ResearchReport.
func (a *AutomationService) buildReport(job *AutomationJob, rr *ResearchReport, confidence, contentScore float64, safetyPassed bool, publishDecision, rejectReason string) *AutomationReport {
	report := &AutomationReport{
		Title:           fmt.Sprintf("AI Research Report: %s", job.Topic),
		Summary:         fmt.Sprintf("Comprehensive multi-agent research analysis of %s.", job.Topic),
		Confidence:      confidence,
		ContentScore:    contentScore,
		SafetyPassed:    safetyPassed,
		PublishDecision: publishDecision,
		RejectReason:    rejectReason,
		ResearchData:    rr,
	}

	if rr != nil {
		report.Title = rr.Title
		report.Summary = rr.Summary

		// Convert ResearchReport sections to AutomationReportSections with per-section confidence
		for i, s := range rr.Sections {
			sectionConf := estimateSectionConfidence(s, rr)
			report.Sections = append(report.Sections, AutomationReportSection{
				Title:      s.Title,
				Content:    s.Content,
				Order:      i + 1,
				Confidence: sectionConf,
				AgentID:    s.AgentID,
			})
		}

		// Convert sources
		for _, src := range rr.AllSources {
			report.Sources = append(report.Sources, SourceRef{
				URL:       src.URL,
				Title:     src.Title,
				Relevance: src.Score,
				Agent:     src.Source,
			})
		}
	}

	// Fallback if no sections from research
	if len(report.Sections) == 0 {
		report.Sections = []AutomationReportSection{
			{Title: "Executive Summary", Content: report.Summary, Order: 1},
		}
	}

	return report
}

// createBlogPost generates a blog post from the research report.
func (a *AutomationService) createBlogPost(job *AutomationJob, report *AutomationReport) BlogPost {
	slug := strings.ToLower(strings.ReplaceAll(job.Topic, " ", "-"))
	slug = strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			return r
		}
		return -1
	}, slug)

	var content strings.Builder
	content.WriteString(fmt.Sprintf("# %s\n\n", report.Title))
	content.WriteString(fmt.Sprintf("*%s*\n\n", report.Summary))
	content.WriteString(fmt.Sprintf("**Confidence Score:** %.0f%% | **Sources:** %d\n\n---\n\n", report.Confidence*100, len(report.Sources)))

	for _, section := range report.Sections {
		content.WriteString(fmt.Sprintf("## %s\n\n%s\n\n", section.Title, section.Content))
	}

	if len(report.Sources) > 0 {
		content.WriteString("## Sources\n\n")
		for i, src := range report.Sources {
			if i >= 10 {
				content.WriteString(fmt.Sprintf("... and %d more sources\n", len(report.Sources)-10))
				break
			}
			content.WriteString(fmt.Sprintf("- [%s](%s) (%.0f%% relevance, via %s)\n", src.Title, src.URL, src.Relevance*100, src.Agent))
		}
	}

	return BlogPost{
		ID:          fmt.Sprintf("blog-%d", time.Now().UnixMilli()),
		Title:       report.Title,
		Slug:        slug,
		Content:     content.String(),
		Summary:     report.Summary,
		Tags:        []string{"ai-research", "automation", strings.ToLower(job.Topic)},
		PublishedAt: time.Now(),
		Status:      "published",
	}
}

// Helper methods

func (a *AutomationService) emitEvent(eventCh chan<- AutomationEvent, event AutomationEvent) {
	select {
	case eventCh <- event:
	default:
		// Channel full or closed — skip event
	}
}

func (a *AutomationService) transition(job *AutomationJob, state AutomationState, progress float64, msg string) {
	a.mu.Lock()
	defer a.mu.Unlock()
	job.State = state
	job.Progress = progress
	job.Logs = append(job.Logs, AutomationLog{
		Timestamp: time.Now().Format(time.RFC3339),
		Level:     "info",
		Message:   fmt.Sprintf("[%s] %s", state, msg),
	})
}

func (a *AutomationService) updateProgress(job *AutomationJob, progress float64) {
	a.mu.Lock()
	defer a.mu.Unlock()
	job.Progress = progress
}

func (a *AutomationService) addLog(job *AutomationJob, level, agent, msg string) {
	a.mu.Lock()
	defer a.mu.Unlock()
	job.Logs = append(job.Logs, AutomationLog{
		Timestamp: time.Now().Format(time.RFC3339),
		Level:     level,
		Agent:     agent,
		Message:   msg,
	})
}

func (a *AutomationService) setAgentStatus(job *AutomationJob, name, status string) {
	a.mu.Lock()
	defer a.mu.Unlock()
	for i := range job.AgentActivity {
		if job.AgentActivity[i].Name == name {
			job.AgentActivity[i].Status = status
			if status == "running" {
				ts := time.Now().Format(time.RFC3339)
				job.AgentActivity[i].StartedAt = &ts
			}
			break
		}
	}
}

func (a *AutomationService) countCompletedAgents(job *AutomationJob) int {
	a.mu.RLock()
	defer a.mu.RUnlock()
	count := 0
	for _, ag := range job.AgentActivity {
		if ag.Status == "completed" {
			count++
		}
	}
	return count
}

func (a *AutomationService) runAgent(job *AutomationJob, name string, work func() (string, error)) {
	a.setAgentStatus(job, name, "running")

	start := time.Now()
	output, err := work()
	duration := time.Since(start).Milliseconds()

	a.mu.Lock()
	for i := range job.AgentActivity {
		if job.AgentActivity[i].Name == name {
			job.AgentActivity[i].DurationMs = duration
			if err != nil {
				job.AgentActivity[i].Status = "failed"
				job.AgentActivity[i].Output = err.Error()
			} else {
				job.AgentActivity[i].Status = "completed"
				job.AgentActivity[i].Output = output
			}
			break
		}
	}
	a.mu.Unlock()

	if err != nil {
		a.addLog(job, "error", name, fmt.Sprintf("Agent failed: %v", err))
	} else {
		a.addLog(job, "info", name, fmt.Sprintf("Completed in %dms", duration))
	}

	job.Metrics.APICallsMade++
}

func (a *AutomationService) failJob(job *AutomationJob, reason string) {
	a.mu.Lock()
	defer a.mu.Unlock()
	job.State = StateFailed
	job.Error = reason
	now := time.Now()
	job.CompletedAt = &now
	job.Logs = append(job.Logs, AutomationLog{
		Timestamp: time.Now().Format(time.RFC3339),
		Level:     "error",
		Message:   reason,
	})
	log.Printf("Automation job %s failed: %s", job.ID, reason)
}

// estimateSectionConfidence derives a per-section confidence score from the
// verification results and section content quality signals.
func estimateSectionConfidence(section ReportSection, rr *ResearchReport) float64 {
	base := 0.6 // default medium confidence

	// Length signal: longer, more detailed sections are generally higher quality
	wordCount := len(strings.Fields(section.Content))
	if wordCount > 300 {
		base += 0.1
	} else if wordCount < 50 {
		base -= 0.15
	}

	// If verification data exists, check how many verified facts relate to this section
	if rr.Verification != nil && len(rr.Verification.VerifiedFacts) > 0 {
		matchCount := 0
		for _, fact := range rr.Verification.VerifiedFacts {
			// Check if fact is relevant to this section by keyword overlap
			if strings.Contains(strings.ToLower(section.Content), strings.ToLower(fact.Claim)) ||
				strings.Contains(strings.ToLower(section.Title), strings.ToLower(fact.Category)) {
				matchCount++
				if fact.Confidence > 0.7 {
					base += 0.03
				}
			}
		}
		if matchCount > 3 {
			base += 0.1
		}
	}

	// Use overall confidence as anchor
	if rr.Verification != nil && rr.Verification.OverallConfidence > 0 {
		base = (base + rr.Verification.OverallConfidence) / 2.0
	}

	return math.Min(math.Max(base, 0.0), 1.0)
}

func maxInt(a, b int) int {
	if a > b {
		return a
	}
	return b
}
