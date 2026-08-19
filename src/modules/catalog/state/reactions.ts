// This module's reducer switch (Ch. 4 §5). Neither producer exists yet —
// release-editor brings both, and an event nobody dispatches costs nothing.

import { invalidateTagsAfterDelay, upsertListItem } from '@core/api/cache-utils';
import { config } from '@core/config/config';
import { createReactions } from '@core/redux/reactions';
import { releaseSubmitted, trackProcessed } from '@shared/events';

import { catalogApi } from '../api/endpoints';
import { toRowFromSubmission } from '../api/transformations';

export const registerCatalogReactions = createReactions((on) => {
  // The list endpoint won't have it for another couple of seconds (ADR-002), so
  // the announcement is what puts it on screen.
  on(releaseSubmitted, ({ release }, { dispatch }) => {
    dispatch(
      catalogApi.util.updateQueryData('releases', undefined, (releases) => {
        upsertListItem(releases, toRowFromSubmission(release));
      }),
    );

    if (config.cacheMode === 'naive') {
      // The demo's broken path — the patch above is correct, and this throws it
      // away: the refetch races the projection and wins with a list that predates
      // the write, so the row the user just created disappears (ADR-002).
      dispatch(catalogApi.util.invalidateTags(['Releases']));
      return;
    }

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
