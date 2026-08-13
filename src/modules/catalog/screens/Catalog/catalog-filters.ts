// What the catalogue screen decides: which releases the filters admit, and which
// page of them is on screen. Born colocated — one screen calls it (Ch. 2 §6).
// No React, no store, no fetching (R5).

import type { Release, ReleaseType } from '../../api/types';
import { pipelineStage, type PipelineStage } from '../../services/release-status';

export type CatalogFilters = {
  query: string;
  /** Artist id, or 'all'. */
  artist: string;
  type: ReleaseType | 'all';
  /** The stage the chip shows, not the raw status: people filter by what they see. */
  stage: PipelineStage | 'all';
  page: number;
};

export const RELEASE_TYPES: readonly ReleaseType[] = ['Single', 'EP', 'Album'];

export const PIPELINE_STAGES: readonly PipelineStage[] = [
  'draft',
  'submitted',
  'in-review',
  'delivering',
  'live',
  'blocked',
];

/** Twelve rows fills the table at 1440×900 without the page scrolling. */
export const PAGE_SIZE = 12;

export const DEFAULT_FILTERS: CatalogFilters = {
  query: '',
  artist: 'all',
  type: 'all',
  stage: 'all',
  page: 1,
};

/** Anything unrecognised falls back — a hand-edited URL must not blank the table. */
export function readFilters(params: URLSearchParams): CatalogFilters {
  const type = params.get('type');
  const stage = params.get('stage');
  const page = Number(params.get('page'));

  return {
    query: params.get('q') ?? DEFAULT_FILTERS.query,
    artist: params.get('artist') ?? DEFAULT_FILTERS.artist,
    type: RELEASE_TYPES.includes(type as ReleaseType) ? (type as ReleaseType) : 'all',
    stage: PIPELINE_STAGES.includes(stage as PipelineStage) ? (stage as PipelineStage) : 'all',
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

/** Only what differs from the default reaches the URL, so a clean view has a clean link. */
export function filterParams(filters: CatalogFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.query.trim()) params.q = filters.query;
  if (filters.artist !== 'all') params.artist = filters.artist;
  if (filters.type !== 'all') params.type = filters.type;
  if (filters.stage !== 'all') params.stage = filters.stage;
  if (filters.page > 1) params.page = String(filters.page);
  return params;
}

/** The page number is a position, not a filter — Reset shouldn't light up because of it. */
export function isFiltered(filters: CatalogFilters): boolean {
  return Object.keys(filterParams({ ...filters, page: 1 })).length > 0;
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

/**
 * The page numbers a reader can actually use: first, last, and the neighbours of
 * the current one. Gaps become ellipses the view renders as dead space.
 */
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
