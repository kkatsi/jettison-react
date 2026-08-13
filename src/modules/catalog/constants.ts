// Copy and tone keyed by domain code (R6). release-status.ts decides the stage;
// this file is the only place that knows what a human should read.

import type { Tone } from '@shared/ui';

import type { AudioStatus, DeliveryStatus } from './api/types';
import type { PipelineStage } from './services/release-status';

/** `busy` pulses the chip's dot: the stores are still working on this one. */
export const STAGE: Record<PipelineStage, { label: string; tone: Tone; busy: boolean }> = {
  draft: { label: 'Draft', tone: 'idle', busy: false },
  submitted: { label: 'Submitted', tone: 'idle', busy: false },
  'in-review': { label: 'In review', tone: 'warning', busy: true },
  delivering: { label: 'Delivering', tone: 'warning', busy: true },
  live: { label: 'Live', tone: 'live', busy: false },
  blocked: { label: 'Blocked', tone: 'danger', busy: false },
};

export const DELIVERY: Record<DeliveryStatus, { label: string; tone: Tone }> = {
  pending: { label: 'Pending', tone: 'idle' },
  'in-review': { label: 'In review', tone: 'warning' },
  delivered: { label: 'Delivered', tone: 'live' },
  rejected: { label: 'Rejected', tone: 'danger' },
};

export const AUDIO: Record<AudioStatus, { label: string; tone: Tone }> = {
  uploading: { label: 'Uploading', tone: 'idle' },
  processing: { label: 'Processing', tone: 'warning' },
  ready: { label: 'Ready', tone: 'live' },
};

/**
 * Who the console is acting as. A real app reads this off the session; the mock
 * backend independently stamps the same name on what it records, because across
 * that boundary the two are separate systems agreeing, not one shared constant.
 */
export const SESSION_ACTOR = 'Mara Kessler';
