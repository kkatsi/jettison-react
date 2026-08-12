// Which model a handler reads is the decision to get right every time:
// lists and aggregates from the projection, detail-by-id from the write model.

import { delay, http, HttpResponse } from 'msw';

import { db, tracksFor } from './db';
import { activityFeedModel, releaseListModel } from './projection';
import { activityEventSchema, releaseDetailSchema, releaseSchema } from './schemas';

/** Enough latency for loading states to be real. */
const NETWORK_MS = 140;

/** Origin-agnostic so the node tests hit the same handlers. */
const url = (path: string) => `*/api${path}`;

export const handlers = [
  // Briefly, deliberately wrong after a write.
  http.get(url('/releases'), async () => {
    await delay(NETWORK_MS);
    return HttpResponse.json(releaseSchema.array().parse(releaseListModel.read()));
  }),

  // Detail reads the write model, so a just-written release is there.
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
