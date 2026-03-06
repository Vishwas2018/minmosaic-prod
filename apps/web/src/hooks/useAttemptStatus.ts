import { useQuery } from '@tanstack/react-query';
import { STATUS_POLL_INTERVAL_MS } from '@mindmosaic/shared';
import { useAuthStore } from '@/stores/authStore';
import { useExamStore } from '@/stores/examStore';
import { supabasePublishableKey, supabaseUrl } from '@/lib/supabase';

interface AttemptStatusResponse {
  status: string;
  scored_at?: string | null;
  auto_submitted?: boolean;
}

interface UseAttemptStatusOptions {
  enabled?: boolean;
}

export function useAttemptStatus(attemptId: string | null, options?: UseAttemptStatusOptions) {
  const session = useAuthStore((state) => state.session);
  const attemptStatus = useExamStore((state) => state.attempt?.status);
  const setAttemptStatus = useExamStore((state) => state.setAttemptStatus);
  const enabled =
    options?.enabled ?? Boolean(attemptId && session?.access_token);

  return useQuery({
    queryKey: ['attempt-status', attemptId],
    enabled,
    refetchInterval: attemptStatus === 'submitted' ? STATUS_POLL_INTERVAL_MS : false,
    queryFn: async () => {
      if (!attemptId || !session?.access_token) {
        throw new Error('Attempt status polling is not available.');
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/get-attempt-status?attempt_id=${attemptId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: supabasePublishableKey,
          },
        },
      );

      const payload = (await response.json()) as
        | { data: AttemptStatusResponse }
        | { error: { message: string } };

      if (!response.ok || !('data' in payload)) {
        throw new Error('error' in payload ? payload.error.message : 'Failed to load attempt status');
      }

      setAttemptStatus(payload.data.status as 'submitted' | 'scored' | 'expired');

      return payload.data;
    },
  });
}
