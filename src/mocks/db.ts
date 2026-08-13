// The write model. Writes land here and are readable by id straight away; the
// lists live in projection.ts and trail behind (ADR-002).

import { buildSeed } from './seeds';
import type { ActivityEvent, AudioStatus, DailyStat, Release, Track } from './schemas';

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

/** How long the ingestion pipeline takes on a file the wizard just sent. */
export const UPLOAD_MS = 1500;
export const PROCESSING_MS = 6000;

/**
 * Ingestion progress is computed when someone reads it, never pushed. A timer that
 * wrote the status would race the reconcile window and break the demo it decorates.
 */
export function audioStatusAt(uploadedAt: string, now: number): AudioStatus {
  const elapsed = now - Date.parse(uploadedAt);
  if (elapsed < UPLOAD_MS) return 'uploading';
  if (elapsed < UPLOAD_MS + PROCESSING_MS) return 'processing';
  return 'ready';
}

export function tracksFor(releaseId: string): Track[] {
  return db.tracks
    .filter((track) => track.releaseId === releaseId)
    .sort((a, b) => a.number - b.number)
    .map((track) =>
      track.uploadedAt
        ? { ...track, audioStatus: audioStatusAt(track.uploadedAt, Date.now()) }
        : track,
    );
}

/** The label's own name for the session. A real backend would read it off the token. */
const SESSION_ACTOR = 'Mara Kessler';

/** The backend records the same fact the client announced to its own modules. */
function recordActivity(
  type: ActivityEvent['type'],
  release: Release,
  summary: string,
  actor = SESSION_ACTOR,
): void {
  db.activity.unshift({
    id: `evt-${type.split('/').pop()}-${release.id}-${db.activity.length}`,
    type,
    at: new Date().toISOString(),
    actor,
    summary,
    release: {
      id: release.id,
      catalogNumber: release.catalogNumber,
      title: release.title,
      artwork: release.artwork,
    },
  });
}

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

  // Recorded on the backend too — that's what makes the delayed reconcile a
  // confirmation rather than a surprise.
  recordActivity(
    'domain/releases/withdrawn',
    withdrawn,
    `Withdrawn from all ${release.deliveries.length} stores at the artist's request`,
  );

  return withdrawn;
}

/** LOR-0074 after LOR-0073. The label numbers releases, not the console. */
export function nextCatalogNumber(existing: readonly string[]): string {
  const highest = existing.reduce((top, number) => {
    const sequence = Number(number.slice(4));
    return Number.isNaN(sequence) ? top : Math.max(top, sequence);
  }, 0);

  return `LOR-${String(highest + 1).padStart(4, '0')}`;
}

const DAY_MS = 86400000;

/** Far enough out that the lead-time rule starts satisfied. */
const DEFAULT_LEAD_DAYS = 28;

export function createDraft(): Release {
  const catalogNumber = nextCatalogNumber([...db.releases.values()].map((r) => r.catalogNumber));

  const draft: Release = {
    id: catalogNumber.toLowerCase(),
    catalogNumber,
    title: '',
    artistId: '',
    artistName: '',
    type: 'Single',
    status: 'draft',
    releaseDate: new Date(Date.now() + DEFAULT_LEAD_DAYS * DAY_MS).toISOString().slice(0, 10),
    submittedAt: null,
    // Until a cover is uploaded, the console shows the panel's own colours rather
    // than pretending a release has artwork.
    artwork: { from: '#2A3040', to: '#12161F' },
    streams30d: 0,
    streamsTrend: [],
    deliveries: db.stores.map((store) => ({
      storeId: store.id,
      status: 'pending',
      deliveredAt: null,
    })),
    genre: null,
    credits: null,
    artworkFile: null,
  };

  db.releases.set(draft.id, draft);
  return draft;
}

export type DraftPatch = Partial<
  Pick<Release, 'title' | 'type' | 'releaseDate' | 'genre' | 'credits' | 'artwork' | 'artworkFile'>
> & { artistId?: string };

export function updateDraft(release: Release, patch: DraftPatch): Release {
  const artist = patch.artistId
    ? db.artists.find((candidate) => candidate.id === patch.artistId)
    : undefined;

  const updated: Release = {
    ...release,
    ...patch,
    artistId: artist?.id ?? release.artistId,
    artistName: artist?.name ?? release.artistName,
  };

  db.releases.set(updated.id, updated);
  return updated;
}

/** What a 24-bit/44.1kHz stereo WAV weighs per second — the format the console asks for. */
const WAV_BYTES_PER_SECOND = 264600;

// ponytail: a two-minute floor, so dropping a 4 KB file doesn't produce a 0:00 track.
const durationFromSize = (bytes: number) =>
  Math.max(120_000, Math.round((bytes / WAV_BYTES_PER_SECOND) * 1000));

/** Only ever goes up: reusing a deleted track's code would reuse its ISRC. */
let isrcSequence = db.tracks.length;

export function addTrack(release: Release, file: { name: string; size: number }): Track {
  isrcSequence += 1;

  const track: Track = {
    id: `${release.id}-t${isrcSequence}`,
    releaseId: release.id,
    number: tracksFor(release.id).length + 1,
    // The filename is the first draft of the title, and the wizard says so.
    title: file.name.replace(/\.[^.]+$/, ''),
    durationMs: durationFromSize(file.size),
    isrc: `GBLOR26${String(isrcSequence).padStart(5, '0')}`,
    audioStatus: 'uploading',
    uploadedAt: new Date().toISOString(),
  };

  db.tracks.push(track);
  return track;
}

/** The tracklist is written as a list: retitling, reordering and removing are one write. */
export function replaceTracks(release: Release, order: readonly { id: string; title: string }[]) {
  const existing = new Map(tracksFor(release.id).map((track) => [track.id, track]));

  const kept = order.flatMap((entry, index) => {
    const track = existing.get(entry.id);
    return track ? [{ ...track, title: entry.title, number: index + 1 }] : [];
  });

  db.tracks = db.tracks.filter((track) => track.releaseId !== release.id).concat(kept);
  return tracksFor(release.id);
}

export function submitRelease(release: Release): Release {
  const submitted: Release = {
    ...release,
    status: 'submitted',
    submittedAt: new Date().toISOString(),
    deliveries: release.deliveries.map((delivery) => ({ ...delivery, status: 'in-review' })),
  };
  db.releases.set(submitted.id, submitted);

  recordActivity(
    'domain/releases/submitted',
    submitted,
    `${submitted.title} submitted for distribution to ${submitted.deliveries.length} stores`,
  );

  return submitted;
}
