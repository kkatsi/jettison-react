// What the catalogue screen decides: which releases the filters admit, and which
// page of them is on screen. Reading and writing the URL is nuqs's job (ADR-004);
// what is left here is the part that is ours. No React, no store, no fetching (R5).

import type { Release, ReleaseType } from '../../api/types';
import { pipelineStage, type PipelineStage } from '../../services/release-status';

/** `all` is a filter value, not the absence of one — it belongs in the allowlist. */
export const TYPE_VALUES = ['all', 'Single', 'EP', 'Album'] as const satisfies readonly (
  'all' | ReleaseType
)[];

export const STAGE_VALUES = [
  'all',
  'draft',
  'submitted',
  'in-review',
  'delivering',
  'live',
  'blocked',
] as const satisfies readonly ('all' | PipelineStage)[];

export type CatalogFilters = {
  query: string;
  /** Artist id, or 'all'. */
  artist: string;
  type: (typeof TYPE_VALUES)[number];
  /** The stage the chip shows, not the raw status: people filter by what they see. */
  stage: (typeof STAGE_VALUES)[number];
  page: number;
};

export const DEFAULT_FILTERS: CatalogFilters = {
  query: '',
  artist: 'all',
  type: 'all',
  stage: 'all',
  page: 1,
};

/** Twelve rows fills the table at 1440×900 without the page scrolling. */
export const PAGE_SIZE = 12;

/** The page is a position, not a filter — Reset shouldn't light up because of it. */
export function isFiltered(filters: CatalogFilters): boolean {
  return (
    filters.query.trim() !== '' ||
    filters.artist !== 'all' ||
    filters.type !== 'all' ||
    filters.stage !== 'all'
  );
}

/**
 * Newest first by the date the table shows, so the order is readable off the
 * column. Same-day releases fall back to the catalogue number, which puts the
 * most recently started one on top.
 */
export function sortCatalogue(releases: readonly Release[]): Release[] {
  return releases.toSorted(
    (a, b) =>
      b.releaseDate.localeCompare(a.releaseDate) || b.catalogNumber.localeCompare(a.catalogNumber),
  );
}

export function filterReleases(releases: readonly Release[], filters: CatalogFilters): Release[] {
  const needle = filters.query.trim().toLowerCase();

  return releases.filter((release) => {
    if (filters.artist !== 'all' && release.artistId !== filters.artist) return false;
    if (filters.type !== 'all' && release.type !== filters.type) return false;
    if (filters.stage !== 'all' && pipelineStage(release) !== filters.stage) return false;
    if (!needle) return true;

    return [release.title, release.artistName, release.catalogNumber]
      .join(' ')
      .toLowerCase()
      .includes(needle);
  });
}

export type Page<T> = {
  items: T[];
  /** Clamped: filtering down to two rows while on page 4 lands on the last page, not on nothing. */
  page: number;
  pageCount: number;
  /** 'Showing 1–12 of 31 releases'. */
  label: string;
};

export function paginate<T>(items: readonly T[], page: number, size = PAGE_SIZE): Page<T> {
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, page), pageCount);
  const from = (current - 1) * size;
  const visible = items.slice(from, from + size);

  return {
    items: visible,
    page: current,
    pageCount,
    label: items.length
      ? `Showing ${from + 1}–${from + visible.length} of ${items.length} releases`
      : 'Showing 0 releases',
  };
}

/** First, last, and the current page's neighbours; the gaps become ellipses. */
export function pageWindow(page: number, pageCount: number): (number | 'gap')[] {
  const window: (number | 'gap')[] = [];

  for (let candidate = 1; candidate <= pageCount; candidate += 1) {
    if (candidate === 1 || candidate === pageCount || Math.abs(candidate - page) <= 1) {
      window.push(candidate);
    } else if (window.at(-1) !== 'gap') {
      window.push('gap');
    }
  }

  return window;
}

/** The artist filter's options, taken from the catalogue rather than a second endpoint. */
export function artistOptions(releases: readonly Release[]): { value: string; label: string }[] {
  const names = new Map<string, string>();
  for (const release of releases) names.set(release.artistId, release.artistName);

  return [...names]
    .sort(([, a], [, b]) => a.localeCompare(b))
    .map(([value, label]) => ({ value, label }));
}
