// Every fact that crosses a module boundary, in one list.
// domain/<entity>/<past-tense fact>, no logic, payload types included because
// shared cannot import a module. No library is named here either: how an event
// travels is core's business (@core/events/events), what happened is ours.

import { defineEvent } from '@core/events/events';

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
 * Submission carries a whole row: the catalogue has to show the release seconds
 * before its own list endpoint will return it.
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

export const releaseSubmitted = defineEvent<{ release: SubmittedRelease; actor: string }>(
  'domain/releases/submitted',
);

export const releaseWithdrawn = defineEvent<ReleaseEvent>('domain/releases/withdrawn');

export const trackProcessed = defineEvent<ReleaseEvent & { trackTitle: string }>(
  'domain/tracks/processed',
);
