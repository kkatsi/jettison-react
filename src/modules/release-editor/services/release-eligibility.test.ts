import { describe, expect, it } from 'vitest';

import type { DraftTrack } from '../api/types';
import {
  canSubmit,
  hasEnoughLead,
  leadDays,
  meetsArtworkRequirements,
  MIN_ARTWORK_PX,
  MIN_LEAD_DAYS,
  releaseIssues,
  type SubmissionCandidate,
} from './release-eligibility';

describe('lead time', () => {
  it('counts calendar days to the street date', () => {
    expect(leadDays('2026-08-20', '2026-08-13')).toBe(7);
    expect(leadDays('2026-08-13', '2026-08-13')).toBe(0);
  });

  it('goes negative for a date that has already passed', () => {
    expect(leadDays('2026-08-01', '2026-08-13')).toBe(-12);
  });

  it('counts across a month and a daylight-saving boundary alike', () => {
    expect(leadDays('2026-11-02', '2026-10-25')).toBe(8);
  });

  it('lets the minimum through and nothing under it', () => {
    expect(hasEnoughLead('2026-08-20', '2026-08-13')).toBe(true);
    expect(hasEnoughLead('2026-08-19', '2026-08-13')).toBe(false);
    expect(MIN_LEAD_DAYS).toBe(7);
  });

  it('treats a date it cannot read as no lead at all', () => {
    expect(leadDays('not-a-date', '2026-08-13')).toBe(0);
  });
});

describe('artwork requirements', () => {
  const cover = (width: number, height = width) => ({ name: 'cover.png', width, height });

  it('takes the minimum and anything above it', () => {
    expect(meetsArtworkRequirements(cover(MIN_ARTWORK_PX))).toBe(true);
    expect(meetsArtworkRequirements(cover(4000))).toBe(true);
  });

  it('refuses anything the biggest store grid would blur', () => {
    expect(meetsArtworkRequirements(cover(1400))).toBe(false);
    expect(meetsArtworkRequirements(cover(3000, 1400))).toBe(false);
  });

  it('counts no cover at all as not meeting them', () => {
    expect(meetsArtworkRequirements(null)).toBe(false);
  });
});

describe('releaseIssues', () => {
  const TODAY = '2026-08-13';

  const track = (patch: Partial<DraftTrack> = {}): DraftTrack => ({
    id: 't1',
    number: 1,
    title: 'Ignition Hour',
    isrc: 'GBLOR2600121',
    audioStatus: 'ready',
    duration: '3:42',
    durationMs: 222_000,
    ...patch,
  });

  /** A release with nothing wrong with it, which every case below breaks one way. */
  const ready = (patch: Partial<SubmissionCandidate> = {}): SubmissionCandidate => ({
    title: 'Signal Fade',
    artistId: 'kessa-nu',
    type: 'EP',
    releaseDate: '2026-09-18',
    artworkFile: { name: 'cover_v4.png', width: 3000, height: 3000 },
    tracks: [track()],
    ...patch,
  });

  const codes = (release: SubmissionCandidate) =>
    releaseIssues(release, TODAY).map((issue) => issue.code);

  it('lets a finished release through', () => {
    expect(releaseIssues(ready(), TODAY)).toEqual([]);
    expect(canSubmit(ready(), TODAY)).toBe(true);
  });

  it('needs a title and an artist before anything else', () => {
    expect(codes(ready({ title: '   ' }))).toContain('details-incomplete');
    expect(codes(ready({ artistId: '' }))).toContain('details-incomplete');
  });

  it('refuses a release with no audio at all', () => {
    expect(codes(ready({ tracks: [] }))).toEqual(['no-tracks']);
  });

  it('names the first untitled track rather than listing every one', () => {
    const issues = releaseIssues(
      ready({
        tracks: [
          track(),
          track({ id: 't2', number: 2, title: '' }),
          track({ id: 't3', number: 3, title: '' }),
        ],
      }),
      TODAY,
    );

    const untitled = issues.filter((issue) => issue.code === 'track-metadata-incomplete');
    expect(untitled).toHaveLength(1);
    expect(untitled[0]?.amount).toBe(2);
  });

  it('holds submission while a file is still being ingested, and says which', () => {
    const issues = releaseIssues(
      ready({
        tracks: [
          track(),
          track({ id: 't2', number: 2, title: 'Sodium Sun', audioStatus: 'processing' }),
        ],
      }),
      TODAY,
    );

    expect(issues).toContainEqual({
      code: 'audio-still-processing',
      subject: 'Sodium Sun',
      amount: 2,
    });
  });

  it('separates a cover that is missing from one that is too small', () => {
    expect(codes(ready({ artworkFile: null }))).toContain('artwork-missing');

    expect(
      releaseIssues(
        ready({ artworkFile: { name: 'cover_v3.png', width: 1400, height: 1400 } }),
        TODAY,
      ),
    ).toContainEqual({ code: 'artwork-too-small', subject: 'cover_v3.png', amount: 1400 });
  });

  it('quotes the lead a too-soon date actually gives the stores', () => {
    expect(releaseIssues(ready({ releaseDate: '2026-08-17' }), TODAY)).toContainEqual({
      code: 'release-date-too-soon',
      subject: '2026-08-17',
      amount: 4,
    });
  });

  it('reports everything wrong at once, in the order the wizard fixes them', () => {
    expect(
      codes({
        title: '',
        artistId: '',
        type: 'Album',
        releaseDate: '2026-08-14',
        artworkFile: null,
        tracks: [],
      }),
    ).toEqual(['details-incomplete', 'no-tracks', 'artwork-missing', 'release-date-too-soon']);
  });
});
