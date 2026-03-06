// supabase/functions/save-response/index.ts
// Step 1.5 - saveResponse Edge Function
//
// Autosaves a single response with atomic stale-write protection.
// See spec §4 (attempt lifecycle), §5 (autosave), §19 Step 1.5.

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { authenticateRequest, createServiceClient } from '../_shared/auth.ts';
import { parseBodyWithLimit } from '../_shared/bodyLimit.ts';
import { handleCors } from '../_shared/cors.ts';
import { errorResponse, successResponse } from '../_shared/responses.ts';

const MAX_SHORT_TEXT_CHARS = 1000;
const MAX_WRITING_CHARS = 3000;
const MAX_ARRAY_ITEMS = 50;
const MAX_OPTION_IDS = 20;

const ACTIVE_STATUSES = new Set(['started', 'in_progress']);
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface SaveResponseBody {
  attempt_id: string;
  item_snapshot_id: string;
  response_payload: ResponsePayload;
  client_revision: number;
}

type ResponsePayload =
  | { type: 'mcq'; selected_option_id: string }
  | { type: 'multi_select'; selected_option_ids: string[] }
  | { type: 'short_text'; text: string }
  | { type: 'numeric'; value: string }
  | { type: 'drag_drop'; placements: Array<{ item_id: string; slot_id: string }> }
  | { type: 'inline_dropdown'; selections: Array<{ gap_id: string; option_id: string }> }
  | { type: 'order'; ordered_item_ids: string[] }
  | { type: 'writing'; text: string; word_count: number };

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
      .select('*')
      .eq('id', parsed.attempt_id)
      .eq('user_id', auth.user.id)
      .single();

    if (attemptError || !attempt) {
      console.error('Attempt lookup error:', attemptError);
      return errorResponse('ATTEMPT_NOT_FOUND', 'Attempt not found', correlationId);
    }

    if (
      ACTIVE_STATUSES.has(attempt.status) &&
      attempt.expires_at &&
      new Date() > new Date(attempt.expires_at)
    ) {
      // §4 F-03 primary expiry path: expire inline on read before accepting more writes.
      const { error: expireError } = await db
        .from('attempts')
        .update({
          status: 'expired',
          expired_at: new Date().toISOString(),
        })
        .eq('id', attempt.id)
        .eq('user_id', auth.user.id)
        .in('status', Array.from(ACTIVE_STATUSES));

      if (expireError) {
        console.error('Inline expiry error:', expireError);
        return errorResponse('SERVER_ERROR', 'Failed to expire attempt', correlationId);
      }

      return errorResponse('ATTEMPT_EXPIRED', "Time's up! Your exam has ended.", correlationId);
    }

    if (!ACTIVE_STATUSES.has(attempt.status)) {
      return errorResponse(
        'INVALID_TRANSITION',
        'Attempt is not in a saveable state',
        correlationId,
      );
    }

    const { data: snapshotRow, error: snapshotError } = await db
      .from('attempt_snapshots')
      .select('snapshot_data')
      .eq('attempt_id', attempt.id)
      .single();

    if (snapshotError || !snapshotRow) {
      console.error('Snapshot lookup error:', snapshotError);
      return errorResponse('SERVER_ERROR', 'Failed to load attempt snapshot', correlationId);
    }

    const snapshotData = Array.isArray(snapshotRow.snapshot_data) ? snapshotRow.snapshot_data : [];
    const itemExists = snapshotData.some(
      (item) =>
        item &&
        typeof item === 'object' &&
        'item_snapshot_id' in item &&
        item.item_snapshot_id === parsed.item_snapshot_id,
    );

    if (!itemExists) {
      return errorResponse('INVALID_REQUEST', 'Item is not part of this attempt snapshot', correlationId);
    }

    const { data: rpcData, error: rpcError } = await db.rpc('upsert_response', {
      p_attempt_id: parsed.attempt_id,
      p_item_snapshot_id: parsed.item_snapshot_id,
      p_response_payload: parsed.response_payload,
      p_client_revision: parsed.client_revision,
    });

    if (rpcError) {
      console.error('upsert_response error:', rpcError);
      return errorResponse('SERVER_ERROR', 'Failed to save response', correlationId);
    }

    const rowsAffected = Array.isArray(rpcData) && rpcData.length > 0 ? rpcData[0].rows_affected : 0;
    if (rowsAffected === 0) {
      return errorResponse('STALE_REVISION', 'Stale response revision', correlationId);
    }

    if (attempt.status === 'started') {
      const { error: statusError } = await db
        .from('attempts')
        .update({ status: 'in_progress' })
        .eq('id', attempt.id)
        .eq('user_id', auth.user.id)
        .eq('status', 'started');

      if (statusError) {
        console.error('Attempt status promotion error:', statusError);
        return errorResponse('SERVER_ERROR', 'Failed to update attempt status', correlationId);
      }
    }

    return successResponse(
      {
        saved: true,
        server_revision: parsed.client_revision,
      },
      correlationId,
    );
  } catch (err) {
    console.error('Unhandled error in save-response:', err);
    return errorResponse('SERVER_ERROR', 'An unexpected error occurred', correlationId);
  }
});

