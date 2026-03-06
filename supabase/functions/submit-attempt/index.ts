// supabase/functions/submit-attempt/index.ts
// Step 1.6 - submitAttempt Edge Function
//
// Finalizes an attempt and schedules scoring.
// See spec §4 (submission), §5 (grace window, idempotency), §19 Step 1.6.

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { authenticateRequest, createServiceClient } from '../_shared/auth.ts';
import { parseBodyWithLimit } from '../_shared/bodyLimit.ts';
import { handleCors } from '../_shared/cors.ts';
import { errorResponse, successResponse } from '../_shared/responses.ts';

const GRACE_WINDOW_SEC = 5;
const ACTIVE_STATUSES = new Set(['started', 'in_progress']);
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

declare const EdgeRuntime: { waitUntil?: (promise: Promise<unknown>) => void } | undefined;

interface SubmitAttemptBody {
  attempt_id: string;
  submission_id: string;
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
      .select('*')
      .eq('id', parsed.attempt_id)
      .eq('user_id', auth.user.id)
      .single();

    if (attemptError || !attempt) {
      console.error('Attempt lookup error:', attemptError);
      return errorResponse('ATTEMPT_NOT_FOUND', 'Attempt not found', correlationId);
    }

    if (attempt.submission_id === parsed.submission_id) {
      return successResponse(
        {
          status: attempt.status,
          message:
            attempt.status === 'scored' ? 'Attempt already scored.' : 'Scoring in progress...',
        },
        correlationId,
      );
    }

    if (attempt.status === 'submitted' || attempt.status === 'scored') {
      return errorResponse(
        'ATTEMPT_ALREADY_SUBMITTED',
        'This exam has already been submitted.',
        correlationId,
      );
    }

    if (!ACTIVE_STATUSES.has(attempt.status)) {
      return errorResponse(
        'INVALID_TRANSITION',
        'Attempt is not in a submittable state',
        correlationId,
      );
    }

    if (!attempt.expires_at) {
      return errorResponse('SERVER_ERROR', 'Attempt expiry is missing', correlationId);
    }

    const graceDeadline = new Date(new Date(attempt.expires_at).getTime() + GRACE_WINDOW_SEC * 1000);
    if (new Date() > graceDeadline) {
      return errorResponse('ATTEMPT_EXPIRED', "Time's up! Your exam has ended.", correlationId);
    }

    const now = new Date().toISOString();
    const { data: updatedAttempt, error: updateError } = await db
      .from('attempts')
      .update({
        status: 'submitted',
        submitted_at: now,
        submission_id: parsed.submission_id,
      })
      .eq('id', attempt.id)
      .eq('user_id', auth.user.id)
      .in('status', Array.from(ACTIVE_STATUSES))
      .select('id, status')
      .single();

    if (updateError || !updatedAttempt) {
      console.error('Attempt submit error:', updateError);
      return errorResponse('SERVER_ERROR', 'Failed to submit attempt', correlationId);
    }

    const { error: jobError } = await db.from('scoring_jobs').insert(
      {
        attempt_id: attempt.id,
        idempotency_key: parsed.submission_id,
        job_type: 'objective',
      },
      {
        onConflict: 'idempotency_key',
        ignoreDuplicates: true,
      },
    );

    if (jobError) {
      console.error('Scoring job insert error:', jobError);
      return errorResponse('SERVER_ERROR', 'Failed to queue scoring job', correlationId);
    }

    dispatchScoringWorker(correlationId);

    return successResponse(
      {
        status: 'submitted',
        message: 'Scoring in progress...',
      },
      correlationId,
    );
  } catch (err) {
    console.error('Unhandled error in submit-attempt:', err);
    return errorResponse('SERVER_ERROR', 'An unexpected error occurred', correlationId);
  }
});

function validateBody(
  body: unknown,
): { data: SubmitAttemptBody; error: null } | { data: null; error: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { data: null, error: 'Request body must be a JSON object' };
  }

  const candidate = body as Record<string, unknown>;
  if (!isUuid(candidate.attempt_id)) {
    return { data: null, error: 'attempt_id must be a valid UUID' };
  }

  if (!isUuid(candidate.submission_id)) {
    return { data: null, error: 'submission_id must be a valid UUID' };
  }

  return {
    data: {
      attempt_id: candidate.attempt_id,
      submission_id: candidate.submission_id,
    },
    error: null,
  };
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

function dispatchScoringWorker(correlationId: string) {
  const baseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!baseUrl || !serviceRoleKey) {
    console.error('Scoring worker dispatch skipped: missing Supabase env vars');
    return;
  }

  const workerRequest = fetch(`${baseUrl}/functions/v1/scoring-worker`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      'x-correlation-id': correlationId,
    },
    body: JSON.stringify({}),
  }).catch((error) => {
    console.error('Scoring worker dispatch failed:', error);
  });

  EdgeRuntime?.waitUntil?.(workerRequest);
}
