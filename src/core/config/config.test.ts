import { describe, expect, it } from 'vitest';

import { urlForCacheMode } from './config';

describe('urlForCacheMode', () => {
  const catalogue = 'http://localhost/catalog?artist=kessa-nu&page=2';

  it('turns the demo on without disturbing the screen you are on', () => {
    expect(urlForCacheMode('naive', catalogue)).toBe(
      'http://localhost/catalog?artist=kessa-nu&page=2&cache=naive',
    );
  });

  it('turns it off again and leaves no trace in the URL', () => {
    expect(urlForCacheMode('events', `${catalogue}&cache=naive`)).toBe(catalogue);
  });

  it('is idempotent — asking for the mode you are already in changes nothing', () => {
    const naive = urlForCacheMode('naive', catalogue);
    expect(urlForCacheMode('naive', naive)).toBe(naive);
    expect(urlForCacheMode('events', catalogue)).toBe(catalogue);
  });
});
