import React, { useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import {
  FileText, ChevronDown, Clock, Users, Database,
  Lightbulb, BarChart3, BookOpen, Download, Copy, Check,
  Search, ShieldCheck, RotateCcw, Brain, Building2,
  TrendingUp, TrendingDown, Minus, Newspaper, Target,
  Award, AlertTriangle, Rocket, Shield, Calendar,
  Globe, User, MapPin, Hash, ExternalLink,
  GitBranch, Network, Share2,
} from 'lucide-react';
import type {
  ResearchReport, CompanyProfile, SwotAnalysis,
  CompetitorEntry, NewsItem, TimelineEvent, ConfidenceScore, FinancialMetric,
} from './types';
import { SourceExplorer } from './SourceExplorer';
import { ResearchPromptInspector } from './ResearchPromptInspector';
import { exportReportAsMarkdown } from '@/services/ai/ResearchService';
// Lazy-load PDF export to avoid bundling @react-pdf/renderer in main chunk
const lazyDownloadPdf = async (report: ResearchReport) => {
  const { downloadReportAsPdf } = await import('./PdfExport');
  return downloadReportAsPdf(report);
};

// Lazy-load heavy graph components
const ResearchGraph = lazy(() => import('./ResearchGraph').then(m => ({ default: m.ResearchGraph })));
const AgentActivityTree = lazy(() => import('./AgentActivityTree').then(m => ({ default: m.AgentActivityTree })));
const KnowledgeGraph = lazy(() => import('./KnowledgeGraph').then(m => ({ default: m.KnowledgeGraph })));

const GraphFallback = () => (
  <div className="w-full h-[400px] rounded-xl bg-graph-container border border-medium-contrast/30 flex items-center justify-center">
    <div className="text-medium-contrast text-xs animate-pulse">Loading visualization...</div>
  </div>
);

interface ReportViewerProps {
  report: ResearchReport;
}

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'];

/* Theme-aware tooltip wrapper — uses CSS class defined in index.css */
const ChartTooltipWrapper: React.FC<{ active?: boolean; payload?: Array<{ value: number; payload: Record<string, unknown> }>; label?: string; formatter?: (value: number, payload: Record<string, unknown>) => string }> = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip px-3 py-2">
      {label && <div className="text-xs font-medium text-high-contrast mb-1">{label}</div>}
      {payload.map((entry, i) => (
        <div key={i} className="text-xs text-medium-contrast">
          {formatter ? formatter(entry.value, entry.payload) : `${entry.value}`}
        </div>
      ))}
    </div>
  );
};

const SENTIMENT_CONFIG = {
  positive: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: TrendingUp },
  neutral: { color: 'text-gray-400', bg: 'bg-gray-500/10', icon: Minus },
  negative: { color: 'text-red-400', bg: 'bg-red-500/10', icon: TrendingDown },
};

const TIMELINE_COLORS: Record<string, string> = {
  founding: 'bg-emerald-500',
  ipo: 'bg-amber-500',
  acquisition: 'bg-purple-500',
  product: 'bg-cyan-500',
  milestone: 'bg-indigo-500',
};

