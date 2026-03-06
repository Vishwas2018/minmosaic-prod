// supabase/functions/_shared/hash.ts
// SHA-256 snapshot hash for Deno runtime (Web Crypto API)
// Must produce identical output to packages/shared/src/hash.ts

/**
 * Canonicalize a value: objects get sorted keys recursively, arrays preserved.
 */
function canonicalize(value: unknown): string {
  return JSON.stringify(value, (_key, val) => {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      return Object.keys(val as Record<string, unknown>)
        .sort()
        .reduce(
          (sorted, k) => {
            sorted[k] = (val as Record<string, unknown>)[k];
            return sorted;
          },
          {} as Record<string, unknown>,
        );
    }
    return val;
  });
}

/**
 * Compute SHA-256 hash of canonicalized JSON.
 * Uses Web Crypto API (available in Deno).
 */
export async function computeSnapshotHash(data: unknown): Promise<string> {
  const canonical = canonicalize(data);
  const encoded = new TextEncoder().encode(canonical);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
