import { describe, expect, it } from 'vitest';

import type { Release } from '../../api/types';
import { catalogClock, summarise } from './catalog-summary';

const NOW = Date.parse('2026-08-12T09:14:00.000Z');
const days = (count: number) => new Date(NOW - count * 86_400_000).toISOString();

const release = (overrides: Partial<Release> = {}): Release => ({
  id: 'lor-0042',
  catalogNumber: 'LOR-0042',
  title: 'Neon Arterial',
  artistId: 'vaeda-grey',
  artistName: 'Vaeda Grey',
  type: 'Album',
  status: 'live',
  releaseDate: '2026-05-08',
  submittedAt: days(120),
  submittedLabel: '2026-04-14 09:14',
  artwork: { from: '#6D3B8F', to: '#2A1140' },
  streamsLabel: '1.28M',
  streams30d: 0,
  streamsTrend: [],
  deliveries: [{ storeId: 'soundry', status: 'delivered', deliveredAt: days(100) }],
  ...overrides,
});

describe('summarise', () => {
  it('counts live releases the way the chips do — from the stores', () => {
    const summary = summarise(
      [
        release(),
        // Called `delivering`, but every store has it: live on screen, live in the tile.
        release({
          id: 'a',
          status: 'delivering',
          deliveries: [{ storeId: 'soundry', status: 'delivered', deliveredAt: days(2) }],
        }),
        release({ id: 'b', status: 'draft', submittedAt: null, deliveries: [] }),
      ],
      NOW,
    );

    expect(summary.live).toEqual({ count: 2, total: 3 });
  });

  it('reports how long the oldest submission has been waiting', () => {
    const summary = summarise(
      [
        release({
          id: 'a',
          status: 'in-review',
          submittedAt: days(6),
          deliveries: [{ storeId: 'soundry', status: 'in-review', deliveredAt: null }],
        }),
        release({
          id: 'b',
          status: 'submitted',
          submittedAt: days(2),
          deliveries: [{ storeId: 'soundry', status: 'pending', deliveredAt: null }],
        }),
      ],
      NOW,
    );

    expect(summary.pendingReview).toEqual({ count: 2, oldestWaitingDays: 6 });
  });

  it('compares the last seven days of the trend against the seven before them', () => {
    // 7 days at 100, then 7 at 200: the week doubled.
    const trend = [...Array<number>(7).fill(100), ...Array<number>(7).fill(200)];
    const summary = summarise([release({ streamsTrend: trend })], NOW);

    expect(summary.streamsThisWeek.label).toBe('1K');
    expect(summary.streamsThisWeek.changePercent).toBe(100);
  });

  it('shows no change rather than a reassuring zero when there is nothing to compare', () => {
    const summary = summarise([release({ streamsTrend: [50, 50] })], NOW);
    expect(summary.streamsThisWeek.changePercent).toBeNull();
  });

  it("runs off the catalogue's own clock, so the seed does not age", () => {
    const clock = catalogClock([
      release({ submittedAt: days(30) }),
      release({ submittedAt: days(3) }),
      release({ submittedAt: null }),
    ]);

    expect(clock).toBe(Date.parse(days(3)));
    expect(catalogClock([])).toBe(0);
  });

  it('survives an empty catalogue', () => {
    const summary = summarise([], NOW);
    expect(summary.live).toEqual({ count: 0, total: 0 });
    expect(summary.pendingReview).toEqual({ count: 0, oldestWaitingDays: 0 });
    expect(summary.streams30d.label).toBe('—');
  });
});
