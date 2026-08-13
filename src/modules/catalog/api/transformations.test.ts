import { describe, expect, it } from 'vitest';

import {
  formatDuration,
  formatStreams,
  formatTimestamp,
  toRelease,
  toReleaseDetail,
  toStoreDeliveries,
} from './transformations';
import type { ReleaseDetailDto, ReleaseDto, TrackDto } from './types';

const release: ReleaseDto = {
  id: 'lor-0042',
  catalogNumber: 'LOR-0042',
  title: 'Neon Arterial',
  artistId: 'vaeda-grey',
  artistName: 'Vaeda Grey',
  type: 'Album',
  status: 'live',
  releaseDate: '2026-05-08',
  submittedAt: '2026-04-11T09:12:33.000Z',
  artwork: { from: '#6D3B8F', to: '#2A1140' },
  streams30d: 1284300,
  streamsTrend: [1, 2, 3],
  deliveries: [
    { storeId: 'soundry', status: 'delivered', deliveredAt: '2026-05-09T14:02:00.000Z' },
    { storeId: 'pulsar', status: 'pending', deliveredAt: null },
  ],
};

const track = (overrides: Partial<TrackDto> = {}): TrackDto => ({
  id: 'lor-0042-t1',
  releaseId: 'lor-0042',
  number: 1,
  title: 'Ashline',
  durationMs: 222000,
  isrc: 'GBLOR2600001',
  audioStatus: 'ready',
  ...overrides,
});

describe('toRelease', () => {
  it('renders the values the table shows, and keeps the ones it sorts by', () => {
    const row = toRelease(release);

    expect(row.streamsLabel).toBe('1.28M');
    expect(row.submittedLabel).toBe('2026-04-11 09:12');
    // The raw timestamp survives: the board sorts on it.
    expect(row.submittedAt).toBe('2026-04-11T09:12:33.000Z');
  });

  it('does not invent a submission for a draft', () => {
    const row = toRelease({ ...release, status: 'draft', submittedAt: null });
    expect(row.submittedLabel).toBe('—');
    expect(row.submittedAt).toBeNull();
  });
});

describe('toReleaseDetail', () => {
  it('puts the tracklist in track order whatever order it arrived in', () => {
    const dto: ReleaseDetailDto = {
      ...release,
      tracks: [track({ id: 'b', number: 3 }), track({ id: 'a', number: 1 })],
    };

    expect(toReleaseDetail(dto).tracks.map((entry) => entry.number)).toEqual([1, 3]);
  });
});

describe('toStoreDeliveries', () => {
  const stores = [
    { id: 'soundry', name: 'Soundry' },
    { id: 'pulsar', name: 'Pulsar' },
    { id: 'tidewave', name: 'Tidewave' },
  ];

  it('names every store, including ones the release never reached', () => {
    const rows = toStoreDeliveries(release.deliveries, stores);

    expect(rows.map((row) => row.storeName)).toEqual(['Soundry', 'Pulsar', 'Tidewave']);
    expect(rows[0]).toMatchObject({ status: 'delivered', deliveredLabel: '2026-05-09 14:02' });
    expect(rows[1]).toMatchObject({ status: 'pending', deliveredLabel: '—' });
    // Never sent: pending, not an error, and not silently dropped.
    expect(rows[2]).toMatchObject({ status: 'pending', deliveredLabel: '—' });
  });
});

describe('the formatters', () => {
  it('reads streams the way a label does', () => {
    expect(formatStreams(0)).toBe('—');
    expect(formatStreams(842)).toBe('842');
    expect(formatStreams(842110)).toBe('842K');
    expect(formatStreams(1284300)).toBe('1.28M');
    expect(formatStreams(3120450)).toBe('3.12M');
  });

  it('shows timestamps in UTC, to the minute', () => {
    expect(formatTimestamp('2026-08-11T09:12:33.000Z')).toBe('2026-08-11 09:12');
    expect(formatTimestamp(null)).toBe('—');
  });

  it('pads track durations like a tracklist', () => {
    expect(formatDuration(222000)).toBe('3:42');
    expect(formatDuration(65000)).toBe('1:05');
    expect(formatDuration(600000)).toBe('10:00');
  });
});
