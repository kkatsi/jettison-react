import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { audioStatusAt, db, nextCatalogNumber, PROCESSING_MS, UPLOAD_MS } from './db';
import { handlers } from './handlers';
import { activityFeedModel, releaseListModel, scheduleProjections } from './projection';
import type { ActivityEvent, AnalyticsReport, Release, ReleaseDetail } from './schemas';

// Shorter than the app's 2.5s, but longer than the handlers' network delay, or the
// projection lands while the response is still in flight.
vi.mock('@core/config/config', () => ({
  config: {
    apiBaseUrl: '/api',
    cacheMode: 'events',
    readModelLagMs: 400,
    reconcileDelayMs: 1400,
    networkMs: 20,
  },
}));

const server = setupServer(...handlers);
const api = 'http://localhost/api';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const newRelease = (): Release => {
  const template = db.releases.get('lor-0042');
  if (!template) throw new Error('seed changed: lor-0042 is gone');
  return { ...template, id: 'lor-0099', catalogNumber: 'LOR-0099', title: 'Signal Lost' };
};

describe('the mock backend', () => {
  it('serves the seeded catalogue', async () => {
    const releases = (await (await fetch(`${api}/releases`)).json()) as Release[];
    expect(releases).toHaveLength(31);
    expect(releases.some((release) => release.catalogNumber === 'LOR-0042')).toBe(true);
  });

  it('404s an unknown release rather than inventing one', async () => {
    expect((await fetch(`${api}/releases/lor-9999`)).status).toBe(404);
  });

  it('answers a detail read from the write model, and the list from the projection', async () => {
    // A write: in the write model at once, not yet in the projection.
    db.releases.set('lor-0099', newRelease());
    scheduleProjections();

    const detail = await (await fetch(`${api}/releases/lor-0099`)).json();
    expect(detail).toMatchObject({ catalogNumber: 'LOR-0099', title: 'Signal Lost' });

    const before = (await (await fetch(`${api}/releases`)).json()) as Release[];
    expect(before.some((release) => release.id === 'lor-0099')).toBe(false);

    // …and catches up once the projection lands. That gap is the whole point.
    await wait(500);
    const after = (await (await fetch(`${api}/releases`)).json()) as Release[];
    expect(after.some((release) => release.id === 'lor-0099')).toBe(true);

    db.releases.delete('lor-0099');
    scheduleProjections();
    await wait(500);
    expect(releaseListModel.read().some((release) => release.id === 'lor-0099')).toBe(false);
  });

  it('withdraws a release out of the stores and records why', async () => {
    // Sodium Sun is mid-delivery in the seed, so there is something to undo.
    const before = db.releases.get('lor-0058');
    if (!before) throw new Error('seed changed: lor-0058 is gone');

    const withdrawn = (await (
      await fetch(`${api}/releases/lor-0058/withdraw`, { method: 'POST' })
    ).json()) as ReleaseDetail;

    expect(withdrawn.status).toBe('draft');
    expect(withdrawn.submittedAt).toBeNull();
    expect(withdrawn.deliveries.every((delivery) => delivery.status === 'pending')).toBe(true);
    expect(withdrawn.tracks.length).toBeGreaterThan(0);

    // The fact the client's own event announced, now on the backend too — which
    // is what makes the delayed reconcile a confirmation rather than a surprise.
    await wait(500);
    const feed = (await (await fetch(`${api}/activity`)).json()) as ActivityEvent[];
    expect(feed[0]).toMatchObject({
      type: 'domain/releases/withdrawn',
      release: { id: 'lor-0058' },
    });

    db.releases.set('lor-0058', before);
    db.activity.shift();
    scheduleProjections();
    await wait(500);
    expect(activityFeedModel.read()[0]?.release.id).not.toBe('lor-0058');
  });

  it('404s a withdrawal of something that was never there', async () => {
    const response = await fetch(`${api}/releases/lor-9999/withdraw`, { method: 'POST' });
    expect(response.status).toBe(404);
  });
});

