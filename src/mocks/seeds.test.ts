import { describe, expect, it } from 'vitest';

import { activityEventSchema, dailyStatSchema, releaseSchema, trackSchema } from './schemas';
import { buildSeed } from './seeds';

const seed = buildSeed();

describe('buildSeed', () => {
  it('satisfies the contract the handlers serve it through', () => {
    // If the generator produces something the handlers would refuse, fail here
    // rather than as a mystery 500 in the browser.
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

    // Exactly one track mid-processing, for the wizard and the detail screen.
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

  it('gives the sparkline its points, and only where there are streams to plot', () => {
    for (const release of seed.releases) {
      expect(release.streamsTrend).toHaveLength(release.status === 'live' ? 16 : 0);
    }

    // The trend is the tail of the same series analytics will chart, not a
    // second set of numbers that could disagree with it.
    const live = seed.releases.find((release) => release.status === 'live');
    if (!live) throw new Error('no live releases in the seed');
    const tail = seed.stats
      .filter((stat) => stat.releaseId === live.id)
      .slice(-16)
      .map((stat) => stat.streams);
    expect(live.streamsTrend).toEqual(tail);
  });

  it('never submits a release in the future, however far off its street date is', () => {
    // The console takes its clock from the newest submission. A release planned
    // for November carrying a September submission would make every screen read
    // the label's own plans as things that had already happened.
    const submitted = seed.releases
      .map((release) => release.submittedAt)
      .filter((at): at is string => at !== null);

    expect(submitted.length).toBeGreaterThan(20);
    for (const at of submitted) {
      expect(Date.parse(at)).toBeLessThanOrEqual(Date.parse('2026-08-12T09:14:00.000Z'));
    }
  });

  it('timestamps a working day, not midnight', () => {
    const times = seed.releases
      .flatMap((release) => [
        release.submittedAt,
        ...release.deliveries.map((delivery) => delivery.deliveredAt),
      ])
      .filter((at): at is string => at !== null)
      .map((at) => at.slice(11, 16));

    // A whole column reading 00:00 is the tell that nobody thought about the data.
    expect(times.some((time) => time !== '00:00')).toBe(true);
    expect(times.filter((time) => time === '00:00')).toHaveLength(0);
  });

  it('is deterministic — two builds, one label', () => {
    expect(buildSeed()).toEqual(buildSeed());
  });
});

it('catalogue numbers are unique', () => {
  const numbers = seed.releases.map((release) => release.catalogNumber);
  expect(new Set(numbers).size).toBe(numbers.length);
});
