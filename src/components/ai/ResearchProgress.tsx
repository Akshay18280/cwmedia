import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Search, Users, FileText, Loader2, Check, AlertCircle,
  Sparkles, Newspaper, Building2, ShieldCheck, RotateCcw, Beaker,
} from 'lucide-react';
import type { ResearchAgentStatus } from './types';

interface ResearchProgressProps {
  phase: 'idle' | 'planning' | 'researching' | 'extracting' | 'verifying' | 'synthesizing' | 'complete';
  agents: ResearchAgentStatus[];
  planMessage?: string;
  synthesisMessage?: string;
  retryCount?: number;
  verificationConfidence?: number;
}

const agentIcons: Record<string, React.ElementType> = {
  overview: Search,
  market: FileText,
  technical: Brain,
  trends: Sparkles,
  risks: AlertCircle,
  news: Newspaper,
  competitor: Building2,
};

const phaseConfig: Record<string, { label: string; description: string }> = {
  planning: { label: 'Planning Research', description: 'Analyzing query and selecting research agents...' },
  researching: { label: 'Agents Working', description: '' },
  extracting: { label: 'Extracting Facts', description: 'Identifying key claims and data points...' },
  verifying: { label: 'Verifying Claims', description: 'Cross-referencing facts across sources...' },
  synthesizing: { label: 'Synthesizing Report', description: 'Merging findings into a structured report...' },
  complete: { label: 'Research Complete', description: 'Report ready' },
};

export const ResearchProgress: React.FC<ResearchProgressProps> = ({
  phase,
  agents,
  planMessage,
  synthesisMessage,
  retryCount,
  verificationConfidence,
}) => {
  if (phase === 'idle') return null;

  const completedCount = agents.filter(a => a.status === 'completed').length;
  const totalAgents = agents.length;
  const config = phaseConfig[phase] || { label: phase, description: '' };

  const getProgressWidth = () => {
    switch (phase) {
      case 'planning': return '15%';
      case 'researching': return `${15 + (completedCount / Math.max(totalAgents, 1)) * 45}%`;
      case 'extracting': return '70%';
      case 'verifying': return '80%';
      case 'synthesizing': return '92%';
      case 'complete': return '100%';
      default: return '0%';
    }
  };

  const getDescription = () => {
    switch (phase) {
      case 'planning': return planMessage || config.description;
      case 'researching': return `${completedCount} of ${totalAgents} agents completed`;
      case 'extracting': return 'Identifying key claims and data points...';
      case 'verifying': return 'Cross-referencing facts across sources...';
      case 'synthesizing': return synthesisMessage || config.description;
      case 'complete': return 'Report ready';
      default: return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="mx-4 mb-3"
    >
      <div className="rounded-2xl border border-medium-contrast/60 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-cyan-500/5 backdrop-blur-sm p-4 sm:p-5">
        {/* Phase indicator */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <motion.div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center"
              animate={phase !== 'complete' ? {
                boxShadow: ['0 0 0px rgba(99,102,241,0)', '0 0 20px rgba(99,102,241,0.3)', '0 0 0px rgba(99,102,241,0)'],
              } : {}}
              transition={phase !== 'complete' ? { duration: 2, repeat: Infinity } : {}}
            >
              {phase === 'complete' ? (
                <Check className="w-5 h-5 text-emerald-400" />
              ) : phase === 'verifying' ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              ) : phase === 'extracting' ? (
                <Beaker className="w-5 h-5 text-cyan-400" />
              ) : (
                <Brain className="w-5 h-5 text-indigo-400" />
              )}
            </motion.div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-body-sm font-semibold text-high-contrast">
                {config.label}
              </span>
              {phase === 'researching' && totalAgents > 0 && (
                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                  {completedCount}/{totalAgents}
                </span>
              )}
              {retryCount !== undefined && retryCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                  <RotateCcw className="w-2.5 h-2.5" />
                  retry {retryCount}
                </span>
              )}
              {verificationConfidence !== undefined && phase === 'complete' && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  {(verificationConfidence * 100).toFixed(0)}% confidence
                </span>
              )}
            </div>
            <p className="text-xs text-low-contrast mt-0.5">{getDescription()}</p>
          </div>
        </div>

        {/* Agent cards */}
        {agents.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <AnimatePresence mode="popLayout">
              {agents.map((agent) => {
                const Icon = agentIcons[agent.id] || Users;
                return (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-xl border px-3 py-2.5 transition-all ${
                      agent.status === 'completed'
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : agent.status === 'running'
                          ? 'border-indigo-500/40 bg-indigo-500/5'
                          : agent.status === 'failed'
                            ? 'border-red-500/30 bg-red-500/5'
                            : 'border-medium-contrast/40 bg-medium-contrast/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                        agent.status === 'completed'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : agent.status === 'running'
                            ? 'bg-indigo-500/15 text-indigo-400'
                            : agent.status === 'failed'
                              ? 'bg-red-500/15 text-red-400'
                              : 'bg-medium-contrast/20 text-low-contrast'
                      }`}>
                        {agent.status === 'completed' ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : agent.status === 'running' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : agent.status === 'failed' ? (
                          <AlertCircle className="w-3.5 h-3.5" />
                        ) : (
                          <Icon className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-high-contrast truncate">
                        {agent.name.replace(' Analyst', '')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {agent.duration_ms !== undefined && agent.status === 'completed' && (
                        <span className="text-[9px] font-mono text-emerald-400">
                          {(agent.duration_ms / 1000).toFixed(1)}s
                        </span>
                      )}
                      {agent.sources !== undefined && agent.status === 'completed' && (
                        <span className="text-[9px] font-mono text-cyan-400">
                          {agent.sources} src
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Phase pipeline indicators */}
        {phase !== 'idle' && (
          <div className="flex items-center gap-1 mt-3 mb-2">
            {['planning', 'researching', 'extracting', 'verifying', 'synthesizing'].map((p, i) => {
              const phases = ['planning', 'researching', 'extracting', 'verifying', 'synthesizing'];
              const currentIdx = phases.indexOf(phase === 'complete' ? 'synthesizing' : phase);
              const stepIdx = i;
              const isActive = stepIdx === currentIdx;
              const isComplete = stepIdx < currentIdx || phase === 'complete';

              return (
                <React.Fragment key={p}>
                  {i > 0 && (
                    <div className={`flex-1 h-px ${isComplete ? 'bg-indigo-500/40' : 'bg-medium-contrast/20'}`} />
                  )}
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isComplete ? 'bg-indigo-500' :
                      isActive ? 'bg-indigo-400 animate-pulse' :
                      'bg-medium-contrast/30'
                    }`}
                    title={phaseConfig[p]?.label || p}
                  />
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Progress bar */}
        {phase !== 'idle' && phase !== 'complete' && (
          <div className="h-1 rounded-full bg-medium-contrast/20 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500"
              initial={{ width: '0%' }}
              animate={{ width: getProgressWidth() }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};
