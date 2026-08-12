// =============================================================================
// Cache surgery — generic, tiny, and the only place it is allowed to live.
// =============================================================================
// Reaction handlers are routing tables: one lookup, one call from this file, one
// delayed invalidation (Chapter 4 §5). Keeping the mechanics here is what stops
// the event system regrowing into the cache-update monolith it replaced.
//
// These functions mutate: they are written for the immer draft that a query
// library hands to a cache updater. They speak no domain vocabulary — no
// release, no track — which is why they can live in core at all (Chapter 2 §7).
// =============================================================================

import type { Dispatch } from '@reduxjs/toolkit';

import { api } from '@core/api/api';
import { config } from '@core/config/config';

type Identified = { id: string };

/** Tags accepted by the client's invalidation action — grows with the registry. */
export type InvalidatableTags = Parameters<typeof api.util.invalidateTags>[0];

/**
 * Insert or replace an item in a cached list. New items land at the start,
 * because every list in this app is newest-first and a freshly created entity
 * that appears at the bottom of page 7 has not, in any useful sense, appeared.
 */
export function upsertListItem<T extends Identified>(
  list: T[],
  item: T,
  position: 'start' | 'end' = 'start',
): void {
  const index = list.findIndex((existing) => existing.id === item.id);
  if (index === -1) {
    if (position === 'start') list.unshift(item);
    else list.push(item);
    return;
  }
  list[index] = item;
}

/** Apply a partial update to one item in a cached list; a miss is a no-op. */
export function patchListItem<T extends Identified>(
  list: T[],
  id: string,
  patch: Partial<T>,
): void {
  const item = list.find((existing) => existing.id === id);
  if (item) Object.assign(item, patch);
}

/** Remove one item from a cached list; a miss is a no-op. */
export function removeListItem<T extends Identified>(list: T[], id: string): void {
  const index = list.findIndex((existing) => existing.id === id);
  if (index !== -1) list.splice(index, 1);
}

/**
 * The *verify* half of patch-then-verify: invalidate later, once the read model
 * has had time to catch up, so the refetch confirms the patch instead of
 * clobbering it with a stale projection.
 *
 * Returns a cancel function — a reaction that patches the same tags again before
 * the timer fires should cancel the older one rather than schedule a stampede.
 */
export function invalidateTagsAfterDelay(
  dispatch: Dispatch,
  tags: InvalidatableTags,
  delayMs: number = config.reconcileDelayMs,
): () => void {
  const timer = setTimeout(() => {
    dispatch(api.util.invalidateTags(tags));
  }, delayMs);
  return () => clearTimeout(timer);
}
