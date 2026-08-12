// =============================================================================
// The mock backend's transport.
// =============================================================================
// Which model a handler reads is the interesting decision in every one of these:
//
//   list / aggregate reads → the projection  (lags the write model)
//   detail-by-id reads     → the write model (read-your-writes)
//
// That is the split ADR-002 commits to, and it is the split contributors have to
// keep thinking about as endpoints are added. Handlers arrive with the module that
// calls them; these three are what the shell and the activity module need.
// =============================================================================

import { delay, http, HttpResponse } from 'msw';

import { db, tracksFor } from './db';
import { activityFeedModel, releaseListModel } from './projection';
import { activityEventSchema, releaseDetailSchema, releaseSchema } from './schemas';

/** Enough latency for loading states to be real, little enough to stay usable. */
const NETWORK_MS = 140;

/** Origin-agnostic, so the same handlers serve the browser and the node tests. */
const url = (path: string) => `*/api${path}`;

export const handlers = [
  // The list every catalogue and distribution screen reads — and the one that is
  // briefly, deliberately wrong after a write.
  http.get(url('/releases'), async () => {
    await delay(NETWORK_MS);
    return HttpResponse.json(releaseSchema.array().parse(releaseListModel.read()));
  }),

  // Detail comes from the write model: the entity you just wrote is readable,
  // exactly as in the real systems this mock imitates.
  http.get(url('/releases/:id'), async ({ params }) => {
    await delay(NETWORK_MS);
    const release = db.releases.get(String(params.id));
    if (!release) return new HttpResponse(null, { status: 404 });

    return HttpResponse.json(
      releaseDetailSchema.parse({ ...release, tracks: tracksFor(release.id) }),
    );
  }),

  http.get(url('/activity'), async () => {
    await delay(NETWORK_MS);
    return HttpResponse.json(activityEventSchema.array().parse(activityFeedModel.read()));
  }),

  http.get(url('/stores'), async () => {
    await delay(NETWORK_MS);
    return HttpResponse.json(db.stores);
  }),
];
