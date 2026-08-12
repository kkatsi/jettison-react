// COMPLIANT — a service: plain functions, no React, no store, no fetching.
export type StoreState = 'pending' | 'delivering' | 'live';

export function deriveReleaseStatus(states: StoreState[]): StoreState {
  if (states.length === 0) return 'pending';
  if (states.every((state) => state === 'live')) return 'live';
  return states.some((state) => state === 'delivering') ? 'delivering' : 'pending';
}
