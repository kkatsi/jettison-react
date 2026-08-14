import { describe, expect, it } from 'vitest';

import type { Release } from '../../api/types';
import {
  DEFAULT_BOARD_FILTERS,
  filterPipeline,
  isBoardFiltered,
  sortByNewestSubmission,
} from './board-filters';

const release = (overrides: Partial<Release> = {}): Release => ({
  id: 'lor-0042',
  catalogNumber: 'LOR-0042',
  title: 'Neon Arterial',
  artistId: 'vaeda-grey',
  artistName: 'Vaeda Grey',
  type: 'Album',
  status: 'delivering',
  releaseDate: '2026-08-14',
  submittedAt: '2026-08-11T09:12:33.000Z',
  submittedLabel: '2026-08-11 09:12',
  artwork: { from: '#6D3B8F', to: '#2A1140' },
  streamsLabel: '—',
  streams30d: 0,
  streamsTrend: [],
  deliveries: [{ storeId: 'soundry', status: 'pending', deliveredAt: null }],
  ...overrides,
});

describe('isBoardFiltered', () => {
  it('leaves a clean board on a clean link', () => {
    expect(isBoardFiltered(DEFAULT_BOARD_FILTERS)).toBe(false);
    expect(isBoardFiltered({ artist: 'kessa-nu', stage: 'all' })).toBe(true);
    expect(isBoardFiltered({ artist: 'all', stage: 'blocked' })).toBe(true);
  });
});

describe('sortByNewestSubmission', () => {
  it('shows the pipeline newest first', () => {
    const rows = sortByNewestSubmission([
      release({ id: 'older', submittedAt: '2026-08-01T17:39:00.000Z' }),
      release({ id: 'newest', submittedAt: '2026-08-12T07:55:00.000Z' }),
      release({ id: 'middle', submittedAt: '2026-08-11T08:40:00.000Z' }),
    ]);

    expect(rows.map((row) => row.id)).toEqual(['newest', 'middle', 'older']);
  });

  it('drops what is not in the pipeline — including a release just withdrawn', () => {
    const rows = sortByNewestSubmission([
      release(),
      release({ id: 'draft', status: 'draft', submittedAt: null }),
      // The withdrawal patch clears the status first; it must leave immediately.
      release({ id: 'withdrawn', status: 'draft' }),
    ]);

    expect(rows.map((row) => row.id)).toEqual(['lor-0042']);
  });

  it('lets a release graduate once every store has taken it', () => {
    const rows = sortByNewestSubmission([
      release(),
      release({
        id: 'live',
        status: 'live',
        deliveries: [
          { storeId: 'soundry', status: 'delivered', deliveredAt: '2026-05-09T14:02:00.000Z' },
        ],
      }),
    ]);

    expect(rows.map((row) => row.id)).toEqual(['lor-0042']);
  });

  it('keeps a blocked release, because a stopped delivery is what a board is for', () => {
    const rows = sortByNewestSubmission([
      release({
        id: 'blocked',
        deliveries: [{ storeId: 'soundry', status: 'rejected', deliveredAt: null }],
      }),
    ]);

    expect(rows.map((row) => row.id)).toEqual(['blocked']);
  });

  it('does not mutate what it was given', () => {
    const input = [
      release({ id: 'a', submittedAt: '2026-08-01T00:00:00.000Z' }),
      release({ id: 'b' }),
    ];
    sortByNewestSubmission(input);
    expect(input.map((entry) => entry.id)).toEqual(['a', 'b']);
  });
});

describe('filterPipeline', () => {
  it('filters by artist and by the stage on the chip', () => {
    const rows = [
      release(),
      release({ id: 'other', artistId: 'kessa-nu', artistName: 'Kessa Nu' }),
      release({
        id: 'blocked',
        deliveries: [{ storeId: 'soundry', status: 'rejected', deliveredAt: null }],
      }),
    ];

    expect(filterPipeline(rows, { artist: 'kessa-nu', stage: 'all' })).toHaveLength(1);
    expect(filterPipeline(rows, { artist: 'all', stage: 'blocked' })).toHaveLength(1);
    expect(filterPipeline(rows, { artist: 'kessa-nu', stage: 'blocked' })).toHaveLength(0);
  });
});
