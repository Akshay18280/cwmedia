package services

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"
)

// VerifiedFact is a fact that has been cross-referenced.
type VerifiedFact struct {
	ExtractedFact
	Verified       bool     `json:"verified"`
	ConfidenceScore float64 `json:"confidence_score"` // 0.0 - 1.0
	ConfidenceLabel string  `json:"confidence_label"` // high, medium, low
	Contradictions  []string `json:"contradictions,omitempty"`
	AgreingSources  int      `json:"agreeing_sources"`
}

// VerificationResult holds the output of the verification agent.
type VerificationResult struct {
	VerifiedFacts     []VerifiedFact `json:"verified_facts"`
	OverallConfidence float64        `json:"overall_confidence"`
	Warnings          []string       `json:"warnings,omitempty"`
}

// VerificationAgent cross-references facts from multiple sources.
type VerificationAgent struct {
	llm LLMProvider
}

// NewVerificationAgent creates a verification agent.
func NewVerificationAgent(llm LLMProvider) *VerificationAgent {
	return &VerificationAgent{llm: llm}
}

const verificationPrompt = `You are a fact verification agent. Your job is to cross-reference claims from multiple research agents.

Given the research findings below, verify each key claim:
1. If multiple agents agree → HIGH confidence
2. If only one agent mentions it → MEDIUM confidence
3. If agents contradict each other → flag as LOW confidence with explanation

Output EXACTLY one line per verified fact:
CONFIDENCE_SCORE|CLAIM|STATUS|NOTES

CONFIDENCE_SCORE: decimal 0.0 to 1.0
STATUS: verified, unverified, contradicted
NOTES: brief explanation

Example:
0.95|NVIDIA revenue exceeded $60B in FY2024|verified|Confirmed by overview and market agents
0.40|Market share is exactly 92%|unverified|Only one source, specific number may vary
0.30|Revenue declined in Q4|contradicted|Overview says growth, risk agent says decline`

// Verify cross-references facts from multiple agent results.
func (v *VerificationAgent) Verify(ctx context.Context, agentResults []AgentResult, facts []ExtractedFact, llmOverride ...LLMProvider) (*VerificationResult, error) {
	llm := v.llm
	if len(llmOverride) > 0 && llmOverride[0] != nil {
		llm = llmOverride[0]
	}

	log.Printf("[VERIFY] Starting verification of %d facts using model: %s (provider: %s)", len(facts), llm.ModelName(), llm.ProviderName())

	// Build content from all agents for cross-referencing
	var agentContent []string
	for _, ar := range agentResults {
		if ar.Status == "completed" {
			agentContent = append(agentContent, fmt.Sprintf("=== %s ===\n%s", ar.AgentName, ar.Content))
		}
	}
	log.Printf("[VERIFY] Cross-referencing across %d agent outputs", len(agentContent))

	// Build fact list
	var factList []string
	for _, f := range facts {
		factStr := f.Claim
		if f.Value != "" {
			factStr += fmt.Sprintf(" (%s %s)", f.Value, f.Unit)
		}
		factList = append(factList, "- "+factStr)
	}

	prompt := fmt.Sprintf(`Agent Research Findings:
%s

Key Claims to Verify:
%s

Cross-reference these claims against all agent findings and verify each one.`, strings.Join(agentContent, "\n\n"), strings.Join(factList, "\n"))

	llmStart := time.Now()
	response, err := llm.Generate(ctx, verificationPrompt, prompt, 1024)
	if err != nil {
		log.Printf("[VERIFY] LLM call failed after %dms: %v", time.Since(llmStart).Milliseconds(), err)
		result := v.defaultVerification(facts)
		result.Warnings = append(result.Warnings, fmt.Sprintf("Verification LLM call failed: %v — using default confidence scores", err))
		return result, nil
	}
	log.Printf("[VERIFY] LLM response received in %dms (%d chars)", time.Since(llmStart).Milliseconds(), len(response))

	result := v.parseVerification(response, facts)
	log.Printf("[VERIFY] Results: %d verified facts, overall confidence: %.0f%%", len(result.VerifiedFacts), result.OverallConfidence*100)
	if len(result.Warnings) > 0 {
		log.Printf("[VERIFY] Warnings: %v", result.Warnings)
	}

	return result, nil
}

func (v *VerificationAgent) parseVerification(response string, originalFacts []ExtractedFact) *VerificationResult {
	result := &VerificationResult{}
	lines := strings.Split(response, "\n")

	var verifiedFacts []VerifiedFact
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") || strings.HasPrefix(line, "Example") {
			continue
		}

		parts := strings.SplitN(line, "|", 4)
		if len(parts) < 3 {
			continue
		}

		var score float64
		fmt.Sscanf(strings.TrimSpace(parts[0]), "%f", &score)
		if score == 0 {
			continue
		}

		claim := strings.TrimSpace(parts[1])
		status := strings.TrimSpace(parts[2])

		// Match to original fact
		var matchedFact ExtractedFact
		for _, f := range originalFacts {
			if strings.Contains(strings.ToLower(claim), strings.ToLower(f.Claim)) ||
				strings.Contains(strings.ToLower(f.Claim), strings.ToLower(claim)) {
				matchedFact = f
				break
			}
		}
		if matchedFact.Claim == "" {
			matchedFact = ExtractedFact{Claim: claim, Category: "general"}
		}

		label := "medium"
		if score >= 0.8 {
			label = "high"
		} else if score < 0.5 {
			label = "low"
		}

		vf := VerifiedFact{
			ExtractedFact:   matchedFact,
			Verified:        status == "verified",
			ConfidenceScore: score,
			ConfidenceLabel: label,
			AgreingSources:  1,
		}

		if score >= 0.8 {
			vf.AgreingSources = 3
		} else if score >= 0.5 {
			vf.AgreingSources = 2
		}

		if status == "contradicted" && len(parts) >= 4 {
			vf.Contradictions = []string{strings.TrimSpace(parts[3])}
		}

		verifiedFacts = append(verifiedFacts, vf)
	}

	// If parsing yielded nothing, use defaults with warning
	if len(verifiedFacts) == 0 {
		result := v.defaultVerification(originalFacts)
		result.Warnings = append(result.Warnings, "Verification response could not be parsed — using default confidence scores")
		return result
	}

	result.VerifiedFacts = verifiedFacts

	// Calculate overall confidence
	var totalScore float64
	for _, vf := range verifiedFacts {
		totalScore += vf.ConfidenceScore
	}
	if len(verifiedFacts) > 0 {
		result.OverallConfidence = totalScore / float64(len(verifiedFacts))
	}

	// Add warnings for low confidence facts
	for _, vf := range verifiedFacts {
		if vf.ConfidenceScore < 0.5 {
			result.Warnings = append(result.Warnings, fmt.Sprintf("Low confidence: %s", vf.Claim))
		}
	}

	return result
}

func (v *VerificationAgent) defaultVerification(facts []ExtractedFact) *VerificationResult {
	result := &VerificationResult{}
	var totalScore float64

	for _, f := range facts {
		score := f.Confidence
		if score == 0 {
			score = 0.6
		}

		label := "medium"
		if score >= 0.8 {
			label = "high"
		} else if score < 0.5 {
			label = "low"
		}

		result.VerifiedFacts = append(result.VerifiedFacts, VerifiedFact{
			ExtractedFact:   f,
			Verified:        score >= 0.5,
			ConfidenceScore: score,
			ConfidenceLabel: label,
			AgreingSources:  1,
		})
		totalScore += score
	}

	if len(facts) > 0 {
		result.OverallConfidence = totalScore / float64(len(facts))
	}

	return result
}
