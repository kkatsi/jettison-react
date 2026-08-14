// Where the numbers jumped, found rather than annotated by hand. A playlist add
// reads as a run of days well clear of the label's ordinary streaming — one day
// above it is a blip, and a blip is not a story.

export type DailyPoint = { date: string; streams: number };

export type PlaylistSpike = {
  from: string;
  to: string;
  /** How far above the baseline the best day of the run got, e.g. 3.4. */
  multiple: number;
};

/** Median, not mean: the spike would drag its own baseline up. */
const BASELINE_FACTOR = 2;
const MIN_DAYS = 2;
const MIN_SERIES = 7;

export function findPlaylistSpike(series: readonly DailyPoint[]): PlaylistSpike | null {
  if (series.length < MIN_SERIES) return null;

  const baseline = median(series.map((point) => point.streams));
  if (baseline <= 0) return null;

  const run = longestRunAbove(series, baseline * BASELINE_FACTOR);
  if (!run || run.length < MIN_DAYS) return null;

  const peak = Math.max(...run.map((point) => point.streams));

  return {
    from: run[0]?.date ?? '',
    to: run.at(-1)?.date ?? '',
    multiple: Math.round((peak / baseline) * 10) / 10,
  };
}

function longestRunAbove(series: readonly DailyPoint[], threshold: number): DailyPoint[] | null {
  let best: DailyPoint[] = [];
  let current: DailyPoint[] = [];

  for (const point of series) {
    current = point.streams > threshold ? [...current, point] : [];
    if (current.length > best.length) best = current;
  }

  return best.length ? best : null;
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2
    ? (sorted[middle] ?? 0)
    : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}
