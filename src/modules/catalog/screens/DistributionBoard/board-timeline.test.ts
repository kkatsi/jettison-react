import { describe, expect, it } from 'vitest';

import type { Release } from '../../api/types';
import { placeOnAxis, scheduleAxis, schedulePlacements } from './board-timeline';

const NOW = Date.parse('2026-08-12T09:14:00.000Z');

const release = (id: string, releaseDate: string): Release => ({
  id,
  catalogNumber: 'LOR-0042',
  title: `Release ${id}`,
  artistId: 'vaeda-grey',
  artistName: 'Vaeda Grey',
  type: 'Album',
  status: 'delivering',
  releaseDate,
  submittedAt: '2026-08-11T09:12:33.000Z',
  submittedLabel: '2026-08-11 09:12',
  artwork: { from: '#6D3B8F', to: '#2A1140' },
  streamsLabel: '—',
  streams30d: 0,
  streamsTrend: [],
  deliveries: [],
});

describe('placeOnAxis', () => {
  it('starts three days before today, so a date that just passed is still visible', () => {
    // The axis runs 2026-08-09 → 2026-09-09.
    expect(placeOnAxis('2026-08-09', NOW)).toBe(0);
    expect(placeOnAxis('2026-08-12', NOW)).toBeCloseTo((3 / 31) * 100, 5);
    expect(placeOnAxis('2026-09-09', NOW)).toBe(100);
  });

  it('refuses dates the window does not cover rather than pinning them to an edge', () => {
    expect(placeOnAxis('2026-08-08', NOW)).toBeNull();
    expect(placeOnAxis('2026-11-06', NOW)).toBeNull();
  });

  it('ignores the time of day — a street date is a day, not a moment', () => {
    const lateInTheDay = Date.parse('2026-08-12T23:58:00.000Z');
    expect(placeOnAxis('2026-08-12', lateInTheDay)).toBe(placeOnAxis('2026-08-12', NOW));
  });
});

describe('scheduleAxis', () => {
  it('gives a week label up to a pin sitting on top of it', () => {
    // Two dates on the same line at the same x read as one broken date.
    const pins = schedulePlacements([release('a', '2026-08-16')], NOW);
    const axis = scheduleAxis(NOW, pins);

    expect(axis.weeks.map((week) => week.showLabel)).toEqual([true, false, true, true, true]);
    // The tick itself stays — losing it would move the ruler.
    expect(axis.weeks).toHaveLength(5);
    expect(scheduleAxis(NOW).weeks.every((week) => week.showLabel)).toBe(true);
  });

  it('labels the four week marks and says where today is', () => {
    const axis = scheduleAxis(NOW);

    expect(axis.weeks.map((week) => week.label)).toEqual([
      '08/09',
      '08/16',
      '08/23',
      '08/30',
      '09/06',
    ]);
    expect(axis.rangeLabel).toBe('08/09 → 09/09');
    expect(axis.todayLeft).toBeCloseTo((3.385 / 31) * 100, 1);
  });
});

describe('schedulePlacements', () => {
  it('keeps only what falls in the window, in date order', () => {
    const placements = schedulePlacements(
      [
        release('later', '2026-08-28'),
        release('past', '2026-01-30'),
        release('sooner', '2026-08-14'),
      ],
      NOW,
    );

    expect(placements.map((placement) => placement.id)).toEqual(['sooner', 'later']);
    expect(placements[0]?.dateLabel).toBe('08/14');
  });

  it('drops the titles that would collide, and nothing else', () => {
    // Two street dates one day apart: ~3% of the axis, well inside the gap.
    const placements = schedulePlacements(
      [release('a', '2026-08-14'), release('b', '2026-08-15'), release('far', '2026-09-05')],
      NOW,
    );

    expect(placements.map((placement) => placement.showTitle)).toEqual([false, false, true]);
    // The dots survive — only the labels give way.
    expect(placements).toHaveLength(3);
  });

  it('shows a lone release its title', () => {
    expect(schedulePlacements([release('a', '2026-08-20')], NOW)[0]?.showTitle).toBe(true);
  });
});
