// The lagging read models. A list rebuilds `readModelLagMs` after a write, so for
// a couple of seconds it doesn't contain what the user just wrote — the window
// naive invalidation loses in (ADR-002).

import { config } from '@core/config/config';

import { db, releasesNewestFirst } from './db';
import type { ActivityEvent, Release } from './schemas';

export type Projection<T> = {
  /** What a read endpoint serves now — possibly stale, by design. */
  read: () => T;
  /** Every write calls this; the rebuild happens lagMs later. */
  scheduleRebuild: () => void;
};

export function createProjection<T>(
  project: () => T,
  lagMs: number = config.readModelLagMs,
): Projection<T> {
  let snapshot = project();
  let pending: ReturnType<typeof setTimeout> | undefined;

  return {
    read: () => snapshot,
    scheduleRebuild() {
      // A burst of writes rides the running timer; restarting it would let a busy
      // label never see its own catalogue.
      if (pending) return;
      pending = setTimeout(() => {
        pending = undefined;
        snapshot = project();
      }, lagMs);
    },
  };
}

export const releaseListModel: Projection<Release[]> = createProjection(releasesNewestFirst);

export const activityFeedModel: Projection<ActivityEvent[]> = createProjection(() => [
  ...db.activity,
]);

/** Called by every mutation handler. */
export function scheduleProjections(): void {
  releaseListModel.scheduleRebuild();
  activityFeedModel.scheduleRebuild();
}