export const ReportViewer: React.FC<ReportViewerProps> = ({ report }) => {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    () => new Set(report.sections?.map((_, i) => i) ?? [])
  );
  const [copied, setCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const allExpanded = expandedSections.size === (report.sections?.length ?? 0);
  const toggleAllSections = () => {
    if (allExpanded) {
      setExpandedSections(new Set());
    } else {
      setExpandedSections(new Set(report.sections?.map((_, i) => i) ?? []));
    }
  };
  const toggleSection = (i: number) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const copyAsMarkdown = () => {
    const md = exportReportAsMarkdown(report);
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAsMarkdown = () => {
    const md = exportReportAsMarkdown(report);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* Report header */}
      <div className="rounded-2xl border border-medium-contrast/60 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 backdrop-blur-sm p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-indigo-400" />
              </div>
              <h3 className="text-heading-sm text-high-contrast font-bold truncate">{report.title}</h3>
            </div>
            <p className="text-body-sm text-medium-contrast leading-relaxed">{report.summary}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={copyAsMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-medium-contrast/40 bg-medium-contrast/10 hover:bg-medium-contrast/20 text-xs text-medium-contrast transition-colors"
              title="Copy as Markdown"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={downloadAsMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-medium-contrast/40 bg-medium-contrast/10 hover:bg-medium-contrast/20 text-xs text-medium-contrast transition-colors"
              title="Download as Markdown"
            >
              <Download className="w-3.5 h-3.5" />
              MD
            </button>
            <button
              onClick={async () => {
                setPdfLoading(true);
                try {
                  await lazyDownloadPdf(report);
                } catch (e) {
                  console.error('PDF export failed:', e);
                } finally {
                  setPdfLoading(false);
                }
              }}
              disabled={pdfLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-xs text-indigo-400 transition-colors disabled:opacity-50"
              title="Download as PDF"
            >
              {pdfLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              {pdfLoading ? 'Generating...' : 'PDF'}
            </button>
          </div>
        </div>

        {/* Metrics bar */}
        {report.metrics && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-medium-contrast/20">
            <MetricBadge icon={Clock} label="Total Time" value={`${(report.metrics.total_ms / 1000).toFixed(1)}s`} />
            <MetricBadge icon={Users} label="Agents" value={String(report.metrics.agents_used)} />
            <MetricBadge icon={Database} label="Sources" value={String(report.metrics.total_sources)} />
            <MetricBadge icon={Search} label="Searches" value={String(report.metrics.web_searches)} />
            <MetricBadge icon={Brain} label="Facts" value={String(report.metrics.facts_extracted)} />
            {report.metrics.retry_count > 0 && (
              <MetricBadge icon={RotateCcw} label="Retries" value={String(report.metrics.retry_count)} />
            )}
            {report.confidence_score && (
              <MetricBadge icon={ShieldCheck} label="Confidence" value={`${report.confidence_score.overall.toFixed(0)}%`} />
            )}
            {!report.confidence_score && report.verification && (
              <MetricBadge icon={ShieldCheck} label="Confidence" value={`${(report.verification.overall_confidence * 100).toFixed(0)}%`} />
            )}
          </div>
        )}
      </div>

      {/* Confidence score banner */}
      {report.confidence_score && (
        <ConfidenceBanner score={report.confidence_score} />
      )}

      {/* Company profile card */}
      {report.company_profile && (
        <CompanyProfileCard profile={report.company_profile} />
      )}

      {/* Key findings */}
      {report.key_findings && report.key_findings.length > 0 && (
        <div className="rounded-2xl border border-medium-contrast/60 bg-medium-contrast/10 backdrop-blur-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <h4 className="text-body-sm font-semibold text-high-contrast">Key Findings</h4>
          </div>
          <ul className="space-y-2">
            {report.key_findings.map((finding, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-2.5 text-body-sm text-medium-contrast"
              >
                <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{finding}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      )}

      {/* Financial data charts */}
      {report.financial_data && report.financial_data.length > 0 && (
        <FinancialCharts data={report.financial_data} />
      )}

      {/* Fallback: generic data points chart */}
      {(!report.financial_data || report.financial_data.length === 0) && report.data_points && report.data_points.length > 0 && (
        <div className="rounded-2xl border border-medium-contrast/60 bg-medium-contrast/10 backdrop-blur-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <h4 className="text-body-sm font-semibold text-high-contrast">Data Points</h4>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.data_points} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                <XAxis dataKey="label" tick={{ className: 'fill-gray-500 dark:fill-gray-400', fontSize: 10 }} axisLine={{ className: 'stroke-gray-300 dark:stroke-gray-700' }} tickLine={false} />
                <YAxis tick={{ className: 'fill-gray-500 dark:fill-gray-400', fontSize: 10 }} axisLine={{ className: 'stroke-gray-300 dark:stroke-gray-700' }} tickLine={false} />
                <Tooltip
                  content={<ChartTooltipWrapper formatter={(v, p) => `${v}${(p as { unit?: string }).unit ? ` ${(p as { unit?: string }).unit}` : ''}`} />}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {report.data_points.map((_entry, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Competitor landscape */}
      {report.competitors && report.competitors.length > 0 && (
        <CompetitorTable competitors={report.competitors} />
      )}

      {/* SWOT analysis grid */}
      {report.swot_analysis && (
        <SwotGrid swot={report.swot_analysis} />
      )}

      {/* News intelligence */}
      {report.news_items && report.news_items.length > 0 && (
        <NewsIntelligence items={report.news_items} />
      )}

      {/* Company timeline */}
      {report.timeline && report.timeline.length > 0 && (
        <TimelineView events={report.timeline} />
      )}

      {/* Source explorer with verification */}
      <SourceExplorer
        sources={report.all_sources}
        verification={report.verification}
      />

      {/* Report sections */}
      {report.sections && report.sections.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <h4 className="text-body-sm font-semibold text-high-contrast">Detailed Analysis</h4>
            </div>
            <button
              onClick={toggleAllSections}
              className="text-[10px] text-low-contrast hover:text-medium-contrast transition-colors"
            >
              {allExpanded ? 'Collapse All' : 'Expand All'}
            </button>
          </div>
          {report.sections.map((section, i) => (
            <div
              key={i}
              className="rounded-xl border border-medium-contrast/40 bg-medium-contrast/10 overflow-hidden"
            >
              <button
                onClick={() => toggleSection(i)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-medium-contrast/10 transition-colors"
                aria-expanded={expandedSections.has(i)}
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-body-sm font-medium text-high-contrast">{section.title}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-low-contrast transition-transform ${expandedSections.has(i) ? 'rotate-180' : ''}`}
                />
              </button>
              <AnimatePresence>
                {expandedSections.has(i) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 border-t border-medium-contrast/20 pt-3">
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-li:my-0.5 prose-headings:my-2 prose-strong:text-high-contrast text-body-sm text-medium-contrast leading-relaxed">
                        <ReactMarkdown>{section.content}</ReactMarkdown>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {/* Agent performance */}
      {report.agent_results && report.agent_results.length > 0 && (
        <div className="rounded-2xl border border-medium-contrast/60 bg-medium-contrast/10 backdrop-blur-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-purple-400" />
            <h4 className="text-body-sm font-semibold text-high-contrast">Agent Performance</h4>
          </div>
          <div className="space-y-2">
            {report.agent_results.map((agent) => (
              <div key={agent.agent_id} className="flex items-center gap-3">
                <span className="text-xs text-medium-contrast w-24 truncate">{agent.agent_name}</span>
                <div className="flex-1 h-2 rounded-full bg-medium-contrast/20 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      agent.status === 'completed'
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
                        : 'bg-red-500'
                    }`}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(100, (agent.duration_ms / Math.max(...report.agent_results.map(a => a.duration_ms))) * 100)}%`,
                    }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  />
                </div>
                <span className="text-[10px] font-mono text-low-contrast w-12 text-right">
                  {(agent.duration_ms / 1000).toFixed(1)}s
                </span>
                {agent.sources && agent.sources.length > 0 && (
                  <span className="text-[9px] font-mono text-cyan-400">
                    {agent.sources.length} src
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Visualizations */}
      {report.agent_results && report.agent_results.length > 0 && (
        <VisualizationTabs report={report} />
      )}

      {/* Prompt inspector */}
      <ResearchPromptInspector prompts={report.research_prompts} />
    </motion.div>
  );
};

/* ── Visualization Tabs ──────────────────────────────────────────── */

type VizTab = 'graph' | 'tree' | 'knowledge';

const VisualizationTabs: React.FC<{ report: ResearchReport }> = ({ report }) => {
  const [activeTab, setActiveTab] = useState<VizTab>('tree');

  const tabs: { id: VizTab; label: string; icon: React.ElementType }[] = [
    { id: 'tree', label: 'Agent Activity', icon: GitBranch },
    { id: 'graph', label: 'Research Graph', icon: Share2 },
    { id: 'knowledge', label: 'Knowledge Graph', icon: Network },
  ];

  return (
    <div className="rounded-2xl border border-medium-contrast/60 bg-medium-contrast/10 backdrop-blur-sm p-5">
      <div className="flex items-center gap-4 mb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/30'
                  : 'text-low-contrast hover:text-high-contrast hover:bg-medium-contrast/30'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>
      <Suspense fallback={<GraphFallback />}>
        {activeTab === 'tree' && <AgentActivityTree report={report} />}
        {activeTab === 'graph' && <ResearchGraph report={report} />}
        {activeTab === 'knowledge' && <KnowledgeGraph report={report} />}
      </Suspense>
    </div>
  );
};

/* ── Sub-components ──────────────────────────────────────────────── */

const MetricBadge: React.FC<{ icon: React.ElementType; label: string; value: string }> = ({
  icon: Icon, label, value,
}) => (
  <div className="flex items-center gap-2">
    <Icon className="w-3.5 h-3.5 text-indigo-400" />
    <span className="text-[10px] text-low-contrast">{label}</span>
    <span className="text-xs font-semibold text-high-contrast font-mono">{value}</span>
  </div>
);

/* ── Confidence Banner ───────────────────────────────────────────── */

const ConfidenceBanner: React.FC<{ score: ConfidenceScore }> = ({ score }) => {
  const color = score.overall >= 75 ? 'emerald' : score.overall >= 50 ? 'amber' : 'red';
  const colorClasses = {
    emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/30 text-emerald-400',
    amber: 'from-amber-500/10 to-amber-500/5 border-amber-500/30 text-amber-400',
    red: 'from-red-500/10 to-red-500/5 border-red-500/30 text-red-400',
  }[color];

  return (
    <div className={`rounded-xl border bg-gradient-to-r ${colorClasses} p-3 flex items-center justify-between`}>
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-5 h-5" />
        <div>
          <span className="text-xs font-semibold text-high-contrast">{score.label}</span>
          <span className="text-[10px] text-medium-contrast ml-2">
            {score.source_count} sources | {score.reliability} reliability
            {score.data_freshness ? ` | ${score.data_freshness}` : ''}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-24 h-2 rounded-full bg-medium-contrast/20 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              color === 'emerald' ? 'bg-emerald-500' : color === 'amber' ? 'bg-amber-500' : 'bg-red-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${score.overall}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
        <CountUp value={score.overall} suffix="%" className="text-sm font-bold font-mono" />
      </div>
    </div>
  );
};

/* Count-up animation for numbers */
const CountUp: React.FC<{ value: number; suffix?: string; className?: string }> = ({ value, suffix = '', className }) => {
  const [display, setDisplay] = React.useState(0);
  React.useEffect(() => {
    let raf: number;
    const start = performance.now();
    const duration = 800;
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(eased * value));
      if (progress < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className={className}>{display.toFixed(0)}{suffix}</span>;
};

/* ── Company Profile Card ────────────────────────────────────────── */

const CompanyProfileCard: React.FC<{ profile: CompanyProfile }> = ({ profile }) => {
  const fields = [
    { icon: User, label: 'CEO', value: profile.ceo },
    { icon: Calendar, label: 'Founded', value: profile.founded },
    { icon: MapPin, label: 'HQ', value: profile.headquarters },
    { icon: Users, label: 'Employees', value: profile.employees },
    { icon: Building2, label: 'Industry', value: profile.industry },
    { icon: TrendingUp, label: 'Market Cap', value: profile.market_cap },
    { icon: Hash, label: 'Ticker', value: profile.stock_ticker },
    { icon: Globe, label: 'Website', value: profile.website },
  ].filter(f => f.value);

  return (
    <div className="rounded-2xl border border-medium-contrast/60 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 backdrop-blur-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <Building2 className="w-4 h-4 text-blue-400" />
        <h4 className="text-body-sm font-semibold text-high-contrast">Company Overview</h4>
      </div>
      <div className="mb-3">
        <h5 className="text-lg font-bold text-high-contrast">{profile.name}</h5>
        {profile.description && (
          <p className="text-body-sm text-medium-contrast mt-1">{profile.description}</p>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {fields.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-2">
            <Icon className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-low-contrast">{label}</div>
              <div className="text-xs font-medium text-high-contrast truncate">
                {label === 'Website' && value ? (
                  <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                    {value.replace(/^https?:\/\//, '')}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                ) : value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Financial Charts ────────────────────────────────────────────── */

const FinancialCharts: React.FC<{ data: FinancialMetric[] }> = ({ data }) => {
  // Group by category for segmented display
  const categories = Array.from(new Set(data.map(d => d.category)));
  const chartData = data.map((d, i) => ({
    ...d,
    displayLabel: d.label.length > 18 ? d.label.slice(0, 16) + '...' : d.label,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  // Pie data for category breakdown
  const categoryData = categories.map((cat, i) => ({
    name: cat,
    value: data.filter(d => d.category === cat).length,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <div className="rounded-2xl border border-medium-contrast/60 bg-medium-contrast/10 backdrop-blur-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-cyan-400" />
        <h4 className="text-body-sm font-semibold text-high-contrast">Financial Performance</h4>
      </div>

      {/* Metric cards row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {data.slice(0, 4).map((metric, i) => (
          <div key={i} className="rounded-lg bg-medium-contrast/10 border border-medium-contrast/20 p-2.5">
            <div className="text-[10px] text-low-contrast truncate">{metric.label}</div>
            <div className="text-sm font-bold text-high-contrast font-mono">
              {metric.unit === '$B' || metric.unit === '$M' ? '$' : ''}
              {metric.value.toLocaleString()}
              {metric.unit === '%' ? '%' : metric.unit === '$B' ? 'B' : metric.unit === '$M' ? 'M' : ` ${metric.unit}`}
            </div>
            {metric.period && <div className="text-[9px] text-low-contrast">{metric.period}</div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Bar chart */}
        <div className="sm:col-span-2 h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
              <XAxis dataKey="displayLabel" tick={{ className: 'fill-gray-500 dark:fill-gray-400', fontSize: 9 }} axisLine={{ className: 'stroke-gray-300 dark:stroke-gray-700' }} tickLine={false} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ className: 'fill-gray-500 dark:fill-gray-400', fontSize: 10 }} axisLine={{ className: 'stroke-gray-300 dark:stroke-gray-700' }} tickLine={false} />
              <Tooltip
                content={<ChartTooltipWrapper formatter={(v, p) => {
                  const pp = p as { unit?: string; label?: string; period?: string };
                  return `${v.toLocaleString()} ${pp.unit || ''}${pp.period ? ` (${pp.period})` : ''}`;
                }} />}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie */}
        <div className="h-52 flex flex-col items-center justify-center">
          <div className="text-[10px] text-low-contrast mb-2">Data by Category</div>
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={50}
                paddingAngle={3}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                content={<ChartTooltipWrapper />}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-2 mt-1">
            {categoryData.map((cat, i) => (
              <span key={i} className="flex items-center gap-1 text-[9px] text-medium-contrast">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.fill }} />
                {cat.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Competitor Table ────────────────────────────────────────────── */

const CompetitorTable: React.FC<{ competitors: CompetitorEntry[] }> = ({ competitors }) => (
  <div className="rounded-2xl border border-medium-contrast/60 bg-medium-contrast/10 backdrop-blur-sm p-5">
    <div className="flex items-center gap-2 mb-4">
      <Target className="w-4 h-4 text-orange-400" />
      <h4 className="text-body-sm font-semibold text-high-contrast">Competitive Landscape</h4>
    </div>
    <div className="overflow-x-auto -mx-2">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-medium-contrast/30">
            <th className="text-left py-2 px-2 text-low-contrast font-medium">Company</th>
            <th className="text-left py-2 px-2 text-low-contrast font-medium">Market Cap</th>
            <th className="text-left py-2 px-2 text-low-contrast font-medium">Revenue</th>
            <th className="text-left py-2 px-2 text-low-contrast font-medium hidden sm:table-cell">Share</th>
            <th className="text-left py-2 px-2 text-low-contrast font-medium">Strength</th>
            <th className="text-left py-2 px-2 text-low-contrast font-medium hidden sm:table-cell">Weakness</th>
          </tr>
        </thead>
        <tbody>
          {competitors.map((comp, i) => (
            <motion.tr
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="border-b border-medium-contrast/10 hover:bg-medium-contrast/10 transition-colors"
            >
              <td className="py-2 px-2 font-medium text-high-contrast">{comp.name}</td>
              <td className="py-2 px-2 text-medium-contrast font-mono">{comp.market_cap || '—'}</td>
              <td className="py-2 px-2 text-medium-contrast font-mono">{comp.revenue || '—'}</td>
              <td className="py-2 px-2 text-medium-contrast font-mono hidden sm:table-cell">{comp.market_share || '—'}</td>
              <td className="py-2 px-2 text-emerald-400 max-w-[160px] truncate">{comp.strengths || '—'}</td>
              <td className="py-2 px-2 text-red-400 max-w-[160px] truncate hidden sm:table-cell">{comp.weaknesses || '—'}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

/* ── SWOT Grid ───────────────────────────────────────────────────── */

const SWOT_COLORS: Record<string, string> = {
  emerald: '#34d399',
  red: '#f87171',
  blue: '#60a5fa',
  amber: '#fbbf24',
};

const SwotGrid: React.FC<{ swot: SwotAnalysis }> = ({ swot }) => {
  const quadrants = [
    { title: 'Strengths', items: swot.strengths, icon: Award, color: 'emerald', gradient: 'from-emerald-500/10 to-emerald-500/5' },
    { title: 'Weaknesses', items: swot.weaknesses, icon: AlertTriangle, color: 'red', gradient: 'from-red-500/10 to-red-500/5' },
    { title: 'Opportunities', items: swot.opportunities, icon: Rocket, color: 'blue', gradient: 'from-blue-500/10 to-blue-500/5' },
    { title: 'Threats', items: swot.threats, icon: Shield, color: 'amber', gradient: 'from-amber-500/10 to-amber-500/5' },
  ];

  return (
    <div className="rounded-2xl border border-medium-contrast/60 bg-medium-contrast/10 backdrop-blur-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-violet-400" />
        <h4 className="text-body-sm font-semibold text-high-contrast">SWOT Analysis</h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {quadrants.map(({ title, items, icon: Icon, color, gradient }) => (
          <div key={title} className={`rounded-xl bg-gradient-to-br ${gradient} border border-medium-contrast/20 p-3.5`}>
            <div className="flex items-center gap-2 mb-2.5">
              <Icon className="w-4 h-4" style={{ color: SWOT_COLORS[color] }} />
              <span className="text-xs font-semibold" style={{ color: SWOT_COLORS[color] }}>{title}</span>
              <span className="text-[9px] text-low-contrast ml-auto">{items.length} items</span>
            </div>
            <ul className="space-y-1.5">
              {items.map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-2 text-[11px] text-medium-contrast leading-relaxed"
                >
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: SWOT_COLORS[color] }} />
                  {item}
                </motion.li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── News Intelligence ───────────────────────────────────────────── */

const NewsIntelligence: React.FC<{ items: NewsItem[] }> = ({ items }) => {
  const sentimentCounts = {
    positive: items.filter(n => n.sentiment === 'positive').length,
    neutral: items.filter(n => n.sentiment === 'neutral').length,
    negative: items.filter(n => n.sentiment === 'negative').length,
  };
  const total = items.length;

  return (
    <div className="rounded-2xl border border-medium-contrast/60 bg-medium-contrast/10 backdrop-blur-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-sky-400" />
          <h4 className="text-body-sm font-semibold text-high-contrast">News Intelligence</h4>
        </div>
        {/* Sentiment summary */}
        <div className="flex items-center gap-3">
          {Object.entries(sentimentCounts).map(([sentiment, count]) => {
            if (count === 0) return null;
            const cfg = SENTIMENT_CONFIG[sentiment as keyof typeof SENTIMENT_CONFIG];
            return (
              <span key={sentiment} className={`flex items-center gap-1 text-[10px] ${cfg.color}`}>
                <cfg.icon className="w-3 h-3" />
                {count}/{total}
              </span>
            );
          })}
        </div>
      </div>

      {/* Sentiment bar */}
      <div className="flex h-2 rounded-full overflow-hidden mb-4 bg-medium-contrast/20">
        {sentimentCounts.positive > 0 && (
          <div className="bg-emerald-500 transition-all" style={{ width: `${(sentimentCounts.positive / total) * 100}%` }} />
        )}
        {sentimentCounts.neutral > 0 && (
          <div className="bg-gray-500 transition-all" style={{ width: `${(sentimentCounts.neutral / total) * 100}%` }} />
        )}
        {sentimentCounts.negative > 0 && (
          <div className="bg-red-500 transition-all" style={{ width: `${(sentimentCounts.negative / total) * 100}%` }} />
        )}
      </div>

      <div className="space-y-2">
        {items.map((item, i) => {
          const cfg = SENTIMENT_CONFIG[item.sentiment] || SENTIMENT_CONFIG.neutral;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-3 rounded-lg bg-medium-contrast/5 border border-medium-contrast/10 p-3"
            >
              <div className={`w-6 h-6 rounded-md ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <cfg.icon className={`w-3 h-3 ${cfg.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-medium text-high-contrast leading-snug">{item.title}</span>
                  {item.impact && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded flex-shrink-0 ${
                      item.impact === 'high' ? 'bg-red-500/10 text-red-400' :
                      item.impact === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-gray-500/10 text-gray-400'
                    }`}>
                      {item.impact}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-medium-contrast mt-0.5 leading-relaxed">{item.summary}</p>
                <div className="flex items-center gap-2 mt-1">
                  {item.source && <span className="text-[9px] text-low-contrast">{item.source}</span>}
                  {item.date && <span className="text-[9px] text-low-contrast">{item.date}</span>}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

/* ── Timeline ────────────────────────────────────────────────────── */

const TimelineView: React.FC<{ events: TimelineEvent[] }> = ({ events }) => (
  <div className="rounded-2xl border border-medium-contrast/60 bg-medium-contrast/10 backdrop-blur-sm p-5">
    <div className="flex items-center gap-2 mb-4">
      <Calendar className="w-4 h-4 text-teal-400" />
      <h4 className="text-body-sm font-semibold text-high-contrast">Company Timeline</h4>
    </div>
    <div className="relative ml-3">
      {/* Vertical line */}
      <div className="absolute left-0 top-2 bottom-2 w-px bg-medium-contrast/30" />

      <div className="space-y-4">
        {events.map((event, i) => {
          const dotColor = TIMELINE_COLORS[event.category || 'milestone'] || 'bg-indigo-500';
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="relative pl-6"
            >
              {/* Dot */}
              <div className={`absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full ${dotColor} -translate-x-1`} />
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold text-high-contrast font-mono">{event.year}</span>
                <span className="text-xs font-medium text-high-contrast">{event.title}</span>
              </div>
              {event.description && (
                <p className="text-[11px] text-medium-contrast mt-0.5 leading-relaxed">{event.description}</p>
              )}
              {event.category && (
                <span className="text-[9px] text-low-contrast capitalize">{event.category}</span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  </div>
);
