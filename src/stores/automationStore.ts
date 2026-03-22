import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Lightweight job summary persisted to localStorage */
export interface SavedAutomationJob {
  id: string;
  topic: string;
  state: string;
  confidence: number;
  contentScore: number;
  sourceCount: number;
  agentCount: number;
  durationMs: number;
  publishDecision: string;
  rejectReason?: string;
  createdAt: string;
}

interface AutomationState {
  savedJobs: SavedAutomationJob[];

  // Actions
  addJob: (job: SavedAutomationJob) => void;
  removeJob: (id: string) => void;
  clearHistory: () => void;
}

export const useAutomationStore = create<AutomationState>()(
  persist(
    (set) => ({
      savedJobs: [],

      addJob: (job) =>
        set((state) => ({
          savedJobs: [job, ...state.savedJobs].slice(0, 100),
        })),

      removeJob: (id) =>
        set((state) => ({
          savedJobs: state.savedJobs.filter((j) => j.id !== id),
        })),

      clearHistory: () => set({ savedJobs: [] }),
    }),
    {
      name: 'cwmedia-automation',
      partialize: (state) => ({ savedJobs: state.savedJobs }),
    },
  ),
);
