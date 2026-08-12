import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  invalidateTagsAfterDelay,
  patchListItem,
  removeListItem,
  upsertListItem,
} from '@core/api/cache-utils';

type Row = { id: string; title: string };

const rows = (): Row[] => [
  { id: 'a', title: 'Neon Arterial' },
  { id: 'b', title: 'Undertow' },
];

describe('upsertListItem', () => {
  it('inserts an unknown item at the start — a new entity must be seen', () => {
    const list = rows();
    upsertListItem(list, { id: 'c', title: 'Signal Fade' });
    expect(list.map((r) => r.id)).toEqual(['c', 'a', 'b']);
  });

  it('appends when asked', () => {
    const list = rows();
    upsertListItem(list, { id: 'c', title: 'Signal Fade' }, 'end');
    expect(list.map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });

  it('replaces a known item in place rather than duplicating it', () => {
    const list = rows();
    upsertListItem(list, { id: 'b', title: 'Undertow (Remix)' });
    expect(list).toEqual([
      { id: 'a', title: 'Neon Arterial' },
      { id: 'b', title: 'Undertow (Remix)' },
    ]);
  });
});

describe('patchListItem', () => {
  it('applies a partial update', () => {
    const list = rows();
    patchListItem(list, 'a', { title: 'Neon Arterial (Deluxe)' });
    expect(list[0]?.title).toBe('Neon Arterial (Deluxe)');
  });

  it('is a no-op for an id that is not cached', () => {
    const list = rows();
    patchListItem(list, 'missing', { title: 'nope' });
    expect(list).toEqual(rows());
  });
});

describe('removeListItem', () => {
  it('removes the matching item and leaves the rest', () => {
    const list = rows();
    removeListItem(list, 'a');
    expect(list.map((r) => r.id)).toEqual(['b']);
  });

  it('is a no-op for an id that is not cached', () => {
    const list = rows();
    removeListItem(list, 'missing');
    expect(list).toEqual(rows());
  });
});

describe('invalidateTagsAfterDelay', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('does not invalidate before the delay has elapsed', () => {
    const dispatch = vi.fn();
    invalidateTagsAfterDelay(dispatch, [], 2500);

    vi.advanceTimersByTime(2499);
    expect(dispatch).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls[0]?.[0]).toMatchObject({ type: 'api/invalidateTags' });
  });

  it('cancels — a second patch must not leave a stampede of refetches behind', () => {
    const dispatch = vi.fn();
    const cancel = invalidateTagsAfterDelay(dispatch, [], 2500);

    cancel();
    vi.advanceTimersByTime(5000);
    expect(dispatch).not.toHaveBeenCalled();
  });
});
