// Copy and label configuration, keyed by domain code (R6). The services decide;
// this file is the only place that knows what a human should read.

import type { Tone } from '@shared/ui';

import type { AudioStatus, Credits, ReleaseType } from './api/types';
import { MIN_ARTWORK_PX, MIN_LEAD_DAYS } from './services/release-eligibility';
import type { IssueCode, ReleaseIssue } from './services/release-eligibility';
import type { SaveState } from './state/draft-slice';

/** Who the console acts as. A real app reads this off the session. */
export const SESSION_ACTOR = 'Mara Kessler';

const YEAR = new Date().getFullYear();

/** A new release inherits the label's rights lines; the wizard can overwrite them. */
export const EMPTY_CREDITS: Credits = {
  composer: '',
  producer: '',
  publisher: '',
  pLine: `℗ ${YEAR} Low Orbit Records`,
  cLine: `© ${YEAR} Low Orbit Records`,
};

/** What this label signs. Not a taxonomy — the stores keep their own. */
export const GENRES = [
  'Electronic — Ambient',
  'Electronic — Techno',
  'Alternative',
  'Post-rock',
  'Jazz',
] as const;

export const TYPES: readonly ReleaseType[] = ['Single', 'EP', 'Album'];

export const TYPE_HINT: Record<ReleaseType, string> = {
  Single: '1–3 tracks, under 30 minutes.',
  EP: '4–6 tracks, or under 30 minutes.',
  Album: '7 or more tracks.',
};

/** The header's one line about the server. `retry` appears only when it failed. */
export const SAVE: Record<SaveState, { label: string; tone: Tone; retry: boolean }> = {
  idle: { label: 'Draft saved', tone: 'idle', retry: false },
  saving: { label: 'Saving…', tone: 'idle', retry: false },
  saved: { label: 'Draft saved', tone: 'live', retry: false },
  failed: { label: "Couldn't save — changes kept locally", tone: 'danger', retry: true },
};

export const DISCARD = {
  title: 'Discard {title}?',
  description:
    'The draft, its tracks and its uploads are deleted. The catalogue number is not reissued — the label numbers releases in the order they were started.',
  confirm: 'Discard draft',
};

/** Ingestion, in the words the wizard uses for it. Catalog names the same states
    from its own side — three lines at a module boundary, duplicated on purpose. */
export const AUDIO: Record<AudioStatus, { label: string; tone: Tone }> = {
  uploading: { label: 'Uploading', tone: 'brand' },
  processing: { label: 'Processing audio', tone: 'warning' },
  ready: { label: 'Ready', tone: 'live' },
};

export type StepSlug = 'details' | 'tracks' | 'artwork' | 'review';

export const STEPS: readonly { slug: StepSlug; label: string; hint: string }[] = [
  { slug: 'details', label: 'Details', hint: 'Title, artist, type, date' },
  { slug: 'tracks', label: 'Tracks', hint: 'Audio files and running order' },
  { slug: 'artwork', label: 'Artwork & Credits', hint: '3000×3000 cover, writers, splits' },
  { slug: 'review', label: 'Review', hint: 'Check and submit for delivery' },
];

/** The cover, in words. The numbers behind them live in release-eligibility.ts. */
export const ARTWORK = {
  passes: 'Passes',
  tooSmall: 'Below the minimum',
  unreadable: 'That file could not be read as an image.',
  requirements: [
    `${MIN_ARTWORK_PX}×${MIN_ARTWORK_PX} min · square`,
    'JPG or PNG · RGB · under 20 MB',
  ],
};

/** What the footer button says about where it goes, keyed by the step it goes to. */
export const CONTINUE: Record<StepSlug, string> = {
  details: '',
  tracks: 'Continue to tracks',
  artwork: 'Continue to artwork',
  review: 'Continue to review',
};

/** What the date field says about itself, once the service has counted the days. */
export const LEAD_HINT = {
  ok: (days: number) =>
    `Stores need at least ${MIN_LEAD_DAYS} days — this date gives them ${days}.`,
  tooSoon: `Too soon — stores need at least ${MIN_LEAD_DAYS} days of lead time.`,
};

