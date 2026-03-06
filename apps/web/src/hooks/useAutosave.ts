import { useEffect, useRef } from 'react';
import { AUTOSAVE_INTERVAL_MS } from '@mindmosaic/shared';
import { useNavigate } from 'react-router-dom';
import { FunctionInvokeError } from '@/lib/functionErrors';
import {
  deletePendingSave,
  enqueuePendingSave,
  getPendingSavesForAttempt,
} from '@/lib/offlineDb';
import { useSaveResponse } from '@/hooks/useSaveResponse';
import { useExamStore, type ExamResponseEntry } from '@/stores/examStore';

export function useAutosave() {
  const navigate = useNavigate();
  const saveResponse = useSaveResponse();
  const attempt = useExamStore((state) => state.attempt);
  const setSaveStatus = useExamStore((state) => state.setSaveStatus);
  const pendingRef = useRef<Map<string, ExamResponseEntry>>(new Map());
  const flushingRef = useRef(false);
  const idleTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const unsubscribe = useExamStore.subscribe((state, previousState) => {
      if (!state.attempt || state.attempt.status === 'submitted') {
        return;
      }

      for (const [itemSnapshotId, response] of state.responses) {
        const previous = previousState.responses.get(itemSnapshotId);
        if (!previous || previous.revision !== response.revision) {
          pendingRef.current.set(itemSnapshotId, response);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!attempt) {
      pendingRef.current.clear();
      return;
    }

    const flush = async () => {
      if (!attempt || attempt.status === 'submitted' || flushingRef.current) {
        return;
      }

      const pendingEntries = Array.from(pendingRef.current.entries());
      const offlineEntries = await getPendingSavesForAttempt(attempt.id);

      if (pendingEntries.length === 0 && offlineEntries.length === 0) {
        return;
      }

      flushingRef.current = true;
      setSaveStatus('saving');

      try {
        for (const record of offlineEntries) {
          await saveResponse.mutateAsync({
            attempt_id: record.attempt_id,
            item_snapshot_id: record.item_snapshot_id,
            response_payload: record.response_payload,
            client_revision: record.client_revision,
          });
          if (typeof record.id === 'number') {
            await deletePendingSave(record.id);
          }
        }

        for (const [itemSnapshotId, entry] of pendingEntries) {
          try {
            await saveResponse.mutateAsync({
              attempt_id: attempt.id,
              item_snapshot_id: itemSnapshotId,
              response_payload: entry.payload,
              client_revision: entry.revision,
            });
            pendingRef.current.delete(itemSnapshotId);
          } catch (error) {
            if (error instanceof FunctionInvokeError && error.code === 'STALE_REVISION') {
              pendingRef.current.delete(itemSnapshotId);
              continue;
            }

            if (error instanceof FunctionInvokeError && error.code === 'ATTEMPT_EXPIRED') {
              pendingRef.current.delete(itemSnapshotId);
              setSaveStatus('error');
              navigate('/', { replace: true });
              return;
            }

            if (isNetworkError(error)) {
              await enqueuePendingSave({
                attempt_id: attempt.id,
                item_snapshot_id: itemSnapshotId,
                response_payload: entry.payload,
                client_revision: entry.revision,
                queued_at: new Date().toISOString(),
              });
              pendingRef.current.delete(itemSnapshotId);
              setSaveStatus('error');
              continue;
            }

            throw error;
          }
        }

        setSaveStatus('saved');
        if (idleTimeoutRef.current) {
          window.clearTimeout(idleTimeoutRef.current);
        }
        idleTimeoutRef.current = window.setTimeout(() => {
          useExamStore.getState().setSaveStatus('idle');
        }, 2000);
      } catch {
        setSaveStatus('error');
      } finally {
        flushingRef.current = false;
      }
    };

    const intervalId = window.setInterval(() => {
      void flush();
    }, AUTOSAVE_INTERVAL_MS);

    const handleOnline = () => {
      void flush();
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('online', handleOnline);
      if (idleTimeoutRef.current) {
        window.clearTimeout(idleTimeoutRef.current);
      }
    };
  }, [attempt, navigate, saveResponse, setSaveStatus]);
}

function isNetworkError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.toLowerCase().includes('network') ||
    error.message.toLowerCase().includes('fetch') ||
    error.name === 'TypeError'
  );
}
