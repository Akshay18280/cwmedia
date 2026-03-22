import React, { useState } from 'react';
import { Code2, ChevronDown, ChevronUp, Clock, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { QueryMetrics } from './types';

interface QueryInspectorProps {
  promptPreview?: { system_prompt: string; user_prompt: string };
  metrics?: QueryMetrics;
}

export const QueryInspector: React.FC<QueryInspectorProps> = ({ promptPreview, metrics }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<'prompt' | 'metrics'>('metrics');

  if (!promptPreview && !metrics) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs text-medium-contrast hover:text-high-contrast transition-colors"
      >
        <Code2 className="w-3 h-3" />
        Inspect Query
        {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-lg border border-medium-contrast bg-medium-contrast/30 overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-medium-contrast">
                <button
                  onClick={() => setTab('metrics')}
                  className={`flex-1 px-3 py-2 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                    tab === 'metrics'
                      ? 'text-accent-primary border-b-2 border-accent-primary'
                      : 'text-low-contrast hover:text-medium-contrast'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  Metrics
                </button>
                <button
                  onClick={() => setTab('prompt')}
                  className={`flex-1 px-3 py-2 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                    tab === 'prompt'
                      ? 'text-accent-primary border-b-2 border-accent-primary'
                      : 'text-low-contrast hover:text-medium-contrast'
                  }`}
                >
                  <Cpu className="w-3 h-3" />
                  Prompt
                </button>
              </div>

              <div className="p-3">
                {tab === 'metrics' && metrics && (
                  <div className="space-y-2">
                    <LatencyBar label="Embedding" ms={metrics.embed_ms} color="bg-blue-500" total={metrics.total_ms} />
                    <LatencyBar label="Search" ms={metrics.search_ms} color="bg-green-500" total={metrics.total_ms} />
                    <LatencyBar label="LLM" ms={metrics.llm_ms} color="bg-purple-500" total={metrics.total_ms} />
                    <div className="flex justify-between text-xs text-medium-contrast pt-1 border-t border-medium-contrast/50">
                      <span>Total: {metrics.total_ms}ms</span>
                      <span>{metrics.chunks_found} chunks</span>
                      <span>~{metrics.prompt_tokens_approx} tokens</span>
                    </div>
                  </div>
                )}

                {tab === 'prompt' && promptPreview && (
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs font-medium text-low-contrast block mb-1">System Prompt</span>
                      <pre className="text-xs text-medium-contrast bg-low-contrast/30 rounded p-2 overflow-x-auto whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {promptPreview.system_prompt}
                      </pre>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-low-contrast block mb-1">User Prompt</span>
                      <pre className="text-xs text-medium-contrast bg-low-contrast/30 rounded p-2 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {promptPreview.user_prompt}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LatencyBar: React.FC<{ label: string; ms: number; color: string; total: number }> = ({
  label, ms, color, total,
}) => {
  const pct = total > 0 ? Math.max(2, (ms / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-low-contrast w-16">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-low-contrast/30 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-medium-contrast w-12 text-right font-mono">{ms}ms</span>
    </div>
  );
};