describe('the wizard write paths', () => {
  const post = (path: string, body?: unknown) =>
    fetch(`${api}${path}`, {
      method: 'POST',
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

  /** Everything a submission needs, in the order the wizard fills it in. */
  const readyDraft = async () => {
    const draft = (await (await post('/releases')).json()) as ReleaseDetail;

    await fetch(`${api}/releases/${draft.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Signal Fade', artistId: 'kessa-nu' }),
    });
    await post(`/releases/${draft.id}/tracks`, { name: 'ignition-hour.wav', size: 60_000_000 });

    return draft.id;
  };

  const forget = (id: string) => {
    db.releases.delete(id);
    db.tracks = db.tracks.filter((track) => track.releaseId !== id);
  };

  it('allocates the next catalogue number rather than let the console guess', async () => {
    const draft = (await (await post('/releases')).json()) as ReleaseDetail;

    expect(draft.catalogNumber).toBe('LOR-0074');
    expect(draft.status).toBe('draft');
    expect(draft.tracks).toEqual([]);
    // Five stores, none of them told anything yet.
    expect(draft.deliveries).toHaveLength(5);

    // A draft starts on a date the stores would accept, and near enough that the
    // board's four-week strip has somewhere to put it.
    const lead = (Date.parse(`${draft.releaseDate}T00:00:00Z`) - Date.now()) / 86_400_000;
    expect(lead).toBeGreaterThanOrEqual(7);
    expect(lead).toBeLessThan(28);

    forget(draft.id);
  });

  it('hands back the blank draft it already has rather than burn a second number', async () => {
    const first = await post('/releases');
    const draft = (await first.json()) as ReleaseDetail;

    const second = await post('/releases');
    const again = (await second.json()) as ReleaseDetail;

    expect(first.status).toBe(201);
    // Nothing was created the second time, and the status says so.
    expect(second.status).toBe(200);
    expect(again.id).toBe(draft.id);
    expect(db.releases.size).toBe(32);

    forget(draft.id);
  });

  it('starts a new one once the last has been touched', async () => {
    const first = await readyDraft();
    const next = (await (await post('/releases')).json()) as ReleaseDetail;

    expect(next.id).not.toBe(first);
    expect(next.catalogNumber).toBe('LOR-0075');

    forget(first);
    forget(next.id);
  });

  it('never mistakes a real draft for an abandoned one', async () => {
    // Three seeded drafts have titles, tracks and dates somebody chose.
    const draft = (await (await post('/releases')).json()) as ReleaseDetail;

    expect(draft.catalogNumber).toBe('LOR-0074');
    forget(draft.id);
  });

  it('names the artist the console only sent an id for', async () => {
    const id = await readyDraft();
    const saved = (await (await fetch(`${api}/releases/${id}`)).json()) as ReleaseDetail;

    expect(saved).toMatchObject({ title: 'Signal Fade', artistName: 'Kessa Nu' });
    forget(id);
  });

  it('rejects a patch it cannot make sense of', async () => {
    const draft = (await (await post('/releases')).json()) as ReleaseDetail;

    const response = await fetch(`${api}/releases/${draft.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ type: 'Mixtape' }),
    });

    expect(response.status).toBe(400);
    forget(draft.id);
  });

  it('refuses to edit a release the stores already have', async () => {
    const response = await fetch(`${api}/releases/lor-0042`, {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Renamed' }),
    });

    expect(response.status).toBe(409);
    expect(db.releases.get('lor-0042')?.title).toBe('Neon Arterial');
  });

  it('takes an upload as a track whose audio is still on its way', async () => {
    const id = await readyDraft();
    const detail = (await (await fetch(`${api}/releases/${id}`)).json()) as ReleaseDetail;
    const [track] = detail.tracks;

    expect(track).toMatchObject({ number: 1, title: 'ignition-hour', audioStatus: 'uploading' });
    // Read off the file, the way a real ingest would.
    expect(track?.durationMs).toBeGreaterThan(120_000);
    expect(track?.isrc).toHaveLength(12);

    forget(id);
  });

  it('writes the tracklist as a list — retitled, reordered and shortened at once', async () => {
    const id = await readyDraft();
    await post(`/releases/${id}/tracks`, { name: 'sodium-sun.wav', size: 50_000_000 });
    await post(`/releases/${id}/tracks`, { name: 'undertow.wav', size: 40_000_000 });

    const before = (await (await fetch(`${api}/releases/${id}`)).json()) as ReleaseDetail;
    const [first, second, third] = before.tracks;

    const after = (await (
      await fetch(`${api}/releases/${id}/tracks`, {
        method: 'PUT',
        body: JSON.stringify([
          { id: third?.id, title: 'Undertow (Reprise)' },
          { id: first?.id, title: first?.title },
        ]),
      })
    ).json()) as ReleaseDetail;

    expect(after.tracks.map((track) => [track.number, track.title])).toEqual([
      [1, 'Undertow (Reprise)'],
      [2, 'ignition-hour'],
    ]);
    // The one left out of the list is the one that was removed.
    expect(after.tracks.some((track) => track.id === second?.id)).toBe(false);

    forget(id);
  });

  it('discards a draft and the tracks that were only ever its', async () => {
    const id = await readyDraft();

    expect((await fetch(`${api}/releases/${id}`, { method: 'DELETE' })).status).toBe(204);
    expect((await fetch(`${api}/releases/${id}`)).status).toBe(404);
    expect(db.tracks.some((track) => track.releaseId === id)).toBe(false);

    // …but never one the stores have seen.
    expect((await fetch(`${api}/releases/lor-0042`, { method: 'DELETE' })).status).toBe(409);
  });

  it('holds a submission back until the audio is ready', async () => {
    const id = await readyDraft();

    expect((await post(`/releases/${id}/submit`)).status).toBe(422);
    forget(id);
  });

  it('submits into the stores, and the feed says so', async () => {
    const id = await readyDraft();
    // The file arrived a minute ago, so ingestion has long since finished.
    for (const track of db.tracks.filter((candidate) => candidate.releaseId === id)) {
      track.uploadedAt = new Date(Date.now() - 60_000).toISOString();
    }

    const submitted = (await (await post(`/releases/${id}/submit`)).json()) as ReleaseDetail;

    expect(submitted.status).toBe('submitted');
    expect(submitted.submittedAt).not.toBeNull();
    expect(submitted.deliveries.every((delivery) => delivery.status === 'in-review')).toBe(true);

    await wait(500);
    const feed = (await (await fetch(`${api}/activity`)).json()) as ActivityEvent[];
    expect(feed[0]).toMatchObject({ type: 'domain/releases/submitted', release: { id } });

    db.activity.shift();
    forget(id);
    scheduleProjections();
    await wait(500);
  });

  it('serves the roster the artist picker reads from', async () => {
    const artists = (await (await fetch(`${api}/artists`)).json()) as { id: string }[];
    expect(artists).toHaveLength(9);
  });

  it('serves an analytics window, and refuses a range it does not keep', async () => {
    const report = (await (
      await fetch(`${api}/analytics?scope=release:lor-0042&days=30`)
    ).json()) as AnalyticsReport;

    expect(report.series).toHaveLength(30);
    expect(report.scope).toBe('release:lor-0042');

    expect((await fetch(`${api}/analytics?scope=all&days=45`)).status).toBe(400);
    expect((await fetch(`${api}/analytics?scope=label:lor-0042&days=30`)).status).toBe(400);
  });
});

describe('ingestion, computed when someone reads it', () => {
  const uploadedAt = '2026-08-13T09:00:00.000Z';
  const at = (ms: number) => audioStatusAt(uploadedAt, Date.parse(uploadedAt) + ms);

  it('walks upload → processing → ready off the clock alone', () => {
    expect(at(0)).toBe('uploading');
    expect(at(UPLOAD_MS - 1)).toBe('uploading');
    expect(at(UPLOAD_MS)).toBe('processing');
    expect(at(UPLOAD_MS + PROCESSING_MS - 1)).toBe('processing');
    expect(at(UPLOAD_MS + PROCESSING_MS)).toBe('ready');
    expect(at(600_000)).toBe('ready');
  });

  it('numbers the next release after the highest one issued', () => {
    expect(nextCatalogNumber(['LOR-0042', 'LOR-0073', 'LOR-0018'])).toBe('LOR-0074');
    expect(nextCatalogNumber([])).toBe('LOR-0001');
  });
});
