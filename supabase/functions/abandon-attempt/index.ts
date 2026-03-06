import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { authenticateRequest, createServiceClient } from '../_shared/auth.ts';
import { parseBodyWithLimit } from '../_shared/bodyLimit.ts';
import { handleCors } from '../_shared/cors.ts';
import { errorResponse, successResponse } from '../_shared/responses.ts';

const ACTIVE_STATUSES = new Set(['created', 'started', 'in_progress']);
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface AbandonAttemptBody {
  attempt_id: string;
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
      .select('id, status')
      .eq('id', parsed.attempt_id)
      .eq('user_id', auth.user.id)
      .single();

    if (attemptError || !attempt) {
      return errorResponse('ATTEMPT_NOT_FOUND', 'Attempt not found', correlationId);
    }

    if (!ACTIVE_STATUSES.has(attempt.status)) {
      return errorResponse(
        'INVALID_TRANSITION',
        'Only active attempts can be abandoned.',
        correlationId,
      );
    }

    const { error: updateError } = await db
      .from('attempts')
      .update({
        status: 'abandoned',
        abandoned_at: new Date().toISOString(),
      })
      .eq('id', attempt.id)
      .eq('user_id', auth.user.id)
      .in('status', Array.from(ACTIVE_STATUSES));

    if (updateError) {
      console.error('Attempt abandon error:', updateError);
      return errorResponse('SERVER_ERROR', 'Failed to abandon attempt', correlationId);
    }

    return successResponse({ abandoned: true, attempt_id: attempt.id }, correlationId);
  } catch (error) {
    console.error('Unhandled error in abandon-attempt:', error);
    return errorResponse('SERVER_ERROR', 'An unexpected error occurred', correlationId);
  }
});

function validateBody(
  body: unknown,
): { data: AbandonAttemptBody; error: null } | { data: null; error: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { data: null, error: 'Request body must be a JSON object' };
  }

  const candidate = body as Record<string, unknown>;
  if (typeof candidate.attempt_id !== 'string' || !UUID_REGEX.test(candidate.attempt_id)) {
    return { data: null, error: 'attempt_id must be a valid UUID' };
  }

  return {
    data: {
      attempt_id: candidate.attempt_id,
    },
    error: null,
  };
}
