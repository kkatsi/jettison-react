// The screen's one hook (R2): the same releases query the catalogue uses, filtered
// down to what is actually in the pipeline, and one view-model out (R3).

import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { useNavigate } from 'react-router';

import type { FilterOption, Tone } from '@shared/ui';

import { useReleasesQuery } from '../../api/endpoints';
import type { Release } from '../../api/types';
import { STAGE } from '../../constants';
import { deliveryProgress, isInFlight, pipelineStage } from '../../services/release-status';
import { artistOptions } from '../Catalog/catalog-filters';
import {
  BOARD_STAGE_VALUES,
  DEFAULT_BOARD_FILTERS,
  filterPipeline,
  isBoardFiltered,
  sortByNewestSubmission,
} from './board-filters';
import { scheduleAxis, schedulePlacements, type ScheduleAxis } from './board-timeline';

export type BoardRow = Release & {
  stage: { label: string; tone: Tone; busy: boolean };
  /** '3/5', with one segment per store. */
  storeLabel: string;
  segments: { storeId: string; done: boolean; rejected: boolean }[];
  onOpen: () => void;
};

export type SchedulePin = {
  id: string;
  left: number;
  dateLabel: string;
  title: string;
  showTitle: boolean;
  artwork: Release['artwork'];
  tone: Tone;
  /** Everything the hover card shows, decided here rather than in the view. */
  detail: {
    title: string;
    catalogNumber: string;
    artistName: string;
    releaseDate: string;
    storeLabel: string;
    stage: { label: string; tone: Tone };
  };
};

export type DistributionBoardModel = {
  isLoading: boolean;
  failure: { retry: () => void } | null;
  rows: BoardRow[];
  isEmpty: boolean;
  /** True when the pipeline itself is empty, not just this filtered view of it. */
  isPipelineEmpty: boolean;
  countLabel: string;
  footerLabel: string;
  schedule: { axis: ScheduleAxis; pins: SchedulePin[] };
  counts: { inFlight: number; blocked: number; live: number };
  filters: {
    artist: string;
    stage: string;
    artists: FilterOption[];
    stages: FilterOption[];
    isActive: boolean;
    onArtist: (artist: string) => void;
    onStage: (stage: string) => void;
    onReset: () => void;
  };
  onNewRelease: () => void;
};

const ALL: FilterOption = { value: 'all', label: 'all' };

/** The board's URL contract — the same two rules as the catalogue's (ADR-004). */
const FILTER_PARSERS = {
  artist: parseAsString.withDefault(DEFAULT_BOARD_FILTERS.artist),
  stage: parseAsStringLiteral(BOARD_STAGE_VALUES).withDefault(DEFAULT_BOARD_FILTERS.stage),
};

export function useDistributionBoard(): DistributionBoardModel {
  const { data, isLoading, isError, refetch } = useReleasesQuery();
  const [filters, setFilters] = useQueryStates(FILTER_PARSERS);
  const navigate = useNavigate();

  const pipeline = sortByNewestSubmission(data ?? []);
  const visible = filterPipeline(pipeline, filters);
  const stages = pipeline.map(pipelineStage);

  // The board's clock is its newest submission, for the reason the catalogue's is
  // (catalog-summary.ts): the label lives on a fixed date until something happens
  // in this tab.
  const now = pipeline.reduce(
    (latest, release) => Math.max(latest, Date.parse(release.submittedAt ?? '') || 0),
    0,
  );

  return {
    isLoading,
    failure: isError ? { retry: () => void refetch() } : null,
    rows: visible.map(toRow(navigate)),
    isEmpty: !isLoading && !isError && visible.length === 0 && pipeline.length > 0,
    isPipelineEmpty: !isLoading && !isError && pipeline.length === 0,
    countLabel: `${pipeline.length} in pipeline`,
    footerLabel: `Showing ${visible.length} of ${pipeline.length} submissions`,
    schedule: {
      axis: scheduleAxis(now),
      pins: schedulePlacements(pipeline, now).map((placement) => {
        const release = pipeline.find((candidate) => candidate.id === placement.id);
        if (!release) throw new Error(`board: placement for a release that left the pipeline`);

        const stage = STAGE[pipelineStage(release)];
        const progress = deliveryProgress(release.deliveries);

        return {
          ...placement,
          title: release.title,
          artwork: release.artwork,
          tone: stage.tone,
          detail: {
            title: release.title,
            catalogNumber: release.catalogNumber,
            artistName: release.artistName,
            releaseDate: release.releaseDate,
            storeLabel: `${progress.delivered}/${progress.total} stores`,
            stage,
          },
        };
      }),
    },
    counts: {
      inFlight: stages.filter(isInFlight).length,
      blocked: stages.filter((stage) => stage === 'blocked').length,
      live: stages.filter((stage) => stage === 'live').length,
    },
    filters: {
      artist: filters.artist,
      stage: filters.stage,
      artists: [ALL, ...artistOptions(pipeline)],
      stages: BOARD_STAGE_VALUES.map((stage) =>
        stage === 'all' ? ALL : { value: stage, label: STAGE[stage].label },
      ),
      isActive: isBoardFiltered(filters),
      onArtist: (artist) => void setFilters({ artist }),
      onStage: (stage) => void setFilters({ stage: stage as (typeof BOARD_STAGE_VALUES)[number] }),
      onReset: () => void setFilters(null),
    },
    onNewRelease: () => void navigate('/releases/new'),
  };
}

function toRow(navigate: (to: string) => void) {
  return (release: Release): BoardRow => {
    const progress = deliveryProgress(release.deliveries);

    return {
      ...release,
      stage: STAGE[pipelineStage(release)],
      storeLabel: `${progress.delivered}/${progress.total}`,
      segments: release.deliveries.map((delivery) => ({
        storeId: delivery.storeId,
        done: delivery.status === 'delivered',
        rejected: delivery.status === 'rejected',
      })),
      onOpen: () => void navigate(`/catalog/${release.id}`),
    };
  };
}
