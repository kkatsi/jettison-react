// =============================================================================
// The only file in the repo that reads the environment or the URL.
// =============================================================================
// Everything else imports `config`. That is what makes "how do we behave in
// production?" a single-file question, and it is why a screen never contains an
// `import.meta.env` check that nobody can find six months later.
// =============================================================================

/**
 * `events` is the architecture: cross-module cache effects travel as domain
 * events and are patched-then-verified. `naive` is the demo of the failure —
 * plain tag invalidation racing an eventually consistent read model
 * (ADR-002). Set by `?cache=naive`, read once at boot.
 */
export type CacheMode = 'events' | 'naive';

// Guarded because this module is imported by unit tests, which have no window.
const search = typeof window === 'undefined' ? '' : window.location.search;
const params = new URLSearchParams(search);

const readModelLagMs = Number(import.meta.env.VITE_READ_MODEL_LAG_MS ?? 2500);

export const config = Object.freeze({
  /** The mock backend answers here; MSW intercepts it (ADR-002). */
  apiBaseUrl: '/api',

  cacheMode: (params.get('cache') === 'naive'
    ? 'naive'
    : 'events') satisfies CacheMode as CacheMode,

  /** How long the mock's read models trail its write model. */
  readModelLagMs,

  /**
   * How long a reaction waits before its reconciling invalidation (the *verify*
   * of patch-then-verify). It must outlast the projection lag, and it is a
   * heuristic, not a proof — Chapter 4 §6 says so out loud.
   */
  reconcileDelayMs: readModelLagMs + 1000,
});
