import { describe, expect, it } from 'vitest';

import { artworkFromSample, shade, toHex } from './artwork';

describe('toHex', () => {
  it('writes the colour the way the theme does', () => {
    expect(toHex([109, 59, 143])).toBe('#6d3b8f');
    expect(toHex([0, 0, 0])).toBe('#000000');
    expect(toHex([255, 255, 255])).toBe('#ffffff');
  });

  it('ignores the alpha channel a canvas hands it', () => {
    expect(toHex([109, 59, 143, 255])).toBe('#6d3b8f');
  });

  it('clamps rather than emitting a colour no browser can read', () => {
    expect(toHex([300, -20, 143.6])).toBe('#ff0090');
  });
});

describe('shade', () => {
  it('darkens towards the depth the seeded covers have', () => {
    expect(toHex(shade([109, 59, 143], 0.42))).toBe('#2e193c');
  });

  it('leaves a colour alone at full strength', () => {
    expect(toHex(shade([109, 59, 143], 1))).toBe('#6d3b8f');
  });
});

describe('artworkFromSample', () => {
  it('reads the two pixels a canvas hands back as one gradient', () => {
    // Top half violet, bottom half the same violet — the depth is what separates them.
    const sample = new Uint8ClampedArray([109, 59, 143, 255, 109, 59, 143, 255]);

    expect(artworkFromSample(sample)).toEqual({ from: '#6d3b8f', to: '#2e193c' });
  });

  it('survives a cover that is one flat colour', () => {
    expect(artworkFromSample([0, 0, 0, 255, 0, 0, 0, 255])).toEqual({
      from: '#000000',
      to: '#000000',
    });
  });
});
