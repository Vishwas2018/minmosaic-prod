// supabase/functions/_shared/bodyLimit.ts
// Enforces the 64KB body size limit from §3.D before JSON parsing

const MAX_BODY_SIZE_BYTES = 65536; // 64 KB

/**
 * Read and parse the request body, enforcing the global size limit.
 * Returns the parsed JSON body or null if the payload is too large / invalid.
 */
export async function parseBodyWithLimit(
  req: Request,
): Promise<{ body: unknown; error: null } | { body: null; error: string }> {
  try {
    // Read as ArrayBuffer to check byte length
    const buffer = await req.arrayBuffer();

    if (buffer.byteLength > MAX_BODY_SIZE_BYTES) {
      return { body: null, error: 'PAYLOAD_TOO_LARGE' };
    }

    const text = new TextDecoder().decode(buffer);
    const body = JSON.parse(text);
    return { body, error: null };
  } catch {
    return { body: null, error: 'INVALID_REQUEST' };
  }
}
