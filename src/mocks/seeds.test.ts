import { describe, expect, it } from 'vitest';

import { activityEventSchema, dailyStatSchema, releaseSchema, trackSchema } from './schemas';
import { buildSeed } from './seeds';

const seed = buildSeed();

describe('buildSeed', () => {
  it('satisfies the contract the handlers serve it through', () => {
    // The seed data and the schemas are the same definition seen twice; if the
    // generator ever produces something the handlers would refuse, it fails here
    // rather than as an unexplained 500 in the browser.
    expect(() => releaseSchema.array().parse(seed.releases)).not.toThrow();
    expect(() => trackSchema.array().parse(seed.tracks)).not.toThrow();
    expect(() => activityEventSchema.array().parse(seed.activity)).not.toThrow();
    expect(() => dailyStatSchema.array().parse(seed.stats)).not.toThrow();
  });

  it('is a mid-sized label: enough that filters matter, small enough to hand-tune', () => {
    expect(seed.artists).toHaveLength(9); // 8 artists + Various Artists
    expect(seed.stores).toHaveLength(5);
    expect(seed.releases).toHaveLength(31);
    expect(seed.tracks.length).toBeGreaterThan(100);
    expect(seed.activity).toHaveLength(40);
  });

  it('carries the states the screens have to render', () => {
    const statuses = new Set(seed.releases.map((release) => release.status));
    expect([...statuses].sort()).toEqual(['delivering', 'draft', 'in-review', 'live', 'rejected']);

    // Exactly one track mid-processing: the media-ingestion state the wizard and
    // the release detail screen both need a live example of.
    expect(seed.tracks.filter((track) => track.audioStatus === 'processing')).toHaveLength(1);
  });

  it('gives every live release 90 days of numbers, with a spike in them', () => {
    const live = seed.releases.filter((release) => release.status === 'live');
    expect(seed.stats).toHaveLength(live.length * 90);

    const first = live[0];
    if (!first) throw new Error('no live releases in the seed');
    const series = seed.stats.filter((stat) => stat.releaseId === first.id);
    const mean = series.reduce((total, stat) => total + stat.streams, 0) / series.length;
    const peak = Math.max(...series.map((stat) => stat.streams));
    expect(peak).toBeGreaterThan(mean * 2);
  });

  it('is deterministic — two builds, one label', () => {
    expect(buildSeed()).toEqual(buildSeed());
  });
});

it('catalogue numbers are unique', () => {
  const numbers = seed.releases.map((release) => release.catalogNumber);
  expect(new Set(numbers).size).toBe(numbers.length);
});
