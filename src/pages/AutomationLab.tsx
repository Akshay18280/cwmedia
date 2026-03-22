import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Zap, Play, Loader2, CheckCircle2, XCircle, Clock,
  AlertTriangle, BarChart3, FileText, Globe, Shield,
  Brain, RefreshCw, Eye, Maximize2, StopCircle, Copy,
} from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { appConfig } from '@/config/appConfig';
import type { ResearchReport } from '@/components/ai/types';
import { useAutomationStore } from '@/stores/automationStore';
import type { SavedAutomationJob } from '@/stores/automationStore';
import { firebasePostsService } from '@/services/firebase/posts.service';
import { useAuth } from '@/contexts/AuthContext';

const ReportViewer = lazy(() => import('@/components/ai/ReportViewer').then(m => ({ default: m.ReportViewer })));
const FullScreenReport = lazy(() => import('@/components/ai/FullScreenReport').then(m => ({ default: m.FullScreenReport })));

const API_BASE = appConfig.ai.apiBaseUrl;

// ── Types ────────────────────────────────────────────────────────

interface AgentActivity {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'retrying';
  started_at?: string;
  duration_ms?: number;
  sources: number;
  confidence: number;
  output?: string;
}

interface AutomationLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'decision';
  agent?: string;
  message: string;
}

interface AutomationMetrics {
  total_duration_ms: number;
  planning_ms: number;
  research_ms: number;
  validation_ms: number;
  synthesis_ms: number;
  total_sources: number;
  total_agents: number;
  tokens_used: number;
  api_calls_made: number;
  retries_performed: number;
  input_tokens?: number;
  output_tokens?: number;
  estimated_cost_usd?: number;
}

interface AutomationReport {
  title: string;
  summary: string;
  sections: { title: string; content: string; order: number; confidence?: number; agent_id?: string }[];
  sources: { url: string; title: string; relevance: number; agent: string }[];
  confidence: number;
  content_score: number;
  safety_passed: boolean;
  publish_decision: string;
  reject_reason?: string;
  research_data?: ResearchReport;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string;
  tags: string[];
  published_at: string;
  status: string;
}

interface AutomationEvent {
  type: string;
  phase?: string;
  agent_name?: string;
  message?: string;
  data?: unknown;
  progress: number;
  elapsed_ms: number;
}

// ── State label map ──────────────────────────────────────────────

const STATE_INFO: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  INIT: { label: 'Initializing', color: 'text-gray-400', icon: Clock },
  PLANNING: { label: 'Planning Research', color: 'text-blue-400', icon: Brain },
  STRUCTURE: { label: 'Structuring Report', color: 'text-indigo-400', icon: FileText },
  RESEARCH: { label: 'Agents Researching', color: 'text-purple-400', icon: Globe },
  VALIDATION: { label: 'Verifying Claims', color: 'text-amber-400', icon: Shield },
  SYNTHESIS: { label: 'Synthesizing Report', color: 'text-cyan-400', icon: Zap },
  REVIEW: { label: 'Scoring Content', color: 'text-orange-400', icon: BarChart3 },
  PUBLISH: { label: 'Publishing Decision', color: 'text-emerald-400', icon: CheckCircle2 },
  COMPLETED: { label: 'Completed', color: 'text-emerald-500', icon: CheckCircle2 },
  FAILED: { label: 'Failed', color: 'text-red-500', icon: XCircle },
};

// ── Agent Status Icon ────────────────────────────────────────────

const AgentStatusIcon: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    case 'running':
      return <Loader2 className="w-4 h-4 text-accent-primary animate-spin" />;
    case 'failed':
      return <XCircle className="w-4 h-4 text-red-400" />;
    case 'retrying':
      return <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />;
    default:
      return <Clock className="w-4 h-4 text-low-contrast" />;
  }
};

// ── Count-Up Animation ───────────────────────────────────────────

const CountUpValue: React.FC<{ value: number; suffix?: string; decimals?: number }> = ({ value, suffix = '', decimals = 0 }) => {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    if (start === end) return;
    const startTime = performance.now();
    const duration = 800;
    let frame: number;

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(start + (end - start) * eased);
      if (progress < 1) frame = requestAnimationFrame(animate);
      else prevValue.current = end;
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{display.toFixed(decimals)}{suffix}</>;
};

