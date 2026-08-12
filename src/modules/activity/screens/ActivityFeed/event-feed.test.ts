import { describe, expect, it } from 'vitest';

import type { ActivityEvent, ActivityEventType } from '../../types';
import {
  DEFAULT_FILTERS,
  feedClock,
  filterEvents,
  filterParams,
  groupEventsByDay,
  isFiltered,
  readFilters,
} from './event-feed';

const NOW = Date.parse('2026-08-12T12:00:00.000Z');

const event = (
  id: string,
  at: string,
  type: ActivityEventType = 'domain/releases/submitted',
  extra: Partial<ActivityEvent> = {},
): ActivityEvent => ({
  id,
  type,
  at,
  actor: 'Mara Kessler',
  summary: 'Neon Arterial submitted for distribution',
  release: {
    id: 'lor-0042',
    catalogNumber: 'LOR-0042',
    title: 'Neon Arterial',
    artwork: { from: '#6D3B8F', to: '#2A1140' },
  },
  ...extra,
});

describe('readFilters', () => {
  it('defaults an empty URL', () => {
    expect(readFilters(new URLSearchParams())).toEqual(DEFAULT_FILTERS);
  });

  it('reads what the screen wrote', () => {
    const params = new URLSearchParams({ q: 'halogen', type: 'tracks', range: '90d' });
    expect(readFilters(params)).toEqual({ query: 'halogen', type: 'tracks', range: '90d' });
  });

  it('falls back on a hand-edited URL instead of blanking the feed', () => {
    const params = new URLSearchParams({ type: 'royalties', range: 'forever' });
    expect(readFilters(params)).toEqual(DEFAULT_FILTERS);
  });
});

describe('filterParams', () => {
  it('keeps a default view out of the URL', () => {
    expect(filterParams(DEFAULT_FILTERS)).toEqual({});
    expect(isFiltered(DEFAULT_FILTERS)).toBe(false);
  });

  it('writes only what differs', () => {
    const filters = { ...DEFAULT_FILTERS, range: '7d' } as const;
    expect(filterParams(filters)).toEqual({ range: '7d' });
    expect(isFiltered(filters)).toBe(true);
  });

  it('treats a whitespace-only search as no search', () => {
    expect(filterParams({ ...DEFAULT_FILTERS, query: '   ' })).toEqual({});
  });
});

describe('filterEvents', () => {
  const events = [
    event('a', '2026-08-12T07:55:00.000Z'),
    event('b', '2026-08-09T11:05:00.000Z', 'domain/tracks/processed', {
      summary: 'All 6 tracks processed and fingerprinted',
      actor: 'Audio pipeline',
    }),
    event('c', '2026-06-01T09:00:00.000Z', 'domain/releases/withdrawn'),
  ];

  it('admits everything inside the range and nothing outside it', () => {
    expect(filterEvents(events, DEFAULT_FILTERS, NOW).map((e) => e.id)).toEqual(['a', 'b']);
    expect(
      filterEvents(events, { ...DEFAULT_FILTERS, range: '24h' }, NOW).map((e) => e.id),
    ).toEqual(['a']);
    expect(filterEvents(events, { ...DEFAULT_FILTERS, range: '90d' }, NOW)).toHaveLength(3);
  });

  it('filters by event family, not by exact type', () => {
    const releases = filterEvents(
      events,
      { ...DEFAULT_FILTERS, type: 'releases', range: '90d' },
      NOW,
    );
    expect(releases.map((e) => e.id)).toEqual(['a', 'c']);

    const tracks = filterEvents(events, { ...DEFAULT_FILTERS, type: 'tracks', range: '90d' }, NOW);
    expect(tracks.map((e) => e.id)).toEqual(['b']);
  });

  it('searches the whole row, case-insensitively', () => {
    const match = (query: string) =>
      filterEvents(events, { ...DEFAULT_FILTERS, query, range: '90d' }, NOW).map((e) => e.id);

    expect(match('LOR-0042')).toEqual(['a', 'b', 'c']); // catalogue number
    expect(match('audio PIPELINE')).toEqual(['b']); // actor
    expect(match('fingerprinted')).toEqual(['b']); // summary
    expect(match('domain/releases/withdrawn')).toEqual(['c']); // the event name itself
    expect(match('nothing here')).toEqual([]);
  });
});

describe('groupEventsByDay', () => {
  it('groups newest day first and names the two days that have names', () => {
    const groups = groupEventsByDay(
      [
        event('old', '2026-08-10T09:00:00.000Z'),
        event('now', '2026-08-12T07:55:00.000Z'),
        event('then', '2026-08-11T22:04:00.000Z'),
      ],
      NOW,
    );

    expect(groups.map((group) => [group.label, group.events.length])).toEqual([
      ['TODAY', 1],
      ['YESTERDAY', 1],
      ['2026/08/10', 1],
    ]);
  });

  it('orders events inside a day newest first, whatever order they arrived in', () => {
    const groups = groupEventsByDay(
      [event('early', '2026-08-12T06:38:00.000Z'), event('late', '2026-08-12T07:55:00.000Z')],
      NOW,
    );

    expect(groups[0]?.events.map((e) => e.id)).toEqual(['late', 'early']);
  });
});

describe('feedClock', () => {
  it('runs on the newest event, so a fixed-date seed still reads as today', () => {
    const events = [event('b', '2026-08-09T11:05:00.000Z'), event('a', '2026-08-12T07:55:00.000Z')];
    expect(feedClock(events)).toBe(Date.parse('2026-08-12T07:55:00.000Z'));

    // And the newest event is always inside the tightest range, by construction.
    const filters = { ...DEFAULT_FILTERS, range: '24h' } as const;
    expect(filterEvents(events, filters, feedClock(events)).map((e) => e.id)).toEqual(['a']);
  });

  it('has no clock for an empty feed — there is nothing to group', () => {
    expect(feedClock([])).toBe(0);
    expect(groupEventsByDay([], 0)).toEqual([]);
  });
});
