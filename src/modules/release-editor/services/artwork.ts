// Cover art, twice over: what the stores measure (the file), and what this
// console can actually render (two colours). No React, no store (R5).

import type { Artwork, ArtworkFile } from '../api/types';

export type ArtworkReading = {
  file: ArtworkFile;
  /** Sampled from the cover, so a release's colours are its own. */
  artwork: Artwork;
  /** Lives as long as the tab does — the mock backend stores no files. */
  previewUrl: string;
};

/** How much darker the lower half is drawn, to match the catalogue's own covers. */
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

/**
 * The whole cover, downsampled to two pixels: the browser averages the top and
 * bottom halves for us, which is the only colour reading this console needs.
 */
export async function readArtworkFile(file: File): Promise<ArtworkReading> {
  const bitmap = await createImageBitmap(file);

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 2;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('artwork: no 2d context');

  context.imageSmoothingQuality = 'high';
  context.drawImage(bitmap, 0, 0, 1, 2);
  const { data } = context.getImageData(0, 0, 1, 2);
  bitmap.close();

  return {
    file: { name: file.name, width: bitmap.width, height: bitmap.height },
    artwork: {
      from: toHex([...data].slice(0, 3)),
      to: toHex(shade([...data].slice(4, 7), DEPTH)),
    },
    previewUrl: URL.createObjectURL(file),
  };
}
