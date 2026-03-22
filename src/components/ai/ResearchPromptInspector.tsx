import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code, ChevronDown, Copy, Check } from 'lucide-react';
import type { PromptRecord } from './types';

interface ResearchPromptInspectorProps {
  prompts?: PromptRecord[];
}

export const ResearchPromptInspector: React.FC<ResearchPromptInspectorProps> = ({ prompts }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedPrompt, setExpandedPrompt] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!prompts || prompts.length === 0) return null;

  const copyPrompt = (index: number) => {
    const p = prompts[index];
    const text = `=== SYSTEM ===\n${p.system}\n\n=== USER ===\n${p.user}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const phaseLabels: Record<string, string> = {
    planning: 'Research Planning',
    'agent:overview': 'Overview Agent',
    'agent:market': 'Market Agent',
    'agent:technical': 'Technical Agent',
    'agent:news': 'News Agent',
    'agent:competitor': 'Competitor Agent',
    'agent:risks': 'Risk Agent',
    extraction: 'Fact Extraction',
    verification: 'Verification',
    synthesis: 'Report Synthesis',
  };

  return (
    <div className="rounded-2xl border border-medium-contrast/60 bg-medium-contrast/10 backdrop-blur-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-medium-contrast/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-violet-400" />
          <span className="text-body-sm font-semibold text-high-contrast">Prompt Inspector</span>
          <span className="text-[10px] font-mono text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">
            {prompts.length} prompts
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-low-contrast transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-medium-contrast/20 p-4 space-y-2 max-h-96 overflow-y-auto">
              {prompts.map((prompt, i) => (
                <div key={i} className="rounded-xl border border-medium-contrast/40 bg-medium-contrast/10 overflow-hidden">
                  <button
                    onClick={() => setExpandedPrompt(expandedPrompt === i ? null : i)}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-medium-contrast/10 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-violet-500/10 text-violet-400 text-[10px] font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="text-xs font-medium text-high-contrast">
                        {phaseLabels[prompt.phase] || prompt.phase}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); copyPrompt(i); }}
                        className="p-1 rounded hover:bg-medium-contrast/20 transition-colors"
                        title="Copy prompt"
                      >
                        {copiedIndex === i ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-low-contrast" />
                        )}
                      </button>
                      <ChevronDown className={`w-3 h-3 text-low-contrast transition-transform ${expandedPrompt === i ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedPrompt === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-medium-contrast/20 px-3 py-3 space-y-3">
                          <div>
                            <span className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider">System Prompt</span>
                            <pre className="mt-1 text-[11px] text-low-contrast bg-low-contrast/30 rounded-lg p-3 overflow-x-auto max-h-40 overflow-y-auto whitespace-pre-wrap font-mono leading-relaxed">
                              {prompt.system}
                            </pre>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">User Prompt</span>
                            <pre className="mt-1 text-[11px] text-low-contrast bg-low-contrast/30 rounded-lg p-3 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap font-mono leading-relaxed">
                              {prompt.user}
                            </pre>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
