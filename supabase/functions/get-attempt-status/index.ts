// supabase/functions/get-attempt-status/index.ts
// Step 1.7 - getAttemptStatus Edge Function
//
// Returns the current attempt status for polling while scoring completes.
// See spec §19 Step 1.7.

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { authenticateRequest, createServiceClient } from '../_shared/auth.ts';
import { handleCors, corsHeaders } from '../_shared/cors.ts';
import { errorResponse, successResponse } from '../_shared/responses.ts';

const ACTIVE_STATUSES = new Set(['started', 'in_progress']);
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const correlationId = crypto.randomUUID();

  try {
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Method not allowed',
            retryable: false,
          },
          correlation_id: correlationId,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const auth = await authenticateRequest(req);
    if (!auth) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', correlationId);
    }

    const url = new URL(req.url);
    const attemptId = url.searchParams.get('attempt_id');
    if (!isUuid(attemptId)) {
      return errorResponse('INVALID_REQUEST', 'attempt_id query param must be a valid UUID', correlationId);
    }

    const db = createServiceClient();

    const { data: attempt, error: attemptError } = await db
      .from('attempts')
      .select('id, status, expires_at, scored_at, auto_submitted')
      .eq('id', attemptId)
      .eq('user_id', auth.user.id)
      .single();

    if (attemptError || !attempt) {
      console.error('Attempt status lookup error:', attemptError);
      return errorResponse('ATTEMPT_NOT_FOUND', 'Attempt not found', correlationId);
    }

    let responseStatus = attempt.status;
    let responseScoredAt = attempt.scored_at;

    if (
      ACTIVE_STATUSES.has(attempt.status) &&
      attempt.expires_at &&
      new Date() > new Date(attempt.expires_at)
    ) {
      // §4 F-03 primary expiry path: expire inline on read.
      const expiredAt = new Date().toISOString();
      const { error: expireError } = await db
        .from('attempts')
        .update({
          status: 'expired',
          expired_at: expiredAt,
        })
        .eq('id', attempt.id)
        .eq('user_id', auth.user.id)
        .in('status', Array.from(ACTIVE_STATUSES));

      if (expireError) {
        console.error('Inline expiry error:', expireError);
        return errorResponse('SERVER_ERROR', 'Failed to expire attempt', correlationId);
      }

      responseStatus = 'expired';
      responseScoredAt = null;
    }

    return successResponse(
      {
        status: responseStatus,
        scored_at: responseScoredAt,
        auto_submitted: Boolean(attempt.auto_submitted),
      },
      correlationId,
    );
  } catch (err) {
    console.error('Unhandled error in get-attempt-status:', err);
    return errorResponse('SERVER_ERROR', 'An unexpected error occurred', correlationId);
  }
});

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}
