// The label's history. Hand-tuned where believability matters (artists, titles,
// catalogue numbers) and generated where volume does (tracks, streams, activity),
// off a fixed seed so every reload and every screenshot see the same label.

import type {
  ActivityEvent,
  Artist,
  DailyStat,
  DeliveryStatus,
  Release,
  ReleaseStatus,
  ReleaseType,
  Store,
  Track,
} from './schemas';

export type Seed = {
  artists: Artist[];
  stores: Store[];
  releases: Release[];
  tracks: Track[];
  activity: ActivityEvent[];
  stats: DailyStat[];
};

/** mulberry32 — uniform enough, and identical on every machine. */
function prng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T>(random: () => number, items: readonly T[]): T =>
  items[Math.floor(random() * items.length)] as T;

const between = (random: () => number, min: number, max: number): number =>
  Math.floor(min + random() * (max - min + 1));

/** The five fictional stores the console delivers to. */
const STORES: readonly [string, string][] = [
  ['soundry', 'Soundry'],
  ['vela-music', 'Vela Music'],
  ['pulsar', 'Pulsar'],
  ['echoport', 'EchoPort'],
  ['tidewave', 'Tidewave'],
];

/** Eight artists, plus the compilation credit. */
const ARTISTS: readonly string[] = [
  'Vaeda Grey',
  'Ossian Bloom',
  'Marisol Vane',
  'The Pale Hours',
  'Kessa Nu',
  'Iron Harbour',
  'Halcyon Drift',
  'Null Parade',
  'Various Artists',
];

/** [title, artist, type, status, catalogue no, release date, streams 30d, art from, art to] */
type CatalogueRow = readonly [
  string,
  string,
  ReleaseType,
  ReleaseStatus,
  string,
  string,
  number,
  string,
  string,
];

/** Three years of it: mostly live, a few in flight, three drafts, two rejected. */
// prettier-ignore
const CATALOGUE: readonly CatalogueRow[] = [
  ['Neon Arterial',       'Vaeda Grey',     'Album',  'live',       'LOR-0042', '2026-05-08', 1284300, '#6D3B8F', '#2A1140'],
  ['Half-Light Ritual',   'Ossian Bloom',   'EP',     'live',       'LOR-0039', '2026-04-22',  842110, '#1F5F5B', '#0A2E2C'],
  ['Sodium Sun',          'Marisol Vane',   'Single', 'delivering', 'LOR-0058', '2026-08-14',       0, '#B4553A', '#4A1E12'],
  ['Cassette Weather',    'The Pale Hours', 'Album',  'live',       'LOR-0031', '2026-02-13', 2039880, '#3C4A8F', '#151D45'],
  ['Undertow',            'Kessa Nu',       'Single', 'live',       'LOR-0045', '2026-06-05',  617420, '#8F6D3B', '#403014'],
  ['Rooms Without Doors', 'Ossian Bloom',   'Album',  'in-review',  'LOR-0047', '2026-09-11',       0, '#4B3B8F', '#1C1445'],
  ['Static Bloom',        'Vaeda Grey',     'Single', 'live',       'LOR-0036', '2026-03-27', 1105940, '#8F3B5E', '#40142A'],
  ['Salt & Signal',       'Iron Harbour',   'EP',     'live',       'LOR-0028', '2026-01-30',  488230, '#2F6B8F', '#0F2A40'],
  ['Grey Cathedral',      'The Pale Hours', 'Single', 'live',       'LOR-0043', '2026-05-29',  733510, '#5A5A5A', '#242424'],
  ['Fluorescent Kids',    'Marisol Vane',   'Album',  'draft',      'LOR-0069', '2026-11-06',       0, '#8F7A3B', '#403614'],
  ['Long Way Down',       'Kessa Nu',       'EP',     'delivering', 'LOR-0052', '2026-08-21',       0, '#3B8F6C', '#144031'],
  ['Nightbus',            'Halcyon Drift',  'Single', 'live',       'LOR-0049', '2026-07-03',  396770, '#6B3B8F', '#2C1440'],
  ['Tessellate the Dark', 'Iron Harbour',   'Album',  'in-review',  'LOR-0062', '2026-10-02',       0, '#8F4B3B', '#401D14'],
  ['Coldwater Signal',    'Vaeda Grey',     'EP',     'live',       'LOR-0022', '2025-11-14', 1573260, '#3B6B8F', '#142C40'],
  ['Hollow Season',       'Ossian Bloom',   'Single', 'rejected',   'LOR-0055', '2026-08-01',       0, '#8F3B3B', '#401414'],
  ['Ferrite',             'Null Parade',    'Single', 'live',       'LOR-0037', '2026-04-04',  259040, '#4A4A6B', '#1C1C2C'],
  ['Paper Cathedral',     'Halcyon Drift',  'Album',  'live',       'LOR-0018', '2025-09-19', 3120450, '#8F6B3B', '#402C14'],
  ['Winter Frequency',    'The Pale Hours', 'EP',     'live',       'LOR-0026', '2026-01-09',  671330, '#3B8F8F', '#144040'],
  ['Slow Alarm',          'Kessa Nu',       'Single', 'draft',      'LOR-0071', '2026-12-04',       0, '#6B8F3B', '#2C4014'],
  ['Everything Louder',   'Null Parade',    'EP',     'in-review',  'LOR-0061', '2026-09-25',       0, '#8F3B7A', '#401434'],
  ['Aftertaste',          'Marisol Vane',   'Single', 'live',       'LOR-0046', '2026-06-19',  905180, '#3B5E8F', '#142640'],
  ['Wire Mother',         'Iron Harbour',   'Single', 'live',       'LOR-0033', '2026-02-27',  344920, '#7A3B8F', '#341440'],
  ['Glass Interstate',    'Halcyon Drift',  'EP',     'delivering', 'LOR-0064', '2026-08-28',       0, '#3B8F4B', '#14401D'],
  ['Low Orbit Vol. 3',    'Various Artists','Album',  'live',       'LOR-0034', '2026-03-06', 1846700, '#8F8F3B', '#404014'],
  ['Ash & Ember',         'Vaeda Grey',     'Single', 'live',       'LOR-0024', '2025-12-12',  528610, '#8F5A3B', '#402414'],
  ['Nocturne for Static', 'Ossian Bloom',   'EP',     'live',       'LOR-0020', '2025-10-24',  412870, '#5B3B8F', '#231440'],
  ['Threadbare',          'Null Parade',    'Album',  'draft',      'LOR-0073', '2027-01-15',       0, '#3B7A8F', '#143440'],
  ['Sirens in Reverse',   'The Pale Hours', 'Single', 'live',       'LOR-0050', '2026-07-17',  788040, '#8F3B4B', '#40141D'],
  ['Quiet Machines',      'Kessa Nu',       'Album',  'live',       'LOR-0016', '2025-08-29', 2274160, '#4B8F3B', '#1D4014'],
  ['Halogen',             'Marisol Vane',   'EP',     'rejected',   'LOR-0054', '2026-07-31',       0, '#8F4B6B', '#401D2C'],
  ['Signal Fade',         'Halcyon Drift',  'Single', 'in-review',  'LOR-0060', '2026-09-04',       0, '#3B4B8F', '#141D40'],
];