function validateBody(
  body: unknown,
): { data: SaveResponseBody; error: null } | { data: null; error: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { data: null, error: 'Request body must be a JSON object' };
  }

  const candidate = body as Record<string, unknown>;
  const { attempt_id, item_snapshot_id, response_payload, client_revision } = candidate;

  if (!isUuid(attempt_id)) {
    return { data: null, error: 'attempt_id must be a valid UUID' };
  }

  if (!isUuid(item_snapshot_id)) {
    return { data: null, error: 'item_snapshot_id must be a valid UUID' };
  }

  if (!Number.isInteger(client_revision) || (client_revision as number) <= 0) {
    return { data: null, error: 'client_revision must be a positive integer' };
  }

  const payloadResult = validateResponsePayload(response_payload);
  if (!payloadResult.data) {
    return { data: null, error: payloadResult.error };
  }

  return {
    data: {
      attempt_id,
      item_snapshot_id,
      response_payload: payloadResult.data,
      client_revision: client_revision as number,
    },
    error: null,
  };
}

function validateResponsePayload(
  payload: unknown,
): { data: ResponsePayload; error: null } | { data: null; error: string } {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { data: null, error: 'response_payload must be an object' };
  }

  const candidate = payload as Record<string, unknown>;
  if (typeof candidate.type !== 'string') {
    return { data: null, error: 'response_payload.type is required' };
  }

  switch (candidate.type) {
    case 'mcq':
      if (!isBoundedString(candidate.selected_option_id, 1, 100)) {
        return { data: null, error: 'mcq selected_option_id must be a non-empty string' };
      }
      return {
        data: { type: 'mcq', selected_option_id: candidate.selected_option_id },
        error: null,
      };

    case 'multi_select':
      if (!isStringArray(candidate.selected_option_ids, 1, MAX_OPTION_IDS, 100)) {
        return {
          data: null,
          error: `multi_select selected_option_ids must contain 1-${MAX_OPTION_IDS} strings`,
        };
      }
      return {
        data: { type: 'multi_select', selected_option_ids: candidate.selected_option_ids },
        error: null,
      };

    case 'short_text':
      if (!isBoundedString(candidate.text, 0, MAX_SHORT_TEXT_CHARS)) {
        return {
          data: null,
          error: `short_text text must be at most ${MAX_SHORT_TEXT_CHARS} characters`,
        };
      }
      return { data: { type: 'short_text', text: candidate.text }, error: null };

    case 'numeric':
      if (!isBoundedString(candidate.value, 0, 100)) {
        return { data: null, error: 'numeric value must be a string up to 100 characters' };
      }
      return { data: { type: 'numeric', value: candidate.value }, error: null };

    case 'drag_drop':
      if (!Array.isArray(candidate.placements) || candidate.placements.length > MAX_ARRAY_ITEMS) {
        return { data: null, error: 'drag_drop placements exceed allowed size' };
      }
      if (
        !candidate.placements.every(
          (entry) =>
            entry &&
            typeof entry === 'object' &&
            isBoundedString((entry as Record<string, unknown>).item_id, 1, 255) &&
            isBoundedString((entry as Record<string, unknown>).slot_id, 1, 255),
        )
      ) {
        return { data: null, error: 'drag_drop placements must contain item_id and slot_id' };
      }
      return {
        data: {
          type: 'drag_drop',
          placements: candidate.placements as Array<{ item_id: string; slot_id: string }>,
        },
        error: null,
      };

    case 'inline_dropdown':
      if (!Array.isArray(candidate.selections) || candidate.selections.length > MAX_ARRAY_ITEMS) {
        return { data: null, error: 'inline_dropdown selections exceed allowed size' };
      }
      if (
        !candidate.selections.every(
          (entry) =>
            entry &&
            typeof entry === 'object' &&
            isBoundedString((entry as Record<string, unknown>).gap_id, 1, 255) &&
            isBoundedString((entry as Record<string, unknown>).option_id, 1, 255),
        )
      ) {
        return {
          data: null,
          error: 'inline_dropdown selections must contain gap_id and option_id',
        };
      }
      return {
        data: {
          type: 'inline_dropdown',
          selections: candidate.selections as Array<{ gap_id: string; option_id: string }>,
        },
        error: null,
      };

    case 'order':
      if (!Array.isArray(candidate.ordered_item_ids) || candidate.ordered_item_ids.length > MAX_ARRAY_ITEMS) {
        return { data: null, error: 'order ordered_item_ids exceed allowed size' };
      }
      if (!candidate.ordered_item_ids.every((id) => isUuid(id))) {
        return { data: null, error: 'order ordered_item_ids must contain UUIDs' };
      }
      return {
        data: { type: 'order', ordered_item_ids: candidate.ordered_item_ids as string[] },
        error: null,
      };

    case 'writing':
      if (!isBoundedString(candidate.text, 0, MAX_WRITING_CHARS)) {
        return {
          data: null,
          error: `writing text must be at most ${MAX_WRITING_CHARS} characters`,
        };
      }
      if (!Number.isInteger(candidate.word_count) || (candidate.word_count as number) < 0) {
        return { data: null, error: 'writing word_count must be a non-negative integer' };
      }
      return {
        data: {
          type: 'writing',
          text: candidate.text,
          word_count: candidate.word_count as number,
        },
        error: null,
      };

    default:
      return { data: null, error: `Unsupported response_payload.type: ${candidate.type}` };
  }
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

function isBoundedString(value: unknown, min: number, max: number): value is string {
  return typeof value === 'string' && value.length >= min && value.length <= max;
}

function isStringArray(
  value: unknown,
  minItems: number,
  maxItems: number,
  maxItemLength: number,
): value is string[] {
  return (
    Array.isArray(value) &&
    value.length >= minItems &&
    value.length <= maxItems &&
    value.every((item) => isBoundedString(item, 1, maxItemLength))
  );
}
