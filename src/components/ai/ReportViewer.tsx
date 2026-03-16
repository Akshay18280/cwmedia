import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import {
  FileText, ChevronDown, Clock, Users, Database,
  Lightbulb, BarChart3, BookOpen, Download, Copy, Check,
  Search, ShieldCheck, RotateCcw, Brain,
} from 'lucide-react';
import type { ResearchReport } from './types';
import { SourceExplorer } from './SourceExplorer';
import { ResearchPromptInspector } from './ResearchPromptInspector';
import { exportReportAsMarkdown } from '@/services/ai/ResearchService';

interface ReportViewerProps {
  report: ResearchReport;
}

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export const ReportViewer: React.FC<ReportViewerProps> = ({ report }) => {
  const [expandedSection, setExpandedSection] = useState<number | null>(0);
  const [copied, setCopied] = useState(false);

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
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                <FileText className="w-4 h-4 text-indigo-400" />
              </div>
              <h3 className="text-heading-sm text-high-contrast font-bold">{report.title}</h3>
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
              Export
            </button>
          </div>
        </div>

        {/* Metrics bar */}
        {report.metrics && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-medium-contrast/20">
            <MetricBadge icon={Clock} label="Total Time" value={`${(report.metrics.total_ms / 1000).toFixed(1)}s`} />
            <MetricBadge icon={Users} label="Agents" value={String(report.metrics.agents_used)} />
            <MetricBadge icon={Database} label="Sources" value={String(report.metrics.total_sources)} />
            <MetricBadge icon={Search} label="Web Searches" value={String(report.metrics.web_searches)} />
            <MetricBadge icon={Brain} label="Facts" value={String(report.metrics.facts_extracted)} />
            {report.metrics.retry_count > 0 && (
              <MetricBadge icon={RotateCcw} label="Retries" value={String(report.metrics.retry_count)} />
            )}
            {report.verification && (
              <MetricBadge
                icon={ShieldCheck}
                label="Confidence"
                value={`${(report.verification.overall_confidence * 100).toFixed(0)}%`}
              />
            )}
          </div>
        )}
      </div>

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

      {/* Source explorer with verification */}
      <SourceExplorer
        sources={report.all_sources}
        verification={report.verification}
      />

      {/* Data visualization */}
      {report.data_points && report.data_points.length > 0 && (
        <div className="rounded-2xl border border-medium-contrast/60 bg-medium-contrast/10 backdrop-blur-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <h4 className="text-body-sm font-semibold text-high-contrast">Data Points</h4>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.data_points} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                  axisLine={{ stroke: '#374151' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                  axisLine={{ stroke: '#374151' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f3f4f6',
                  }}
                  formatter={(value: number, _name: string, props: { payload: { unit?: string } }) => [
                    `${value}${props.payload.unit ? ` ${props.payload.unit}` : ''}`,
                    'Value',
                  ]}
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

      {/* Report sections */}
      {report.sections && report.sections.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <h4 className="text-body-sm font-semibold text-high-contrast">Detailed Analysis</h4>
          </div>
          {report.sections.map((section, i) => (
            <div
              key={i}
              className="rounded-xl border border-medium-contrast/40 bg-medium-contrast/10 overflow-hidden"
            >
              <button
                onClick={() => setExpandedSection(expandedSection === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-medium-contrast/10 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-body-sm font-medium text-high-contrast">{section.title}</span>
                  {section.agent_id && (
                    <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                      {section.agent_id}
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-low-contrast transition-transform ${
                    expandedSection === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <AnimatePresence>
                {expandedSection === i && (
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

      {/* Prompt inspector */}
      <ResearchPromptInspector prompts={report.research_prompts} />
    </motion.div>
  );
};

const MetricBadge: React.FC<{ icon: React.ElementType; label: string; value: string }> = ({
  icon: Icon,
  label,
  value,
}) => (
  <div className="flex items-center gap-2">
    <Icon className="w-3.5 h-3.5 text-indigo-400" />
    <span className="text-[10px] text-low-contrast">{label}</span>
    <span className="text-xs font-semibold text-high-contrast font-mono">{value}</span>
  </div>
);
