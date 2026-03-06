import { useMutation } from '@tanstack/react-query';
import { toFunctionInvokeError } from '@/lib/functionErrors';
import { supabase } from '@/lib/supabase';

interface AbandonAttemptArgs {
  attempt_id: string;
}

export function useAbandonAttempt() {
  return useMutation({
    mutationFn: async (body: AbandonAttemptArgs) => {
      const { data, error } = await supabase.functions.invoke('abandon-attempt', { body });

      if (error) {
        throw await toFunctionInvokeError(error);
      }

      return (data as { data: { abandoned: true; attempt_id: string } }).data;
    },
  });
}
