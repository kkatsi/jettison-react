// Server response → UI shape, and nothing else (Ch. 4 §1). The screen below this
// file does no arithmetic: every number it shows is a string by the time it
// arrives, and every comparison has already been made.

import type { TimeSeriesBand, TimeSeriesPoint } from '@shared/ui';

import { DAY_NOTE, KPI_LABEL, SPIKE_NOTE, TOP_TRACKS } from '../constants';
import type { PlaylistSpike } from '../services/playlist-spike';
import type {
  AnalyticsReport,
  AnalyticsReportDto,
  ChartPanel,
  DailyPointDto,
  Delta,
  StoreBar,
  StoreRollupDto,
  TrackRollupDto,
  TrackRow,
} from './types';

const NONE = '—';

export function toAnalyticsReport(
  dto: AnalyticsReportDto,
  spike: PlaylistSpike | null,
): AnalyticsReport {
  const streams = dto.series.reduce((total, day) => total + day.streams, 0);
  const revenue = dto.series.reduce((total, day) => total + day.revenue, 0);

  return {
    rangeLabel: `last ${dto.days} days`,
    comparisonLabel: `vs prev ${dto.days}d`,

    kpis: [
      {
        label: KPI_LABEL.streams,
        value: formatStreams(streams),
        delta: toDelta(streams, dto.previous?.streams),
      },
      {
        label: KPI_LABEL.revenue,
        value: formatMoney(revenue),
        delta: toDelta(revenue, dto.previous?.revenue),
      },
      // No delta: both windows are the same length, so it would be the streams
      // delta printed a second time.
      {
        label: KPI_LABEL.perDay,
        value: formatStreams(Math.round(streams / dto.days)),
        delta: null,
      },
    ],

    streams: {
      ...toChartPanel(dto.series, (day) => day.streams, formatCount, spike),
      band: toBand(spike),
      spikeLabel: spike ? `Playlist spike · ${spike.multiple.toFixed(1)}× baseline` : null,
    },

    revenue: toChartPanel(dto.series, (day) => day.revenue, formatMoney, null),

    stores: toStores(dto.stores),
    tracks: toTracks(dto.tracks),
  };
}

function toChartPanel(
  series: readonly DailyPointDto[],
  valueOf: (day: DailyPointDto) => number,
  formatValue: (value: number) => string,
  spike: PlaylistSpike | null,
): ChartPanel {
  const total = series.reduce((sum, day) => sum + valueOf(day), 0);

  return {
    totalLabel: `${formatValue(total)} total`,
    points: series.map((day, index): TimeSeriesPoint => {
      const value = valueOf(day);
      const previous = series[index - 1];
      const change = toDelta(value, previous ? valueOf(previous) : undefined);
      const inSpike = !!spike && day.date >= spike.from && day.date <= spike.to;

      return {
        label: toAxisLabel(day.date),
        value: Math.round(value * 100) / 100,
        tip: {
          date: toTooltipDate(day.date),
          value: formatValue(value),
          delta: change?.label,
          deltaUp: change?.up,
          note: inSpike ? SPIKE_NOTE : DAY_NOTE,
        },
      };
    }),
  };
}

function toBand(spike: PlaylistSpike | null): TimeSeriesBand | null {
  return spike ? { from: toAxisLabel(spike.from), to: toAxisLabel(spike.to) } : null;
}

function toStores(rollups: readonly StoreRollupDto[]): AnalyticsReport['stores'] {
  const ordered = [...rollups].sort((a, b) => b.streams - a.streams);
  const total = ordered.reduce((sum, store) => sum + store.streams, 0);

  const bars: StoreBar[] = ordered.map((store) => {
    const share = total > 0 ? store.streams / total : 0;

    return {
      id: store.storeId,
      name: store.storeName,
      streamsLabel: store.streams > 0 ? formatCount(store.streams) : NONE,
      shareLabel: store.streams > 0 ? `${Math.round(share * 100)}%` : NONE,
      widthPct: Math.round(share * 100),
      delta: toDelta(store.streams, store.previousStreams),
    };
  });

  return { totalLabel: total > 0 ? `${formatStreams(total)} streams` : NONE, bars };
}

function toTracks(rollups: readonly TrackRollupDto[]): TrackRow[] {
  return [...rollups]
    .sort((a, b) => b.streams - a.streams)
    .slice(0, TOP_TRACKS)
    .map((track, index) => ({
      id: track.trackId,
      rank: String(index + 1).padStart(2, '0'),
      title: track.title,
      streamsLabel: formatCount(track.streams),
      delta: toDelta(track.streams, track.previousStreams),
    }));
}

/** Null, not 0%: nothing to compare against is not the same as no change. */
export function toDelta(now: number, before: number | null | undefined): Delta {
  if (!before) return null;

  const change = ((now - before) / before) * 100;
  const sign = change >= 0 ? '+' : '−';

  return { label: `${sign}${Math.abs(change).toFixed(1)}%`, up: change >= 0 };
}

/** Millions to two decimals, thousands whole — the range a label reads at a glance. */
export function formatStreams(streams: number): string {
  if (streams <= 0) return NONE;
  if (streams >= 1_000_000) return `${(streams / 1_000_000).toFixed(2)}M`;
  if (streams >= 1000) return `${Math.round(streams / 1000)}K`;
  return String(streams);
}

/** The axis keeps its zero: a dash is for a value the label doesn't have, not for the origin. */
export function formatStreamsAxis(streams: number): string {
  return streams <= 0 ? '0' : formatStreams(streams);
}

export function formatCount(value: number): string {
  return Math.round(value).toLocaleString('en-GB');
}

export function formatMoney(amount: number): string {
  return `£${Math.round(amount).toLocaleString('en-GB')}`;
}

/** Axis ticks are read in a glance, so they lose the pennies and the thousands. */
export function formatMoneyAxis(amount: number): string {
  return amount >= 1000 ? `£${(amount / 1000).toFixed(1)}K` : `£${Math.round(amount)}`;
}

/** 08/12 — the axis has no room for a year, and every day on it shares one. */
export function toAxisLabel(date: string): string {
  return date.slice(5).replace('-', '/');
}

export function toTooltipDate(date: string): string {
  return `${date.slice(5)} · ${date.slice(0, 4)}`;
}
