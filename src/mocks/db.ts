// =============================================================================
// The write model — the mock backend's command store.
// =============================================================================
// Mutations land here immediately and are immediately readable *by id*. The lists
// are somewhere else, and they are behind (see projection.ts). That split is the
// whole point of this mock: it is how the backends this architecture targets
// actually behave (ADR-002).
// =============================================================================

import { buildSeed } from './seeds';
import type { ActivityEvent, DailyStat, Release, Track } from './schemas';

const seed = buildSeed();

export const db = {
  artists: seed.artists,
  stores: seed.stores,
  /** Keyed, because detail reads go straight here. */
  releases: new Map<string, Release>(seed.releases.map((release) => [release.id, release])),
  tracks: seed.tracks as Track[],
  activity: seed.activity as ActivityEvent[],
  stats: seed.stats as DailyStat[],
};

/** Releases, newest submission first — the order every list in the console uses. */
export function releasesNewestFirst(): Release[] {
  return [...db.releases.values()].sort((a, b) =>
    (b.submittedAt ?? b.releaseDate).localeCompare(a.submittedAt ?? a.releaseDate),
  );
}

export function tracksFor(releaseId: string): Track[] {
  return db.tracks
    .filter((track) => track.releaseId === releaseId)
    .sort((a, b) => a.number - b.number);
}
