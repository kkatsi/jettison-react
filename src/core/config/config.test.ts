import { afterEach, describe, expect, it, vi } from 'vitest';

import { urlForCacheMode } from './config';

describe('cacheMode', () => {
  // Read once at import, so each case needs its own module instance.
  const load = async (search?: string) => {
    vi.resetModules();
    if (search === undefined) vi.unstubAllGlobals();
    else vi.stubGlobal('location', { search });
    return (await import('./config')).config.cacheMode;
  };

  afterEach(() => void vi.unstubAllGlobals());

  it('is events by default', async () => {
    await expect(load('')).resolves.toBe('events');
  });

  it('is naive when the URL asks for it', async () => {
    await expect(load('?cache=naive')).resolves.toBe('naive');
  });

  it('ignores anything else in the query string', async () => {
    await expect(load('?cache=nope&artist=kessa-nu')).resolves.toBe('events');
  });

  it('falls back to events where there is no location at all', async () => {
    await expect(load()).resolves.toBe('events');
  });
});

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
