// Offline Store and Sync Engine
export interface QueuedEvent {
  id: string;
  idempotency_key: string;
  action: string;
  device_event_time: string;
  payload: any;
}

export type SyncState = 'ONLINE_SYNCED' | 'OFFLINE_QUEUED' | 'SYNCING' | 'CONFLICT';

class OfflineStore {
  private queueKey = 'skp_offline_queue_v1';
  private listeners: ((state: { state: SyncState; pendingCount: number }) => void)[] = [];
  private isSimulatedOffline = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleConnectivityChange());
      window.addEventListener('offline', () => this.handleConnectivityChange());
    }
  }

  getSimulatedOffline(): boolean {
    return this.isSimulatedOffline;
  }

  setSimulatedOffline(offline: boolean) {
    this.isSimulatedOffline = offline;
    this.handleConnectivityChange();
  }

  getQueue(): QueuedEvent[] {
    try {
      const raw = localStorage.getItem(this.queueKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  enqueue(action: string, payload: any): string {
    const queue = this.getQueue();
    const idempotency_key = `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const event: QueuedEvent = {
      id: idempotency_key,
      idempotency_key,
      action,
      device_event_time: new Date().toISOString(),
      payload,
    };
    queue.push(event);
    localStorage.setItem(this.queueKey, JSON.stringify(queue));
    this.notify();
    return idempotency_key;
  }

  clearQueue() {
    localStorage.removeItem(this.queueKey);
    this.notify();
  }

  getSyncState(): { state: SyncState; pendingCount: number } {
    const queue = this.getQueue();
    if (this.isSimulatedOffline || !navigator.onLine) {
      return {
        state: queue.length > 0 ? 'OFFLINE_QUEUED' : 'OFFLINE_QUEUED',
        pendingCount: queue.length,
      };
    }
    return {
      state: queue.length > 0 ? 'SYNCING' : 'ONLINE_SYNCED',
      pendingCount: queue.length,
    };
  }

  subscribe(listener: (state: { state: SyncState; pendingCount: number }) => void) {
    this.listeners.push(listener);
    listener(this.getSyncState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    const state = this.getSyncState();
    this.listeners.forEach((l) => l(state));
  }

  async syncNow(): Promise<{ synced: number; failed: number }> {
    if (this.isSimulatedOffline || !navigator.onLine) {
      return { synced: 0, failed: 0 };
    }

    const queue = this.getQueue();
    if (queue.length === 0) {
      return { synced: 0, failed: 0 };
    }

    this.notify();

    try {
      const res = await fetch('/api/v1/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outlet_id: 'out_skp_mumbai',
          events: queue,
        }),
      });

      if (res.ok) {
        this.clearQueue();
        return { synced: queue.length, failed: 0 };
      } else {
        return { synced: 0, failed: queue.length };
      }
    } catch {
      return { synced: 0, failed: queue.length };
    } finally {
      this.notify();
    }
  }

  private handleConnectivityChange() {
    this.notify();
    if (!this.isSimulatedOffline && navigator.onLine) {
      this.syncNow();
    }
  }
}

export const offlineStore = new OfflineStore();
