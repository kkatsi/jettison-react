import { describe, expect, it } from 'vitest';

import { EMPTY_CREDITS } from '../constants';
import {
  formatDuration,
  toDraft,
  toDraftTrack,
  toSubmission,
  totalDuration,
} from './transformations';
import type { ReleaseDraftDto, TrackDto } from './types';

const track = (patch: Partial<TrackDto> = {}): TrackDto => ({
  id: 'lor-0074-t1',
  number: 1,
  title: 'Ignition Hour',
  durationMs: 222_000,
  isrc: 'GBLOR2600121',
  audioStatus: 'ready',
  ...patch,
});

const dto = (patch: Partial<ReleaseDraftDto> = {}): ReleaseDraftDto => ({
  id: 'lor-0074',
  catalogNumber: 'LOR-0074',
  title: 'Signal Fade',
  artistId: 'kessa-nu',
  artistName: 'Kessa Nu',
  type: 'EP',
  status: 'draft',
  releaseDate: '2026-09-18',
  submittedAt: null,
  artwork: { from: '#2A3040', to: '#12161F' },
  deliveries: [{ storeId: 'soundry' }, { storeId: 'pulsar' }],
  tracks: [track({ number: 2, id: 'b' }), track({ number: 1, id: 'a' })],
  ...patch,
});

describe('toDraft', () => {
  it('fills the holes a draft is allowed to have', () => {
    const draft = toDraft(dto());

    expect(draft.genre).toBe('');
    expect(draft.credits).toEqual(EMPTY_CREDITS);
    expect(draft.artworkFile).toBeNull();
  });

  it('keeps what the backend did send', () => {
    const credits = { ...EMPTY_CREDITS, composer: 'V. Grey' };
    const draft = toDraft(
      dto({
        genre: 'Jazz',
        credits,
        artworkFile: { name: 'cover.png', width: 3000, height: 3000 },
      }),
    );

    expect(draft.genre).toBe('Jazz');
    expect(draft.credits.composer).toBe('V. Grey');
    expect(draft.artworkFile?.width).toBe(3000);
  });

  it('puts the tracklist in running order whatever order it arrived in', () => {
    expect(toDraft(dto()).tracks.map((t) => t.id)).toEqual(['a', 'b']);
  });

  it('reduces the deliveries to the only thing the submission event needs', () => {
    expect(toDraft(dto()).storeIds).toEqual(['soundry', 'pulsar']);
  });
});

describe('toDraftTrack', () => {
  it('shows a duration once the file has been through ingestion', () => {
    expect(toDraftTrack(track()).duration).toBe('3:42');
  });

  it('refuses to guess one before then', () => {
    expect(toDraftTrack(track({ audioStatus: 'processing' })).duration).toBe('—');
    expect(toDraftTrack(track({ audioStatus: 'uploading' })).duration).toBe('—');
    // The number survives, so the running time is still summable.
    expect(toDraftTrack(track({ audioStatus: 'uploading' })).durationMs).toBe(222_000);
  });
});

describe('toSubmission', () => {
  it('carries the whole row, because catalog cannot fetch it yet', () => {
    const submitted = toDraft(
      dto({ status: 'submitted', submittedAt: '2026-08-13T09:12:00.000Z' }),
    );

    expect(toSubmission(submitted)).toEqual({
      id: 'lor-0074',
      catalogNumber: 'LOR-0074',
      title: 'Signal Fade',
      artwork: { from: '#2A3040', to: '#12161F' },
      artistId: 'kessa-nu',
      artistName: 'Kessa Nu',
      type: 'EP',
      releaseDate: '2026-09-18',
      submittedAt: '2026-08-13T09:12:00.000Z',
      storeIds: ['soundry', 'pulsar'],
    });
  });
});

describe('durations', () => {
  it('reads as a tracklist, not a number of seconds', () => {
    expect(formatDuration(222_000)).toBe('3:42');
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(61_000)).toBe('1:01');
  });

  it('sums a running time past the hour without breaking into hours', () => {
    expect(totalDuration([{ durationMs: 222_000 }, { durationMs: 258_000 }])).toBe('8:00');
    expect(totalDuration([])).toBe('0:00');
  });
});
