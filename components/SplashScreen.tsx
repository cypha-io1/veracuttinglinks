'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { appReady } from '@/lib/appReady';
import { prefetchProducts } from '@/hooks/useProducts';
import { prefetchCategories } from '@/components/Categories';

// Preload critical data required by the first route before revealing the app.
const PREFETCH_ENDPOINTS = [
  '/api/products',
];

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const windowLoaded = useRef(false);
  const minTimeElapsed = useRef(false);
  const dismissed = useRef(false);

  const tryDismiss = () => {
    if (dismissed.current) return;
    if (!windowLoaded.current) return;
    if (!minTimeElapsed.current) return;
    if (appReady.isPending()) return;

    dismissed.current = true;
    setFading(true);
    setTimeout(() => setVisible(false), 600);
  };

  useEffect(() => {
    // Kick off all data prefetches immediately.
    PREFETCH_ENDPOINTS.forEach(ep => prefetchProducts(ep));
    void prefetchCategories();

    // Minimum display time — ensures the splash is never a bare flash
    const minTimer = setTimeout(() => {
      minTimeElapsed.current = true;
      tryDismiss();
    }, 1500);

    // Hard fallback: always dismiss after 8s
    const fallback = setTimeout(() => {
      windowLoaded.current = true;
      minTimeElapsed.current = true;
      if (!dismissed.current) {
        dismissed.current = true;
        setFading(true);
        setTimeout(() => setVisible(false), 600);
      }
    }, 8000);

    // Wait for all static resources
    const onWindowLoad = () => {
      windowLoaded.current = true;
      tryDismiss();
    };
    if (document.readyState === 'complete') {
      windowLoaded.current = true;
    } else {
      window.addEventListener('load', onWindowLoad, { once: true });
    }

    // Re-check whenever a product fetch finishes
    const unsubscribe = appReady.subscribe(() => {
      tryDismiss();
    });

    return () => {
      clearTimeout(minTimer);
      clearTimeout(fallback);
      window.removeEventListener('load', onWindowLoad);
      unsubscribe();
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-opacity duration-600 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ transition: 'opacity 0.6s ease' }}
    >
      {/* Logo */}
      <div className="relative w-32 h-32 mb-6 animate-pulse">
        <Image
          src="/logo.png"
          alt="Zhilakaii"
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* Loading bar */}
      <div className="mt-6 w-48 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-white rounded-full animate-loading-bar" />
      </div>
    </div>
  );
}
