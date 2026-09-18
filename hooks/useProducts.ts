import { useState, useEffect } from 'react';
import { appReady } from '@/lib/appReady';
import type { PublicProduct } from '@/lib/productTypes';

interface UseProductsOptions {
  category?: string;
  featured?: boolean;
  limit?: number;
  realtime?: boolean;
  refreshIntervalMs?: number;
  initialProducts?: PublicProduct[];
}

// Module-level cache — persists for the entire browser session.
// Key: endpoint URL string.
const productCache = new Map<string, PublicProduct[]>();
const productCacheUpdatedAt = new Map<string, number>();
const inFlightRequests = new Map<string, Promise<PublicProduct[]>>();
const CACHE_TTL_MS = 45_000;

function getCachedProducts(endpoint: string): PublicProduct[] | null {
  const cached = productCache.get(endpoint);
  const updatedAt = productCacheUpdatedAt.get(endpoint);

  if (!cached || !updatedAt) {
    return null;
  }

  if (Date.now() - updatedAt > CACHE_TTL_MS) {
    return null;
  }

  return cached;
}

function seedProductsCache(endpoint: string, products: PublicProduct[]) {
  productCache.set(endpoint, products);
  productCacheUpdatedAt.set(endpoint, Date.now());
}

async function fetchProducts(endpoint: string, signal?: AbortSignal): Promise<PublicProduct[]> {
  const existingRequest = inFlightRequests.get(endpoint);
  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    const res = await fetch(endpoint, { signal, cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: PublicProduct[] = await res.json();
    seedProductsCache(endpoint, data);
    return data;
  })();

  inFlightRequests.set(endpoint, request);

  try {
    return await request;
  } finally {
    inFlightRequests.delete(endpoint);
  }
}

/** Fetch and cache a single endpoint. Signals appReady so SplashScreen can track it. */
export async function prefetchProducts(endpoint: string): Promise<void> {
  if (getCachedProducts(endpoint)) return;
  appReady.startLoad();
  try {
    await fetchProducts(endpoint);
  } catch {
    // silently ignore prefetch failures
  } finally {
    appReady.endLoad();
  }
}

export const useProducts = (options: UseProductsOptions = {}) => {
  const {
    category,
    featured,
    limit,
    realtime = true,
    refreshIntervalMs = 20_000,
    initialProducts,
  } = options;

  const buildEndpoint = () => {
    const query = new URLSearchParams();
    if (category) query.set('category', category);
    if (featured !== undefined) query.set('featured', String(featured));
    if (limit !== undefined) query.set('limit', String(limit));
    const qs = query.toString();
    return qs ? `/api/products?${qs}` : '/api/products';
  };

  const getFromCache = (): PublicProduct[] | null => {
    const endpoint = buildEndpoint();
    const endpointCache = getCachedProducts(endpoint);
    if (endpointCache) return endpointCache;

    if (initialProducts) {
      return initialProducts;
    }

    // If we already have the full list, derive subsets locally and seed endpoint cache.
    const fullList = getCachedProducts('/api/products');
    if (fullList) {
      let derived = fullList;

      if (category) {
        derived = derived.filter(
          p => p.category.toLowerCase() === category.toLowerCase()
        );
      }

      if (featured !== undefined) {
        derived = derived.filter(p => p.isFeatured === featured);
      }

      if (limit !== undefined) {
        derived = derived.slice(0, Math.max(0, limit));
      }

      seedProductsCache(endpoint, derived);
      return derived;
    }

    return null;
  };

  const cached = getFromCache();
  const [products, setProducts] = useState<PublicProduct[]>(cached ?? []);
  const [loading, setLoading] = useState(cached === null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fromCache = getFromCache();
    if (fromCache !== null) {
      setProducts(fromCache);
      setLoading(false);
    }

    let isMounted = true;
    let timeoutId: NodeJS.Timeout;
    let intervalId: NodeJS.Timeout | null = null;
    let eventSource: EventSource | null = null;
    const endpoint = buildEndpoint();

    const loadProducts = async (showLoading = true) => {
      appReady.startLoad();
      try {
        if (showLoading) {
          setLoading(true);
        }

        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), 10000);

        const data = await fetchProducts(endpoint, controller.signal);
        clearTimeout(timeoutId);

        if (isMounted) {
          setProducts(data);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setLoading(false);
        }
      } finally {
        appReady.endLoad();
      }
    };

    if (fromCache === null) {
      void loadProducts();
    }

    if (realtime) {
      eventSource = new EventSource('/api/realtime/stream?channels=products');

      eventSource.addEventListener('message', () => {
        if (document.visibilityState !== 'visible') {
          return;
        }

        void loadProducts(false);
      });

      // Polling remains as a fallback safety net for lost SSE connections.
      intervalId = setInterval(() => {
        if (document.visibilityState !== 'visible') {
          return;
        }

        void loadProducts(false);
      }, Math.max(5_000, refreshIntervalMs));
    }

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (intervalId) {
        clearInterval(intervalId);
      }

      if (eventSource) {
        eventSource.close();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, featured, initialProducts, limit, realtime, refreshIntervalMs]);

  return { products, loading, error };
};
