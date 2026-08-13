// Which model a handler reads is the decision to get right every time:
// lists and aggregates from the projection, detail-by-id from the write model.

import { delay, http, HttpResponse } from 'msw';

import { config } from '@core/config/config';

import {
  addTrack,
  createDraft,
  db,
  replaceTracks,
  submitRelease,
  tracksFor,
  updateDraft,
  withdrawRelease,
} from './db';
import { activityFeedModel, releaseListModel, scheduleProjections } from './projection';
import {
  activityEventSchema,
  audioUploadSchema,
  draftPatchSchema,
  releaseDetailSchema,
  releaseSchema,
  tracklistSchema,
} from './schemas';
import type { Release } from './schemas';

/** Enough latency for loading states to be real. Turn it up with VITE_NETWORK_MS. */
const NETWORK_MS = config.networkMs;

/** Origin-agnostic so the node tests hit the same handlers. */
const url = (path: string) => `*/api${path}`;

const detail = (release: Release) =>
  HttpResponse.json(releaseDetailSchema.parse({ ...release, tracks: tracksFor(release.id) }));

/** A draft is the only thing the wizard may write to: everything else is with the stores. */
function editableDraft(id: string): Release | Response {
  const release = db.releases.get(id);
  if (!release) return new HttpResponse(null, { status: 404 });
  if (release.status !== 'draft') return new HttpResponse(null, { status: 409 });
  return release;
}

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

    return detail(release);
  }),

  // The wizard opens on a real release: the catalogue number is the label's to
  // allocate, so the console asks for one rather than inventing it.
  http.post(url('/releases'), async () => {
    await delay(NETWORK_MS);
    const draft = createDraft();

    scheduleProjections();
    return HttpResponse.json(releaseDetailSchema.parse({ ...draft, tracks: [] }), { status: 201 });
  }),

  http.patch(url('/releases/:id'), async ({ params, request }) => {
    await delay(NETWORK_MS);
    const draft = editableDraft(String(params.id));
    if (draft instanceof Response) return draft;

    const patch = draftPatchSchema.safeParse(await request.json());
    if (!patch.success) return new HttpResponse(null, { status: 400 });

    scheduleProjections();
    return detail(updateDraft(draft, patch.data));
  }),

  http.post(url('/releases/:id/tracks'), async ({ params, request }) => {
    await delay(NETWORK_MS);
    const draft = editableDraft(String(params.id));
    if (draft instanceof Response) return draft;

    const file = audioUploadSchema.safeParse(await request.json());
    if (!file.success) return new HttpResponse(null, { status: 400 });

    addTrack(draft, file.data);
    return detail(draft);
  }),

  // One write for retitling, reordering and removing — the tracklist is a list.
  http.put(url('/releases/:id/tracks'), async ({ params, request }) => {
    await delay(NETWORK_MS);
    const draft = editableDraft(String(params.id));
    if (draft instanceof Response) return draft;

    const order = tracklistSchema.safeParse(await request.json());
    if (!order.success) return new HttpResponse(null, { status: 400 });

    replaceTracks(draft, order.data);
    return detail(draft);
  }),

  // The console decides what is submittable; the backend still checks, because a
  // disabled button is not a rule.
  http.post(url('/releases/:id/submit'), async ({ params }) => {
    await delay(NETWORK_MS);
    const draft = editableDraft(String(params.id));
    if (draft instanceof Response) return draft;

    const tracks = tracksFor(draft.id);
    if (!draft.title || !draft.artistId || tracks.length === 0) {
      return new HttpResponse(null, { status: 422 });
    }
    if (tracks.some((track) => track.audioStatus !== 'ready')) {
      return new HttpResponse(null, { status: 422 });
    }

    const submitted = submitRelease(draft);
    scheduleProjections();
    return detail(submitted);
  }),

  // The write lands now; the lists that show it catch up later (ADR-002).
  http.post(url('/releases/:id/withdraw'), async ({ params }) => {
    await delay(NETWORK_MS);
    const release = withdrawRelease(String(params.id));
    if (!release) return new HttpResponse(null, { status: 404 });

    scheduleProjections();
    return detail(release);
  }),

  // `?releaseId=` narrows the same feed: catalog's detail screen shows one
  // release's history, and asking the client to fetch forty events to render six
  // would be a slow screen (Ch. 4 §1 — two modules, one resource).
  http.get(url('/activity'), async ({ request }) => {
    await delay(NETWORK_MS);
    const releaseId = new URL(request.url).searchParams.get('releaseId');
    const feed = activityFeedModel.read();

    return HttpResponse.json(
      activityEventSchema
        .array()
        .parse(releaseId ? feed.filter((event) => event.release.id === releaseId) : feed),
    );
  }),

  http.get(url('/stores'), async () => {
    await delay(NETWORK_MS);
    return HttpResponse.json(db.stores);
  }),

  http.get(url('/artists'), async () => {
    await delay(NETWORK_MS);
    return HttpResponse.json(db.artists);
  }),
];
