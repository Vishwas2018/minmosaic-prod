import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { authenticateRequest, createServiceClient } from '../_shared/auth.ts';
import { parseBodyWithLimit } from '../_shared/bodyLimit.ts';
import { handleCors } from '../_shared/cors.ts';
import { errorResponse, successResponse } from '../_shared/responses.ts';

const ACTIVE_STATUSES = new Set(['started', 'in_progress']);
const EVENT_TYPES = new Set(['fullscreen_exit', 'focus_loss', 'context_menu']);
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface AntiCheatBody {
  attempt_id: string;
  event_type: 'fullscreen_exit' | 'focus_loss' | 'context_menu';
  client_event_seq: number;
  client_event_ts_ms: number;
}

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const correlationId = crypto.randomUUID();

  try {
    if (req.method !== 'POST') {
      return errorResponse('INVALID_REQUEST', 'Method not allowed', correlationId);
    }

    const { body, error: bodyError } = await parseBodyWithLimit(req);
    if (bodyError) {
      return errorResponse(bodyError, 'Invalid or oversized request body', correlationId);
    }

    const auth = await authenticateRequest(req);
    if (!auth) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', correlationId);
    }

    const { data: parsed, error: validationError } = validateBody(body);
    if (validationError) {
      return errorResponse('INVALID_REQUEST', validationError, correlationId);
    }

    const db = createServiceClient();

    const { data: attempt, error: attemptError } = await db
      .from('attempts')
      .select(
        'id, status, last_processed_event_seq, focus_loss_count, fullscreen_exit_count, context_menu_count',
      )
      .eq('id', parsed.attempt_id)
      .eq('user_id', auth.user.id)
      .single();

    if (attemptError || !attempt) {
      return errorResponse('ATTEMPT_NOT_FOUND', 'Attempt not found', correlationId);
    }

    if (!ACTIVE_STATUSES.has(attempt.status)) {
      return errorResponse(
        'INVALID_TRANSITION',
        'Anti-cheat logging is only available for active attempts.',
        correlationId,
      );
    }

    const lastProcessedSeq =
      typeof attempt.last_processed_event_seq === 'number' ? attempt.last_processed_event_seq : 0;

    if (parsed.client_event_seq <= lastProcessedSeq) {
      return successResponse({ logged: false, ignored: true, reason: 'stale_sequence' }, correlationId);
    }

    const { error: insertError } = await db.from('anticheat_events').insert({
      attempt_id: parsed.attempt_id,
      event_type: parsed.event_type,
      client_event_seq: parsed.client_event_seq,
      client_event_ts_ms: parsed.client_event_ts_ms,
    });

    if (insertError) {
      console.error('Anti-cheat insert error:', insertError);
      return errorResponse('SERVER_ERROR', 'Failed to log anti-cheat event', correlationId);
    }

    const counterUpdate =
      parsed.event_type === 'focus_loss'
        ? {
            focus_loss_count: Number(attempt.focus_loss_count ?? 0) + 1,
          }
        : parsed.event_type === 'fullscreen_exit'
          ? {
              fullscreen_exit_count: Number(attempt.fullscreen_exit_count ?? 0) + 1,
            }
          : {
              context_menu_count: Number(attempt.context_menu_count ?? 0) + 1,
            };

    const { error: updateError } = await db
      .from('attempts')
      .update({
        ...counterUpdate,
        last_processed_event_seq: parsed.client_event_seq,
      })
      .eq('id', parsed.attempt_id)
      .eq('user_id', auth.user.id)
      .eq('last_processed_event_seq', lastProcessedSeq);

    if (updateError) {
      console.error('Anti-cheat counter update error:', updateError);
      return errorResponse('SERVER_ERROR', 'Failed to update anti-cheat counters', correlationId);
    }

    return successResponse({ logged: true, ignored: false }, correlationId);
  } catch (error) {
    console.error('Unhandled error in log-anticheat-event:', error);
    return errorResponse('SERVER_ERROR', 'An unexpected error occurred', correlationId);
  }
});

function validateBody(
  body: unknown,
): { data: AntiCheatBody; error: null } | { data: null; error: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { data: null, error: 'Request body must be a JSON object' };
  }

  const candidate = body as Record<string, unknown>;

  if (typeof candidate.attempt_id !== 'string' || !UUID_REGEX.test(candidate.attempt_id)) {
    return { data: null, error: 'attempt_id must be a valid UUID' };
  }

  if (typeof candidate.event_type !== 'string' || !EVENT_TYPES.has(candidate.event_type)) {
    return { data: null, error: 'event_type is invalid' };
  }

  if (!Number.isInteger(candidate.client_event_seq) || Number(candidate.client_event_seq) <= 0) {
    return { data: null, error: 'client_event_seq must be a positive integer' };
  }

  if (
    !Number.isSafeInteger(candidate.client_event_ts_ms) ||
    Number(candidate.client_event_ts_ms) <= 0
  ) {
    return { data: null, error: 'client_event_ts_ms must be a positive integer timestamp' };
  }

  return {
    data: {
      attempt_id: candidate.attempt_id,
      event_type: candidate.event_type as AntiCheatBody['event_type'],
      client_event_seq: Number(candidate.client_event_seq),
      client_event_ts_ms: Number(candidate.client_event_ts_ms),
    },
    error: null,
  };
}
