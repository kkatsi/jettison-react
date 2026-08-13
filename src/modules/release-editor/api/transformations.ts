// Server response → UI shape, and nothing else (Ch. 4 §1). A draft arrives with
// holes in it by definition, and this is where they get filled once.

import type { SubmittedRelease } from '@shared/events';

import { EMPTY_CREDITS } from '../constants';
import type { DraftTrack, ReleaseDraft, ReleaseDraftDto, TrackDto } from './types';

/** Nothing to show yet. */
const NONE = '—';

export function toDraft(dto: ReleaseDraftDto): ReleaseDraft {
  return {
    id: dto.id,
    catalogNumber: dto.catalogNumber,
    title: dto.title,
    artistId: dto.artistId,
    artistName: dto.artistName,
    type: dto.type,
    status: dto.status,
    releaseDate: dto.releaseDate,
    submittedAt: dto.submittedAt,
    genre: dto.genre ?? '',
    credits: dto.credits ?? EMPTY_CREDITS,
    artwork: dto.artwork,
    artworkFile: dto.artworkFile ?? null,
    tracks: [...dto.tracks].sort((a, b) => a.number - b.number).map(toDraftTrack),
    storeIds: dto.deliveries.map((delivery) => delivery.storeId),
  };
}

export function toDraftTrack(dto: TrackDto): DraftTrack {
  return {
    id: dto.id,
    number: dto.number,
    title: dto.title,
    isrc: dto.isrc,
    audioStatus: dto.audioStatus,
    // A duration read off a file nobody has finished ingesting is a guess.
    duration: dto.audioStatus === 'ready' ? formatDuration(dto.durationMs) : NONE,
    durationMs: dto.durationMs,
  };
}

/** The announcement catalog and activity hear. Everything they need to draw a row. */
export function toSubmission(draft: ReleaseDraft): SubmittedRelease {
  return {
    id: draft.id,
    catalogNumber: draft.catalogNumber,
    title: draft.title,
    artwork: draft.artwork,
    artistId: draft.artistId,
    artistName: draft.artistName,
    type: draft.type,
    releaseDate: draft.releaseDate,
    submittedAt: draft.submittedAt ?? new Date().toISOString(),
    storeIds: draft.storeIds,
  };
}

export function formatDuration(durationMs: number): string {
  const seconds = Math.round(durationMs / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** '3:42 · 4:18 · 2:31' summed — the review step's running time. */
export function totalDuration(tracks: readonly { durationMs: number }[]): string {
  return formatDuration(tracks.reduce((total, track) => total + track.durationMs, 0));
}
