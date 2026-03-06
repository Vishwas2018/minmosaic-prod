import Dexie, { type Table } from 'dexie';
import type { ResponsePayloadSchema } from '@mindmosaic/shared';

export interface PendingSaveRecord {
  id?: number;
  attempt_id: string;
  item_snapshot_id: string;
  response_payload: ResponsePayloadSchema;
  client_revision: number;
  queued_at: string;
}

class OfflineExamDb extends Dexie {
  pendingSaves!: Table<PendingSaveRecord, number>;

  constructor() {
    super('mindmosaicOfflineDb');

    this.version(1).stores({
      pendingSaves: '++id, attempt_id, item_snapshot_id, client_revision, queued_at',
    });
  }
}

export const offlineDb = new OfflineExamDb();

export async function enqueuePendingSave(record: Omit<PendingSaveRecord, 'id'>) {
  await offlineDb.pendingSaves.add(record);
}

export async function getPendingSavesForAttempt(attemptId: string) {
  return offlineDb.pendingSaves
    .where('attempt_id')
    .equals(attemptId)
    .sortBy('queued_at');
}

export async function deletePendingSave(id: number) {
  await offlineDb.pendingSaves.delete(id);
}
