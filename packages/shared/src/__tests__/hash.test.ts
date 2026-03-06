import { describe, expect, it } from 'vitest';
import { computeSnapshotHash } from '../hash';

describe('computeSnapshotHash', () => {
  it('produces the same hash regardless of object key insertion order', () => {
    const a = {
      item_snapshot_id: 'abc',
      stem: { text: 'Question' },
      interaction_config: {
        options: [
          { id: 'a', label: 'Option A' },
          { id: 'b', label: 'Option B' },
        ],
        unit: 'kg',
      },
    };

    const b = {
      interaction_config: {
        unit: 'kg',
        options: [
          { label: 'Option A', id: 'a' },
          { label: 'Option B', id: 'b' },
        ],
      },
      stem: { text: 'Question' },
      item_snapshot_id: 'abc',
    };

    expect(computeSnapshotHash(a)).toBe(computeSnapshotHash(b));
  });
});
