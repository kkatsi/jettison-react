import { describe, expect, it } from 'vitest';

import { shade, toHex } from './artwork';

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
