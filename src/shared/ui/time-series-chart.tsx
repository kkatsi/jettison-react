import { lazy, Suspense } from 'react';

export type TimeSeriesPoint = {
  /** Axis label. Every value in `tip` is copy too: the chart formats nothing. */
  label: string;
  value: number;
  tip: { date: string; value: string; delta?: string; deltaUp?: boolean; note?: string };
};

/** A highlighted stretch of the axis, named by the labels of the days it spans. */
export type TimeSeriesBand = { from: string; to: string };

export type TimeSeriesChartProps = {
  points: readonly TimeSeriesPoint[];
  band?: TimeSeriesBand | null;
  area?: boolean;
  /** The caller owns the units, so it owns the tick copy. */
  formatAxis: (value: number) => string;
  height?: number;
  className?: string;
};

// The kit's door is a barrel, so an eager import would put a charting library in
// every screen's first paint. It arrives with the panel that draws one.
const Plot = lazy(() =>
  import('./time-series-plot').then((module) => ({ default: module.TimeSeriesPlot })),
);

export function TimeSeriesChart({ height = 194, ...props }: TimeSeriesChartProps) {
  return (
    <Suspense fallback={<div className="w-full" style={{ height }} />}>
      <Plot height={height} {...props} />
    </Suspense>
  );
}
