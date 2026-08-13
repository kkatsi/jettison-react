// Where a release actually stands, decided from its deliveries rather than read
// off its status field. Plain functions: no React, no store, no fetching (R5),
// and they return codes, never copy (R6) — constants.ts owns the words.

import type { DeliveryDto, ReleaseStatus } from '../api/types';

/** What the console shows in a status chip. `blocked` is the label's word for rejected. */
export type PipelineStage = 'draft' | 'submitted' | 'in-review' | 'delivering' | 'live' | 'blocked';

export type DeliveryProgress = {
  delivered: number;
  total: number;
  /** Stores that refused it. One is enough to block the release. */
  rejected: number;
};

export function deliveryProgress(deliveries: readonly DeliveryDto[]): DeliveryProgress {
  return {
    delivered: deliveries.filter((delivery) => delivery.status === 'delivered').length,
    total: deliveries.length,
    rejected: deliveries.filter((delivery) => delivery.status === 'rejected').length,
  };
}

/**
 * The aggregate. The stores are the truth: a release the backend still calls
 * `delivering` is live once every store has it, and a single rejection blocks
 * the release however the row describes itself — that is the whole reason this
 * is a service and not a lookup table.
 */
export function pipelineStage(release: {
  status: ReleaseStatus;
  deliveries: readonly DeliveryDto[];
}): PipelineStage {
  if (release.status === 'draft') return 'draft';

  const { delivered, total, rejected } = deliveryProgress(release.deliveries);

  if (release.status === 'rejected' || rejected > 0) return 'blocked';
  if (total > 0 && delivered === total) return 'live';
  if (delivered > 0) return 'delivering';
  if (release.status === 'in-review') return 'in-review';

  return 'submitted';
}

/** Still moving — the stages whose chips pulse, and the board's "in flight" count. */
export function isInFlight(stage: PipelineStage): boolean {
  return stage === 'submitted' || stage === 'in-review' || stage === 'delivering';
}

/**
 * In the pipeline at all. A withdrawn release loses its submission timestamp, so
 * this is what drops it off the board the moment the withdrawal lands.
 */
export function isInPipeline(release: {
  status: ReleaseStatus;
  submittedAt: string | null;
}): boolean {
  return release.status !== 'draft' && release.submittedAt !== null;
}

/**
 * Taking a release back out of distribution. It is the same call either way, but
 * not the same act, and the console must not tell the label it is withdrawing a
 * record from stores that never received one:
 *
 * - `withdraw` — stores have it, and are being asked to take it down.
 * - `cancel` — nothing was ever delivered, so the submission is simply pulled.
 * - `null` — a draft was never submitted; there is nothing to take back.
 */
export function withdrawalAction(stage: PipelineStage): 'withdraw' | 'cancel' | null {
  if (stage === 'draft') return null;
  return stage === 'delivering' || stage === 'live' ? 'withdraw' : 'cancel';
}
