// Which submissions the board shows, and in what order. Colocated with the one
// screen that calls it (Ch. 2 §6). No React, no store, no fetching (R5).

import type { Release } from '../../api/types';
import { isInPipeline, pipelineStage, type PipelineStage } from '../../services/release-status';

export type BoardFilters = {
  /** Artist id, or 'all'. */
  artist: string;
  stage: PipelineStage | 'all';
};

/** Draft never appears here: a draft is not in the pipeline by definition. */
export const PIPELINE_ONLY_STAGES: readonly PipelineStage[] = [
  'submitted',
  'in-review',
  'delivering',
  'live',
  'blocked',
];

export const DEFAULT_BOARD_FILTERS: BoardFilters = { artist: 'all', stage: 'all' };

export function readBoardFilters(params: URLSearchParams): BoardFilters {
  const stage = params.get('stage');

  return {
    artist: params.get('artist') ?? DEFAULT_BOARD_FILTERS.artist,
    stage: PIPELINE_ONLY_STAGES.includes(stage as PipelineStage) ? (stage as PipelineStage) : 'all',
  };
}

export function boardParams(filters: BoardFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.artist !== 'all') params.artist = filters.artist;
  if (filters.stage !== 'all') params.stage = filters.stage;
  return params;
}

export function isBoardFiltered(filters: BoardFilters): boolean {
  return Object.keys(boardParams(filters)).length > 0;
}

/**
 * The pipeline, newest submission first — and only the pipeline. A withdrawn
 * release loses its submission timestamp, which is what drops it off the board
 * the moment the withdrawal's patch lands.
 */
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
