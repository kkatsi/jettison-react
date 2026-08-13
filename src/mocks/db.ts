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

/** The label's own name for the session. A real backend would read it off the token. */
const SESSION_ACTOR = 'Mara Kessler';

/** Out of the pipeline, out of the stores, back to a draft. Undefined for an unknown id. */
export function withdrawRelease(id: string): Release | undefined {
  const release = db.releases.get(id);
  if (!release) return undefined;

  const withdrawn: Release = {
    ...release,
    status: 'draft',
    submittedAt: null,
    deliveries: release.deliveries.map((delivery) => ({
      ...delivery,
      status: 'pending',
      deliveredAt: null,
    })),
  };
  db.releases.set(id, withdrawn);

  // The backend records the same fact the client just announced to its own
  // modules — that's what makes the delayed reconcile a confirmation.
  db.activity.unshift({
    id: `evt-withdrawn-${id}-${db.activity.length}`,
    type: 'domain/releases/withdrawn',
    at: new Date().toISOString(),
    actor: SESSION_ACTOR,
    summary: `Withdrawn from all ${release.deliveries.length} stores at the artist's request`,
    release: {
      id: release.id,
      catalogNumber: release.catalogNumber,
      title: release.title,
      artwork: release.artwork,
    },
  });

  return withdrawn;
}
