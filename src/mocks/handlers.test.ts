import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { db } from './db';
import { handlers } from './handlers';
import { activityFeedModel, releaseListModel, scheduleProjections } from './projection';
import type { ActivityEvent, Release, ReleaseDetail } from './schemas';

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
