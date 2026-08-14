// The rollups an analytics backend would compute: one scope, one window, and the
// window before it so the console can show a delta. Reads db.stats directly —
// nothing the console writes moves a stream count, so a lagging model here would
// be ceremony rather than ADR-002.

import { db, tracksFor } from './db';
import type { AnalyticsReport, DailyStat, Release } from './schemas';

/** Share of a release's streams each store reports, in the order the label onboarded them. */
const STORE_WEIGHTS = [0.47, 0.26, 0.17, 0.07, 0.03];

export const ANALYTICS_RANGES = [7, 30, 90] as const;

export type Scope = { kind: 'all' } | { kind: 'artist' | 'release'; id: string };

/** `all`, `artist:vaeda-grey`, `release:lor-0042`. Null for anything else. */
export function parseScope(value: string | null): Scope | null {
  if (!value || value === 'all') return { kind: 'all' };

  const [kind, id] = value.split(':');
  if ((kind === 'artist' || kind === 'release') && id) return { kind, id };
  return null;
}

const DAY_MS = 86400000;
const day = (time: number): string => new Date(time).toISOString().slice(0, 10);
const shift = (date: string, days: number): string => day(Date.parse(date) + days * DAY_MS);

/** The label's clock is the newest number it has, not the wall clock. */
function latestStatDate(): string {
  return db.stats.reduce((latest, stat) => (stat.date > latest ? stat.date : latest), '');
}

function releasesInScope(scope: Scope): Release[] {
  const all = [...db.releases.values()];

  switch (scope.kind) {
    case 'all':
      return all;
    case 'artist':
      return all.filter((release) => release.artistId === scope.id);
    case 'release':
      return all.filter((release) => release.id === scope.id);
  }
}

type Window = { from: string; to: string };

const inWindow = (stat: DailyStat, window: Window) =>
  stat.date >= window.from && stat.date <= window.to;

function rowsFor(releases: readonly Release[], window: Window): DailyStat[] {
  const ids = new Set(releases.map((release) => release.id));
  return db.stats.filter((stat) => ids.has(stat.releaseId) && inWindow(stat, window));
}

const sumStreams = (rows: readonly DailyStat[]) =>
  rows.reduce((total, row) => total + row.streams, 0);

const money = (amount: number) => Math.round(amount * 100) / 100;

/** One row per day, zero-filled: a gap in the chart would read as missing data. */
function series(rows: readonly DailyStat[], window: Window, days: number) {
  const byDate = new Map<string, { streams: number; revenue: number }>();
  for (const row of rows) {
    const totals = byDate.get(row.date) ?? { streams: 0, revenue: 0 };
    byDate.set(row.date, {
      streams: totals.streams + row.streams,
      revenue: totals.revenue + row.revenue,
    });
  }

  return Array.from({ length: days }, (_, offset) => {
    const date = shift(window.from, offset);
    const totals = byDate.get(date) ?? { streams: 0, revenue: 0 };
    return { date, streams: totals.streams, revenue: money(totals.revenue) };
  });
}

/** A store only reports what it holds — the weights are renormalised over the stores that took it. */
function byStore(releases: readonly Release[], window: Window): Map<string, number> {
  const totals = new Map(db.stores.map((store) => [store.id, 0]));

  for (const release of releases) {
    const streams = sumStreams(rowsFor([release], window));
    if (streams === 0) continue;

    const weights = db.stores.map((store, index) => {
      const delivery = release.deliveries.find((candidate) => candidate.storeId === store.id);
      return delivery?.status === 'delivered' ? (STORE_WEIGHTS[index] ?? 0) : 0;
    });

    const spread = weights.reduce((sum, weight) => sum + weight, 0);
    if (spread === 0) continue;

    db.stores.forEach((store, index) => {
      const share = (weights[index] ?? 0) / spread;
      totals.set(store.id, (totals.get(store.id) ?? 0) + Math.round(streams * share));
    });
  }

  return totals;
}

/** The pipeline does report per track; the mock splits a release's streams by position. */
function byTrack(releases: readonly Release[], window: Window): Map<string, number> {
  const totals = new Map<string, number>();

  for (const release of releases) {
    const streams = sumStreams(rowsFor([release], window));
    const tracks = tracksFor(release.id);
    if (streams === 0 || tracks.length === 0) continue;

    const weights = tracks.map((_, index) => 1 / (index + 2));
    const spread = weights.reduce((sum, weight) => sum + weight, 0);

    tracks.forEach((track, index) => {
      totals.set(track.id, Math.round((streams * (weights[index] ?? 0)) / spread));
    });
  }

  return totals;
}

export function analyticsReport(scope: Scope, days: number): AnalyticsReport {
  const to = latestStatDate();
  const current: Window = { from: shift(to, 1 - days), to };
  const earlier: Window = { from: shift(current.from, -days), to: shift(current.from, -1) };

  const releases = releasesInScope(scope);
  const rows = rowsFor(releases, current);
  const earlierRows = rowsFor(releases, earlier);

  const storesNow = byStore(releases, current);
  const storesBefore = byStore(releases, earlier);
  const tracksNow = byTrack(releases, current);
  const tracksBefore = byTrack(releases, earlier);

  return {
    scope: scope.kind === 'all' ? 'all' : `${scope.kind}:${scope.id}`,
    days,
    from: current.from,
    to: current.to,
    series: series(rows, current, days),

    // Null rather than zero: at 90 days the label has no earlier window, and a
    // −100% delta would be a lie about the numbers rather than about the range.
    previous: earlierRows.length
      ? {
          streams: sumStreams(earlierRows),
          revenue: money(earlierRows.reduce((total, row) => total + row.revenue, 0)),
        }
      : null,

    stores: db.stores.map((store) => ({
      storeId: store.id,
      storeName: store.name,
      streams: storesNow.get(store.id) ?? 0,
      previousStreams: storesBefore.get(store.id) ?? 0,
    })),

    tracks: [...tracksNow].flatMap(([trackId, streams]) => {
      const track = db.tracks.find((candidate) => candidate.id === trackId);
      const release = track ? db.releases.get(track.releaseId) : undefined;
      if (!track || !release) return [];

      return [
        {
          trackId,
          title: track.title,
          releaseId: release.id,
          releaseTitle: release.title,
          streams,
          previousStreams: tracksBefore.get(trackId) ?? 0,
        },
      ];
    }),
  };
}
