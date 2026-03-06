export const ErrorCodes = {
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
} as const;

export type ErrorCode = keyof typeof ErrorCodes;

export interface ApiErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    retryable: boolean;
    details?: Record<string, unknown>;
  };
  correlation_id: string;
}

export interface ApiSuccessResponse<T = unknown> {
  data: T;
  correlation_id: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/** Client-friendly error messages */
export const ErrorMessages: Record<ErrorCode, string> = {
  INVALID_REQUEST: 'Something went wrong. Please try again.',
  UNAUTHORIZED: 'Please sign in to continue.',
  FORBIDDEN: "You don't have access to this resource.",
  ATTEMPT_NOT_FOUND: 'This exam could not be found.',
  ATTEMPT_EXPIRED: "Time's up! Your exam has ended.",
  ATTEMPT_ALREADY_SUBMITTED: 'This exam has already been submitted.',
  INVALID_TRANSITION: "This action isn't available right now.",
  STALE_REVISION: '', // Silent
  CONCURRENT_ATTEMPT_LIMIT: 'You already have an exam in progress. Please complete or abandon it first.',
  WORD_COUNT_EXCEEDED: 'Your response exceeds the word limit.',
  WORD_COUNT_BELOW_MIN: 'Your response is below the minimum word count.',
  PAYLOAD_TOO_LARGE: 'Request too large. Please try again.',
  RATE_LIMITED: 'Too many requests. Please wait a moment.',
  GUEST_LIMIT_REACHED: 'Guest exam limit reached. Sign up for more.',
  SERVER_ERROR: "Something went wrong. We're looking into it.",
  SERVICE_UNAVAILABLE: 'The service is temporarily unavailable.',
};
