'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { appReady } from '@/lib/appReady';

export type Category = {
  id: number;
  name: string;
  slug: string;
  imageUrl?: string | null;
};

const categoryCache = new Map<string, Category[]>();
const categoryCacheUpdatedAt = new Map<string, number>();
const categoryRequests = new Map<string, Promise<Category[]>>();
const CATEGORY_ENDPOINT = '/api/categories';
const CATEGORY_CACHE_TTL_MS = 45_000;

function getCachedCategories(endpoint: string): Category[] | null {
  const cached = categoryCache.get(endpoint);
  const updatedAt = categoryCacheUpdatedAt.get(endpoint);

  if (!cached || !updatedAt) {
    return null;
  }

  if (Date.now() - updatedAt > CATEGORY_CACHE_TTL_MS) {
    return null;
  }

  return cached;
}

function seedCategoriesCache(endpoint: string, categories: Category[]) {
  categoryCache.set(endpoint, categories);
  categoryCacheUpdatedAt.set(endpoint, Date.now());
}

async function fetchCategories(endpoint: string): Promise<Category[]> {
  const running = categoryRequests.get(endpoint);
  if (running) {
    return running;
  }

  const request = (async () => {
    const response = await fetch(endpoint, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = (await response.json()) as Category[];
    seedCategoriesCache(endpoint, payload);
    return payload;
  })();

  categoryRequests.set(endpoint, request);

  try {
    return await request;
  } finally {
    categoryRequests.delete(endpoint);
  }
}

export async function prefetchCategories(): Promise<void> {
  if (getCachedCategories(CATEGORY_ENDPOINT)) return;

  appReady.startLoad();
  try {
    await fetchCategories(CATEGORY_ENDPOINT);
  } catch {
    // Keep startup resilient if categories fail to prefetch.
  } finally {
    appReady.endLoad();
  }
}

interface CategoriesProps {
  activeCategory?: string;
  initialCategories?: Category[];
}

export default function Categories({ activeCategory, initialCategories = [] }: CategoriesProps) {
  const [categories, setCategories] = useState<Category[]>(
    getCachedCategories(CATEGORY_ENDPOINT) ?? initialCategories
  );

  const cardStyles = [
    'bg-[radial-gradient(circle_at_top_left,_#fb7185,_#be123c_55%,_#881337)]',
    'bg-[radial-gradient(circle_at_top_right,_#f472b6,_#db2777_55%,_#831843)]',
    'bg-[radial-gradient(circle_at_bottom_left,_#fda4af,_#e11d48_50%,_#9f1239)]',
    'bg-[radial-gradient(circle_at_top,_#fecdd3,_#f43f5e_45%,_#881337)]',
    'bg-[radial-gradient(circle_at_bottom_right,_#f9a8d4,_#ec4899_55%,_#9d174d)]',
  ];

  useEffect(() => {
    let isMounted = true;
    let eventSource: EventSource | null = null;

    const loadCategories = async () => {
      appReady.startLoad();
      try {
        const payload = await fetchCategories(CATEGORY_ENDPOINT);
        if (isMounted) {
          setCategories(payload);
        }
      } catch {
        // Keep the server-rendered categories if the refresh fails.
      } finally {
        appReady.endLoad();
      }
    };

    const cachedCategories = getCachedCategories(CATEGORY_ENDPOINT);
    if (cachedCategories) {
      setCategories(cachedCategories);
    }

    void loadCategories();

    eventSource = new EventSource('/api/realtime/stream?channels=categories');
    eventSource.addEventListener('message', () => {
      if (document.visibilityState !== 'visible') return;
      void loadCategories();
    });

    const refreshTimer = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      void loadCategories();
    }, 60_000);

    return () => {
      isMounted = false;
      clearInterval(refreshTimer);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="bg-white py-8 md:py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {!activeCategory && (
          <div className="mb-10 flex flex-col items-center md:mb-14">
            <span className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-black md:text-sm">Explore Collections</span>
            <h2 className="text-3xl font-black tracking-tight text-gray-800 md:text-4xl lg:text-5xl">Shop by Category</h2>
            <div className="mt-6 h-1.5 w-16 rounded-full bg-gradient-to-r from-black to-gray-900 shadow-sm" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((category, index) => {
            const isActive = activeCategory?.toLowerCase() === category.name.toLowerCase();
            const bgStyle = cardStyles[index % cardStyles.length];
            const hasImage = Boolean(category.imageUrl);

            return (
              <Link
                key={category.id}
                href={`/products?category=${encodeURIComponent(category.name)}`}
                className="group"
              >
                <div
                  className={`relative overflow-hidden rounded-2xl p-4 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl md:p-5 ${
                    hasImage ? 'bg-gray-900' : bgStyle
                  } ${
                    isActive ? 'ring-4 ring-black' : 'ring-1 ring-transparent'
                  }`}
                >
                  {hasImage && category.imageUrl && (
                    <>
                      <Image
                        src={category.imageUrl}
                        alt={category.name}
                        fill
                        priority={index < 5}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        className="scale-105 object-cover blur-[1.5px]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/30 to-black/65" />
                    </>
                  )}
                  {!hasImage && <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-white/15" />}
                  {!hasImage && <div className="absolute -bottom-8 -left-6 h-24 w-24 rounded-full bg-white/10" />}
                  <div className="relative z-10 flex h-24 flex-col justify-between md:h-28">
                    <div className="h-10 w-10 rounded-full bg-black/20 text-center text-lg font-black leading-10 text-white">
                      {category.name.slice(0, 1).toUpperCase()}
                    </div>
                    <h3 className="text-base font-black uppercase leading-tight tracking-wide text-white md:text-lg">{category.name}</h3>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
