import { useState, useRef, useCallback } from 'react';
import type { ResearchAgentStatus, ResearchReport, VerificationResult } from '@/components/ai/types';
import { streamResearch, isResearchQuery } from '@/services/ai/ResearchService';
import { useResearchStore } from '@/stores/researchStore';

export type ResearchPhase = 'idle' | 'planning' | 'researching' | 'extracting' | 'verifying' | 'synthesizing' | 'complete';

export function useResearch(apiBase: string) {
  const [researchMode, setResearchMode] = useState(false);
  const [researchPhase, setResearchPhase] = useState<ResearchPhase>('idle');
  const [researchAgents, setResearchAgents] = useState<ResearchAgentStatus[]>([]);
  const [researchReport, setResearchReport] = useState<ResearchReport | null>(null);
  const [planMessage, setPlanMessage] = useState('');
  const [synthesisMessage, setSynthesisMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [verificationConfidence, setVerificationConfidence] = useState<number | undefined>();

  const abortRef = useRef<AbortController | null>(null);
  const addReport = useResearchStore(state => state.addReport);

  const resetResearch = useCallback(() => {
    setResearchReport(null);
    setResearchPhase('idle');
    setResearchAgents([]);
    setRetryCount(0);
    setVerificationConfidence(undefined);
    setPlanMessage('');
    setSynthesisMessage('');
  }, []);

  const handleResearch = useCallback(async (
    question: string,
    onReportMessage: (msg: { id: string; role: 'assistant'; content: string; timestamp: Date }) => void,
  ) => {
    setResearchPhase('planning');
    setResearchAgents([]);
    setResearchReport(null);
    setPlanMessage('');
    setSynthesisMessage('');
    setRetryCount(0);
    setVerificationConfidence(undefined);

    try {
      await new Promise<void>((resolve, reject) => {
        const ctrl = streamResearch(apiBase, question, {
          onPlanning: (msg) => { setResearchPhase('planning'); setPlanMessage(msg); },
          onPlanReady: () => {},
          onAgentStart: (agent) => {
            setResearchPhase('researching');
            setResearchAgents(prev => {
              const existing = prev.find(a => a.id === agent.id);
              return existing ? prev.map(a => a.id === agent.id ? agent : a) : [...prev, agent];
            });
          },
          onAgentProgress: (agent) => {
            setResearchAgents(prev => prev.map(a => a.id === agent.id ? { ...a, message: agent.message } : a));
          },
          onAgentComplete: (agent) => {
            setResearchAgents(prev => prev.map(a => a.id === agent.id ? agent : a));
          },
          onExtracting: () => { setResearchPhase('extracting'); },
          onVerifying: () => { setResearchPhase('verifying'); },
          onVerified: (result: VerificationResult) => { setVerificationConfidence(result.overall_confidence); },
          onRetry: (_msg, count) => { setRetryCount(count); setResearchPhase('researching'); },
          onSynthesizing: (msg) => { setResearchPhase('synthesizing'); setSynthesisMessage(msg); },
          onReport: (report) => {
            setResearchReport(report);
            setResearchPhase('complete');
            addReport(report);
            onReportMessage({
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: `**${report.title}**\n\n${report.summary}`,
              timestamp: new Date(),
            });
          },
          onDone: () => resolve(),
          onError: (err) => reject(new Error(err)),
        });
        abortRef.current = ctrl;
      });
    } catch (err) {
      onReportMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Research failed: ${err instanceof Error ? err.message : 'Unknown error'}. Try a simpler query or switch to chat mode.`,
        timestamp: new Date(),
      });
      setResearchPhase('idle');
    }
  }, [apiBase, addReport]);

  const shouldAutoResearch = useCallback((question: string, backendConnected: boolean) => {
    return researchMode || (backendConnected && isResearchQuery(question));
  }, [researchMode]);

  return {
    // State
    researchMode,
    researchPhase,
    researchAgents,
    researchReport,
    planMessage,
    synthesisMessage,
    retryCount,
    verificationConfidence,
    // Ref
    researchAbortRef: abortRef,
    // Actions
    setResearchMode,
    handleResearch,
    resetResearch,
    shouldAutoResearch,
    setResearchReport,
  };
}
