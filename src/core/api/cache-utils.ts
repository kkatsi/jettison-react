// List surgery for reaction handlers. Generic on purpose — no domain words in
// here, or it doesn't belong in core. These mutate: they take an immer draft.

import type { Dispatch } from '@reduxjs/toolkit';

import { api } from '@core/api/api';
import { config } from '@core/config/config';

type Identified = { id: string };

export type InvalidatableTags = Parameters<typeof api.util.invalidateTags>[0];

/** Insert or replace. New items go first — every list here is newest-first. */
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

/** Partial update of one item. A miss is a no-op. */
export function patchListItem<T extends Identified>(
  list: T[],
  id: string,
  patch: Partial<T>,
): void {
  const item = list.find((existing) => existing.id === id);
  if (item) Object.assign(item, patch);
}

/** Remove one item. A miss is a no-op. */
export function removeListItem<T extends Identified>(list: T[], id: string): void {
  const index = list.findIndex((existing) => existing.id === id);
  if (index !== -1) list.splice(index, 1);
}

/**
 * The verify half of patch-then-verify: invalidate once the read model has caught
 * up, so the refetch confirms the patch instead of clobbering it. Returns a cancel
 * so a second patch on the same tags can drop the older timer.
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
