import { describe, expect, it } from 'vitest';

import type { ScopeReleaseDto } from '../api/types';
import { formatScope, parseScope, scopeOptions, selectedOption } from './scope';

const artwork = { from: '#6D3B8F', to: '#2A1140' };

const release = (over: Partial<ScopeReleaseDto>): ScopeReleaseDto => ({
  id: 'lor-0042',
  catalogNumber: 'LOR-0042',
  title: 'Neon Arterial',
  artistId: 'vaeda-grey',
  artistName: 'Vaeda Grey',
  status: 'live',
  artwork,
  ...over,
});

const artists = [
  { id: 'vaeda-grey', name: 'Vaeda Grey' },
  { id: 'kessa-nu', name: 'Kessa Nu' },
  { id: 'null-parade', name: 'Null Parade' },
];

describe('reading a scope off the URL', () => {
  it('takes the three shapes the picker writes', () => {
    expect(parseScope('all')).toEqual({ kind: 'all' });
    expect(parseScope('artist:kessa-nu')).toEqual({ kind: 'artist', id: 'kessa-nu' });
    expect(parseScope('release:lor-0042')).toEqual({ kind: 'release', id: 'lor-0042' });
  });

  it('falls back to the whole label rather than blanking the screen', () => {
    expect(parseScope(null)).toEqual({ kind: 'all' });
    expect(parseScope('label:lor-0042')).toEqual({ kind: 'all' });
    expect(parseScope('release:')).toEqual({ kind: 'all' });
  });

  it('round-trips', () => {
    for (const value of ['all', 'artist:kessa-nu', 'release:lor-0042']) {
      expect(formatScope(parseScope(value))).toBe(value);
    }
  });
});

describe('the scope list', () => {
  const releases = [
    release({}),
    release({ id: 'lor-0036', catalogNumber: 'LOR-0036', title: 'Static Bloom' }),
    release({
      id: 'lor-0016',
      catalogNumber: 'LOR-0016',
      title: 'Quiet Machines',
      artistId: 'kessa-nu',
      artistName: 'Kessa Nu',
    }),
    release({
      id: 'lor-0073',
      catalogNumber: 'LOR-0073',
      title: 'Threadbare',
      artistId: 'null-parade',
      status: 'draft',
    }),
  ];

  it('opens with the whole label, counting everything in the catalogue', () => {
    expect(scopeOptions(releases, artists)[0]).toMatchObject({
      value: 'all',
      meta: '4 in catalog',
      group: 'Label',
    });
  });

  it('leaves out what the stores never took — a draft has no numbers', () => {
    const values = scopeOptions(releases, artists).map((option) => option.value);

    expect(values).not.toContain('release:lor-0073');
    expect(values).not.toContain('artist:null-parade');
    expect(values).toContain('release:lor-0042');
  });

  it('puts the busiest artist first and counts only their live releases', () => {
    const artistRows = scopeOptions(releases, artists).filter(
      (option) => option.group === 'Artists',
    );

    expect(artistRows.map((option) => option.label)).toEqual(['Vaeda Grey', 'Kessa Nu']);
    expect(artistRows[0]?.meta).toBe('2 releases');
    expect(artistRows[1]?.meta).toBe('1 release');
  });

  it('selects the whole label when the URL names something that has gone', () => {
    const options = scopeOptions(releases, artists);

    expect(selectedOption(options, 'release:lor-0036')?.label).toBe('Static Bloom');
    expect(selectedOption(options, 'release:lor-9999')?.value).toBe('all');
    expect(selectedOption([], 'all')).toBeNull();
  });
});
