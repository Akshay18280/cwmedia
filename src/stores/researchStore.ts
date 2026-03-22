import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ResearchReport } from '../components/ai/types';

/** Lightweight summary stored in localStorage via persist */
export interface SavedReportSummary {
  id: string;
  title: string;
  summary: string;
  confidence: number;
  agentsUsed: number;
  totalSources: number;
  createdAt: string;
}

/** Conversation metadata */
export interface ConversationMeta {
  id: string;
  title: string;
  createdAt: string;
  messageCount: number;
}

interface ResearchState {
  // Full reports (runtime only — not persisted)
  reports: ResearchReport[];
  activeReportIndex: number | null;

  // Persisted summaries (lightweight)
  savedReports: SavedReportSummary[];

  // Conversation metadata (persisted)
  conversations: ConversationMeta[];
  activeConversationId: string | null;

  // Actions
  addReport: (report: ResearchReport) => void;
  setActiveReport: (index: number | null) => void;
  clearReports: () => void;
  getActiveReport: () => ResearchReport | null;

  // Saved reports actions
  removeSavedReport: (id: string) => void;

  // Conversation actions
  addConversation: (conv: ConversationMeta) => void;
  setActiveConversation: (id: string | null) => void;
  updateConversation: (id: string, updates: Partial<ConversationMeta>) => void;
  removeConversation: (id: string) => void;
}

export const useResearchStore = create<ResearchState>()(
  persist(
    (set, get) => ({
      reports: [],
      activeReportIndex: null,
      savedReports: [],
      conversations: [],
      activeConversationId: null,

      addReport: (report) =>
        set((state) => {
          const summary: SavedReportSummary = {
            id: `report-${Date.now()}`,
            title: report.title,
            summary: report.summary,
            confidence: report.confidence_score?.overall ?? (report.verification?.overall_confidence ?? 0) * 100,
            agentsUsed: report.metrics.agents_used,
            totalSources: report.metrics.total_sources,
            createdAt: new Date().toISOString(),
          };
          return {
            reports: [report, ...state.reports].slice(0, 50),
            activeReportIndex: 0,
            savedReports: [summary, ...state.savedReports].slice(0, 100),
          };
        }),

      setActiveReport: (index) => set({ activeReportIndex: index }),

      clearReports: () => set({ reports: [], activeReportIndex: null, savedReports: [] }),

      getActiveReport: () => {
        const { reports, activeReportIndex } = get();
        if (activeReportIndex === null || activeReportIndex >= reports.length) return null;
        return reports[activeReportIndex];
      },

      removeSavedReport: (id) =>
        set((state) => ({
          savedReports: state.savedReports.filter(r => r.id !== id),
        })),

      addConversation: (conv) =>
        set((state) => ({
          conversations: [conv, ...state.conversations].slice(0, 50),
          activeConversationId: conv.id,
        })),

      setActiveConversation: (id) => set({ activeConversationId: id }),

      updateConversation: (id, updates) =>
        set((state) => ({
          conversations: state.conversations.map(c =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      removeConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.filter(c => c.id !== id),
          activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
        })),
    }),
    {
      name: 'cwmedia-research',
      // Only persist lightweight data — full reports stay in runtime memory
      partialize: (state) => ({
        savedReports: state.savedReports,
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
      }),
    },
  ),
);
