// DTOs as the backend sends them, and the shapes the screen consumes. The module
// declares both; nothing here imports from src/mocks.

import type { ArtworkColours, TimeSeriesBand, TimeSeriesPoint } from '@shared/ui';

export type AnalyticsReportDto = {
  scope: string;
  days: number;
  from: string;
  to: string;
  series: DailyPointDto[];
  /** Absent when the data does not reach back a second window — then there is no delta to show. */
  previous: { streams: number; revenue: number } | null;
  stores: StoreRollupDto[];
  tracks: TrackRollupDto[];
};

export type DailyPointDto = { date: string; streams: number; revenue: number };

export type StoreRollupDto = {
  storeId: string;
  storeName: string;
  streams: number;
  previousStreams: number;
};

export type TrackRollupDto = {
  trackId: string;
  title: string;
  releaseId: string;
  releaseTitle: string;
  streams: number;
  previousStreams: number;
};

/** What the scope picker needs off a release. The list endpoint sends more; the screen ignores it. */
export type ScopeReleaseDto = {
  id: string;
  catalogNumber: string;
  title: string;
  artistId: string;
  artistName: string;
  status: string;
  artwork: ArtworkColours;
};

export type ScopeArtistDto = { id: string; name: string };

// The UI shapes.

/** Null when there is nothing to compare against — not 0%, which would claim a flat window. */
export type Delta = { label: string; up: boolean } | null;

export type Kpi = { label: string; value: string; delta: Delta };

export type StoreBar = {
  id: string;
  name: string;
  streamsLabel: string;
  /** Width relative to the leading store, so the top bar always fills its track. */
  widthPct: number;
  /** One of the stores that carry the release, rather than its tail. */
  major: boolean;
  delta: Delta;
};

export type TrackRow = {
  id: string;
  rank: string;
  title: string;
  streamsLabel: string;
  delta: Delta;
};

export type ScopeOption = {
  value: string;
  label: string;
  meta: string;
  group: 'Label' | 'Artists' | 'Releases';
  artwork: ArtworkColours | null;
};

export type ChartPanel = {
  totalLabel: string;
  points: TimeSeriesPoint[];
  /** Kept on the report, not made in the hook: a new function each render would remount the chart. */
  formatAxis: (value: number) => string;
};

/** Everything the screen draws, one window of it. */
export type AnalyticsReport = {
  rangeLabel: string;
  kpis: Kpi[];
  streams: ChartPanel & { band: TimeSeriesBand | null; spikeLabel: string | null };
  revenue: ChartPanel;
  stores: { topShareLabel: string; bars: StoreBar[] };
  tracks: TrackRow[];
};
