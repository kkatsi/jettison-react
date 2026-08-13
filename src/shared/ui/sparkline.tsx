import { cn } from '@shared/utils/cn';

export type SparklineProps = {
  points: readonly number[];
  /** What the line says. Give it when the sparkline stands in a column of its own. */
  label?: string;
  width?: number;
  height?: number;
  className?: string;
};

/** A trend, not a chart: no axes, no tooltip, no library. */
export function Sparkline({ points, label, width = 64, height = 18, className }: SparklineProps) {
  const peak = Math.max(0, ...points);
  // Labelled, the line is content; unlabelled, decoration. The pointer gets the
  // same sentence as the screen reader.
  const described = label
    ? { role: 'img' as const, 'aria-label': label, title: label }
    : { 'aria-hidden': true };

  // Nothing to plot — a flat rule keeps the column aligned instead of collapsing it.
  if (points.length < 2 || peak === 0) {
    return (
      <div {...described} className={cn('flex items-center', className)} style={{ width, height }}>
        <div className="h-px w-full bg-line-strong/70" />
      </div>
    );
  }

  const plotted = points
    .map((value, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - 1 - (value / peak) * (height - 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      {...described}
      width={width}
      height={height}
      className={cn('block overflow-visible', className)}
    >
      <polyline
        points={plotted}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
