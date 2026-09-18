// Module-level store — tracks in-flight product fetches across all components.
// Works outside of React so both hooks and the SplashScreen can share it.

let pendingCount = 0;
const subscribers = new Set<() => void>();

function notify() {
  subscribers.forEach(fn => fn());
}

export const appReady = {
  /** Call when a data fetch begins */
  startLoad() {
    pendingCount++;
    notify();
  },
  /** Call when a data fetch ends (success or error) */
  endLoad() {
    pendingCount = Math.max(0, pendingCount - 1);
    notify();
  },
  /** True while any registered fetch is still in flight */
  isPending() {
    return pendingCount > 0;
  },
  subscribe(fn: () => void) {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  },
};
