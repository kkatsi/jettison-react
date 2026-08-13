import { describe, expect, it } from 'vitest';

import type { Release } from '../../api/types';
import {
  DEFAULT_FILTERS,
  artistOptions,
  filterReleases,
  isFiltered,
  pageWindow,
  paginate,
} from './catalog-filters';

const release = (overrides: Partial<Release> = {}): Release => ({
  id: 'lor-0042',
  catalogNumber: 'LOR-0042',
  title: 'Neon Arterial',
  artistId: 'vaeda-grey',
  artistName: 'Vaeda Grey',
  type: 'Album',
  status: 'live',
  releaseDate: '2026-05-08',
  submittedAt: '2026-04-11T09:12:33.000Z',
  submittedLabel: '2026-04-11 09:12',
  artwork: { from: '#6D3B8F', to: '#2A1140' },
  streamsLabel: '1.28M',
  streams30d: 1284300,
  streamsTrend: [],
  deliveries: [],
  ...overrides,
});

describe('isFiltered', () => {
  it('ignores the page — turning to page 2 is a position, not a filter', () => {
    expect(isFiltered({ ...DEFAULT_FILTERS, page: 4 })).toBe(false);
    expect(isFiltered({ ...DEFAULT_FILTERS, stage: 'draft' })).toBe(true);
    // Whitespace is not a search — it must not light Reset up either.
    expect(isFiltered({ ...DEFAULT_FILTERS, query: '   ' })).toBe(false);
  });
});

describe('filterReleases', () => {
  const releases = [
    release(),
    release({
      id: 'lor-0045',
      catalogNumber: 'LOR-0045',
      title: 'Undertow',
      artistId: 'kessa-nu',
      artistName: 'Kessa Nu',
      type: 'Single',
    }),
    release({
      id: 'lor-0069',
      catalogNumber: 'LOR-0069',
      title: 'Fluorescent Kids',
      artistId: 'marisol-vane',
      artistName: 'Marisol Vane',
      status: 'draft',
    }),
  ];

  it('searches title, artist and catalogue number — the three things anyone types', () => {
    expect(filterReleases(releases, { ...DEFAULT_FILTERS, query: 'undertow' })).toHaveLength(1);
    expect(filterReleases(releases, { ...DEFAULT_FILTERS, query: 'kessa' })).toHaveLength(1);
    expect(filterReleases(releases, { ...DEFAULT_FILTERS, query: 'LOR-0069' })).toHaveLength(1);
    expect(filterReleases(releases, { ...DEFAULT_FILTERS, query: '  NEON  ' })).toHaveLength(1);
  });

  it('combines the dropdowns', () => {
    expect(
      filterReleases(releases, { ...DEFAULT_FILTERS, artist: 'vaeda-grey', type: 'Album' }),
    ).toHaveLength(1);
    expect(
      filterReleases(releases, { ...DEFAULT_FILTERS, artist: 'vaeda-grey', type: 'Single' }),
    ).toHaveLength(0);
  });

  it('filters by the stage on the chip, not by the raw status', () => {
    // Every store has it, so the chip says Live even though the row still says
    // delivering. Filtering to Live has to find it, or the table disagrees with
    // itself in front of the user.
    const delivered = release({
      status: 'delivering',
      deliveries: [
        { storeId: 'soundry', status: 'delivered', deliveredAt: '2026-05-09T14:02:00.000Z' },
      ],
    });

    expect(filterReleases([delivered], { ...DEFAULT_FILTERS, stage: 'live' })).toHaveLength(1);
    expect(filterReleases([delivered], { ...DEFAULT_FILTERS, stage: 'delivering' })).toHaveLength(
      0,
    );
  });

  it('filters by artist id, not by name — two artists may share a name, never an id', () => {
    expect(filterReleases(releases, { ...DEFAULT_FILTERS, artist: 'Kessa Nu' })).toHaveLength(0);
    expect(filterReleases(releases, { ...DEFAULT_FILTERS, artist: 'kessa-nu' })).toHaveLength(1);
  });
});

describe('paginate', () => {
  const items = Array.from({ length: 31 }, (_, index) => index);

  it('describes the slice the way the footer reads it', () => {
    expect(paginate(items, 1, 12)).toMatchObject({
      page: 1,
      pageCount: 3,
      label: 'Showing 1–12 of 31 releases',
    });
    expect(paginate(items, 3, 12).label).toBe('Showing 25–31 of 31 releases');
  });

  it('clamps a page that filtering has left behind', () => {
    // Was on page 4, a filter cut the list to eight rows: land on the last page,
    // not on an empty table with no way back.
    expect(paginate(items.slice(0, 8), 4, 12)).toMatchObject({ page: 1, pageCount: 1 });
    expect(paginate(items, 99, 12).page).toBe(3);
    expect(paginate(items, 0, 12).page).toBe(1);
  });

  it('says so when nothing survived the filters', () => {
    expect(paginate([], 1, 12)).toMatchObject({
      items: [],
      pageCount: 1,
      label: 'Showing 0 releases',
    });
  });
});

describe('pageWindow', () => {
  it('keeps the ends, the neighbours, and one gap between runs', () => {
    expect(pageWindow(1, 3)).toEqual([1, 2, 3]);
    expect(pageWindow(5, 9)).toEqual([1, 'gap', 4, 5, 6, 'gap', 9]);
    expect(pageWindow(1, 1)).toEqual([1]);
  });
});

describe('artistOptions', () => {
  it('offers each artist once, alphabetically, from the catalogue itself', () => {
    const options = artistOptions([
      release({ artistId: 'kessa-nu', artistName: 'Kessa Nu' }),
      release(),
      release({ artistId: 'kessa-nu', artistName: 'Kessa Nu' }),
    ]);

    expect(options).toEqual([
      { value: 'kessa-nu', label: 'Kessa Nu' },
      { value: 'vaeda-grey', label: 'Vaeda Grey' },
    ]);
  });
});