/** Track-title vocabulary, in the catalogue's own register. */
const TRACK_HEADS = [
  'Ashline',
  'Blue Hour',
  'Carbon',
  'Dead Air',
  'Everlight',
  'Ferrous',
  'Glasshouse',
  'Harbour Lights',
  'Interlude',
  'Kilometre Zero',
  'Lantern',
  'Midwinter',
  'Nightshift',
  'Oxide',
  'Paper Streets',
  'Quiet Part',
  'Radiate',
  'Saltwater',
  'Tessellate',
  'Undertone',
  'Vantage',
  'Wavelength',
] as const;

const TRACK_TAILS = [
  '',
  ' (Reprise)',
  ' II',
  ' at Dawn',
  ' in Reverse',
  ' Forever',
  ' Again',
  ' (Alt Take)',
] as const;

const TRACK_COUNT: Record<ReleaseType, [number, number]> = {
  Single: [1, 2],
  EP: [4, 6],
  Album: [8, 12],
};

const ACTOR = ['Mara Kessler', 'Dev Okonjo', 'Priya Raman', 'automation'] as const;

const DAY_MS = 86400000;

const iso = (date: Date): string => date.toISOString();
const day = (date: Date): string => iso(date).slice(0, 10);

/** Fixed "now", so the label never drifts against its own dates. */
const NOW = new Date('2026-08-12T09:14:00.000Z');

/** Real ISRC format, fictional codes. */
const isrc = (index: number): string => `GBLOR26${String(index + 1).padStart(5, '0')}`;

/**
 * A time of day somebody could have been at their desk. Every timestamp in the
 * console is shown to the minute, and a whole column reading 00:00 is the tell
 * that nobody generated the data with a working day in mind.
 */
const atWorkingHour = (timestamp: number, random: () => number): string =>
  iso(new Date(timestamp + between(random, 8, 18) * 3600000 + between(random, 0, 59) * 60000));

