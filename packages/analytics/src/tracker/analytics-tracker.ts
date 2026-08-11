import type { TrackEventPayload } from '@carparty/types';

export interface AnalyticsTrackerOptions {
  apiUrl: string;
  batchSize?: number;
  flushInterval?: number;
  getAuthToken?: () => string | null;
}

export class AnalyticsTracker {
  private queue: TrackEventPayload[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private readonly batchSize: number;
  private readonly flushInterval: number;

  constructor(private readonly options: AnalyticsTrackerOptions) {
    this.batchSize = options.batchSize ?? 10;
    this.flushInterval = options.flushInterval ?? 5000;

    if (typeof window !== 'undefined') {
      this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
      window.addEventListener('beforeunload', () => this.flush());
    }
  }

  track(payload: TrackEventPayload): void {
    this.queue.push({
      ...payload,
      value: payload.value ?? 1,
      timestamp: payload.timestamp ?? new Date().toISOString(),
    });

    if (this.queue.length >= this.batchSize) {
      void this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = this.options.getAuthToken?.();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      await fetch(`${this.options.apiUrl}/analytics/track/batch`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ events }),
        keepalive: true,
      });
    } catch {
      this.queue.unshift(...events);
    }
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
}

let globalTracker: AnalyticsTracker | null = null;

export function initTracker(options: AnalyticsTrackerOptions): AnalyticsTracker {
  globalTracker?.destroy();
  globalTracker = new AnalyticsTracker(options);
  return globalTracker;
}

export function getTracker(): AnalyticsTracker {
  if (!globalTracker) {
    throw new Error('Analytics tracker not initialized. Call initTracker() first.');
  }
  return globalTracker;
}

export function track(payload: TrackEventPayload): void {
  getTracker().track(payload);
}
