import { beforeEach, describe, expect, it } from 'vitest';
import { useExamStore } from '@/stores/examStore';

describe('examStore', () => {
  beforeEach(() => {
    useExamStore.getState().reset();
  });

  it('sets an attempt and computes a non-negative timer', () => {
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 60_000).toISOString();

    useExamStore.getState().setAttempt(
      {
        id: 'attempt-1',
        user_id: 'user-1',
        domain: 'numeracy',
        year_level: 5,
        status: 'started',
        time_limit_sec: 2700,
        started_at: now,
        expires_at: expiresAt,
        submitted_at: null,
        scored_at: null,
        auto_submitted: false,
        auto_submit_reason: null,
        submission_id: null,
        snapshot_hash: null,
        engine_version: '1.0.0',
        created_at: now,
        updated_at: now,
      },
      [
        {
          item_snapshot_id: 'item-1',
          position: 0,
          question_type: 'mcq',
          item_code: 'NUM-Y5-MCQ-001',
          stem: { text: 'Question 1' },
          interaction_config: { options: [{ id: 'a', label: 'A' }] },
        },
      ],
      now,
    );

    const state = useExamStore.getState();
    expect(state.attempt?.id).toBe('attempt-1');
    expect(state.snapshot).toHaveLength(1);
    expect(state.timerRemainingSec).toBeGreaterThanOrEqual(0);
  });

  it('increments response revisions per item', () => {
    useExamStore.getState().setResponse('item-1', {
      type: 'mcq',
      selected_option_id: 'a',
    });
    useExamStore.getState().setResponse('item-1', {
      type: 'mcq',
      selected_option_id: 'b',
    });

    expect(useExamStore.getState().responses.get('item-1')?.revision).toBe(2);
  });

  it('bounds question navigation to the snapshot length', () => {
    const now = new Date().toISOString();

    useExamStore.getState().setAttempt(
      {
        id: 'attempt-1',
        user_id: 'user-1',
        domain: 'reading',
        year_level: 5,
        status: 'started',
        time_limit_sec: 2700,
        started_at: now,
        expires_at: new Date(Date.now() + 60_000).toISOString(),
        submitted_at: null,
        scored_at: null,
        auto_submitted: false,
        auto_submit_reason: null,
        submission_id: null,
        snapshot_hash: null,
        engine_version: '1.0.0',
        created_at: now,
        updated_at: now,
      },
      [
        {
          item_snapshot_id: 'item-1',
          position: 0,
          question_type: 'mcq',
          item_code: 'READ-Y5-MCQ-001',
          stem: { text: 'Question 1' },
          interaction_config: { options: [{ id: 'a', label: 'A' }] },
        },
        {
          item_snapshot_id: 'item-2',
          position: 1,
          question_type: 'short_text',
          item_code: 'READ-Y5-SHORT_TEXT-001',
          stem: { text: 'Question 2' },
          interaction_config: {},
        },
      ],
      now,
    );

    useExamStore.getState().setCurrentIndex(5);
    expect(useExamStore.getState().currentIndex).toBe(1);

    useExamStore.getState().setCurrentIndex(-10);
    expect(useExamStore.getState().currentIndex).toBe(0);
  });
});