export function buildSeed(seed = 20140611): Seed {
  const random = prng(seed);

  const artists: Artist[] = ARTISTS.map((name) => ({
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name,
  }));
  const stores: Store[] = STORES.map(([id, name]) => ({ id, name }));

  const releases: Release[] = [];
  const tracks: Track[] = [];
  const activity: ActivityEvent[] = [];
  const stats: DailyStat[] = [];
  let trackIndex = 0;

  for (const row of CATALOGUE) {
    const [title, artistName, type, status, catalogNumber, releaseDate, streams30d, from, to] = row;
    const id = catalogNumber.toLowerCase();
    const artist = artists.find((candidate) => candidate.name === artistName);
    if (!artist) throw new Error(`seed: unknown artist ${artistName}`);

    const releasedAt = new Date(releaseDate).getTime();
    // A release is submitted before its street date — but nothing is submitted in
    // the future, whatever its street date says. Without the clamp, a release
    // planned for November carries a September submission, and every screen that
    // takes its clock from the newest submission (the board, the stat tiles) reads
    // the label's own dates as if they had already happened.
    const submittedAt =
      status === 'draft'
        ? null
        : atWorkingHour(
            Math.min(
              releasedAt - between(random, 6, 40) * DAY_MS,
              NOW.getTime() - between(random, 1, 9) * DAY_MS,
            ),
            random,
          );

    // 90 days of numbers, with one playlist spike for analytics to point at.
    const series: DailyStat[] = [];
    if (status === 'live') {
      const daily = streams30d / 30;
      const spikeStart = between(random, 20, 60);
      for (let back = 89; back >= 0; back -= 1) {
        const date = new Date(NOW.getTime() - back * DAY_MS);
        const inSpike = back <= spikeStart && back > spikeStart - 6;
        const wobble = 0.75 + random() * 0.5;
        const streams = Math.round(daily * wobble * (inSpike ? 3.4 : 1));
        series.push({
          releaseId: id,
          date: day(date),
          streams,
          // ~$0.0032 a stream, the industry's famously grim rate.
          revenue: Math.round(streams * 0.0032 * 100) / 100,
        });
      }
    }
    stats.push(...series);

    releases.push({
      id,
      catalogNumber,
      title,
      artistId: artist.id,
      artistName,
      type,
      status,
      releaseDate,
      submittedAt,
      artwork: { from, to },
      streams30d,
      streamsTrend: series.slice(-16).map((stat) => stat.streams),
      deliveries: stores.map((store) => ({
        storeId: store.id,
        status: deliveryStatusFor(status, random),
        deliveredAt:
          status === 'live'
            ? atWorkingHour(releasedAt + between(random, 0, 3) * DAY_MS, random)
            : null,
      })),
    });

    // LOR-0052 keeps a track mid-processing, so the wizard and the detail screen
    // have a live example of it.
    const [min, max] = TRACK_COUNT[type];
    const count = between(random, min, max);
    const used = new Set<string>();
    for (let number = 1; number <= count; number += 1) {
      let trackTitle = `${pick(random, TRACK_HEADS)}${pick(random, TRACK_TAILS)}`;
      // A repeated title reads as generated, instantly.
      while (used.has(trackTitle)) {
        trackTitle = `${pick(random, TRACK_HEADS)}${pick(random, TRACK_TAILS)}`;
      }
      used.add(trackTitle);

      tracks.push({
        id: `${id}-t${number}`,
        releaseId: id,
        number,
        title: trackTitle,
        durationMs: between(random, 132, 402) * 1000,
        isrc: isrc(trackIndex),
        audioStatus: catalogNumber === 'LOR-0052' && number === 2 ? 'processing' : 'ready',
      });
      trackIndex += 1;
    }
  }

  // The feed, newest first.
  const eventful = releases.filter((release) => release.status !== 'draft');
  for (let index = 0; index < 40; index += 1) {
    const release = pick(random, eventful);
    const type = pick(random, [
      'domain/releases/submitted',
      'domain/releases/withdrawn',
      'domain/tracks/processed',
    ] as const);

    activity.push({
      id: `evt-${String(index + 1).padStart(3, '0')}`,
      type,
      at: iso(new Date(NOW.getTime() - between(random, 1, 40) * 6 * 3600000)),
      actor: type === 'domain/tracks/processed' ? 'Audio pipeline' : pick(random, ACTOR),
      summary: summaryFor(type, release, tracks.filter((t) => t.releaseId === release.id).length),
      release: {
        id: release.id,
        catalogNumber: release.catalogNumber,
        title: release.title,
        artwork: release.artwork,
      },
    });
  }
  activity.sort((a, b) => b.at.localeCompare(a.at));

  return { artists, stores, releases, tracks, activity, stats };
}

function deliveryStatusFor(status: ReleaseStatus, random: () => number): DeliveryStatus {
  switch (status) {
    case 'live':
      return 'delivered';
    case 'delivering':
      // The interesting case: some stores have it, some don't.
      return random() < 0.6 ? 'delivered' : 'pending';
    case 'submitted':
    case 'in-review':
      return 'in-review';
    case 'rejected':
      return 'rejected';
    case 'draft':
      return 'pending';
  }
}

function summaryFor(type: ActivityEvent['type'], release: Release, trackCount: number): string {
  switch (type) {
    case 'domain/releases/submitted':
      return `${release.title} submitted for distribution to ${release.deliveries.length} stores`;
    case 'domain/releases/withdrawn':
      return `Withdrawn from all ${release.deliveries.length} stores at the artist's request`;
    case 'domain/tracks/processed':
      return `All ${trackCount} tracks processed and fingerprinted`;
  }
}
