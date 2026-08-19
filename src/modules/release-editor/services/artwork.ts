// The colour half of cover art: a sampled image in, the pair the console renders
// out. Pure (R5) — reading the file is the hook's job, deciding is this file's.

import type { Artwork } from '../api/types';

/** How much darker the lower half is drawn, to match the seeded covers' depth. */
const DEPTH = 0.42;

export function toHex(channels: readonly number[]): string {
  return `#${channels
    .slice(0, 3)
    .map((value) =>
      Math.max(0, Math.min(255, Math.round(value)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

export function shade(channels: readonly number[], factor: number): number[] {
  return channels.slice(0, 3).map((value) => value * factor);
}

/** Two pixels — top half, bottom half, RGBA each — as the gradient every screen draws. */
export function artworkFromSample(sample: ArrayLike<number>): Artwork {
  const pixels = Array.from(sample);

  return {
    from: toHex(pixels.slice(0, 3)),
    to: toHex(shade(pixels.slice(4, 7), DEPTH)),
  };
}
