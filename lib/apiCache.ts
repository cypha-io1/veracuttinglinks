type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const cacheStore = new Map<string, CacheEntry<unknown>>();
const inFlightStore = new Map<string, Promise<unknown>>();

export function readApiCache<T>(key: string): T | null {
  const entry = cacheStore.get(key);
  if (!entry) return null;

  if (Date.now() >= entry.expiresAt) {
    cacheStore.delete(key);
    return null;
  }

  return entry.value as T;
}

export function writeApiCache<T>(key: string, value: T, ttlMs: number) {
  cacheStore.set(key, { value, expiresAt: Date.now() + Math.max(0, ttlMs) });
}

export async function withApiCache<T>(key: string, ttlMs: number, loader: () => Promise<T>) {
  const cached = readApiCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  const running = inFlightStore.get(key) as Promise<T> | undefined;
  if (running) {
    return running;
  }

  const promise = loader()
    .then(result => {
      writeApiCache(key, result, ttlMs);
      return result;
    })
    .finally(() => {
      inFlightStore.delete(key);
    });

  inFlightStore.set(key, promise);
  return promise;
}

export function invalidateApiCacheByPrefix(prefix: string) {
  for (const key of cacheStore.keys()) {
    if (key.startsWith(prefix)) {
      cacheStore.delete(key);
    }
  }

  for (const key of inFlightStore.keys()) {
    if (key.startsWith(prefix)) {
      inFlightStore.delete(key);
    }
  }
}