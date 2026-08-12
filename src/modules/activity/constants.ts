// Copy and styling keyed by domain code (R6). Services return the codes; this
// file is the only place that knows what a human should read.

import type { ActivityEventType, RangeFilter, TypeFilter } from './types';

/** Chip colours, one per event type. Tokens only — no hex outside theme.css. */
export const TYPE_CHIP: Record<ActivityEventType, string> = {
  'domain/releases/submitted': 'bg-brand/10 text-brand-soft',
  'domain/releases/withdrawn': 'bg-danger/10 text-danger',
  'domain/tracks/processed': 'bg-live/10 text-live',
};

export const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'all' },
  { value: 'releases', label: 'domain/releases/*' },
  { value: 'tracks', label: 'domain/tracks/*' },
];

export const RANGE_OPTIONS: { value: RangeFilter; label: string }[] = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
];

/**
 * What a live domain event reads as in the feed. The seeded events come with
 * their summary from the backend; these are the ones that happened in this tab,
 * before the backend has told us about them.
 */
export const LIVE_SUMMARY: Record<ActivityEventType, (title: string, detail?: string) => string> = {
  'domain/releases/submitted': (title) => `${title} submitted for distribution`,
  'domain/releases/withdrawn': () => 'Withdrawn from distribution',
  'domain/tracks/processed': (_title, detail) => `Audio processing finished for ${detail}`,
};