// ── Section Confidence Badge ─────────────────────────────────────

const ConfidenceBadge: React.FC<{ confidence: number }> = ({ confidence }) => {
  const pct = confidence * 100;
  const cls = pct > 75
    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    : pct > 50
    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    : 'bg-rose-500/10 text-rose-500 border-rose-500/20';
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${cls}`}>
      <CountUpValue value={pct} decimals={0} suffix="%" />
    </span>
  );
};

// ── Agent Latency Chart ──────────────────────────────────────────

const LATENCY_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff'];

const AgentLatencyChart: React.FC<{ agents: AgentActivity[] }> = ({ agents }) => {
  const data = agents
    .filter((a) => a.status === 'completed' && a.duration_ms)
    .map((a) => ({ name: a.name, duration: (a.duration_ms || 0) / 1000 }))
    .sort((a, b) => b.duration - a.duration);

  if (data.length === 0) return null;

  return (
    <div className="rounded-2xl border border-medium-contrast/30 bg-medium-contrast/5 p-5">
      <h3 className="text-sm font-semibold text-high-contrast mb-4 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-accent-primary" /> Agent Latency
      </h3>
      <ResponsiveContainer width="100%" height={Math.max(120, data.length * 36)}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
          <XAxis type="number" unit="s" tick={{ fontSize: 11, fill: 'var(--color-low-contrast)' }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: 'var(--color-medium-contrast)' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: 'var(--color-medium-contrast)', border: '1px solid var(--color-low-contrast)', borderRadius: '8px', fontSize: '12px' }}
            formatter={(value: number) => [`${value.toFixed(2)}s`, 'Duration']}
          />
          <Bar dataKey="duration" radius={[0, 4, 4, 0]} barSize={20}>
            {data.map((_, i) => (
              <Cell key={i} fill={LATENCY_COLORS[i % LATENCY_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ── Inline Citation Renderer ─────────────────────────────────────

const renderWithCitations = (
  text: string,
  sources: { url: string; title: string; relevance: number; agent: string }[]
) => {
  // Split text on citation markers like [1], [2], etc.
  const parts = text.split(/(\[\d+\])/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[(\d+)\]$/);
    if (match) {
      const idx = parseInt(match[1], 10) - 1;
      const source = sources[idx];
      if (source) {
        return (
          <a
            key={i}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            title={`${source.title} (${(source.relevance * 100).toFixed(0)}% relevance)`}
            className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-accent-primary/15 text-accent-primary text-[9px] font-bold hover:bg-accent-primary/25 transition-colors cursor-pointer align-super ml-0.5 no-underline"
          >
            {match[1]}
          </a>
        );
      }
    }
    return <span key={i}>{part}</span>;
  });
};

// ── Skeleton Loader ──────────────────────────────────────────────

const ReportSkeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-6 bg-medium-contrast/20 rounded-lg w-2/3" />
    <div className="h-4 bg-medium-contrast/20 rounded-lg w-full" />
    <div className="h-4 bg-medium-contrast/20 rounded-lg w-5/6" />
    <div className="flex gap-3">
      <div className="h-8 bg-medium-contrast/20 rounded-full w-32" />
      <div className="h-8 bg-medium-contrast/20 rounded-full w-24" />
      <div className="h-8 bg-medium-contrast/20 rounded-full w-28" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="h-32 bg-medium-contrast/20 rounded-xl" />
      <div className="h-32 bg-medium-contrast/20 rounded-xl" />
    </div>
    {[1, 2, 3].map(i => (
      <div key={i} className="h-16 bg-medium-contrast/20 rounded-xl" />
    ))}
  </div>
);

// ── Main Component ───────────────────────────────────────────────

export default function AutomationLab() {
  const [topic, setTopic] = useState('');
  const [phase, setPhase] = useState('INIT');
  const [progress, setProgress] = useState(0);
  const [agents, setAgents] = useState<AgentActivity[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [report, setReport] = useState<AutomationReport | null>(null);
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [metrics, setMetrics] = useState<AutomationMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [publishedPostId, setPublishedPostId] = useState<string | null>(null);

  const { user: currentUser } = useAuth();
  const abortRef = useRef<AbortController | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reportMetaRef = useRef<{ confidence: number; contentScore: number }>({ confidence: 0, contentScore: 0 });

  const addJob = useAutomationStore((s) => s.addJob);
  const savedJobs = useAutomationStore((s) => s.savedJobs);
  const clearHistory = useAutomationStore((s) => s.clearHistory);

  // Feature flag check
  if (!(appConfig.features as Record<string, boolean>).automationLab) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center px-4">
          <Zap className="w-16 h-16 text-low-contrast mx-auto mb-6" />
          <h1 className="text-headline font-bold text-high-contrast mb-4">Automation Lab is currently disabled.</h1>
          <p className="text-body-lg text-medium-contrast">Enable the feature flag to access the AI automation pipeline.</p>
        </div>
      </div>
    );
  }

  // Elapsed time timer
  useEffect(() => {
    if (!isRunning) return;
    const t = setInterval(() => setElapsed(e => e + 100), 100);
    return () => clearInterval(t);
  }, [isRunning]);

  // Auto-scroll logs
  useEffect(() => {
    if (showLogs && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs.length, showLogs]);

  // Keyboard shortcuts
  useHotkeys('mod+enter', () => startStream(), { enableOnFormTags: true, preventDefault: true });
  useHotkeys('escape', () => cancelStream(), { preventDefault: true });

  const formatDuration = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
  };

  const cancelStream = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      setIsRunning(false);
    }
  }, []);

  const startStream = useCallback(async () => {
    const t = topic.trim();
    if (!t || isRunning) return;

    // Reset state
    setIsRunning(true);
    setPhase('INIT');
    setProgress(0);
    setAgents([]);
    setLogs([]);
    setReport(null);
    setBlog(null);
    setMetrics(null);
    setError(null);
    setShowReport(false);
    setShowFullScreen(false);
    setElapsed(0);
    setPublishedPostId(null);

    abortRef.current = new AbortController();

    try {
      const response = await fetch(`${API_BASE}/api/automation/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: t }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop()!;

        for (const part of parts) {
          if (!part.trim()) continue;

          // Parse SSE event
          let eventType = '';
          let eventData = '';
          for (const line of part.split('\n')) {
            if (line.startsWith('event: ')) eventType = line.slice(7);
            else if (line.startsWith('data: ')) eventData = line.slice(6);
          }

          if (!eventType || !eventData) continue;

          try {
            const parsed = JSON.parse(eventData) as AutomationEvent;

            // Update progress
            if (parsed.progress > 0) setProgress(parsed.progress);

            // Update phase
            if (parsed.phase) setPhase(parsed.phase);

            // Handle event types
            switch (eventType) {
              case 'init':
                // Job started
                break;

              case 'phase_change':
                if (parsed.message) {
                  setLogs(prev => [...prev, {
                    timestamp: new Date().toISOString(),
                    level: 'info',
                    message: parsed.message!,
                  }]);
                }
                break;

              case 'agent_complete':
                if (parsed.agent_name) {
                  setAgents(prev => {
                    const existing = prev.find(a => a.name === parsed.agent_name);
                    if (existing) {
                      return prev.map(a => a.name === parsed.agent_name ? { ...a, status: 'completed' as const } : a);
                    }
                    return prev;
                  });
                }
                break;

              case 'research_event': {
                const rData = parsed.data as Record<string, unknown> | undefined;
                const rAgent = parsed.agent_name || (rData as Record<string, unknown>)?.agent as string || '';
                const rMessage = parsed.message || '';

                // Add agents dynamically from plan_ready
                if (rData && typeof rData === 'object') {
                  const rType = (rData as Record<string, unknown>).type as string;
                  if (rType === 'plan_ready') {
                    const planData = (rData as Record<string, unknown>).data as Record<string, unknown>;
                    if (planData?.agents) {
                      const agentNames = planData.agents as string[];
                      setAgents(prev => {
                        const existing = new Set(prev.map(a => a.name));
                        const newAgents = agentNames
                          .filter(n => !existing.has(n))
                          .map(n => ({ name: n, status: 'pending' as const, sources: 0, confidence: 0 }));
                        return [...prev, ...newAgents];
                      });
                    }
                  } else if (rType === 'agent_start' && rAgent) {
                    setAgents(prev => {
                      const existing = prev.find(a => a.name === rAgent);
                      if (existing) {
                        return prev.map(a => a.name === rAgent ? { ...a, status: 'running' as const } : a);
                      }
                      return [...prev, { name: rAgent, status: 'running' as const, sources: 0, confidence: 0 }];
                    });
                  } else if (rType === 'agent_complete' && rAgent) {
                    setAgents(prev => prev.map(a =>
                      a.name === rAgent ? { ...a, status: 'completed' as const } : a
                    ));
                  }
                }

                if (rMessage) {
                  setLogs(prev => [...prev, {
                    timestamp: new Date().toISOString(),
                    level: 'info',
                    agent: rAgent,
                    message: rMessage,
                  }]);
                }
                break;
              }

              case 'quality_score':
                if (parsed.data) {
                  const scoreData = parsed.data as Record<string, unknown>;
                  setLogs(prev => [...prev, {
                    timestamp: new Date().toISOString(),
                    level: 'info',
                    agent: 'Content Scorer',
                    message: `Quality score: ${((scoreData.score as number) * 100).toFixed(1)}%`,
                  }]);
                }
                break;

              case 'publish_decision':
                if (parsed.data) {
                  const decisionData = parsed.data as Record<string, unknown>;
                  setLogs(prev => [...prev, {
                    timestamp: new Date().toISOString(),
                    level: decisionData.decision === 'publish' ? 'info' : 'decision',
                    agent: 'Publisher',
                    message: `Decision: ${decisionData.decision}${decisionData.reason ? ` — ${decisionData.reason}` : ''}`,
                  }]);
                }
                break;

              case 'report_ready':
                if (parsed.data) {
                  const rpt = parsed.data as AutomationReport;
                  setReport(rpt);
                  setShowReport(true);
                  // Store confidence/score for the saved job (captured via ref)
                  reportMetaRef.current = { confidence: rpt.confidence, contentScore: rpt.content_score };
                }
                break;

              case 'blog_created':
                if (parsed.data) {
                  setBlog(parsed.data as BlogPost);
                }
                break;

              case 'error':
                setError(parsed.message || 'Unknown error');
                setLogs(prev => [...prev, {
                  timestamp: new Date().toISOString(),
                  level: 'error',
                  message: parsed.message || 'Unknown error',
                }]);
                break;

              case 'done':
                if (parsed.data) {
                  const doneData = parsed.data as Record<string, unknown>;
                  if (doneData.metrics) {
                    setMetrics(doneData.metrics as AutomationMetrics);
                  }
                  // Save to persistent history
                  const metricsData = doneData.metrics as AutomationMetrics | undefined;
                  const savedJob: SavedAutomationJob = {
                    id: (doneData.job_id as string) || `auto-${Date.now()}`,
                    topic: t,
                    state: 'COMPLETED',
                    confidence: reportMetaRef.current.confidence,
                    contentScore: reportMetaRef.current.contentScore,
                    sourceCount: metricsData?.total_sources ?? 0,
                    agentCount: metricsData?.total_agents ?? 0,
                    durationMs: metricsData?.total_duration_ms ?? 0,
                    publishDecision: (doneData.publish_decision as string) || 'unknown',
                    createdAt: new Date().toISOString(),
                  };
                  addJob(savedJob);
                }
                setIsRunning(false);
                setPhase('COMPLETED');
                setProgress(100);
                break;
            }
          } catch {
            // Skip unparseable events
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setPhase('FAILED');
        setError('Research cancelled by user');
        setLogs(prev => [...prev, {
          timestamp: new Date().toISOString(),
          level: 'warn',
          message: 'Research cancelled by user',
        }]);
      } else {
        setPhase('FAILED');
        setError(String(err));
        setLogs(prev => [...prev, {
          timestamp: new Date().toISOString(),
          level: 'error',
          message: `Failed: ${err}`,
        }]);
      }
    } finally {
      setIsRunning(false);
    }
  }, [topic, isRunning]);

  // Publish report to blog
  const handlePublishToBlog = async () => {
    if (!report || !currentUser) return;
    setPublishing(true);
    try {
      const title = report.title || topic;
      const postId = await firebasePostsService.createPost({
        title,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        excerpt: report.summary || (report.content?.slice(0, 200) + '...') || '',
        content: blog?.content || report.content || '',
        author_id: currentUser.id,
        status: 'published',
        tags: report.tags || blog?.tags || [],
        categories: ['AI Research'],
        featured_image: '',
      } as any);
      setPublishedPostId(postId);
      toast.success('Published to blog!');
    } catch (err) {
      console.error('Publish error:', err);
      toast.error('Failed to publish to blog');
    } finally {
      setPublishing(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const stateInfo = STATE_INFO[phase] || STATE_INFO.INIT;
  const StateIcon = stateInfo.icon;
  const completedAgents = agents.filter(a => a.status === 'completed').length;

  // Get the ResearchReport for the rich ReportViewer
  const researchReport: ResearchReport | null = report?.research_data || null;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-amber-500 text-sm font-medium mb-4">
            <Zap className="w-4 h-4" /> Automation Lab
          </div>
          <h1 className="text-display font-bold text-high-contrast mb-3">AI Research Automation</h1>
          <p className="text-body-lg text-medium-contrast max-w-2xl mx-auto">
            Multi-agent AI research pipeline. Enter a topic — specialized agents will research, verify, score, and publish a comprehensive report.
          </p>
        </motion.div>

        {/* Job History */}
        {savedJobs.length > 0 && !isRunning && phase === 'INIT' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-high-contrast flex items-center gap-2">
                <Clock className="w-4 h-4 text-low-contrast" /> Recent Automations
              </h3>
              <button onClick={clearHistory} className="text-[10px] text-low-contrast hover:text-medium-contrast transition-colors">
                Clear History
              </button>
            </div>
            <div className="space-y-1.5">
              {savedJobs.slice(0, 5).map((job) => (
                <button
                  key={job.id}
                  onClick={() => setTopic(job.topic)}
                  className="w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-xl border border-medium-contrast/20 bg-medium-contrast/5 hover:border-accent-primary/30 hover:bg-medium-contrast/10 transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-high-contrast truncate group-hover:text-accent-primary transition-colors">
                      {job.topic}
                    </p>
                    <p className="text-[10px] text-low-contrast">
                      {new Date(job.createdAt).toLocaleDateString()} · {(job.durationMs / 1000).toFixed(1)}s · {job.sourceCount} sources
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      job.publishDecision === 'publish'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-red-500/10 text-red-500'
                    }`}>
                      {job.publishDecision === 'publish' ? 'Published' : 'Rejected'}
                    </span>
                    <span className="text-xs font-mono text-low-contrast">{(job.confidence * 100).toFixed(0)}%</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Input Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="max-w-2xl mx-auto mb-10">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && startStream()}
              placeholder="Enter a research topic..."
              disabled={isRunning}
              aria-label="Research topic"
              className="w-full px-5 py-4 pr-40 sm:pr-48 rounded-2xl border border-medium-contrast/40 bg-white dark:bg-gray-900 text-high-contrast placeholder:text-low-contrast focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary/50 outline-none transition-all text-body-lg disabled:opacity-50"
            />
            <button
              onClick={isRunning ? cancelStream : startStream}
              disabled={!topic.trim() && !isRunning}
              aria-label={isRunning ? 'Cancel research' : 'Start research and publish'}
              className={`absolute right-2 top-1/2 -translate-y-1/2 px-4 sm:px-5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 min-h-[44px] ${
                isRunning
                  ? 'bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20'
                  : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {isRunning ? (
                <><StopCircle className="w-4 h-4" /> <span className="hidden sm:inline">Cancel</span></>
              ) : (
                <><Play className="w-4 h-4" /> <span className="hidden sm:inline">Research & Publish</span><span className="sm:hidden">Go</span></>
              )}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3 justify-center">
            {['Tesla Electric Vehicles', 'OpenAI GPT-5', 'Apple Vision Pro', 'Nvidia AI Chips'].map((example) => (
              <button
                key={example}
                onClick={() => setTopic(example)}
                disabled={isRunning}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-medium-contrast/10 text-medium-contrast hover:bg-medium-contrast/20 hover:text-high-contrast transition-colors disabled:opacity-50"
              >
                {example}
              </button>
            ))}
          </div>
          <p className="text-center text-[10px] text-low-contrast mt-2">
            <kbd className="px-1 py-0.5 rounded bg-medium-contrast/20 font-mono">⌘+Enter</kbd> to start · <kbd className="px-1 py-0.5 rounded bg-medium-contrast/20 font-mono">Esc</kbd> to cancel
          </p>
        </motion.div>

        {/* Progress & Status */}
        <AnimatePresence>
          {(isRunning || phase !== 'INIT') && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              {/* Screen reader live region */}
              <div className="sr-only" aria-live="polite" aria-atomic="true">
                {stateInfo.label}: {Math.round(progress)}% complete. {formatDuration(elapsed)} elapsed.
              </div>

              {/* State Banner */}
              <div className="rounded-2xl border border-medium-contrast/30 bg-medium-contrast/5 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <StateIcon className={`w-6 h-6 ${stateInfo.color}`} />
                    <div>
                      <h2 className="text-lg font-semibold text-high-contrast">{stateInfo.label}</h2>
                      <p className="text-sm text-medium-contrast">Topic: {topic}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-high-contrast"><CountUpValue value={progress} decimals={0} suffix="%" /></span>
                    <p className="text-xs text-low-contrast">{formatDuration(elapsed)}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div
                  className="w-full h-2 rounded-full bg-medium-contrast/20 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={Math.round(progress)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Research progress: ${Math.round(progress)}%`}
                >
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                </div>

                {/* Metrics row */}
                {phase === 'COMPLETED' && metrics && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
                    <div className="text-center">
                      <p className="text-xl font-bold text-high-contrast">{(metrics.total_duration_ms / 1000).toFixed(1)}s</p>
                      <p className="text-xs text-low-contrast">Duration</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-high-contrast">{metrics.total_sources}</p>
                      <p className="text-xs text-low-contrast">Sources</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-high-contrast">{metrics.total_agents}</p>
                      <p className="text-xs text-low-contrast">Agents</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-high-contrast">{metrics.api_calls_made}</p>
                      <p className="text-xs text-low-contrast">API Calls</p>
                    </div>
                    {metrics.estimated_cost_usd !== undefined && metrics.estimated_cost_usd > 0 && (
                      <div className="text-center">
                        <p className="text-xl font-bold text-high-contrast">${metrics.estimated_cost_usd.toFixed(4)}</p>
                        <p className="text-xs text-low-contrast">Est. Cost</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Agent Activity */}
              {agents.length > 0 && (
                <div className="rounded-2xl border border-medium-contrast/30 bg-medium-contrast/5 p-5">
                  <h3 className="text-sm font-semibold text-high-contrast mb-4 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-accent-primary" /> Agent Activity ({completedAgents}/{agents.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {agents.map((agent, i) => (
                      <div
                        key={`${agent.name}-${i}`}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all ${
                          agent.status === 'running' ? 'border-accent-primary/30 bg-accent-primary/5' :
                          agent.status === 'completed' ? 'border-emerald-500/20 bg-emerald-500/5' :
                          agent.status === 'failed' ? 'border-red-500/20 bg-red-500/5' :
                          'border-medium-contrast/20 bg-transparent'
                        }`}
                      >
                        <AgentStatusIcon status={agent.status} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-high-contrast truncate">{agent.name}</p>
                          {agent.duration_ms ? (
                            <p className="text-[10px] text-low-contrast">{agent.duration_ms}ms{agent.sources > 0 ? ` · ${agent.sources} sources` : ''}</p>
                          ) : agent.status === 'running' ? (
                            <p className="text-[10px] text-accent-primary">Processing...</p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Agent Latency Chart — shown when completed */}
              {!isRunning && phase === 'COMPLETED' && agents.length > 0 && (
                <AgentLatencyChart agents={agents} />
              )}

              {/* Error Banner */}
              {error && phase === 'FAILED' && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-500">Pipeline Error</h3>
                      <p className="text-sm text-medium-contrast mt-1">{error}</p>
                    </div>
                    <button
                      onClick={startStream}
                      className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-sm font-medium text-red-500 hover:bg-red-500/20 transition-colors flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-4 h-4" /> Retry
                    </button>
                  </div>
                </div>
              )}

              {/* Quality Decision */}
              {report && !isRunning && (
                <div className={`rounded-2xl border p-5 ${
                  report.publish_decision === 'publish'
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-red-500/30 bg-red-500/5'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    {report.publish_decision === 'publish' ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-red-500" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-high-contrast">
                        {report.publish_decision === 'publish' ? 'Published Successfully' : 'Publication Rejected'}
                      </h3>
                      <p className="text-sm text-medium-contrast">
                        {report.publish_decision === 'publish'
                          ? <>Confidence: <CountUpValue value={report.confidence * 100} decimals={0} suffix="%" /> · {report.sources.length} sources · Safety: Passed</>
                          : report.reject_reason}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-3">
                    <button
                      onClick={() => setShowReport(!showReport)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-medium-contrast/10 border border-medium-contrast/30 text-sm font-medium text-high-contrast hover:bg-medium-contrast/20 transition-colors"
                    >
                      <Eye className="w-4 h-4" /> {showReport ? 'Hide' : 'View'} Report
                    </button>
                    {researchReport && (
                      <button
                        onClick={() => setShowFullScreen(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-medium-contrast/10 border border-medium-contrast/30 text-sm font-medium text-high-contrast hover:bg-medium-contrast/20 transition-colors"
                      >
                        <Maximize2 className="w-4 h-4" /> Full Screen
                      </button>
                    )}
                    <button
                      onClick={() => setShowLogs(!showLogs)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-medium-contrast/10 border border-medium-contrast/30 text-sm font-medium text-medium-contrast hover:bg-medium-contrast/20 transition-colors"
                    >
                      <FileText className="w-4 h-4" /> {showLogs ? 'Hide' : 'View'} Logs ({logs.length})
                    </button>
                    <button
                      onClick={startStream}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-medium-contrast/10 border border-medium-contrast/30 text-sm font-medium text-medium-contrast hover:bg-medium-contrast/20 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" /> Run Again
                    </button>
                    {!publishedPostId ? (
                      <button
                        onClick={handlePublishToBlog}
                        disabled={publishing}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold hover:shadow-md transition-all disabled:opacity-50"
                      >
                        {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Approve & Publish to Blog
                      </button>
                    ) : (
                      <Link
                        to="/blog"
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-sm font-medium text-emerald-500"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Published — View Blog
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Report Viewer — use rich ReportViewer if research_data available */}
              <AnimatePresence>
                {showReport && report && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    {researchReport ? (
                      <Suspense fallback={<ReportSkeleton />}>
                        <div className="rounded-2xl border border-medium-contrast/30 bg-medium-contrast/5 p-5">
                          <ReportViewer report={researchReport} />
                        </div>
                      </Suspense>
                    ) : (
                      /* Fallback: basic report for when research_data is not available */
                      <div className="rounded-2xl border border-medium-contrast/30 bg-medium-contrast/5 p-5">
                        <h2 className="text-xl font-bold text-high-contrast mb-2">{report.title}</h2>
                        <p className="text-body text-medium-contrast mb-4">{report.summary}</p>

                        <div className="flex gap-3 mb-6 flex-wrap">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            <CountUpValue value={report.confidence * 100} decimals={0} suffix="% Confidence" />
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                            {report.sources.length} Sources
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-500 border border-purple-500/20">
                            Score: <CountUpValue value={report.content_score * 100} decimals={0} suffix="%" />
                          </span>
                        </div>

                        <div className="space-y-3">
                          {report.sections.map((section, i) => (
                            <div key={i} className="border border-medium-contrast/20 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold text-high-contrast">{section.title}</h3>
                                {section.confidence !== undefined && section.confidence > 0 && (
                                  <ConfidenceBadge confidence={section.confidence} />
                                )}
                              </div>
                              <div className="text-sm text-medium-contrast leading-relaxed whitespace-pre-wrap">
                                {report.sources.length > 0
                                  ? renderWithCitations(section.content, report.sources)
                                  : section.content}
                              </div>
                            </div>
                          ))}
                        </div>

                        {report.sources.length > 0 && (
                          <div className="mt-6">
                            <h3 className="text-sm font-semibold text-high-contrast mb-3 flex items-center gap-2">
                              <Globe className="w-4 h-4 text-accent-primary" /> Sources ({report.sources.length})
                            </h3>
                            <div className="space-y-1.5">
                              {report.sources.slice(0, 10).map((src, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                  <span className="w-5 h-5 rounded bg-medium-contrast/10 text-low-contrast flex items-center justify-center text-[10px] font-bold">
                                    {i + 1}
                                  </span>
                                  <a
                                    href={src.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-accent-primary hover:underline truncate flex-1"
                                  >
                                    {src.title || src.url}
                                  </a>
                                  <span className="text-low-contrast flex-shrink-0">{(src.relevance * 100).toFixed(0)}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Skeleton while researching */}
              {isRunning && !report && progress > 20 && (
                <div className="rounded-2xl border border-medium-contrast/30 bg-medium-contrast/5 p-5">
                  <ReportSkeleton />
                </div>
              )}

              {/* Blog Post Preview */}
              {blog && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-high-contrast flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-500" /> Generated Blog Post
                    </h3>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(blog.content);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-medium-contrast hover:bg-medium-contrast/10 transition-colors"
                    >
                      <Copy className="w-3 h-3" /> Copy Markdown
                    </button>
                  </div>
                  <p className="text-sm text-medium-contrast mb-2">{blog.title}</p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {blog.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-500">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-low-contrast">Published: {new Date(blog.published_at).toLocaleString()}</p>
                </div>
              )}

              {/* Logs Panel */}
              <AnimatePresence>
                {showLogs && logs.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-2xl border border-medium-contrast/30 bg-medium-contrast/10 overflow-hidden"
                  >
                    <div className="p-4 max-h-80 overflow-y-auto font-mono text-xs">
                      {logs.map((log, i) => (
                        <div key={i} className="flex gap-2 py-0.5">
                          <span className="text-low-contrast flex-shrink-0 w-20">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <span className={`flex-shrink-0 w-12 font-semibold ${
                            log.level === 'error' ? 'text-red-400' :
                            log.level === 'warn' ? 'text-amber-400' :
                            log.level === 'decision' ? 'text-purple-400' :
                            'text-emerald-400'
                          }`}>
                            [{log.level.toUpperCase()}]
                          </span>
                          {log.agent && <span className="text-cyan-400 flex-shrink-0">[{log.agent}]</span>}
                          <span className="text-medium-contrast">{log.message}</span>
                        </div>
                      ))}
                      <div ref={logsEndRef} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pipeline Visualization (static — shown when idle) */}
        {phase === 'INIT' && !isRunning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="max-w-3xl mx-auto">
            <h3 className="text-sm font-semibold text-high-contrast text-center mb-6">How It Works</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Brain, label: 'Planning', desc: 'AI plans research strategy' },
                { icon: Globe, label: 'Research', desc: 'Multi-agent web research' },
                { icon: Shield, label: 'Verification', desc: 'Cross-reference & verify' },
                { icon: FileText, label: 'Publish', desc: 'Score, filter & publish' },
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center gap-2 px-3 py-4 rounded-xl border border-medium-contrast/20 bg-medium-contrast/5">
                  <step.icon className="w-6 h-6 text-amber-500" />
                  <span className="text-xs font-semibold text-high-contrast">{step.label}</span>
                  <span className="text-[10px] text-low-contrast text-center">{step.desc}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Full Screen Report */}
      {researchReport && (
        <Suspense fallback={null}>
          <FullScreenReport
            report={researchReport}
            open={showFullScreen}
            onClose={() => setShowFullScreen(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
