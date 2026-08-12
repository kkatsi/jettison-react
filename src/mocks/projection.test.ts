import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createProjection } from './projection';

describe('createProjection', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('serves the snapshot taken at build time, not the current write model', () => {
    const writeModel = ['a'];
    const model = createProjection(() => [...writeModel], 2500);

    writeModel.push('b');
    expect(model.read()).toEqual(['a']);
  });

  it('catches up once the lag has elapsed — and not a tick before', () => {
    const writeModel = ['a'];
    const model = createProjection(() => [...writeModel], 2500);

    writeModel.push('b');
    model.scheduleRebuild();

    vi.advanceTimersByTime(2499);
    expect(model.read()).toEqual(['a']);

    vi.advanceTimersByTime(1);
    expect(model.read()).toEqual(['a', 'b']);
  });

  it('does not push the rebuild out when writes arrive in a burst', () => {
    const writeModel = ['a'];
    const model = createProjection(() => [...writeModel], 2500);

    model.scheduleRebuild();
    vi.advanceTimersByTime(2000);

    // A second write 2s in must not restart the clock.
    writeModel.push('b');
    model.scheduleRebuild();
    vi.advanceTimersByTime(500);

    expect(model.read()).toEqual(['a', 'b']);
  });

  it('projects again on the next write after a rebuild', () => {
    const writeModel = ['a'];
    const model = createProjection(() => [...writeModel], 1000);

    writeModel.push('b');
    model.scheduleRebuild();
    vi.advanceTimersByTime(1000);
    expect(model.read()).toEqual(['a', 'b']);

    writeModel.push('c');
    model.scheduleRebuild();
    vi.advanceTimersByTime(1000);
    expect(model.read()).toEqual(['a', 'b', 'c']);
  });
});
