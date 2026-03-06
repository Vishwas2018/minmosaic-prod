/**
 * Deterministic word count algorithm.
 * Identical implementation on client and server; server is authoritative.
 */
export function countWords(text: string): number {
  return text
    .replace(/\n/g, ' ')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter((t) => t.length > 0).length;
}
