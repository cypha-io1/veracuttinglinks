export type RealtimeChannel = 'products' | 'orders' | 'categories';

export type RealtimeEvent = {
  channel: RealtimeChannel;
  action: 'created' | 'updated' | 'deleted' | 'changed';
  id?: number | string;
  timestamp: number;
};

type Subscriber = (event: RealtimeEvent) => void;

const subscribers = new Set<Subscriber>();

export function subscribeRealtime(subscriber: Subscriber): () => void {
  subscribers.add(subscriber);

  return () => {
    subscribers.delete(subscriber);
  };
}

export function emitRealtimeEvent(event: Omit<RealtimeEvent, 'timestamp'>): void {
  const payload: RealtimeEvent = {
    ...event,
    timestamp: Date.now(),
  };

  for (const subscriber of subscribers) {
    try {
      subscriber(payload);
    } catch {
      // Ignore individual subscriber failures to keep fan-out resilient.
    }
  }
}
