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

/** The stores are the truth: all delivered is live, one rejection blocks. */
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

/** A withdrawal clears the submission, which is what drops it off the board. */
export function isInPipeline(release: {
  status: ReleaseStatus;
  submittedAt: string | null;
}): boolean {
  return release.status !== 'draft' && release.submittedAt !== null;
}

/** Same call either way, not the same act: nothing was delivered for a `cancel`. */
export function withdrawalAction(stage: PipelineStage): 'withdraw' | 'cancel' | null {
  if (stage === 'draft') return null;
  return stage === 'delivering' || stage === 'live' ? 'withdraw' : 'cancel';
}