export const UNAVAILABLE = {
  title: 'This release is no longer a draft',
  description:
    'It has been submitted for distribution, or discarded. Either way the stores decide what happens to it now — the console can only show you where it stands.',
  action: 'Back to catalog',
};

/** One entry per code (R6). No severity: they all block submission equally. */
export const ISSUE: Record<
  IssueCode,
  {
    title: (issue: ReleaseIssue) => string;
    detail: (issue: ReleaseIssue) => string;
    action: string;
    step: StepSlug;
  }
> = {
  'details-incomplete': {
    title: () => 'The release has no title or no artist',
    detail: () => 'Every store indexes a release by those two fields before anything else.',
    action: 'Fill in details',
    step: 'details',
  },
  'no-tracks': {
    title: () => 'There is no audio to deliver',
    detail: () => 'A release needs at least one track before the stores will take it.',
    action: 'Add tracks',
    step: 'tracks',
  },
  'track-metadata-incomplete': {
    title: (issue) => `Track ${issue.amount} has no title`,
    detail: () => 'A delivery with an untitled track is rejected on ingest.',
    action: 'Name it',
    step: 'tracks',
  },
  'audio-still-processing': {
    title: (issue) => `Track ${issue.amount} audio is still processing`,
    detail: (issue) => `“${issue.subject}” — loudness analysis finishes shortly after the upload.`,
    action: 'View tracks',
    step: 'tracks',
  },
  'artwork-missing': {
    title: () => 'The release has no cover art',
    detail: () =>
      `Every store needs a square cover of at least ${MIN_ARTWORK_PX}×${MIN_ARTWORK_PX}.`,
    action: 'Upload artwork',
    step: 'artwork',
  },
  'artwork-too-small': {
    title: () => `Artwork is below the ${MIN_ARTWORK_PX}×${MIN_ARTWORK_PX} minimum`,
    detail: (issue) =>
      `${issue.subject} is ${issue.amount} across — Soundry and Pulsar will reject it.`,
    action: 'Replace the cover',
    step: 'artwork',
  },
  'release-date-too-soon': {
    title: () => 'The release date is too soon',
    detail: (issue) =>
      `${issue.subject} gives stores ${issue.amount} days — ${MIN_LEAD_DAYS} is the minimum.`,
    action: 'Pick a later date',
    step: 'details',
  },
};

/** Only for what lands somewhere the user cannot see. A state the screen already
    shows stays on that screen. */
export const TOAST = {
  submitted: (title: string, stores: number) => ({
    title: `${title} submitted for distribution`,
    description: `Delivery to ${stores} stores has begun.`,
  }),
  discarded: (catalogNumber: string) => ({
    title: `Draft ${catalogNumber} discarded`,
    description: 'Its tracks and uploads went with it.',
  }),
};

export const REVIEW = {
  lede: (stores: number) =>
    `Once submitted, delivery to ${stores} stores begins and metadata locks for 24 hours.`,
  clear: {
    title: 'No blocking issues',
    line: 'Everything checks out — this release is ready for delivery.',
    note: (stores: number) => `Submission opens delivery to all ${stores} stores.`,
  },
  blocked: {
    title: 'Issues blocking submission',
    note: 'Submission stays locked until every blocking issue is cleared.',
    count: (open: number) => `${open} to resolve`,
    footer: (open: number) => `${open} issue${open === 1 ? '' : 's'} to resolve first`,
  },
  submit: 'Submit for distribution',
  submitting: 'Submitting…',
  failed: 'The stores could not be reached. Nothing was submitted — try again.',
};

export const CREDIT_FIELDS: readonly {
  name: keyof Credits;
  label: string;
  hint: string;
  mono?: boolean;
}[] = [
  {
    name: 'composer',
    label: 'Composer(s)',
    hint: 'Comma-separated, as credited on the split sheet.',
  },
  { name: 'producer', label: 'Producer', hint: 'Appears in store credits.' },
  { name: 'publisher', label: 'Publisher', hint: 'Leave blank if unpublished.' },
  {
    name: 'pLine',
    label: '℗ line — sound recording',
    hint: 'Delivered verbatim to every store.',
    mono: true,
  },
  {
    name: 'cLine',
    label: '© line — composition',
    hint: 'Delivered verbatim to every store.',
    mono: true,
  },
];
