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

  /** What the mock charges for a round trip. Raise it to read the loading states. */
  networkMs: Number(import.meta.env.VITE_NETWORK_MS ?? 140),

  /** How long a reaction waits before reconciling. Must outlast the lag above. */
  reconcileDelayMs: readModelLagMs + 1000,
});

/** Switching modes reloads: `config` is read once and frozen, and a caching demo
    is worth more from an empty cache. */
export function urlForCacheMode(mode: CacheMode, href = window.location.href): string {
  const url = new URL(href);

  if (mode === 'naive') url.searchParams.set('cache', 'naive');
  else url.searchParams.delete('cache');

  return url.toString();
}
