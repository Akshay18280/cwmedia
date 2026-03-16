import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, FileText, ChevronDown, ExternalLink,
  ShieldCheck, ShieldAlert, Shield,
} from 'lucide-react';
import type { WebSearchResult, VerificationResult, VerifiedFact } from './types';

interface SourceExplorerProps {
  sources?: WebSearchResult[];
  verification?: VerificationResult;
}

const confidenceConfig = {
  high: { icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'High' },
  medium: { icon: Shield, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'Medium' },
  low: { icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'Low' },
};

export const SourceExplorer: React.FC<SourceExplorerProps> = ({ sources, verification }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'sources' | 'verification'>('sources');

  const hasSources = sources && sources.length > 0;
  const hasVerification = verification && verification.verified_facts.length > 0;

  if (!hasSources && !hasVerification) return null;

  return (
    <div className="rounded-2xl border border-medium-contrast/60 bg-medium-contrast/10 backdrop-blur-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-medium-contrast/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          <span className="text-body-sm font-semibold text-high-contrast">
            Sources & Verification
          </span>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
            {(sources?.length || 0)} sources
          </span>
          {hasVerification && (
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              {(verification.overall_confidence * 100).toFixed(0)}% confidence
            </span>
          )}
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
            <div className="border-t border-medium-contrast/20">
              {/* Tabs */}
              {hasVerification && (
                <div className="flex border-b border-medium-contrast/20">
                  <button
                    onClick={() => setActiveTab('sources')}
                    className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
                      activeTab === 'sources'
                        ? 'text-cyan-400 border-b-2 border-cyan-400'
                        : 'text-low-contrast hover:text-high-contrast'
                    }`}
                  >
                    Sources ({sources?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('verification')}
                    className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
                      activeTab === 'verification'
                        ? 'text-emerald-400 border-b-2 border-emerald-400'
                        : 'text-low-contrast hover:text-high-contrast'
                    }`}
                  >
                    Verification ({verification.verified_facts.length})
                  </button>
                </div>
              )}

              <div className="p-4 max-h-80 overflow-y-auto">
                {activeTab === 'sources' && hasSources && (
                  <SourcesList sources={sources} />
                )}
                {activeTab === 'verification' && hasVerification && (
                  <VerificationPanel verification={verification} />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SourcesList: React.FC<{ sources: WebSearchResult[] }> = ({ sources }) => (
  <div className="space-y-2">
    {sources.map((src, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
        className="rounded-xl border border-medium-contrast/40 bg-medium-contrast/10 p-3"
      >
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            {src.source === 'document' ? (
              <FileText className="w-3 h-3 text-cyan-400" />
            ) : (
              <Globe className="w-3 h-3 text-cyan-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-high-contrast truncate">{src.title}</span>
              {src.url && (
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 flex-shrink-0"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <p className="text-[11px] text-low-contrast mt-1 line-clamp-2">{src.content}</p>
            <div className="flex items-center gap-2 mt-1.5">
              {src.source && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-medium-contrast/20 text-low-contrast">
                  {src.source}
                </span>
              )}
              {src.confidence && (
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                  src.confidence === 'high' ? 'bg-emerald-500/10 text-emerald-400' :
                  src.confidence === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-red-500/10 text-red-400'
                }`}>
                  {src.confidence}
                </span>
              )}
              <span className="text-[9px] font-mono text-low-contrast">
                score: {src.score.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    ))}
  </div>
);

const VerificationPanel: React.FC<{ verification: VerificationResult }> = ({ verification }) => (
  <div className="space-y-3">
    {/* Overall confidence bar */}
    <div className="flex items-center gap-3 mb-4">
      <span className="text-xs text-low-contrast">Overall Confidence</span>
      <div className="flex-1 h-2 rounded-full bg-medium-contrast/20 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${
            verification.overall_confidence >= 0.8 ? 'bg-emerald-500' :
            verification.overall_confidence >= 0.5 ? 'bg-amber-500' : 'bg-red-500'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${verification.overall_confidence * 100}%` }}
          transition={{ duration: 0.6 }}
        />
      </div>
      <span className="text-xs font-mono font-semibold text-high-contrast">
        {(verification.overall_confidence * 100).toFixed(0)}%
      </span>
    </div>

    {/* Verified facts */}
    {verification.verified_facts.map((fact, i) => (
      <FactCard key={i} fact={fact} index={i} />
    ))}

    {/* Warnings */}
    {verification.warnings && verification.warnings.length > 0 && (
      <div className="mt-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
        <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Warnings</span>
        <ul className="mt-1 space-y-1">
          {verification.warnings.map((w, i) => (
            <li key={i} className="text-[11px] text-amber-300/80">{w}</li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

const FactCard: React.FC<{ fact: VerifiedFact; index: number }> = ({ fact, index }) => {
  const conf = confidenceConfig[fact.confidence_label] || confidenceConfig.medium;
  const Icon = conf.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-xl border ${conf.border} ${conf.bg} p-3`}
    >
      <div className="flex items-start gap-2">
        <Icon className={`w-4 h-4 ${conf.color} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-high-contrast">{fact.claim}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className={`text-[10px] font-semibold ${conf.color}`}>
              {(fact.confidence_score * 100).toFixed(0)}% — {conf.label}
            </span>
            <span className="text-[10px] text-low-contrast">
              {fact.agreeing_sources} agreeing source{fact.agreeing_sources !== 1 ? 's' : ''}
            </span>
            {fact.category && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-medium-contrast/20 text-low-contrast">
                {fact.category}
              </span>
            )}
          </div>
          {fact.contradictions && fact.contradictions.length > 0 && (
            <div className="mt-2 text-[10px] text-red-400">
              Contradictions: {fact.contradictions.join('; ')}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
