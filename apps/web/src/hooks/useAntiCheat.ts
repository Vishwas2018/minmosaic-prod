import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useExamStore } from '@/stores/examStore';

type AntiCheatEventType = 'fullscreen_exit' | 'focus_loss' | 'context_menu';

export function useAntiCheat() {
  const attempt = useExamStore((state) => state.attempt);
  const seqRef = useRef(0);

  useEffect(() => {
    if (!attempt || (attempt.status !== 'started' && attempt.status !== 'in_progress')) {
      return;
    }

    const sendEvent = (eventType: AntiCheatEventType) => {
      seqRef.current += 1;

      void supabase.functions
        .invoke('log-anticheat-event', {
          body: {
            attempt_id: attempt.id,
            event_type: eventType,
            client_event_seq: seqRef.current,
            client_event_ts_ms: Date.now(),
          },
        })
        .catch(() => {
          // Passive logging only in Phase 1. Do not interrupt the exam flow.
        });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendEvent('focus_loss');
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        sendEvent('fullscreen_exit');
      }
    };

    const handleContextMenu = () => {
      sendEvent('context_menu');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [attempt]);
}
