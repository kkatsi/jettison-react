// The module's own types. Nothing here is imported from src/mocks — the mock's
// schemas are the backend's contract, and this is our reading of it.

/** The app's cross-module vocabulary, as the feed receives it. */
export type ActivityEventType =
  'domain/releases/submitted' | 'domain/releases/withdrawn' | 'domain/tracks/processed';

export type ActivityEvent = {
  id: string;
  type: ActivityEventType;
  at: string;
  actor: string;
  summary: string;
  release: {
    id: string;
    catalogNumber: string;
    title: string;
    artwork: { from: string; to: string };
  };
};

export type TypeFilter = 'all' | 'releases' | 'tracks';

export type RangeFilter = '24h' | '7d' | '30d' | '90d';

export type FeedFilters = {
  query: string;
  type: TypeFilter;
  range: RangeFilter;
};

/** One day's worth of feed, in the order the screen renders it. */
export type FeedDay = {
  day: string;
  label: string;
  events: ActivityEvent[];
};
