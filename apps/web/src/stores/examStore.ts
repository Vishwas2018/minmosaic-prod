import { create } from 'zustand';
import type { Attempt, SnapshotItem } from '@mindmosaic/shared';
import type { ResponsePayloadSchema } from '@mindmosaic/shared';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface ExamResponseEntry {
  payload: ResponsePayloadSchema;
  revision: number;
}

interface ExamState {
  attempt: Attempt | null;
  snapshot: SnapshotItem[];
  responses: Map<string, ExamResponseEntry>;
  currentIndex: number;
  timerRemainingSec: number;
  serverDriftMs: number;
  flaggedItems: Set<string>;
  saveStatus: SaveStatus;
  setAttempt: (attempt: Attempt, snapshot: SnapshotItem[], serverNow: string) => void;
  setResponse: (itemSnapshotId: string, payload: ResponsePayloadSchema) => void;
  setCurrentIndex: (index: number) => void;
  toggleFlag: (itemSnapshotId: string) => void;
  decrementTimer: () => void;
  setSaveStatus: (status: SaveStatus) => void;
  setAttemptStatus: (status: Attempt['status']) => void;
  reset: () => void;
}

const initialState = {
  attempt: null,
  snapshot: [] as SnapshotItem[],
  responses: new Map<string, ExamResponseEntry>(),
  currentIndex: 0,
  timerRemainingSec: 0,
  serverDriftMs: 0,
  flaggedItems: new Set<string>(),
  saveStatus: 'idle' as SaveStatus,
};

export const useExamStore = create<ExamState>((set) => ({
  ...initialState,
  setAttempt: (attempt, snapshot, serverNow) => {
    const driftMs = new Date(serverNow).getTime() - Date.now();
    const remainingSec = attempt.expires_at
      ? Math.max(
          0,
          Math.floor((new Date(attempt.expires_at).getTime() - (Date.now() + driftMs)) / 1000),
        )
      : 0;

    set({
      attempt,
      snapshot,
      responses: new Map<string, ExamResponseEntry>(),
      currentIndex: 0,
      timerRemainingSec: remainingSec,
      serverDriftMs: driftMs,
      flaggedItems: new Set<string>(),
      saveStatus: 'idle',
    });
  },
  setResponse: (itemSnapshotId, payload) =>
    set((state) => {
      const responses = new Map(state.responses);
      const previous = responses.get(itemSnapshotId);

      responses.set(itemSnapshotId, {
        payload,
        revision: (previous?.revision ?? 0) + 1,
      });

      return { responses };
    }),
  setCurrentIndex: (index) =>
    set((state) => ({
      currentIndex: Math.min(Math.max(index, 0), Math.max(state.snapshot.length - 1, 0)),
    })),
  toggleFlag: (itemSnapshotId) =>
    set((state) => {
      const flaggedItems = new Set(state.flaggedItems);

      if (flaggedItems.has(itemSnapshotId)) {
        flaggedItems.delete(itemSnapshotId);
      } else {
        flaggedItems.add(itemSnapshotId);
      }

      return { flaggedItems };
    }),
  decrementTimer: () =>
    set((state) => ({
      timerRemainingSec: Math.max(0, state.timerRemainingSec - 1),
    })),
  setSaveStatus: (saveStatus) => set({ saveStatus }),
  setAttemptStatus: (status) =>
    set((state) => ({
      attempt: state.attempt ? { ...state.attempt, status } : null,
    })),
  reset: () => ({ ...initialState, responses: new Map(), flaggedItems: new Set() }),
}));
