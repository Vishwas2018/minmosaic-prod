import type { ApiErrorResponse, ErrorCode } from '@mindmosaic/shared';

export class FunctionInvokeError extends Error {
  code: ErrorCode | null;
  details?: Record<string, unknown>;

  constructor(
    message: string,
    code: ErrorCode | null = null,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'FunctionInvokeError';
    this.code = code;
    this.details = details;
  }
}

export async function toFunctionInvokeError(error: unknown) {
  if (isFunctionsHttpError(error)) {
    try {
      const payload = (await error.context.json()) as ApiErrorResponse;
      return new FunctionInvokeError(
        payload.error.message,
        payload.error.code,
        payload.error.details,
      );
    } catch {
      return new FunctionInvokeError(error.message);
    }
  }

  if (error instanceof Error) {
    return new FunctionInvokeError(error.message);
  }

  return new FunctionInvokeError('Something went wrong. Please try again.');
}

function isFunctionsHttpError(
  value: unknown,
): value is Error & { context: Response; message: string } {
  return (
    value instanceof Error &&
    typeof value === 'object' &&
    value !== null &&
    'context' in value &&
    value.context instanceof Response
  );
}
