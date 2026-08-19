// Copy and tone keyed by domain code (R6). release-status.ts decides the stage;
// this file is the only place that knows what a human should read.

import type { Tone } from '@shared/ui';

import type { AudioStatus, DeliveryStatus } from './api/types';
import type { PipelineStage } from './services/release-status';

/** `busy` pulses the chip's dot: the stores are still working on this one. */
export const STAGE = {
  draft: { label: 'Draft', tone: 'idle', busy: false },
  submitted: { label: 'Submitted', tone: 'idle', busy: false },
  'in-review': { label: 'In review', tone: 'warning', busy: true },
  delivering: { label: 'Delivering', tone: 'warning', busy: true },
  live: { label: 'Live', tone: 'live', busy: false },
  blocked: { label: 'Blocked', tone: 'danger', busy: false },
} satisfies Record<PipelineStage, { label: string; tone: Tone; busy: boolean }>;

export const DELIVERY = {
  pending: { label: 'Pending', tone: 'idle' },
  'in-review': { label: 'In review', tone: 'warning' },
  delivered: { label: 'Delivered', tone: 'live' },
  rejected: { label: 'Rejected', tone: 'danger' },
} satisfies Record<DeliveryStatus, { label: string; tone: Tone }>;

export const AUDIO = {
  uploading: { label: 'Uploading', tone: 'idle' },
  processing: { label: 'Processing', tone: 'warning' },
  ready: { label: 'Ready', tone: 'live' },
} satisfies Record<AudioStatus, { label: string; tone: Tone }>;

/** Fires from three screens, and on two the changed chip may be scrolled out of sight. */
export const TOAST = {
  withdrawn: (title: string) => ({
    title: `${title} withdrawn from distribution`,
    description: 'Every store has been asked to take it down. It is a draft again.',
  }),
  cancelled: (title: string) => ({
    title: `Submission cancelled for ${title}`,
    description: 'No store had it yet, so nothing needs taking down.',
  }),
};

/** What an exit from distribution has to say, at every point the user meets it. */
type WithdrawalCopy = {
  action: string;
  /** For a table cell, where the column header already supplies the context. */
  short: string;
  pending: string;
  title: string;
  description: string;
  confirm: string;
  /** The dialog has already closed by then, so there is nowhere else to say it. */
  failed: string;
};

/** The two ways a release comes back out of distribution, in words. */
export const WITHDRAWAL = {
  withdraw: {
    action: 'Withdraw from distribution',
    short: 'Withdraw',
    pending: 'Withdrawing…',
    title: 'Withdraw {title}?',
    description:
      'Every store is asked to take it down, and the release returns to draft. You can submit it again afterwards — the stores will treat it as a new delivery.',
    confirm: 'Withdraw from all stores',
    failed: 'The stores could not be reached. The release is still out there — try again.',
  },
  cancel: {
    action: 'Cancel submission',
    short: 'Cancel',
    pending: 'Cancelling…',
    title: 'Cancel the submission for {title}?',
    description:
      'No store has this release yet, so nothing needs taking down. It returns to draft with its tracks and artwork intact.',
    confirm: 'Cancel submission',
    failed: 'The stores could not be reached. The submission still stands — try again.',
  },
} satisfies Record<'withdraw' | 'cancel', WithdrawalCopy>;

/** Who the console acts as. A real app reads this off the session. */
export const SESSION_ACTOR = 'Mara Kessler';

/** A URL, not an import: modules don't know each other, and the shell's catch-all
    answers once release-editor is gone. */
export const EDIT = {
  action: 'Continue editing',
  pathFor: (id: string) => `/releases/${id}/edit/details`,
};
