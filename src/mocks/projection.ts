// =============================================================================
// The lagging read models — the reason this repo exists.
// =============================================================================
// A write lands in the write model instantly. The list projections rebuild from it
// only after `readModelLagMs`, so for a couple of seconds every list endpoint
// serves data that does not contain what the user just wrote. That is the exact
// window in which naive tag invalidation destroys an optimistic patch, and the
// window the event-driven patch-then-verify mechanism is built to survive
// (Chapter 4 §3, ADR-002).
// =============================================================================

import { config } from '@core/config/config';

import { db, releasesNewestFirst } from './db';
import type { ActivityEvent, Release } from './schemas';

export type Projection<T> = {
  /** What a read endpoint serves right now — possibly stale, by design. */
  read: () => T;
  /** Called by every write. The rebuild happens `lagMs` later, not now. */
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
      // A burst of writes rides the timer already running — it must not push the
      // rebuild further out, or a busy label would never see its own catalogue.
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

/** Every mutation handler calls this — one line, and the lag takes care of itself. */
export function scheduleProjections(): void {
  releaseListModel.scheduleRebuild();
  activityFeedModel.scheduleRebuild();
}
