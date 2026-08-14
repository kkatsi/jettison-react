// The tracklist's own rules: what has finished ingesting, what just did, and what
// order the list is in. No React, no store (R5).

import type { AudioStatus, DraftTrack } from '../api/types';

export function readyCount(tracks: readonly DraftTrack[]): number {
  return tracks.filter((track) => track.audioStatus === 'ready').length;
}

/** Something is still on its way, which is what makes the screen keep asking. */
export function isIngesting(tracks: readonly DraftTrack[]): boolean {
  return tracks.some((track) => track.audioStatus !== 'ready');
}

/** The transition, not the state: a track that was always ready is not news. */
export function newlyReady(
  before: ReadonlyMap<string, AudioStatus>,
  tracks: readonly DraftTrack[],
): DraftTrack[] {
  return tracks.filter(
    (track) =>
      track.audioStatus === 'ready' && before.has(track.id) && before.get(track.id) !== 'ready',
  );
}

export function audioStatuses(tracks: readonly DraftTrack[]): Map<string, AudioStatus> {
  return new Map(tracks.map((track) => [track.id, track.audioStatus]));
}

/** Drag-and-drop, as an array operation. Out-of-range indices leave the list alone. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return [...items];
  }

  const next = [...items];
  const [moved] = next.splice(from, 1);
  if (moved !== undefined) next.splice(to, 0, moved);

  return next;
}
