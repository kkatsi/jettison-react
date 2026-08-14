import { describe, expect, it } from 'vitest';

import { findPlaylistSpike, type DailyPoint } from './playlist-spike';

const days = (streams: readonly number[]): DailyPoint[] =>
  streams.map((value, index) => ({
    date: `2026-08-${String(index + 1).padStart(2, '0')}`,
    streams: value,
  }));

describe('finding a playlist spike', () => {
  it('names the run of days that cleared the baseline, and how far', () => {
    const spike = findPlaylistSpike(
      days([100, 110, 90, 105, 340, 380, 300, 95, 100, 105, 98, 102]),
    );

    expect(spike).toEqual({ from: '2026-08-05', to: '2026-08-07', multiple: 3.7 });
  });

  it('ignores a single loud day — that is a blip, not an add', () => {
    expect(findPlaylistSpike(days([100, 110, 90, 400, 95, 100, 105, 98]))).toBeNull();
  });

  it('finds nothing in an ordinary week', () => {
    expect(findPlaylistSpike(days([100, 118, 92, 105, 96, 110, 101]))).toBeNull();
  });

  it('keeps the longer of two runs', () => {
    const spike = findPlaylistSpike(
      days([100, 300, 310, 100, 100, 320, 330, 340, 100, 100, 100, 100]),
    );

    expect(spike).toMatchObject({ from: '2026-08-06', to: '2026-08-08' });
  });

  it('declines to guess on a series too short to have a baseline', () => {
    expect(findPlaylistSpike(days([100, 400, 420]))).toBeNull();
    expect(findPlaylistSpike([])).toBeNull();
  });

  it('says nothing about a release with no streams at all', () => {
    expect(findPlaylistSpike(days([0, 0, 0, 0, 0, 0, 0, 0]))).toBeNull();
  });
});
