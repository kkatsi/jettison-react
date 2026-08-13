import { describe, expect, it } from 'vitest';

import type { DeliveryDto, DeliveryStatus, ReleaseStatus } from '../api/types';
import {
  deliveryProgress,
  isInFlight,
  isInPipeline,
  pipelineStage,
  withdrawalAction,
} from './release-status';

const stores = (...statuses: DeliveryStatus[]): DeliveryDto[] =>
  statuses.map((status, index) => ({
    storeId: `store-${index}`,
    status,
    deliveredAt: status === 'delivered' ? '2026-05-09T14:02:00.000Z' : null,
  }));

const release = (status: ReleaseStatus, deliveries: DeliveryDto[]) => ({ status, deliveries });

describe('deliveryProgress', () => {
  it('counts what the five little segments on the board draw', () => {
    expect(deliveryProgress(stores('delivered', 'delivered', 'pending', 'rejected'))).toEqual({
      delivered: 2,
      total: 4,
      rejected: 1,
    });
  });

  it('survives a release nobody sent anywhere', () => {
    expect(deliveryProgress([])).toEqual({ delivered: 0, total: 0, rejected: 0 });
  });
});

describe('pipelineStage', () => {
  it('trusts the stores over the release row', () => {
    // Every store has it. Whatever the backend still calls this, it is live.
    expect(pipelineStage(release('delivering', stores('delivered', 'delivered')))).toBe('live');

    // Some do: mid-delivery, even if the row hasn't caught up.
    expect(pipelineStage(release('in-review', stores('delivered', 'pending')))).toBe('delivering');
  });

  it('lets one rejection block the whole release', () => {
    expect(pipelineStage(release('delivering', stores('delivered', 'rejected')))).toBe('blocked');
    expect(pipelineStage(release('rejected', stores('pending', 'pending')))).toBe('blocked');
  });

  it('keeps a draft a draft, however its deliveries read', () => {
    expect(pipelineStage(release('draft', stores('delivered', 'delivered')))).toBe('draft');
  });

  it('separates waiting for review from waiting to be picked up', () => {
    expect(pipelineStage(release('in-review', stores('in-review', 'in-review')))).toBe('in-review');
    expect(pipelineStage(release('submitted', stores('pending', 'pending')))).toBe('submitted');
  });

  it('does not call an unsent release live just because nothing is outstanding', () => {
    // total === 0: no stores, so nothing has been delivered — 'live' here would
    // be a vacuous truth on screen.
    expect(pipelineStage(release('submitted', []))).toBe('submitted');
  });
});

describe('the predicates the board filters on', () => {
  it('knows which chips are still moving', () => {
    expect((['submitted', 'in-review', 'delivering'] as const).every(isInFlight)).toBe(true);
    expect(isInFlight('live')).toBe(false);
    expect(isInFlight('blocked')).toBe(false);
    expect(isInFlight('draft')).toBe(false);
  });

  it('drops a withdrawn release off the board the moment it loses its submission', () => {
    expect(isInPipeline({ status: 'live', submittedAt: '2026-04-11T09:12:33.000Z' })).toBe(true);
    expect(isInPipeline({ status: 'draft', submittedAt: null })).toBe(false);
    // Mid-withdrawal the patch clears one before the other; neither alone belongs on the board.
    expect(isInPipeline({ status: 'draft', submittedAt: '2026-04-11T09:12:33.000Z' })).toBe(false);
  });

  it('calls it a withdrawal only when stores actually have the record', () => {
    expect(withdrawalAction('live')).toBe('withdraw');
    expect(withdrawalAction('delivering')).toBe('withdraw');

    // Nothing was ever delivered: pulling the submission is not a withdrawal, and
    // telling the label it is would describe stores taking down a record they
    // never received.
    expect(withdrawalAction('submitted')).toBe('cancel');
    expect(withdrawalAction('in-review')).toBe('cancel');
    expect(withdrawalAction('blocked')).toBe('cancel');

    // Never submitted, so there is nothing to take back.
    expect(withdrawalAction('draft')).toBeNull();
  });
});
