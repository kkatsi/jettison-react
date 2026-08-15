// What the screen can be scoped to, and how that scope survives the URL. The
// picker lists only releases the stores have taken: a draft has no numbers, and
// an empty chart the reader blames on the label is worse than an absent row.

import type { ScopeArtistDto, ScopeOption, ScopeReleaseDto } from '../api/types';

export const ALL_SCOPE = 'all';

export type Scope = { kind: 'all' } | { kind: 'artist' | 'release'; id: string };

/** Anything unreadable falls back to the whole label rather than blanking the screen. */
export function parseScope(value: string | null): Scope {
  if (!value || value === ALL_SCOPE) return { kind: 'all' };

  const [kind, id] = value.split(':');
  if ((kind === 'artist' || kind === 'release') && id) return { kind, id };
  return { kind: 'all' };
}

export function formatScope(scope: Scope): string {
  return scope.kind === 'all' ? ALL_SCOPE : `${scope.kind}:${scope.id}`;
}

const isLive = (release: ScopeReleaseDto) => release.status === 'live';

export function scopeOptions(
  releases: readonly ScopeReleaseDto[],
  artists: readonly ScopeArtistDto[],
): ScopeOption[] {
  const live = releases.filter(isLive);

  const byArtist = artists
    .map((artist) => ({
      artist,
      releases: live.filter((release) => release.artistId === artist.id),
    }))
    .filter((entry) => entry.releases.length > 0)
    .sort(
      (a, b) => b.releases.length - a.releases.length || a.artist.name.localeCompare(b.artist.name),
    );

  return [
    {
      value: ALL_SCOPE,
      label: 'All releases',
      meta: `${releases.length} in catalog`,
      group: 'Label',
      artwork: null,
    },

    ...byArtist.map(({ artist, releases: theirs }) => ({
      value: formatScope({ kind: 'artist', id: artist.id }),
      label: artist.name,
      meta: `${theirs.length} ${theirs.length === 1 ? 'release' : 'releases'}`,
      group: 'Artists' as const,
      artwork: theirs[0]?.artwork ?? null,
    })),

    ...live.map((release) => ({
      value: formatScope({ kind: 'release', id: release.id }),
      label: release.title,
      meta: release.catalogNumber,
      group: 'Releases' as const,
      artwork: release.artwork,
    })),
  ];
}

/** The picker's own shape: a heading and the options under it, in list order. */
export type ScopeGroup = { value: ScopeOption['group']; items: ScopeOption[] };

export function scopeGroups(options: readonly ScopeOption[]): ScopeGroup[] {
  return options.reduce<ScopeGroup[]>((groups, option) => {
    const last = groups.at(-1);
    if (last?.value === option.group) last.items.push(option);
    else groups.push({ value: option.group, items: [option] });

    return groups;
  }, []);
}

/** The whole label is the fallback, so the picker always has something selected. */
export function selectedOption(options: readonly ScopeOption[], value: string): ScopeOption | null {
  return options.find((option) => option.value === value) ?? options[0] ?? null;
}
