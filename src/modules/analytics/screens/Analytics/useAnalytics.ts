// The screen's one hook (R2): three queries, two URL params, one view-model out (R3).

import { parseAsNumberLiteral, parseAsString, useQueryStates } from 'nuqs';
import { useMemo } from 'react';

import {
  useAnalyticsReportQuery,
  useScopeArtistsQuery,
  useScopeReleasesQuery,
} from '../../api/endpoints';
import { formatMoneyAxis, formatStreamsAxis } from '../../api/transformations';
import type { AnalyticsReport, ScopeOption } from '../../api/types';
import { DEFAULT_RANGE, RANGES, type Range } from '../../constants';
import {
  ALL_SCOPE,
  scopeGroups,
  scopeOptions,
  selectedOption,
  type ScopeGroup,
} from '../../services/scope';

export type AnalyticsModel = {
  isLoading: boolean;
  failure: { retry: () => void } | null;
  report: AnalyticsReport | null;
  scope: {
    selected: ScopeOption | null;
    groups: ScopeGroup[];
    onSelect: (option: ScopeOption) => void;
  };
  range: {
    value: Range;
    options: { value: Range; label: string }[];
    onSelect: (range: Range) => void;
  };
  /** How each chart labels its y-axis — a stable reference, so the plot is not redrawn. */
  axis: { streams: AxisFormat; revenue: AxisFormat };
};

type AxisFormat = (value: number) => string;

/** Scope and range belong in the URL: a label manager sends the chart, not a description of it (ADR-004). */
const PARSERS = {
  scope: parseAsString.withDefault(ALL_SCOPE),
  range: parseAsNumberLiteral(RANGES).withDefault(DEFAULT_RANGE),
};

export function useAnalytics(): AnalyticsModel {
  const [{ scope, range }, setParams] = useQueryStates(PARSERS);

  const {
    data: report,
    isLoading,
    isError,
    refetch,
  } = useAnalyticsReportQuery({ scope, days: range });

  const { data: releases } = useScopeReleasesQuery();
  const { data: artists } = useScopeArtistsQuery();

  // The picker re-renders on every hover inside the popup; the list it filters is
  // built from two queries and does not change with either.
  const options = useMemo(() => scopeOptions(releases ?? [], artists ?? []), [releases, artists]);
  const groups = useMemo(() => scopeGroups(options), [options]);

  return {
    isLoading,
    failure: isError ? { retry: () => void refetch() } : null,
    report: report ?? null,
    scope: {
      selected: selectedOption(options, scope),
      groups,
      onSelect: (option) => void setParams({ scope: option.value }),
    },
    range: {
      value: range,
      options: RANGES.map((value) => ({ value, label: `${value}d` })),
      onSelect: (value) => void setParams({ range: value }),
    },
    axis: { streams: formatStreamsAxis, revenue: formatMoneyAxis },
  };
}
