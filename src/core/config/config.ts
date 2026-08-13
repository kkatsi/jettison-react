// The only file that reads the environment or the URL.

/** `naive` swaps patch-then-verify for plain invalidation, to demo the bug. */
export type CacheMode = 'events' | 'naive';

// Guarded: unit tests import this and have no window.
const search = typeof window === 'undefined' ? '' : window.location.search;
const params = new URLSearchParams(search);

const readModelLagMs = Number(import.meta.env.VITE_READ_MODEL_LAG_MS ?? 2500);

export const config = Object.freeze({
  apiBaseUrl: '/api',

  cacheMode: (params.get('cache') === 'naive'
    ? 'naive'
    : 'events') satisfies CacheMode as CacheMode,

  /** How far the mock's read models trail its write model (ADR-002). */
  readModelLagMs,

  /**
   * What the mock charges for a round trip. A knob rather than a constant because
   * a loading state nobody can see is a loading state nobody has designed: set
   * VITE_NETWORK_MS=5000 in .env.local and every skeleton in the console is
   * legible for as long as you need it.
   */
  networkMs: Number(import.meta.env.VITE_NETWORK_MS ?? 140),

  /** How long a reaction waits before reconciling. Must outlast the lag above. */
  reconcileDelayMs: readModelLagMs + 1000,
});
