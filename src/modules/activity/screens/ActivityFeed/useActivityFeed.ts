// The screen's one hook (R2). Query in, filters from the URL, one view-model out
// (R3) — the view below it decides nothing.

import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';

import { useActivityFeedQuery } from '../../api';
import type { FeedDay, FeedFilters } from '../../types';
import {
  DEFAULT_FILTERS,
  RANGE_VALUES,
  TYPE_VALUES,
  feedClock,
  filterEvents,
  groupEventsByDay,
  isFiltered,
} from './event-feed';

export type ActivityFeedModel = {
  isLoading: boolean;
  /** Present only when the feed could not be loaded at all. */
  failure: { retry: () => void } | null;
  groups: FeedDay[];
  /** The feed loaded, and the filters admitted nothing. */
  isEmpty: boolean;
  /** '12 of 40' while filtering, empty when everything is shown. */
  resultLabel: string;
  filters: FeedFilters & {
    isActive: boolean;
    onQuery: (query: string) => void;
    onType: (type: string) => void;
    onRange: (range: string) => void;
    onReset: () => void;
  };
};

/** The screen's URL contract: defaults stay out of the query string, junk falls back (ADR-004). */
const FILTER_PARSERS = {
  query: parseAsString.withDefault(DEFAULT_FILTERS.query),
  type: parseAsStringLiteral(TYPE_VALUES).withDefault(DEFAULT_FILTERS.type),
  range: parseAsStringLiteral(RANGE_VALUES).withDefault(DEFAULT_FILTERS.range),
};

export function useActivityFeed(): ActivityFeedModel {
  const { data, isLoading, isError, refetch } = useActivityFeedQuery();
  const [filters, setFilters] = useQueryStates(FILTER_PARSERS, { urlKeys: { query: 'q' } });

  const events = data ?? [];
  const now = feedClock(events);
  const visible = filterEvents(events, filters, now);

  return {
    isLoading,
    failure: isError ? { retry: () => void refetch() } : null,
    groups: groupEventsByDay(visible, now),
    isEmpty: !isLoading && !isError && visible.length === 0,
    resultLabel: visible.length === events.length ? '' : `${visible.length} of ${events.length}`,
    filters: {
      ...filters,
      isActive: isFiltered(filters),
      onQuery: (query) => void setFilters({ query }),
      onType: (type) => void setFilters({ type: type as FeedFilters['type'] }),
      onRange: (range) => void setFilters({ range: range as FeedFilters['range'] }),
      // null clears every key this hook owns — the whole filter set, in one call.
      onReset: () => void setFilters(null),
    },
  };
}
