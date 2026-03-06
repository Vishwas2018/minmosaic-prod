/**
 * Compute SHA-256 hash of canonicalized JSON (sorted keys, no whitespace).
 * Used for snapshot_hash to guarantee reproducibility.
 */
export function computeSnapshotHash(data: unknown): string {
  const canonical = canonicalize(data);

  // Node.js / Deno environment
  if (typeof globalThis.crypto?.subtle !== 'undefined') {
    // Will be used async — see computeSnapshotHashAsync
    throw new Error('Use computeSnapshotHashAsync in browser/Deno environments');
  }

  // Node.js fallback (Edge Functions, server)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createHash } = require('crypto');
  return createHash('sha256').update(canonical).digest('hex');
}

/**
 * Async version for browser/Deno using Web Crypto API.
 */
export async function computeSnapshotHashAsync(data: unknown): Promise<string> {
  const canonical = canonicalize(data);
  const encoded = new TextEncoder().encode(canonical);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

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
