import { describe, expect, it } from 'vitest';

import {
  hasEnoughLead,
  leadDays,
  meetsArtworkRequirements,
  MIN_ARTWORK_PX,
  MIN_LEAD_DAYS,
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
