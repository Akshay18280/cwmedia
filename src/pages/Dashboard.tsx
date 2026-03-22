import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Brain, Sparkles, Shield, Database, Search,
  ArrowRight, Trash2, Clock, Zap, CheckCircle2, XCircle,
} from 'lucide-react';
import { useResearchStore, type SavedReportSummary } from '@/stores/researchStore';
import { useAutomationStore } from '@/stores/automationStore';

const STAT_ICONS = [Brain, Shield, Database, Search] as const;

export default function Dashboard() {
  const savedReports = useResearchStore((s) => s.savedReports);
  const conversations = useResearchStore((s) => s.conversations);
  const removeSavedReport = useResearchStore((s) => s.removeSavedReport);

  // Compute stats
  const totalSessions = savedReports.length;
  const avgConfidence = totalSessions > 0
    ? Math.round(savedReports.reduce((sum, r) => sum + r.confidence, 0) / totalSessions)
    : 0;
  const totalSources = savedReports.reduce((sum, r) => sum + r.totalSources, 0);
  const uniqueTopics = new Set(savedReports.map(r => r.title.split(/\s+/).slice(0, 3).join(' '))).size;

  const stats = [
    { label: 'Research Sessions', value: totalSessions, icon: STAT_ICONS[0] },
    { label: 'Avg Confidence', value: `${avgConfidence}%`, icon: STAT_ICONS[1] },
    { label: 'Sources Analyzed', value: totalSources, icon: STAT_ICONS[2] },
    { label: 'Topics Explored', value: uniqueTopics, icon: STAT_ICONS[3] },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-headline font-bold text-high-contrast">Research Dashboard</h1>
            <p className="text-body-sm text-medium-contrast mt-1">Your research history and saved reports</p>
          </div>
          <Link
            to="/ai-lab"
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg text-body-sm font-semibold hover:shadow-md hover:shadow-indigo-500/20 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            New Research
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-medium-contrast/40 bg-medium-contrast/10 p-4"
            >
              <stat.icon className="w-5 h-5 text-accent-primary mb-2" />
              <div className="text-headline font-bold text-high-contrast text-mono-data">
                {stat.value}
              </div>
              <div className="text-caption text-medium-contrast">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Automation Stats */}
        <AutomationSection />

        {/* Recent research */}
        <section>
          <h2 className="text-section-title font-semibold text-high-contrast mb-4">Recent Research</h2>

          {savedReports.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-medium-contrast/40 bg-medium-contrast/10 p-12 text-center"
            >
              <Sparkles className="w-12 h-12 text-low-contrast mx-auto mb-4" />
              <h3 className="text-body-lg font-semibold text-high-contrast mb-2">No research yet</h3>
              <p className="text-body-sm text-medium-contrast mb-6">Your research reports will appear here once you start exploring.</p>
              <Link
                to="/ai-lab"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
              >
                Start Your First Research
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {savedReports.map((report, i) => (
                <ReportCard key={report.id} report={report} index={i} onRemove={removeSavedReport} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const AutomationSection: React.FC = () => {
  const savedJobs = useAutomationStore((s) => s.savedJobs);

  if (savedJobs.length === 0) return null;

  const published = savedJobs.filter((j) => j.publishDecision === 'publish').length;
  const rejected = savedJobs.length - published;
  const avgConf = savedJobs.length > 0
    ? Math.round(savedJobs.reduce((s, j) => s + j.confidence * 100, 0) / savedJobs.length)
    : 0;
  const avgDuration = savedJobs.length > 0
    ? (savedJobs.reduce((s, j) => s + j.durationMs, 0) / savedJobs.length / 1000).toFixed(1)
    : '0';

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-amber-500" />
        <h2 className="text-section-title font-semibold text-high-contrast">Automation Lab</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="rounded-xl border border-medium-contrast/40 bg-medium-contrast/10 p-3">
          <p className="text-xl font-bold text-high-contrast text-mono-data">{savedJobs.length}</p>
          <p className="text-caption text-medium-contrast">Total Runs</p>
        </div>
        <div className="rounded-xl border border-medium-contrast/40 bg-medium-contrast/10 p-3">
          <p className="text-xl font-bold text-emerald-400 text-mono-data">{published} <span className="text-xs text-low-contrast font-normal">/ {rejected} rejected</span></p>
          <p className="text-caption text-medium-contrast">Published</p>
        </div>
        <div className="rounded-xl border border-medium-contrast/40 bg-medium-contrast/10 p-3">
          <p className="text-xl font-bold text-high-contrast text-mono-data">{avgConf}%</p>
          <p className="text-caption text-medium-contrast">Avg Confidence</p>
        </div>
        <div className="rounded-xl border border-medium-contrast/40 bg-medium-contrast/10 p-3">
          <p className="text-xl font-bold text-high-contrast text-mono-data">{avgDuration}s</p>
          <p className="text-caption text-medium-contrast">Avg Duration</p>
        </div>
      </div>

      <div className="space-y-2">
        {savedJobs.slice(0, 5).map((job, i) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-medium-contrast/20 bg-medium-contrast/5"
          >
            {job.publishDecision === 'publish' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-high-contrast truncate">{job.topic}</p>
              <p className="text-[10px] text-low-contrast">
                {new Date(job.createdAt).toLocaleDateString()} · {(job.durationMs / 1000).toFixed(1)}s · {job.sourceCount} sources · {job.agentCount} agents
              </p>
            </div>
            <span className="text-xs font-mono text-low-contrast flex-shrink-0">
              {(job.confidence * 100).toFixed(0)}%
            </span>
          </motion.div>
        ))}
      </div>

      <Link
        to="/automation-lab"
        className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-accent-primary hover:underline"
      >
        Go to Automation Lab <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </section>
  );
};

const ReportCard: React.FC<{
  report: SavedReportSummary;
  index: number;
  onRemove: (id: string) => void;
}> = ({ report, index, onRemove }) => {
  const confidenceColor = report.confidence >= 75 ? 'text-emerald-400' : report.confidence >= 50 ? 'text-amber-400' : 'text-red-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group rounded-xl border border-medium-contrast/40 bg-medium-contrast/10 p-4 hover:border-accent-primary/30 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-body font-semibold text-high-contrast truncate">{report.title}</h3>
          <p className="text-body-sm text-medium-contrast line-clamp-2 mt-1">{report.summary}</p>
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1 text-caption text-low-contrast">
              <Clock className="w-3 h-3" />
              {new Date(report.createdAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1 text-caption text-low-contrast">
              <Brain className="w-3 h-3" />
              {report.agentsUsed} agents
            </span>
            <span className="flex items-center gap-1 text-caption text-low-contrast">
              <Database className="w-3 h-3" />
              {report.totalSources} sources
            </span>
            <span className={`text-caption font-semibold text-mono-data ${confidenceColor}`}>
              {report.confidence.toFixed(0)}% confidence
            </span>
          </div>
        </div>
        <button
          onClick={() => onRemove(report.id)}
          className="opacity-0 group-hover:opacity-100 p-2 text-low-contrast hover:text-red-500 transition-all rounded-lg hover:bg-red-500/10"
          aria-label={`Delete report: ${report.title}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
