// This module's reducer switch (Chapter 4 §5): one `on` per fact it cares about.
// Patch-then-verify, from the consumer's side — the feed shows the event now, and
// the delayed invalidation lets the backend confirm it once its read model has
// caught up. Nothing here knows which module dispatched.

import { invalidateTagsAfterDelay, upsertListItem } from '@core/api/cache-utils';
import { config } from '@core/config/config';
import { createReactions, type ReactionDispatch } from '@core/redux/reactions';
import { releaseSubmitted, releaseWithdrawn, trackProcessed } from '@shared/events';
import type { EventRelease } from '@shared/events';

import { activityApi } from '../api';
import { LIVE_SUMMARY } from '../constants';
import type { ActivityEvent, ActivityEventType } from '../types';

export const registerActivityReactions = createReactions((on) => {
  on(releaseSubmitted, ({ release, actor }, { dispatch }) =>
    record(dispatch, 'domain/releases/submitted', release, actor),
  );

  on(releaseWithdrawn, ({ release, actor }, { dispatch }) =>
    record(dispatch, 'domain/releases/withdrawn', release, actor),
  );

  on(trackProcessed, ({ release, actor, trackTitle }, { dispatch }) =>
    record(dispatch, 'domain/tracks/processed', release, actor, trackTitle),
  );
});

function record(
  dispatch: ReactionDispatch,
  type: ActivityEventType,
  release: EventRelease,
  actor: string,
  detail?: string,
): void {
  const entry: ActivityEvent = {
    id: `live-${release.id}-${type}-${Date.now()}`,
    type,
    at: new Date().toISOString(),
    actor,
    summary: LIVE_SUMMARY[type](release.title, detail),
    release,
  };

  dispatch(
    activityApi.util.updateQueryData('activityFeed', undefined, (feed) => {
      upsertListItem(feed, entry);
    }),
  );

  // The demo's broken path — the same patch, thrown away by a refetch that lands
  // before the feed has been projected (ADR-002).
  if (config.cacheMode === 'naive') {
    dispatch(activityApi.util.invalidateTags(['ActivityFeed']));
    return;
  }

  // Verify: by the time this fires the backend has recorded the same fact, so the
  // refetch confirms the row instead of deleting it.
  invalidateTagsAfterDelay(dispatch, ['ActivityFeed']);
}
