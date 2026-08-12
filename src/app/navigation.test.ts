import { describe, expect, it } from 'vitest';

import { navTitleFor } from './navigation';

describe('navTitleFor', () => {
  it('names the section for an exact match', () => {
    expect(navTitleFor('/catalog')).toBe('Catalog');
    expect(navTitleFor('/activity')).toBe('Activity');
  });

  it('names the section for a screen inside it', () => {
    expect(navTitleFor('/catalog/lor-0042')).toBe('Catalog');
  });

  it('prefers the longest matching section', () => {
    // Must not lose to a future '/releases' entry.
    expect(navTitleFor('/releases/new')).toBe('New Release');
  });

  it('falls back rather than rendering an empty topbar', () => {
    expect(navTitleFor('/')).toBe('Console');
    expect(navTitleFor('/somewhere-else')).toBe('Console');
  });
});
