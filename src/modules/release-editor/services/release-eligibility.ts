// What stops a release being submitted. Codes, never copy (R5, R6) — the label's
// rules in one sitting.

import type { ArtworkFile, DraftTrack, ReleaseType } from '../api/types';

/** Stores need a week to ingest, index and schedule a release. */
export const MIN_LEAD_DAYS = 7;

/** The strictest store's requirement, so one cover satisfies all five. */
export const MIN_ARTWORK_PX = 3000;

export type IssueCode =
  | 'details-incomplete'
  | 'no-tracks'
  | 'track-metadata-incomplete'
  | 'audio-still-processing'
  | 'artwork-missing'
  | 'artwork-too-small'
  | 'release-date-too-soon';

export type ReleaseIssue = {
  code: IssueCode;
  /** The track, file or field the issue is about, for copy that can name it. */
  subject: string | null;
  /** The number the copy quotes: days of lead, pixels across. */
  amount: number | null;
};

/** Everything the rules read. Not the release type — a service takes what it needs. */
export type SubmissionCandidate = {
  title: string;
  artistId: string;
  type: ReleaseType;
  releaseDate: string;
  artworkFile: ArtworkFile | null;
  tracks: readonly DraftTrack[];
};

const DAY_MS = 86400000;

/** Whole days: a release date is a date, not a time. */
export function leadDays(releaseDate: string, today: string): number {
  const from = Date.parse(`${today}T00:00:00Z`);
  const to = Date.parse(`${releaseDate}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;

  return Math.round((to - from) / DAY_MS);
}

export function hasEnoughLead(releaseDate: string, today: string): boolean {
  return leadDays(releaseDate, today) >= MIN_LEAD_DAYS;
}

/** Square, and big enough for the largest grid any store renders. */
export function meetsArtworkRequirements(file: ArtworkFile | null): boolean {
  if (!file) return false;
  return file.width >= MIN_ARTWORK_PX && file.height >= MIN_ARTWORK_PX;
}

/** Everything between this release and the stores. An empty list opens submission. */
export function releaseIssues(release: SubmissionCandidate, today: string): ReleaseIssue[] {
  const issues: ReleaseIssue[] = [];
  const issue = (code: IssueCode, subject: string | null = null, amount: number | null = null) =>
    issues.push({ code, subject, amount });

  if (!release.title.trim() || !release.artistId) issue('details-incomplete');

  if (release.tracks.length === 0) {
    issue('no-tracks');
  } else {
    // The first offender is enough: a list of eleven untitled tracks is a wall,
    // not a fix, and clearing one reveals the next.
    const untitled = release.tracks.find((track) => !track.title.trim());
    if (untitled) issue('track-metadata-incomplete', null, untitled.number);

    const ingesting = release.tracks.find((track) => track.audioStatus !== 'ready');
    if (ingesting) issue('audio-still-processing', ingesting.title, ingesting.number);
  }

  if (!release.artworkFile) {
    issue('artwork-missing');
  } else if (!meetsArtworkRequirements(release.artworkFile)) {
    issue(
      'artwork-too-small',
      release.artworkFile.name,
      Math.min(release.artworkFile.width, release.artworkFile.height),
    );
  }

  if (!hasEnoughLead(release.releaseDate, today)) {
    issue('release-date-too-soon', release.releaseDate, leadDays(release.releaseDate, today));
  }

  return issues;
}

export function canSubmit(release: SubmissionCandidate, today: string): boolean {
  return releaseIssues(release, today).length === 0;
}
