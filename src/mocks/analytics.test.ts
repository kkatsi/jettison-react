import { describe, expect, it } from 'vitest';

import { analyticsReport, parseScope } from './analytics';
import { db } from './db';

describe('scope parsing', () => {
  it('reads the three shapes the console asks in, and nothing else', () => {
    expect(parseScope(null)).toEqual({ kind: 'all' });
    expect(parseScope('all')).toEqual({ kind: 'all' });
    expect(parseScope('artist:vaeda-grey')).toEqual({ kind: 'artist', id: 'vaeda-grey' });
    expect(parseScope('release:lor-0042')).toEqual({ kind: 'release', id: 'lor-0042' });
    expect(parseScope('label:lor-0042')).toBeNull();
    expect(parseScope('artist:')).toBeNull();
  });
});

describe('the analytics rollup', () => {
  it('windows the requested number of days, newest last', () => {
    const report = analyticsReport({ kind: 'release', id: 'lor-0042' }, 7);

    expect(report.series).toHaveLength(7);
    expect(report.series.at(0)?.date).toBe(report.from);
    expect(report.series.at(-1)?.date).toBe(report.to);
    expect(report.from < report.to).toBe(true);
  });

  it('has no earlier window to compare at 90 days, and says so', () => {
    expect(analyticsReport({ kind: 'all' }, 30).previous).not.toBeNull();
    expect(analyticsReport({ kind: 'all' }, 90).previous).toBeNull();
  });

  it('scopes to one artist: their releases and no others', () => {
    const artist = analyticsReport({ kind: 'artist', id: 'vaeda-grey' }, 30);
    const label = analyticsReport({ kind: 'all' }, 30);
    const total = (streams: number, day: { streams: number }) => streams + day.streams;

    const artistStreams = artist.series.reduce(total, 0);
    expect(artistStreams).toBeGreaterThan(0);
    expect(artistStreams).toBeLessThan(label.series.reduce(total, 0));
  });

  it('splits a release across the stores that hold it, and loses nothing on the way', () => {
    const report = analyticsReport({ kind: 'release', id: 'lor-0042' }, 30);
    const windowStreams = report.series.reduce((sum, day) => sum + day.streams, 0);
    const storeStreams = report.stores.reduce((sum, store) => sum + store.streams, 0);

    // Per-store rounding, five stores.
    expect(Math.abs(storeStreams - windowStreams)).toBeLessThanOrEqual(5);
    expect(report.stores).toHaveLength(db.stores.length);
    expect(report.stores.every((store) => store.streams > 0)).toBe(true);
  });

  it('moves each store on its own — one split for every window reads as one number five times', () => {
    for (const scope of [{ kind: 'all' } as const, { kind: 'release', id: 'lor-0042' } as const]) {
      const { stores, tracks } = analyticsReport(scope, 30);

      const storeTrends = stores.map((store) => (store.streams / store.previousStreams).toFixed(3));
      const trackTrends = tracks.map((track) => (track.streams / track.previousStreams).toFixed(3));

      expect(new Set(storeTrends).size).toBeGreaterThan(1);
      expect(new Set(trackTrends).size).toBeGreaterThan(1);
    }
  });

  it('gives a track fewer streams the further down the tracklist it sits', () => {
    const report = analyticsReport({ kind: 'release', id: 'lor-0042' }, 30);
    const ordered = report.tracks.filter((track) => track.releaseId === 'lor-0042');

    expect(ordered.length).toBeGreaterThan(1);
    expect(ordered.at(0)?.streams).toBeGreaterThan(ordered.at(-1)?.streams ?? 0);
  });

  it('reports nothing for a release the stores never took', () => {
    // A draft has no numbers, and inventing some would be the one dishonest pixel.
    const report = analyticsReport({ kind: 'release', id: 'lor-0069' }, 30);

    expect(report.series.every((day) => day.streams === 0)).toBe(true);
    expect(report.stores.every((store) => store.streams === 0)).toBe(true);
    expect(report.tracks).toHaveLength(0);
  });
});
