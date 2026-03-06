import { describe, expect, it } from 'vitest';
import { SaveResponseRequest, StartAttemptRequest, SubmitAttemptRequest } from '../schemas/api';

describe('StartAttemptRequest', () => {
  it('accepts valid request', () => {
    const result = StartAttemptRequest.safeParse({ domain: 'reading', year_level: 5 });
    expect(result.success).toBe(true);
  });

  it('rejects invalid domain', () => {
    const result = StartAttemptRequest.safeParse({ domain: 'math', year_level: 5 });
    expect(result.success).toBe(false);
  });

  it('rejects invalid year level', () => {
    const result = StartAttemptRequest.safeParse({ domain: 'reading', year_level: 4 });
    expect(result.success).toBe(false);
  });
});

describe('SaveResponseRequest', () => {
  const base = {
    attempt_id: '550e8400-e29b-41d4-a716-446655440000',
    item_snapshot_id: '550e8400-e29b-41d4-a716-446655440001',
    client_revision: 1,
  };

  it('accepts MCQ response', () => {
    const result = SaveResponseRequest.safeParse({
      ...base,
      response_payload: {
        type: 'mcq',
        selected_option_id: 'a',
      },
    });
    expect(result.success).toBe(true);
  });

  it('accepts short_text response', () => {
    const result = SaveResponseRequest.safeParse({
      ...base,
      response_payload: { type: 'short_text', text: '42' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects short_text exceeding max chars', () => {
    const result = SaveResponseRequest.safeParse({
      ...base,
      response_payload: { type: 'short_text', text: 'x'.repeat(1001) },
    });
    expect(result.success).toBe(false);
  });

  it('rejects revision of 0', () => {
    const result = SaveResponseRequest.safeParse({
      ...base,
      client_revision: 0,
      response_payload: { type: 'short_text', text: 'test' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative revision', () => {
    const result = SaveResponseRequest.safeParse({
      ...base,
      client_revision: -1,
      response_payload: { type: 'short_text', text: 'test' },
    });
    expect(result.success).toBe(false);
  });
});

describe('SubmitAttemptRequest', () => {
  it('accepts valid request', () => {
    const result = SubmitAttemptRequest.safeParse({
      attempt_id: '550e8400-e29b-41d4-a716-446655440000',
      submission_id: '550e8400-e29b-41d4-a716-446655440003',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-uuid attempt_id', () => {
    const result = SubmitAttemptRequest.safeParse({
      attempt_id: 'not-a-uuid',
      submission_id: '550e8400-e29b-41d4-a716-446655440003',
    });
    expect(result.success).toBe(false);
  });
});

describe('SaveResponseRequest - numeric', () => {
  const base = {
    attempt_id: '550e8400-e29b-41d4-a716-446655440000',
    item_snapshot_id: '550e8400-e29b-41d4-a716-446655440001',
    client_revision: 1,
  };

  it('accepts numeric response', () => {
    const result = SaveResponseRequest.safeParse({
      ...base,
      response_payload: { type: 'numeric', value: '16.05' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects numeric value exceeding max length', () => {
    const result = SaveResponseRequest.safeParse({
      ...base,
      response_payload: { type: 'numeric', value: 'x'.repeat(101) },
    });
    expect(result.success).toBe(false);
  });
});

describe('SaveResponseRequest - multi_select', () => {
  const base = {
    attempt_id: '550e8400-e29b-41d4-a716-446655440000',
    item_snapshot_id: '550e8400-e29b-41d4-a716-446655440001',
    client_revision: 1,
  };

  it('accepts multi_select response', () => {
    const result = SaveResponseRequest.safeParse({
      ...base,
      response_payload: { type: 'multi_select', selected_option_ids: ['a', 'c', 'e'] },
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty multi_select', () => {
    const result = SaveResponseRequest.safeParse({
      ...base,
      response_payload: { type: 'multi_select', selected_option_ids: [] },
    });
    expect(result.success).toBe(false);
  });

  it('rejects multi_select exceeding max options', () => {
    const ids = Array.from({ length: 21 }, (_, index) => `opt-${index}`);
    const result = SaveResponseRequest.safeParse({
      ...base,
      response_payload: { type: 'multi_select', selected_option_ids: ids },
    });
    expect(result.success).toBe(false);
  });
});

describe('SaveResponseRequest - all response types edge cases', () => {
  const base = {
    attempt_id: '550e8400-e29b-41d4-a716-446655440000',
    item_snapshot_id: '550e8400-e29b-41d4-a716-446655440001',
    client_revision: 2,
  };

  it('accepts numeric values as strings', () => {
    const result = SaveResponseRequest.safeParse({
      ...base,
      response_payload: { type: 'numeric', value: '9.2' },
    });
    expect(result.success).toBe(true);
  });

  it('accepts multi_select with one option', () => {
    const result = SaveResponseRequest.safeParse({
      ...base,
      response_payload: { type: 'multi_select', selected_option_ids: ['a'] },
    });
    expect(result.success).toBe(true);
  });

  it('rejects mcq with empty selected_option_id', () => {
    const result = SaveResponseRequest.safeParse({
      ...base,
      response_payload: { type: 'mcq', selected_option_id: '' },
    });
    expect(result.success).toBe(false);
  });

  it('accepts short_text at the max character limit', () => {
    const result = SaveResponseRequest.safeParse({
      ...base,
      response_payload: { type: 'short_text', text: 'x'.repeat(1000) },
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing response payload discriminator', () => {
    const result = SaveResponseRequest.safeParse({
      ...base,
      response_payload: { text: '42' },
    });
    expect(result.success).toBe(false);
  });
});
