// The screen's one hook (R2). Query in, filters from the URL, one view-model out
// (R3) — the view below it decides nothing.

import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { useNavigate } from 'react-router';

import type { FilterOption, Tone } from '@shared/ui';

import { useReleasesQuery } from '../../api/endpoints';
import type { Release } from '../../api/types';
import type { RowAction } from '../../components/RowActions';
import { STAGE } from '../../constants';
import { useWithdrawRelease, type WithdrawModel } from '../../hooks/useWithdrawRelease';
import { pipelineStage } from '../../services/release-status';
import {
  DEFAULT_FILTERS,
  STAGE_VALUES,
  TYPE_VALUES,
  artistOptions,
  filterReleases,
  isFiltered,
  pageWindow,
  paginate,
  sortCatalogue,
} from './catalog-filters';
import { catalogClock, summarise, trendDirection, type CatalogSummary } from './catalog-summary';
import { TREND_LABEL } from './constants';

/** A release with everything the row renders already decided. */
export type CatalogRow = Release & {
  stage: { label: string; tone: Tone; busy: boolean };
  /** The sparkline's own column, so the line carries its own description. */
  trendLabel: string;
  onOpen: () => void;
  actions: RowAction[];
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
  withdraw: WithdrawModel;
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

/** The screen's URL contract: defaults stay out of the query string, junk falls back (ADR-004). */
const FILTER_PARSERS = {
  query: parseAsString.withDefault(DEFAULT_FILTERS.query),
  artist: parseAsString.withDefault(DEFAULT_FILTERS.artist),
  type: parseAsStringLiteral(TYPE_VALUES).withDefault(DEFAULT_FILTERS.type),
  stage: parseAsStringLiteral(STAGE_VALUES).withDefault(DEFAULT_FILTERS.stage),
  page: parseAsInteger.withDefault(DEFAULT_FILTERS.page),
};

export function useCatalog(): CatalogModel {
  const { data, isLoading, isError, refetch } = useReleasesQuery();
  const [filters, setFilters] = useQueryStates(FILTER_PARSERS, { urlKeys: { query: 'q' } });
  const withdraw = useWithdrawRelease();
  const navigate = useNavigate();

  const releases = data ?? [];
  const clock = catalogClock(releases);
  const matching = filterReleases(sortCatalogue(releases, clock), filters);
  const page = paginate(matching, filters.page);
  const summary = summarise(releases, clock);

  // Any filter change returns to page one: page 4 of a two-page result is a blank
  // table, and the user didn't ask to go anywhere.
  const update = (patch: Partial<typeof filters>) => void setFilters({ page: 1, ...patch });

  const goTo = (target: number) => () => void setFilters({ page: target });

  return {
    isLoading,
    failure: isError ? { retry: () => void refetch() } : null,
    tiles: tilesFor(summary),
    rows: page.items.map((release) => {
      const stage = pipelineStage(release);
      const open = () => void navigate(`/catalog/${release.id}`);
      const takeBack = withdraw.actionFor({ id: release.id, title: release.title, stage });

      return {
        ...release,
        stage: STAGE[stage],
        trendLabel: TREND_LABEL[trendDirection(release.streamsTrend)],
        onOpen: open,
        actions: [
          { label: 'Open release', onSelect: open },
          ...(takeBack
            ? [
                {
                  label: takeBack.label,
                  isDestructive: takeBack.isDestructive,
                  onSelect: () => withdraw.request({ id: release.id, title: release.title, stage }),
                },
              ]
            : []),
        ],
      };
    }),
    isEmpty: !isLoading && !isError && matching.length === 0,
    resultLabel:
      matching.length === releases.length ? '' : `${matching.length} of ${releases.length}`,
    countLabel: `${releases.length} releases`,
    footerLabel: page.label,
    withdraw,
    filters: {
      query: filters.query,
      artist: filters.artist,
      type: filters.type,
      stage: filters.stage,
      artists: [ALL, ...artistOptions(releases)],
      types: TYPE_VALUES.map((type) => (type === 'all' ? ALL : { value: type, label: type })),
      stages: STAGE_VALUES.map((stage) =>
        stage === 'all' ? ALL : { value: stage, label: STAGE[stage].label },
      ),
      isActive: isFiltered(filters),
      onQuery: (query) => update({ query }),
      onArtist: (artist) => update({ artist }),
      onType: (type) => update({ type: type as (typeof TYPE_VALUES)[number] }),
      onStage: (stage) => update({ stage: stage as (typeof STAGE_VALUES)[number] }),
      // null clears every key this hook owns — the whole filter set, in one call.
      onReset: () => void setFilters(null),
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
