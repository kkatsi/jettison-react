// The four numbers above the table. Domain codes and figures only — the tiles'
// wording lives in the view (R6).

import { formatStreams } from '../../api/transformations';
import type { Release } from '../../api/types';
import { pipelineStage } from '../../services/release-status';

export type CatalogSummary = {
  live: { count: number; total: number };
  pendingReview: { count: number; oldestWaitingDays: number };
  /** Last seven days of the trend, against the seven before it. */
  streamsThisWeek: { label: string; changePercent: number | null };
  streams30d: { label: string };
};

const DAY_MS = 86_400_000;

/**
 * The catalogue's clock is its newest submission, not the wall clock: the
 * simulated label lives on a fixed date (ADR-002), and a console that reports
 * "oldest waiting 400 days" next year proves nothing. A release submitted in
 * this tab carries a real timestamp, so it becomes the clock the moment it lands.
 */
export function catalogClock(releases: readonly { submittedAt: string | null }[]): number {
  return releases.reduce(
    (latest, release) =>
      Math.max(latest, release.submittedAt ? Date.parse(release.submittedAt) : 0),
    0,
  );
}

export function summarise(releases: readonly Release[], now: number): CatalogSummary {
  const stages = releases.map((release) => ({ release, stage: pipelineStage(release) }));

  const awaiting = stages.filter(
    (entry) => entry.stage === 'submitted' || entry.stage === 'in-review',
  );

  const week = sumTail(releases, 7);
  const previousWeek = sumTail(releases, 14) - week;

  return {
    live: {
      count: stages.filter((entry) => entry.stage === 'live').length,
      total: releases.length,
    },
    pendingReview: {
      count: awaiting.length,
      oldestWaitingDays: awaiting.reduce((longest, entry) => {
        const submitted = entry.release.submittedAt;
        if (!submitted) return longest;
        return Math.max(longest, Math.floor((now - Date.parse(submitted)) / DAY_MS));
      }, 0),
    },
    streamsThisWeek: {
      label: formatStreams(week),
      // No previous week to compare against is not a 0% change — it is no change
      // to report, and the tile shows nothing rather than a reassuring zero.
      changePercent: previousWeek > 0 ? ((week - previousWeek) / previousWeek) * 100 : null,
    },
    streams30d: {
      label: formatStreams(releases.reduce((total, release) => total + release.streams30d, 0)),
    },
  };
}

/** Which way the sparkline points. A code, not words — constants.ts owns those (R6). */
export type TrendDirection = 'rising' | 'falling' | 'steady' | 'none';

/**
 * The second half of the trend against the first. A threshold, because a line
 * that wobbles by a percent is not a story — calling that "rising" would make
 * the word mean nothing on the rows where it is true.
 */
export function trendDirection(points: readonly number[], threshold = 0.05): TrendDirection {
  if (points.length < 2) return 'none';

  const middle = Math.floor(points.length / 2);
  const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);
  const earlier = sum(points.slice(0, middle));
  const later = sum(points.slice(middle));

  if (earlier === 0) return later > 0 ? 'rising' : 'none';

  const change = (later - earlier) / earlier;
  if (change > threshold) return 'rising';
  if (change < -threshold) return 'falling';
  return 'steady';
}

/** The trend is newest-last, so the tail is the recent end of it. */
function sumTail(releases: readonly Release[], days: number): number {
  return releases.reduce(
    (total, release) =>
      total + release.streamsTrend.slice(-days).reduce((sum, value) => sum + value, 0),
    0,
  );
}
