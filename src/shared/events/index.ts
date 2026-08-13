// Every fact that crosses a module boundary, in one readable list.
//
// Naming: domain/<entity>/<past-tense fact>. Payload: the smallest thing a
// listener needs, and its type lives here too (shared can't import a module).
// No logic — createAction calls only.
//
// The producers arrive with catalog and release-editor; activity already listens.
// That order is deliberate: an event nobody dispatches costs nothing, which is
// the same reason jettisoning a producer is safe.

import { createAction } from '@reduxjs/toolkit';

/** What every listener needs to name a release on screen. */
export type EventRelease = {
  id: string;
  catalogNumber: string;
  title: string;
  artwork: { from: string; to: string };
};

type ReleaseEvent = {
  release: EventRelease;
  /** Who caused it — a person, or a system that acts like one. */
  actor: string;
};

/**
 * Submission carries more, because it asks more: a listener has to put a row on
 * screen for a release its own list endpoint will not return for another few
 * seconds, and a row needs more than a name. Still the smallest thing a listener
 * needs — it is that this listener needs a row.
 *
 * The type vocabulary is repeated here rather than imported: shared cannot see
 * inside a module, and a boundary is the one place duplication is the cheap
 * answer (Ch. 2 §6).
 */
export type SubmittedRelease = EventRelease & {
  artistId: string;
  artistName: string;
  type: 'Single' | 'EP' | 'Album';
  releaseDate: string;
  submittedAt: string;
  /** The stores it went to — enough to draw a delivery row with nothing delivered yet. */
  storeIds: string[];
};

export const releaseSubmitted = createAction<{ release: SubmittedRelease; actor: string }>(
  'domain/releases/submitted',
);

export const releaseWithdrawn = createAction<ReleaseEvent>('domain/releases/withdrawn');

export const trackProcessed = createAction<ReleaseEvent & { trackTitle: string }>(
  'domain/tracks/processed',
);
