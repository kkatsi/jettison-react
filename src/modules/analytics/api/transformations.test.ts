import { describe, expect, it } from 'vitest';

import {
  formatMoney,
  formatMoneyAxis,
  formatStreams,
  toAnalyticsReport,
  toAxisLabel,
  toDelta,
  toTooltipDate,
} from './transformations';
import type { AnalyticsReportDto } from './types';

const series = [
  { date: '2026-08-08', streams: 1000, revenue: 3.2 },
  { date: '2026-08-09', streams: 1500, revenue: 4.8 },
  { date: '2026-08-10', streams: 3000, revenue: 9.6 },
  { date: '2026-08-11', streams: 3200, revenue: 10.24 },
  { date: '2026-08-12', streams: 1300, revenue: 4.16 },
];

const report = (over: Partial<AnalyticsReportDto> = {}) =>
  toAnalyticsReport(
    {
      scope: 'release:lor-0042',
      days: 5,
      from: '2026-08-08',
      to: '2026-08-12',
      series,
      previous: { streams: 9000, revenue: 28.8 },
      stores: [
        { storeId: 'soundry', storeName: 'Soundry', streams: 4700, previousStreams: 4100 },
        { storeId: 'vela-music', storeName: 'Vela Music', streams: 2600, previousStreams: 2700 },
        { storeId: 'pulsar', storeName: 'Pulsar', streams: 1700, previousStreams: 1300 },
        { storeId: 'echoport', storeName: 'EchoPort', streams: 700, previousStreams: 700 },
        { storeId: 'tidewave', storeName: 'Tidewave', streams: 300, previousStreams: 0 },
      ],
      tracks: [
        {
          trackId: 't2',
          title: 'Sodium Sun',
          releaseId: 'r',
          releaseTitle: 'R',
          streams: 2000,
          previousStreams: 1000,
        },
        {
          trackId: 't1',
          title: 'Neon Arterial',
          releaseId: 'r',
          releaseTitle: 'R',
          streams: 5000,
          previousStreams: 6000,
        },
        {
          trackId: 't3',
          title: 'Oxide',
          releaseId: 'r',
          releaseTitle: 'R',
          streams: 1200,
          previousStreams: 1200,
        },
      ],
      ...over,
    },
    { from: '2026-08-10', to: '2026-08-11', multiple: 2.4 },
  );

describe('the analytics report', () => {
  it('totals the window and compares it with the one before', () => {
    const [streams, revenue, perDay] = report().kpis;

    expect(streams).toEqual({
      label: 'Streams',
      value: '10K',
      delta: { label: '+11.1%', up: true },
    });
    expect(revenue?.value).toBe('£32');
    expect(perDay?.value).toBe('2K');
    // Same-length windows: an average's trend is the total's trend.
    expect(perDay?.delta).toBeNull();
  });

  it('drops the deltas when there is no earlier window, rather than claiming −100%', () => {
    expect(report({ previous: null }).kpis.every((kpi) => kpi.delta === null)).toBe(true);
  });

  it('hands the chart pre-formatted points, day over day', () => {
    const { points, totalLabel } = report().streams;

    expect(totalLabel).toBe('10,000 total');
    expect(points).toHaveLength(5);
    expect(points[0]).toEqual({
      label: '08/08',
      value: 1000,
      // Nothing before the first day of the window, so no comparison is offered.
      tip: {
        date: '08-08 · 2026',
        value: '1,000',
        delta: undefined,
        deltaUp: undefined,
        note: 'Streams on this day',
      },
    });
    expect(points[1]?.tip.delta).toBe('+50.0%');
    expect(points[4]?.tip.delta).toBe('−59.4%');
    expect(points[4]?.tip.deltaUp).toBe(false);
  });

  it('marks the days inside the spike, and labels the band once', () => {
    const { points, band, spikeLabel } = report().streams;

    expect(band).toEqual({ from: '08/10', to: '08/11' });
    expect(spikeLabel).toBe('Playlist spike · 2.4× baseline');
    expect(points.map((point) => point.tip.note)).toEqual([
      'Streams on this day',
      'Streams on this day',
      'Inside the playlist spike',
      'Inside the playlist spike',
      'Streams on this day',
    ]);
  });

  it('leaves the revenue panel unbanded — the spike is a streaming story', () => {
    const revenue = report().revenue;

    expect(revenue.totalLabel).toBe('£32 total');
    expect(revenue.formatAxis(4200)).toBe('£4.2K');
    expect(revenue.points[0]?.tip.value).toBe('£3');
  });

  it('ranks the stores, sizes the bars against the leader, and names the tail', () => {
    const { bars, topShareLabel } = report().stores;

    expect(bars.map((bar) => bar.name)).toEqual([
      'Soundry',
      'Vela Music',
      'Pulsar',
      'EchoPort',
      'Tidewave',
    ]);
    expect(topShareLabel).toBe('top store 47%');
    expect(bars[0]).toMatchObject({ widthPct: 100, major: true, streamsLabel: '4,700' });
    expect(bars[1]?.widthPct).toBe(55);
    expect(bars[3]?.major).toBe(false);
    // Nothing to compare a store's first streams against.
    expect(bars[4]?.delta).toBeNull();
    expect(bars[1]?.delta).toEqual({ label: '−3.7%', up: false });
  });

  it('reports no share at all when nothing streamed', () => {
    const { bars, topShareLabel } = report({
      stores: [{ storeId: 'soundry', storeName: 'Soundry', streams: 0, previousStreams: 0 }],
    }).stores;

    expect(topShareLabel).toBe('—');
    expect(bars[0]).toMatchObject({ widthPct: 0, major: false, streamsLabel: '—' });
  });

  it('takes the top tracks in order, however the backend sent them', () => {
    expect(report().tracks).toEqual([
      {
        id: 't1',
        rank: '01',
        title: 'Neon Arterial',
        streamsLabel: '5,000',
        delta: { label: '−16.7%', up: false },
      },
      {
        id: 't2',
        rank: '02',
        title: 'Sodium Sun',
        streamsLabel: '2,000',
        delta: { label: '+100.0%', up: true },
      },
      {
        id: 't3',
        rank: '03',
        title: 'Oxide',
        streamsLabel: '1,200',
        delta: { label: '+0.0%', up: true },
      },
    ]);
  });
});

describe('the formatters', () => {
  it('reads streams at the scale a label thinks in', () => {
    expect(formatStreams(20_232_720)).toBe('20.23M');
    expect(formatStreams(512_400)).toBe('512K');
    expect(formatStreams(842)).toBe('842');
    expect(formatStreams(0)).toBe('—');
  });

  it('rounds money to the pound, and axis money to the nearest hundred', () => {
    expect(formatMoney(77_410.62)).toBe('£77,411');
    expect(formatMoneyAxis(4109)).toBe('£4.1K');
    expect(formatMoneyAxis(410)).toBe('£410');
  });

  it('keeps the year out of the axis and in the tooltip', () => {
    expect(toAxisLabel('2026-08-12')).toBe('08/12');
    expect(toTooltipDate('2026-08-12')).toBe('08-12 · 2026');
  });

  it('has nothing to say about a comparison with zero', () => {
    expect(toDelta(100, 0)).toBeNull();
    expect(toDelta(100, null)).toBeNull();
    expect(toDelta(100, undefined)).toBeNull();
  });
});
