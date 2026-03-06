import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { Attempt, Domain, SnapshotItem, YearLevel } from '@mindmosaic/shared';
import { toFunctionInvokeError } from '@/lib/functionErrors';
import { useAuthStore } from '@/stores/authStore';
import { useExamStore } from '@/stores/examStore';
import { supabase } from '@/lib/supabase';

interface StartAttemptArgs {
  domain: Domain;
  year_level: YearLevel;
}

interface StartAttemptPayload {
  attempt_id: string;
  snapshot: SnapshotItem[];
  server_now: string;
  expires_at: string;
  time_limit_sec: number;
}

export function useStartAttempt() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setAttempt = useExamStore((state) => state.setAttempt);

  return useMutation({
    mutationFn: async (body: StartAttemptArgs) => {
      const { data, error } = await supabase.functions.invoke('start-attempt', { body });

      if (error) {
        throw await toFunctionInvokeError(error);
      }

      return (data as { data: StartAttemptPayload }).data;
    },
    onSuccess: (data, variables) => {
      const attempt = normalizeAttempt(data, variables.domain, variables.year_level, user?.id ?? null);
      setAttempt(attempt, data.snapshot, data.server_now);
      navigate(`/exam/${data.attempt_id}`);
    },
  });
}

function normalizeAttempt(
  payload: StartAttemptPayload,
  domain: Domain,
  yearLevel: YearLevel,
  userId: string | null,
): Attempt {
  const now = payload.server_now;

  return {
    id: payload.attempt_id,
    user_id: userId,
    domain,
    year_level: yearLevel,
    status: 'started',
    time_limit_sec: payload.time_limit_sec,
    started_at: now,
    expires_at: payload.expires_at,
    submitted_at: null,
    scored_at: null,
    auto_submitted: false,
    auto_submit_reason: null,
    submission_id: null,
    snapshot_hash: null,
    engine_version: null,
    created_at: now,
    updated_at: now,
  };
}
