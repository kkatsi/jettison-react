// This module's reducer switch (Ch. 4 §5): one `on` per fact it cares about,
// each one a routing table — a lookup, a cache-util call, a delayed invalidation.
// Nothing here knows which module dispatched, and neither event's producer exists
// yet: release-editor brings both. An event nobody dispatches costs nothing,
// which is the same reason jettisoning its producer is safe.

import { invalidateTagsAfterDelay, upsertListItem } from '@core/api/cache-utils';
import { config } from '@core/config/config';
import { createReactions } from '@core/redux/reactions';
import { releaseSubmitted, trackProcessed } from '@shared/events';

import { catalogApi } from '../api/endpoints';
import { toRowFromSubmission } from '../api/transformations';

export const registerCatalogReactions = createReactions((on) => {
  // The release the editor just submitted has to be on the board now. The list
  // endpoint will not return it for another couple of seconds (ADR-002), so the
  // announcement is what puts it there.
  on(releaseSubmitted, ({ release }, { dispatch }) => {
    if (config.cacheMode === 'naive') {
      // The demo's broken path: refetch immediately, get the list from before the
      // submission, and watch the row the user just created disappear.
      dispatch(catalogApi.util.invalidateTags(['Releases']));
      return;
    }

    dispatch(
      catalogApi.util.updateQueryData('releases', undefined, (releases) => {
        upsertListItem(releases, toRowFromSubmission(release));
      }),
    );

    invalidateTagsAfterDelay(dispatch, ['Releases']);
  });

  // Audio finishing is the backend telling us something we never asked for.
  on(trackProcessed, ({ release, trackTitle }, { dispatch }) => {
    dispatch(
      catalogApi.util.updateQueryData('releaseDetail', release.id, (detail) => {
        const track = detail.tracks.find((candidate) => candidate.title === trackTitle);
        if (track) track.audioStatus = 'ready';
      }),
    );

    invalidateTagsAfterDelay(dispatch, [{ type: 'ReleaseDetail', id: release.id }]);
  });
});
