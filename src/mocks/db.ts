// The write model. Writes land here and are readable by id straight away; the
// lists live in projection.ts and trail behind (ADR-002).

import { buildSeed } from './seeds';
import type { ActivityEvent, DailyStat, Release, Track } from './schemas';

const seed = buildSeed();

export const db = {
  artists: seed.artists,
  stores: seed.stores,
  /** Keyed — detail reads come straight from here. */
  releases: new Map<string, Release>(seed.releases.map((release) => [release.id, release])),
  tracks: seed.tracks as Track[],
  activity: seed.activity as ActivityEvent[],
  stats: seed.stats as DailyStat[],
};

/** Newest submission first, the order every list uses. */
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
