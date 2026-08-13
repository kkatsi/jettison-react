// Which submissions the board shows, and in what order. The URL itself is nuqs's
// job (ADR-004). No React, no store, no fetching (R5).

import type { Release } from '../../api/types';
import { isInPipeline, pipelineStage, type PipelineStage } from '../../services/release-status';

/** Draft is missing on purpose: a draft is not in the pipeline by definition. */
export const BOARD_STAGE_VALUES = [
  'all',
  'submitted',
  'in-review',
  'delivering',
  'live',
  'blocked',
] as const satisfies readonly ('all' | PipelineStage)[];

export type BoardFilters = {
  /** Artist id, or 'all'. */
  artist: string;
  stage: (typeof BOARD_STAGE_VALUES)[number];
};

export const DEFAULT_BOARD_FILTERS: BoardFilters = { artist: 'all', stage: 'all' };

export function isBoardFiltered(filters: BoardFilters): boolean {
  return filters.artist !== 'all' || filters.stage !== 'all';
}

/** Newest submission first. A withdrawal clears the timestamp, so the row leaves at once. */
export function sortByNewestSubmission(releases: readonly Release[]): Release[] {
  return releases
    .filter(isInPipeline)
    .toSorted((a, b) => (b.submittedAt ?? '').localeCompare(a.submittedAt ?? ''));
}

export function filterPipeline(releases: readonly Release[], filters: BoardFilters): Release[] {
  return releases.filter((release) => {
    if (filters.artist !== 'all' && release.artistId !== filters.artist) return false;
    if (filters.stage !== 'all' && pipelineStage(release) !== filters.stage) return false;
    return true;
  });
}
