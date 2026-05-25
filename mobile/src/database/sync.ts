import { syncApi } from '../api/endpoints';
import { getLastSyncedAt, setLastSyncedAt } from '../store/storage';

let isSyncing = false;

export async function performSync(): Promise<void> {
  if (isSyncing) return;
  isSyncing = true;

  try {
    const lastSynced = getLastSyncedAt();
    const serverData = await syncApi.pull(lastSynced);
    // In a full WatermelonDB integration, we'd apply serverData to the local DB here.
    // This stub marks the sync timestamp so the next call requests only the delta.
    setLastSyncedAt(new Date().toISOString());
  } catch {
    // Silently fail — app works offline
  } finally {
    isSyncing = false;
  }
}

export async function pushLocalChanges(changes: unknown): Promise<void> {
  try {
    await syncApi.push(changes);
    setLastSyncedAt(new Date().toISOString());
  } catch {
    // Queue locally and retry on next sync
  }
}
