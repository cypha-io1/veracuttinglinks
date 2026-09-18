import { ensureDbInitialized } from '@/lib/dbInit';

let started = false;

export function primeServerStartup() {
  if (started) return;
  started = true;

  void ensureDbInitialized().catch(() => {
    // Keep app boot resilient; regular request path will retry.
  });
}