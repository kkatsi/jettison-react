import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { db } from './db';
import { handlers } from './handlers';
import { releaseListModel, scheduleProjections } from './projection';
import type { Release } from './schemas';

// Shorter than the app's 2.5s, but longer than the handlers' network delay, or the
// projection lands while the response is still in flight.
vi.mock('@core/config/config', () => ({
  config: { apiBaseUrl: '/api', cacheMode: 'events', readModelLagMs: 400, reconcileDelayMs: 1400 },
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
});
