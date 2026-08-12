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

export const releaseSubmitted = createAction<ReleaseEvent>('domain/releases/submitted');

export const releaseWithdrawn = createAction<ReleaseEvent>('domain/releases/withdrawn');

export const trackProcessed = createAction<ReleaseEvent & { trackTitle: string }>(
  'domain/tracks/processed',
);
