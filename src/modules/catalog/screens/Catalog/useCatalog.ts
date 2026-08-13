// The screen's one hook (R2). Query in, filters from the URL, one view-model out
// (R3) — the view below it decides nothing.

import { useNavigate, useSearchParams } from 'react-router';

import type { FilterOption, Tone } from '@shared/ui';

import { useReleasesQuery } from '../../api/endpoints';
import type { Release } from '../../api/types';
import { STAGE } from '../../constants';
import { pipelineStage } from '../../services/release-status';
import {
  DEFAULT_FILTERS,
  PIPELINE_STAGES,
  RELEASE_TYPES,
  artistOptions,
  filterParams,
  filterReleases,
  isFiltered,
  pageWindow,
  paginate,
  readFilters,
  type CatalogFilters,
} from './catalog-filters';
import { catalogClock, summarise, type CatalogSummary } from './catalog-summary';

/** A release with everything the row renders already decided. */
export type CatalogRow = Release & {
  stage: { label: string; tone: Tone; busy: boolean };
  onOpen: () => void;
};

export type CatalogTile = {
  label: string;
  value: string;
  delta?: { value: string; tone: Tone };
  hint: string;
};

export type CatalogModel = {
  isLoading: boolean;
  failure: { retry: () => void } | null;
  tiles: CatalogTile[];
  rows: CatalogRow[];
  /** The table loaded and the filters admitted nothing. */
  isEmpty: boolean;
  /** '12 of 31' while filtering, empty when everything is shown. */
  resultLabel: string;
  countLabel: string;
  footerLabel: string;
  filters: {
    query: string;
    artist: string;
    type: string;
    stage: string;
    artists: FilterOption[];
    types: FilterOption[];
    stages: FilterOption[];
    isActive: boolean;
    onQuery: (query: string) => void;
    onArtist: (artist: string) => void;
    onType: (type: string) => void;
    onStage: (stage: string) => void;
    onReset: () => void;
  };
  pagination: {
    pages: { key: string; label: string; isCurrent: boolean; onSelect?: () => void }[];
    onPrevious: () => void;
    onNext: () => void;
    hasPrevious: boolean;
    hasNext: boolean;
  };
};

const ALL: FilterOption = { value: 'all', label: 'all' };

export function useCatalog(): CatalogModel {
  const { data, isLoading, isError, refetch } = useReleasesQuery();
  // Filters belong in the URL: a label manager sends colleagues a filtered
  // catalogue, and a reload has to survive it (Ch. 4 §2).
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const filters = readFilters(params);
  const releases = data ?? [];
  const matching = filterReleases(releases, filters);
  const page = paginate(matching, filters.page);
  const summary = summarise(releases, catalogClock(releases));

  const update = (patch: Partial<CatalogFilters>) => {
    // Any filter change returns to page one: page 4 of a two-page result is a
    // blank table, and the user didn't ask to go anywhere.
    const next = { ...filters, page: 1, ...patch };
    setParams(filterParams(next), { replace: true });
  };

  const goTo = (target: number) => () => update({ ...filters, page: target });

  return {
    isLoading,
    failure: isError ? { retry: () => void refetch() } : null,
    tiles: tilesFor(summary),
    rows: page.items.map((release) => ({
      ...release,
      stage: STAGE[pipelineStage(release)],
      onOpen: () => void navigate(`/catalog/${release.id}`),
    })),
    isEmpty: !isLoading && !isError && matching.length === 0,
    resultLabel:
      matching.length === releases.length ? '' : `${matching.length} of ${releases.length}`,
    countLabel: `${releases.length} releases`,
    footerLabel: page.label,
    filters: {
      query: filters.query,
      artist: filters.artist,
      type: filters.type,
      stage: filters.stage,
      artists: [ALL, ...artistOptions(releases)],
      types: [ALL, ...RELEASE_TYPES.map((type) => ({ value: type, label: type }))],
      stages: [
        ALL,
        ...PIPELINE_STAGES.map((stage) => ({ value: stage, label: STAGE[stage].label })),
      ],
      isActive: isFiltered(filters),
      onQuery: (query) => update({ query }),
      onArtist: (artist) => update({ artist }),
      onType: (type) => update({ type: type as CatalogFilters['type'] }),
      onStage: (stage) => update({ stage: stage as CatalogFilters['stage'] }),
      onReset: () => setParams(filterParams(DEFAULT_FILTERS), { replace: true }),
    },
    pagination: {
      pages: pageWindow(page.page, page.pageCount).map((entry, index) =>
        entry === 'gap'
          ? { key: `gap-${index}`, label: '…', isCurrent: false }
          : {
              key: String(entry),
              label: String(entry),
              isCurrent: entry === page.page,
              onSelect: goTo(entry),
            },
      ),
      onPrevious: goTo(page.page - 1),
      onNext: goTo(page.page + 1),
      hasPrevious: page.page > 1,
      hasNext: page.page < page.pageCount,
    },
  };
}

function tilesFor(summary: CatalogSummary): CatalogTile[] {
  const { live, pendingReview, streamsThisWeek, streams30d } = summary;

  return [
    {
      label: 'Live releases',
      value: String(live.count),
      hint: `of ${live.total} in catalog`,
    },
    {
      label: 'Pending review',
      value: String(pendingReview.count),
      hint: pendingReview.count
        ? `oldest waiting ${pendingReview.oldestWaitingDays} days`
        : 'nothing waiting on the stores',
    },
    {
      label: 'Streams this week',
      value: streamsThisWeek.label,
      delta:
        streamsThisWeek.changePercent === null
          ? undefined
          : {
              value: `${streamsThisWeek.changePercent >= 0 ? '+' : '−'}${Math.abs(streamsThisWeek.changePercent).toFixed(1)}%`,
              tone: streamsThisWeek.changePercent >= 0 ? 'live' : 'danger',
            },
      hint: 'vs. previous 7 days',
    },
    {
      label: 'Streams · 30d',
      value: streams30d.label,
      hint: 'across the whole catalogue',
    },
  ];
}
