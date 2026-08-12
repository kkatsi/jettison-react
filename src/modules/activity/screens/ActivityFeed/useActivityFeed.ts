// The screen's one hook (R2). Query in, filters from the URL, one view-model out
// (R3) — the view below it decides nothing.

import { useSearchParams } from 'react-router';

import { useActivityFeedQuery } from '../../api';
import type { FeedDay, FeedFilters } from '../../types';
import {
  DEFAULT_FILTERS,
  feedClock,
  filterEvents,
  filterParams,
  groupEventsByDay,
  isFiltered,
  readFilters,
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

export function useActivityFeed(): ActivityFeedModel {
  const { data, isLoading, isError, refetch } = useActivityFeedQuery();
  // Filters belong in the URL: a label manager sends colleagues a filtered feed,
  // and a reload has to survive it (Chapter 4 §2).
  const [params, setParams] = useSearchParams();

  const filters = readFilters(params);
  const events = data ?? [];
  const now = feedClock(events);
  const visible = filterEvents(events, filters, now);

  // The URL is the source of truth, and readFilters validates it on the way back
  // in — so an unknown value written here corrects itself on the next render.
  const update = (patch: Partial<Record<keyof FeedFilters, string>>) => {
    setParams(filterParams({ ...filters, ...patch } as FeedFilters), { replace: true });
  };

  return {
    isLoading,
    failure: isError ? { retry: () => void refetch() } : null,
    groups: groupEventsByDay(visible, now),
    isEmpty: !isLoading && !isError && visible.length === 0,
    resultLabel: visible.length === events.length ? '' : `${visible.length} of ${events.length}`,
    filters: {
      ...filters,
      isActive: isFiltered(filters),
      onQuery: (query) => update({ query }),
      onType: (type) => update({ type }),
      onRange: (range) => update({ range }),
      onReset: () => setParams(filterParams(DEFAULT_FILTERS), { replace: true }),
    },
  };
}
