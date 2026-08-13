// The release-schedule strip: street dates placed on a four-week axis. Pure
// arithmetic over dates — no React, no store, no fetching (R5).

import type { Release } from '../../api/types';

const DAY_MS = 86_400_000;

/** Three days of history on the left, four weeks ahead: what a label plans against. */
export const SPAN_DAYS = 31;
export const LOOKBACK_DAYS = 3;

export type SchedulePlacement = {
  id: string;
  /** 0–100, as a percentage across the axis. */
  left: number;
  /** '08/14' — the strip is too narrow for a year that never changes. */
  dateLabel: string;
  /** Dropped when a neighbour is close enough that the two would overlap. */
  showTitle: boolean;
};

export type ScheduleAxis = {
  /** Week ticks, left to right. The tick always shows; its label gives way to a pin. */
  weeks: { left: number; label: string; showLabel: boolean }[];
  /** Where "now" sits on the axis, or null when it has scrolled off it. */
  todayLeft: number | null;
  rangeLabel: string;
};

/** Percent along the axis, or null for a date the window doesn't cover. */
export function placeOnAxis(date: string, now: number): number | null {
  const start = axisStart(now);
  const percent = ((Date.parse(`${date}T00:00:00.000Z`) - start) / (SPAN_DAYS * DAY_MS)) * 100;

  return percent >= 0 && percent <= 100 ? percent : null;
}

/** A week label gives way to a pin on top of it; the tick stays, or the ruler moves. */
export function scheduleAxis(
  now: number,
  placements: readonly SchedulePlacement[] = [],
  minGapPercent = 5,
): ScheduleAxis {
  const start = axisStart(now);

  return {
    weeks: [0, 7, 14, 21, 28].map((offset) => {
      const left = (offset / SPAN_DAYS) * 100;

      return {
        left,
        label: shortDate(start + offset * DAY_MS),
        showLabel: !placements.some((placement) => Math.abs(placement.left - left) < minGapPercent),
      };
    }),
    todayLeft: ((now - start) / (SPAN_DAYS * DAY_MS)) * 100,
    rangeLabel: `${shortDate(start)} → ${shortDate(start + SPAN_DAYS * DAY_MS)}`,
  };
}

/** Street dates inside the window, in order. Crowded titles drop; dots and dates stay. */
export function schedulePlacements(
  releases: readonly Release[],
  now: number,
  minGapPercent = 13,
): SchedulePlacement[] {
  const placed = releases
    .map((release) => ({ release, left: placeOnAxis(release.releaseDate, now) }))
    .filter((entry): entry is { release: Release; left: number } => entry.left !== null)
    .sort((a, b) => a.left - b.left);

  return placed.map((entry, index) => {
    const previous = placed[index - 1];
    const next = placed[index + 1];
    const gap = Math.min(
      previous ? entry.left - previous.left : Infinity,
      next ? next.left - entry.left : Infinity,
    );

    return {
      id: entry.release.id,
      left: entry.left,
      dateLabel: entry.release.releaseDate.slice(5).replace('-', '/'),
      showTitle: gap >= minGapPercent,
    };
  });
}

function axisStart(now: number): number {
  return startOfDay(now) - LOOKBACK_DAYS * DAY_MS;
}

function startOfDay(timestamp: number): number {
  return Date.parse(`${new Date(timestamp).toISOString().slice(0, 10)}T00:00:00.000Z`);
}

/** '08/14' — month and day, the way a release calendar is read aloud. */
function shortDate(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(5, 10).replace('-', '/');
}
