import { useMutation } from '@tanstack/react-query';
import { toFunctionInvokeError } from '@/lib/functionErrors';
import { useExamStore } from '@/stores/examStore';
import { supabase } from '@/lib/supabase';

interface SubmitAttemptArgs {
  attempt_id: string;
  submission_id: string;
}

export function useSubmitAttempt() {
  const setAttemptStatus = useExamStore((state) => state.setAttemptStatus);

  return useMutation({
    mutationFn: async (body: SubmitAttemptArgs) => {
      const { data, error } = await supabase.functions.invoke('submit-attempt', { body });

      if (error) {
        throw await toFunctionInvokeError(error);
      }

      return (data as { data: { status: 'submitted' | 'scored'; message?: string } }).data;
    },
    onSuccess: (data) => {
      setAttemptStatus(data.status);
    },
  });
}
