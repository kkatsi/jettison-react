import { describe, expect, it } from 'vitest';

import type { AudioStatus, DraftTrack } from '../api/types';
import { audioStatuses, isIngesting, moveItem, newlyReady, readyCount } from './tracklist';

const track = (id: string, audioStatus: AudioStatus): DraftTrack => ({
  id,
  number: 1,
  title: id,
  isrc: 'GBLOR2600121',
  audioStatus,
  duration: '3:42',
  durationMs: 222_000,
});

describe('ingestion', () => {
  const tracks = [track('a', 'ready'), track('b', 'processing'), track('c', 'uploading')];

  it('counts what the stores could actually take', () => {
    expect(readyCount(tracks)).toBe(1);
    expect(readyCount([])).toBe(0);
  });

  it('keeps the screen asking while anything is in flight', () => {
    expect(isIngesting(tracks)).toBe(true);
    expect(isIngesting([track('a', 'ready')])).toBe(false);
    // Nothing uploaded is nothing to wait for.
    expect(isIngesting([])).toBe(false);
  });
});

describe('newlyReady', () => {
  it('reports the crossing, not the state', () => {
    const before = audioStatuses([track('a', 'processing'), track('b', 'ready')]);
    const now = [track('a', 'ready'), track('b', 'ready')];

    expect(newlyReady(before, now).map((t) => t.id)).toEqual(['a']);
  });

  it('says nothing about a track it has never seen', () => {
    // A track that arrives already ready was processed before this screen existed.
    expect(newlyReady(new Map(), [track('a', 'ready')])).toEqual([]);
  });

  it('says nothing when nothing moved', () => {
    const before = audioStatuses([track('a', 'processing')]);
    expect(newlyReady(before, [track('a', 'processing')])).toEqual([]);
  });
});

describe('moveItem', () => {
  const list = ['a', 'b', 'c', 'd'];

  it('moves a track down the running order', () => {
    expect(moveItem(list, 0, 2)).toEqual(['b', 'c', 'a', 'd']);
  });

  it('moves one up', () => {
    expect(moveItem(list, 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  });

  it('leaves the list alone when the drag went nowhere', () => {
    expect(moveItem(list, 1, 1)).toEqual(list);
    expect(moveItem(list, 0, 9)).toEqual(list);
    expect(moveItem(list, -1, 2)).toEqual(list);
  });

  it('copies rather than mutating: the list it is handed is the cache', () => {
    const moved = moveItem(list, 0, 1);
    expect(list).toEqual(['a', 'b', 'c', 'd']);
    expect(moved).not.toBe(list);
  });
});
