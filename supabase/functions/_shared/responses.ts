// supabase/functions/_shared/responses.ts
// Standardized API responses matching §3 error contract + ApiResponse type

import { corsHeaders } from './cors.ts';

const ErrorCodes: Record<string, { http: number; retryable: boolean }> = {
  INVALID_REQUEST: { http: 400, retryable: false },
  UNAUTHORIZED: { http: 401, retryable: false },
  FORBIDDEN: { http: 403, retryable: false },
  ATTEMPT_NOT_FOUND: { http: 404, retryable: false },
  ATTEMPT_EXPIRED: { http: 409, retryable: false },
  ATTEMPT_ALREADY_SUBMITTED: { http: 409, retryable: false },
  INVALID_TRANSITION: { http: 409, retryable: false },
  STALE_REVISION: { http: 409, retryable: true },
  CONCURRENT_ATTEMPT_LIMIT: { http: 409, retryable: false },
  WORD_COUNT_EXCEEDED: { http: 422, retryable: false },
  WORD_COUNT_BELOW_MIN: { http: 422, retryable: false },
  PAYLOAD_TOO_LARGE: { http: 413, retryable: false },
  RATE_LIMITED: { http: 429, retryable: true },
  GUEST_LIMIT_REACHED: { http: 403, retryable: false },
  SERVER_ERROR: { http: 500, retryable: true },
  SERVICE_UNAVAILABLE: { http: 503, retryable: true },
};

export function successResponse<T>(data: T, correlationId: string): Response {
  return new Response(JSON.stringify({ data, correlation_id: correlationId }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function errorResponse(
  code: string,
  message: string,
  correlationId: string,
  details?: Record<string, unknown>,
): Response {
  const meta = ErrorCodes[code] ?? { http: 500, retryable: false };
  return new Response(
    JSON.stringify({
      error: {
        code,
        message,
        retryable: meta.retryable,
        ...(details ? { details } : {}),
      },
      correlation_id: correlationId,
    }),
    {
      status: meta.http,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  );
}
