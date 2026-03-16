import React from 'react';
import { Clock, Database, Hash } from 'lucide-react';
import type { QueryMetrics } from './types';

interface MetricsPanelProps {
  metrics: QueryMetrics | null;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ metrics }) => {
  if (!metrics) return null;

  const segments = [
    { label: 'Embed', ms: metrics.embed_ms, color: 'bg-blue-500' },
    { label: 'Search', ms: metrics.search_ms, color: 'bg-green-500' },
    { label: 'LLM', ms: metrics.llm_ms, color: 'bg-purple-500' },
  ];

  const total = metrics.total_ms || 1;

  return (
    <div className="rounded-xl border border-medium-contrast bg-medium-contrast/30 p-4">
      <h4 className="text-body-sm font-semibold text-high-contrast mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4 text-accent-primary" />
        Last Query Metrics
      </h4>

      {/* Stacked bar */}
      <div className="h-3 rounded-full overflow-hidden flex mb-3">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className={`${seg.color} transition-all`}
            style={{ width: `${Math.max(2, (seg.ms / total) * 100)}%` }}
            title={`${seg.label}: ${seg.ms}ms`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-medium-contrast mb-3">
        {segments.map((seg) => (
          <span key={seg.label} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${seg.color}`} />
            {seg.label}: {seg.ms}ms
          </span>
        ))}
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-xs text-low-contrast border-t border-medium-contrast/50 pt-2">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> Total: {metrics.total_ms}ms
        </span>
        <span className="flex items-center gap-1">
          <Database className="w-3 h-3" /> {metrics.chunks_found} chunks
        </span>
        <span className="flex items-center gap-1">
          <Hash className="w-3 h-3" /> ~{metrics.prompt_tokens_approx} tokens
        </span>
      </div>
    </div>
  );
};
