import { LineChart } from 'echarts/charts';
import { GridComponent, MarkAreaComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { useEffect, useRef } from 'react';

import { cn } from '@shared/utils/cn';

import type { TimeSeriesBand, TimeSeriesChartProps, TimeSeriesPoint } from './time-series-chart';

// Registered once, and only what the console draws — the whole reason for the
// core build rather than the bundled one.
echarts.use([LineChart, GridComponent, TooltipComponent, MarkAreaComponent, CanvasRenderer]);

const token = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export function TimeSeriesPlot({
  points,
  band,
  area = false,
  formatAxis,
  height = 194,
  className,
}: TimeSeriesChartProps) {
  const holder = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = holder.current;
    if (!element) return;

    const chart = echarts.init(element, undefined, { renderer: 'canvas' });
    chart.setOption(option(points, band ?? null, area, formatAxis), true);

    // Panels are grid cells; a window resize changes their width without remounting.
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(element);

    return () => {
      observer.disconnect();
      chart.dispose();
    };
  }, [points, band, area, formatAxis]);

  return <div ref={holder} className={cn('w-full', className)} style={{ height }} />;
}

function option(
  points: readonly TimeSeriesPoint[],
  band: TimeSeriesBand | null,
  area: boolean,
  formatAxis: (value: number) => string,
) {
  const colours = {
    brand: token('--color-brand'),
    line: token('--color-line'),
    raised: token('--color-raised'),
    lineStrong: token('--color-line-strong'),
    dim: token('--color-dim'),
  };

  const axisLabel = {
    color: colours.dim,
    fontFamily: 'var(--font-mono)',
    fontSize: 9.5,
  };

  return {
    animationDuration: 240,
    grid: { left: 46, right: 8, top: 24, bottom: 24 },

    xAxis: {
      type: 'category' as const,
      data: points.map((point) => point.label),
      boundaryGap: false,
      axisLine: { show: false },
      axisTick: { show: false },
      // Five or six dates along the bottom, whatever the range.
      axisLabel: { ...axisLabel, interval: Math.max(0, Math.ceil(points.length / 5) - 1) },
      axisPointer: { lineStyle: { color: colours.lineStrong } },
    },

    yAxis: {
      type: 'value' as const,
      splitNumber: 3,
      splitLine: { lineStyle: { color: colours.line } },
      axisLabel: { ...axisLabel, formatter: formatAxis },
    },

    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: colours.raised,
      borderColor: colours.lineStrong,
      borderWidth: 1,
      padding: [8, 10],
      formatter: (params: unknown) => tooltip(points, params),
    },

    series: [
      {
        type: 'line' as const,
        data: points.map((point) => point.value),
        symbol: 'circle',
        symbolSize: 7,
        showSymbol: false,
        lineStyle: { color: colours.brand, width: 1.6 },
        itemStyle: { color: colours.brand },
        areaStyle: area ? { color: colours.brand, opacity: 0.12 } : undefined,
        markArea: band
          ? {
              silent: true,
              itemStyle: { color: colours.brand, opacity: 0.08 },
              data: [[{ xAxis: band.from }, { xAxis: band.to }]],
            }
          : undefined,
      },
    ],
  };
}

function tooltip(points: readonly TimeSeriesPoint[], params: unknown): string {
  const index = Array.isArray(params) ? (params[0] as { dataIndex: number }).dataIndex : 0;
  const tip = points[index]?.tip;
  if (!tip) return '';

  const delta = tip.delta
    ? `<span class="font-mono text-xs ${tip.deltaUp ? 'text-live' : 'text-danger'}">${tip.delta}</span>`
    : '';

  return [
    `<div class="font-mono text-2xs text-faint">${tip.date}</div>`,
    `<div class="mt-1 flex items-baseline gap-2"><span class="font-mono text-base text-text">${tip.value}</span>${delta}</div>`,
    tip.note ? `<div class="mt-0.5 text-xs text-subtle">${tip.note}</div>` : '',
  ].join('');
}
