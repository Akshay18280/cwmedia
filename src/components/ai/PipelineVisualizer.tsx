import React from 'react';
import { motion } from 'framer-motion';
import { Hash, Search, Database, FileCode, Sparkles, Check, Loader2 } from 'lucide-react';
import type { PipelineStep } from './types';

const STEPS = [
  { key: 'embedding', label: 'Embed', sublabel: '512-dim', icon: Hash },
  { key: 'search', label: 'Search', sublabel: 'cosine', icon: Search },
  { key: 'retrieve', label: 'Retrieve', sublabel: 'top-5', icon: Database },
  { key: 'prompt', label: 'Prompt', sublabel: 'build', icon: FileCode },
  { key: 'generate', label: 'Generate', sublabel: 'Gemini', icon: Sparkles },
];

interface PipelineVisualizerProps {
  steps: PipelineStep[];
  isActive: boolean;
}

export const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({ steps, isActive }) => {
  if (!isActive && steps.every(s => s.status === 'idle')) return null;

  const getStep = (key: string) => steps.find(s => s.step === key);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mx-4 mb-3"
      role="status"
      aria-label="RAG pipeline progress"
    >
      <div className="rounded-xl border border-medium-contrast/60 bg-gradient-to-r from-medium-contrast/10 via-medium-contrast/20 to-medium-contrast/10 backdrop-blur-sm px-3 py-3 sm:px-5 sm:py-4">
        <div className="flex items-center gap-0.5 sm:gap-0">
          {STEPS.map((step, i) => {
            const data = getStep(step.key);
            const state = data?.status || 'idle';
            const duration = data?.duration_ms;
            const Icon = step.icon;

            const prevCompleted = i === 0 || (getStep(STEPS[i - 1].key)?.status === 'completed');

            return (
              <React.Fragment key={step.key}>
                {i > 0 && (
                  <div className="flex-1 min-w-2 sm:min-w-4 px-0.5">
                    <div className="relative h-0.5 rounded-full bg-medium-contrast/30 overflow-hidden">
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                        initial={{ width: '0%' }}
                        animate={{
                          width: state === 'completed' || state === 'started' || prevCompleted ? '100%' : '0%',
                        }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                )}
                <div className="flex flex-col items-center gap-0.5 sm:gap-1 flex-shrink-0">
                  <motion.div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-300 relative ${
                      state === 'completed'
                        ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30'
                        : state === 'started'
                          ? 'bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/40'
                          : 'bg-medium-contrast/20 text-low-contrast/60'
                    }`}
                    animate={state === 'started' ? {
                      boxShadow: ['0 0 0px rgba(6,182,212,0)', '0 0 20px rgba(6,182,212,0.3)', '0 0 0px rgba(6,182,212,0)'],
                    } : {}}
                    transition={state === 'started' ? { duration: 1.5, repeat: Infinity } : {}}
                  >
                    {state === 'completed' ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      >
                        <Check className="w-4 h-4" />
                      </motion.div>
                    ) : state === 'started' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </motion.div>
                  <span className="text-[9px] sm:text-[10px] text-low-contrast font-medium hidden sm:block">
                    {step.label}
                  </span>
                  {state === 'completed' && duration !== undefined ? (
                    <motion.span
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[9px] text-emerald-400 font-mono font-medium"
                    >
                      {duration}ms
                    </motion.span>
                  ) : (
                    <span className="text-[9px] text-low-contrast/40 font-mono hidden sm:block">
                      {step.sublabel}
                    </span>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
