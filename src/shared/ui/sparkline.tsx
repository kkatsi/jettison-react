import { cn } from '@shared/utils/cn';

export type SparklineProps = {
  points: readonly number[];
  width?: number;
  height?: number;
  className?: string;
};

/**
 * A trend, not a chart: no axes, no tooltip, no library. The exact number sits
 * next to it in every place this is used, so the line is decoration and the svg
 * is hidden from assistive tech.
 */
export function Sparkline({ points, width = 64, height = 18, className }: SparklineProps) {
  const peak = Math.max(0, ...points);

  // Nothing to plot — a flat rule keeps the column aligned instead of collapsing it.
  if (points.length < 2 || peak === 0) {
    return (
      <div aria-hidden className={cn('flex items-center', className)} style={{ width, height }}>
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
      aria-hidden
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
