import { describe, expect, it } from 'vitest';

import { artistOptions } from './artist-options';

describe('artistOptions', () => {
  it('offers each artist once, alphabetically, from the releases themselves', () => {
    const options = artistOptions([
      { artistId: 'kessa-nu', artistName: 'Kessa Nu' },
      { artistId: 'vaeda-grey', artistName: 'Vaeda Grey' },
      { artistId: 'kessa-nu', artistName: 'Kessa Nu' },
    ]);

    expect(options).toEqual([
      { value: 'kessa-nu', label: 'Kessa Nu' },
      { value: 'vaeda-grey', label: 'Vaeda Grey' },
    ]);
  });

  it('has nothing to offer for an empty catalogue', () => {
    expect(artistOptions([])).toEqual([]);
  });
});
