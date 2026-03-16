import type {
  ResearchEvent, ResearchReport, ResearchAgentStatus,
  ExtractedFact, VerificationResult,
} from '@/components/ai/types';

interface ResearchCallbacks {
  onPlanning: (message: string) => void;
  onPlanReady: (plan: { agents: string[]; strategy: string }) => void;
  onAgentStart: (agent: ResearchAgentStatus) => void;
  onAgentProgress: (agent: ResearchAgentStatus, message: string) => void;
  onAgentComplete: (agent: ResearchAgentStatus) => void;
  onExtracting: (message: string) => void;
  onVerifying: (message: string) => void;
  onVerified: (result: VerificationResult) => void;
  onRetry: (message: string, retryCount: number) => void;
  onSynthesizing: (message: string) => void;
  onReport: (report: ResearchReport) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

export function streamResearch(
  apiBase: string,
  question: string,
  callbacks: ResearchCallbacks,
): AbortController {
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(`${apiBase}/api/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
        signal: controller.signal,
      });

      if (!res.ok) {
        callbacks.onError(`HTTP ${res.status}`);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        callbacks.onError('No readable stream');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data) as ResearchEvent;
              handleEvent(currentEvent, parsed, callbacks);
            } catch {
              // Skip malformed JSON
            }
            currentEvent = '';
          }
        }
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        callbacks.onError(err instanceof Error ? err.message : 'Research stream failed');
      }
    }
  })();

  return controller;
}

function handleEvent(event: string, parsed: ResearchEvent, cb: ResearchCallbacks) {
  const agentData = parsed.data as Record<string, unknown> | undefined;

  switch (event) {
    case 'planning':
      cb.onPlanning(parsed.message || 'Planning research...');
      break;

    case 'plan_ready':
      if (agentData) {
        cb.onPlanReady({
          agents: (agentData.agents as string[]) || [],
          strategy: (agentData.strategy as string) || '',
        });
      }
      break;

    case 'agent_start':
      cb.onAgentStart({
        id: parsed.agent_id || '',
        name: parsed.agent || '',
        status: 'running',
        message: parsed.message,
      });
      break;

    case 'agent_progress':
      cb.onAgentProgress(
        {
          id: parsed.agent_id || '',
          name: parsed.agent || '',
          status: 'running',
          message: parsed.message,
        },
        parsed.message || '',
      );
      break;

    case 'agent_complete': {
      cb.onAgentComplete({
        id: parsed.agent_id || '',
        name: parsed.agent || '',
        status: agentData?.status === 'failed' ? 'failed' : 'completed',
        duration_ms: agentData?.duration_ms as number | undefined,
        sources: agentData?.sources as number | undefined,
        message: parsed.message,
      });
      break;
    }

    case 'extracting':
      cb.onExtracting(parsed.message || 'Extracting facts...');
      break;

    case 'verifying':
      cb.onVerifying(parsed.message || 'Verifying claims...');
      break;

    case 'verified':
      if (agentData) {
        cb.onVerified(agentData as unknown as VerificationResult);
      }
      break;

    case 'retry':
      cb.onRetry(
        parsed.message || 'Retrying weak agents...',
        (agentData?.retry_count as number) || 1,
      );
      break;

    case 'synthesizing':
      cb.onSynthesizing(parsed.message || 'Synthesizing report...');
      break;

    case 'report':
      if (parsed.data) {
        cb.onReport(parsed.data as ResearchReport);
      }
      break;

    case 'done':
      cb.onDone();
      break;

    case 'error':
      cb.onError(parsed.message || 'Research failed');
      break;
  }
}

// Detect if a query should trigger research mode
export function isResearchQuery(question: string): boolean {
  const q = question.toLowerCase();
  const keywords = [
    'research', 'analyze', 'analysis', 'compare', 'investigate',
    'deep dive', 'report', 'comprehensive', 'market', 'trend',
    'evaluate', 'assessment', 'study', 'explore', 'overview',
    'landscape', 'competitive', 'benchmark', 'forecast', 'outlook',
  ];
  for (const kw of keywords) {
    if (q.includes(kw)) return true;
  }
  return question.length > 80;
}

// Fetch research history
export async function fetchResearchHistory(apiBase: string): Promise<Array<{
  id: string;
  query: string;
  title: string;
  created_at: string;
}>> {
  const res = await fetch(`${apiBase}/api/research/history`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.history || [];
}

// Clear research memory
export async function clearResearchMemory(apiBase: string): Promise<boolean> {
  const res = await fetch(`${apiBase}/api/research/memory`, { method: 'DELETE' });
  return res.ok;
}

// Generate markdown export of a research report
export function exportReportAsMarkdown(report: ResearchReport): string {
  const lines: string[] = [
    `# ${report.title}`,
    '',
    report.summary,
    '',
    '## Key Findings',
    ...report.key_findings.map(f => `- ${f}`),
    '',
  ];

  for (const section of report.sections) {
    lines.push(`## ${section.title}`, '', section.content, '');
  }

  if (report.verification && report.verification.verified_facts.length > 0) {
    lines.push('## Fact Verification', '');
    lines.push(`Overall Confidence: ${(report.verification.overall_confidence * 100).toFixed(0)}%`, '');
    lines.push('| Claim | Confidence | Status |', '|-------|-----------|--------|');
    for (const fact of report.verification.verified_facts) {
      const status = fact.verified ? 'Verified' : fact.contradictions?.length ? 'Contradicted' : 'Unverified';
      lines.push(`| ${fact.claim} | ${(fact.confidence_score * 100).toFixed(0)}% | ${status} |`);
    }
    lines.push('');
  }

  if (report.all_sources && report.all_sources.length > 0) {
    lines.push('## Sources', '');
    for (const src of report.all_sources) {
      lines.push(`- [${src.title}](${src.url || '#'}) — ${src.source || 'web'}`);
    }
    lines.push('');
  }

  if (report.metrics) {
    lines.push('## Research Metrics', '');
    lines.push(`- Total time: ${(report.metrics.total_ms / 1000).toFixed(1)}s`);
    lines.push(`- Agents used: ${report.metrics.agents_used}`);
    lines.push(`- Sources found: ${report.metrics.total_sources}`);
    lines.push(`- Facts extracted: ${report.metrics.facts_extracted}`);
    if (report.metrics.retry_count > 0) {
      lines.push(`- Retries: ${report.metrics.retry_count}`);
    }
    lines.push('');
  }

  lines.push('---', `*Generated by CWMedia AI Research Copilot*`);
  return lines.join('\n');
}

// Generate data for verified facts chart
export function getVerificationChartData(facts: ExtractedFact[]): Array<{ label: string; value: number; category: string }> {
  return facts.map(f => ({
    label: f.claim.length > 40 ? f.claim.slice(0, 37) + '...' : f.claim,
    value: Math.round(f.confidence * 100),
    category: f.category,
  }));
}
