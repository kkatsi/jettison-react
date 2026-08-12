// What the feed screen decides, as plain functions: which events the filters
// admit, and which day each one belongs to. Born colocated — one screen calls it
// (Chapter 2 §6). No React, no store, no fetching (R5).

import type { ActivityEvent, FeedDay, FeedFilters, RangeFilter, TypeFilter } from '../../types';

/** Filter semantics, and — being exhaustive — the URL parser's allowlist too. */
const TYPE_PREFIX: Record<TypeFilter, string> = {
  all: '',
  releases: 'domain/releases/',
  tracks: 'domain/tracks/',
};

const RANGE_DAYS: Record<RangeFilter, number> = { '24h': 1, '7d': 7, '30d': 30, '90d': 90 };

const DAY_MS = 86_400_000;

export const DEFAULT_FILTERS: FeedFilters = { query: '', type: 'all', range: '30d' };

/** Anything unrecognised falls back — a hand-edited URL must not blank the feed. */
export function readFilters(params: URLSearchParams): FeedFilters {
  const type = params.get('type');
  const range = params.get('range');

  return {
    query: params.get('q') ?? DEFAULT_FILTERS.query,
    type: type && type in TYPE_PREFIX ? (type as TypeFilter) : DEFAULT_FILTERS.type,
    range: range && range in RANGE_DAYS ? (range as RangeFilter) : DEFAULT_FILTERS.range,
  };
}

/** Only what differs from the default reaches the URL, so a clean view has a clean link. */
export function filterParams(filters: FeedFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.query.trim()) params.q = filters.query;
  if (filters.type !== DEFAULT_FILTERS.type) params.type = filters.type;
  if (filters.range !== DEFAULT_FILTERS.range) params.range = filters.range;
  return params;
}

export function isFiltered(filters: FeedFilters): boolean {
  return Object.keys(filterParams(filters)).length > 0;
}

export function filterEvents(
  events: readonly ActivityEvent[],
  filters: FeedFilters,
  now: number,
): ActivityEvent[] {
  const needle = filters.query.trim().toLowerCase();
  const prefix = TYPE_PREFIX[filters.type];
  const oldest = now - RANGE_DAYS[filters.range] * DAY_MS;

  return events.filter((event) => {
    if (Date.parse(event.at) < oldest) return false;
    if (!event.type.startsWith(prefix)) return false;
    if (!needle) return true;

    const haystack = [
      event.type,
      event.summary,
      event.actor,
      event.release.title,
      event.release.catalogNumber,
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(needle);
  });
}

/** Newest day first, newest event first — regardless of the order they arrived in. */
export function groupEventsByDay(events: readonly ActivityEvent[], now: number): FeedDay[] {
  const days = new Map<string, ActivityEvent[]>();

  for (const event of [...events].sort((a, b) => b.at.localeCompare(a.at))) {
    const day = dayOf(event.at);
    const bucket = days.get(day);
    if (bucket) bucket.push(event);
    else days.set(day, [event]);
  }

  const today = dayOf(new Date(now).toISOString());
  const yesterday = dayOf(new Date(now - DAY_MS).toISOString());

  return [...days].map(([day, dayEvents]) => ({
    day,
    label: day === today ? 'TODAY' : day === yesterday ? 'YESTERDAY' : day.replaceAll('-', '/'),
    events: dayEvents,
  }));
}

/**
 * The feed's clock is its newest event, not the wall clock: the simulated label
 * lives on a fixed date (ADR-002), and a demo whose ranges quietly empty out
 * tomorrow proves nothing. Live events carry real timestamps, so as soon as one
 * arrives it becomes the clock. An empty feed has no clock and nothing to group.
 */
export function feedClock(events: readonly ActivityEvent[]): number {
  return events.reduce((latest, event) => Math.max(latest, Date.parse(event.at)), 0);
}

const dayOf = (timestamp: string): string => timestamp.slice(0, 10);
