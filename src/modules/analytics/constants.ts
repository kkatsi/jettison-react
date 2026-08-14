export const RANGES = [7, 30, 90] as const;

export type Range = (typeof RANGES)[number];

export const DEFAULT_RANGE: Range = 30;

/** Copy the report attaches to what it hands the charts. */
export const KPI_LABEL = {
  streams: 'Streams',
  revenue: 'Revenue',
  perDay: 'Avg. per day',
} as const;

export const SPIKE_NOTE = 'Inside the playlist spike';
export const DAY_NOTE = 'Streams on this day';

/** The top three stores carry the release; the tail is drawn quietly. */
export const MAJOR_STORES = 3;

export const TOP_TRACKS = 6;
