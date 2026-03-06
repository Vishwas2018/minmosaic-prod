import { describe, it, expect } from 'vitest';
import { countWords } from '../wordcount';

describe('countWords', () => {
  it('counts basic words', () => {
    expect(countWords('hello world')).toBe(2);
  });

  it('returns 0 for empty string', () => {
    expect(countWords('')).toBe(0);
  });

  it('returns 0 for whitespace only', () => {
    expect(countWords('   \n\n  ')).toBe(0);
  });

  it('handles single word', () => {
    expect(countWords('hello')).toBe(1);
  });

  it('collapses multiple spaces', () => {
    expect(countWords('hello    world')).toBe(2);
  });

  it('handles newlines', () => {
    expect(countWords('hello\nworld\nfoo')).toBe(3);
  });

  it('strips punctuation', () => {
    expect(countWords("hello, world! it's great.")).toBe(4);
  });

  it('handles mixed whitespace', () => {
    expect(countWords('  hello \n  world \n ')).toBe(2);
  });

  it('counts realistic paragraph', () => {
    const text = 'The quick brown fox jumps over the lazy dog.';
    expect(countWords(text)).toBe(9);
  });
});
