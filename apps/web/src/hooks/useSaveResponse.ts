import { useMutation } from '@tanstack/react-query';
import type { ResponsePayloadSchema } from '@mindmosaic/shared';
import { toFunctionInvokeError } from '@/lib/functionErrors';
import { supabase } from '@/lib/supabase';

interface SaveResponseArgs {
  attempt_id: string;
  item_snapshot_id: string;
  response_payload: ResponsePayloadSchema;
  client_revision: number;
}

export function useSaveResponse() {
  return useMutation({
    mutationFn: async (body: SaveResponseArgs) => {
      const { data, error } = await supabase.functions.invoke('save-response', { body });

      if (error) {
        throw await toFunctionInvokeError(error);
      }

      return (data as { data: { saved: boolean; server_revision: number } }).data;
    },
  });
}
