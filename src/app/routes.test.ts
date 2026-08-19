// What `/` resolves to is a claim about the shell, and it was silently lost once
// already. A memory router settles it without a browser.
import { createMemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { NAV } from './navigation';
import { routes } from './routes';

/** Let the router settle its initial navigation before reading where it landed. */
const landOn = async (path: string) => {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  await new Promise((resolve) => setTimeout(resolve, 0));
  return router.state.location.pathname;
};

describe('the landing route', () => {
  it('sends / to the first section in the sidebar, not to an empty state', async () => {
    await expect(landOn('/')).resolves.toBe('/catalog');
  });

  it('follows NAV rather than a hardcoded path, so ejecting a module moves it', async () => {
    expect(NAV[0]?.to).toBe('/catalog');
    await expect(landOn('/')).resolves.toBe(NAV[0]?.to);
  });

  it('leaves every other path alone', async () => {
    await expect(landOn('/analytics')).resolves.toBe('/analytics');
    await expect(landOn('/nonsense')).resolves.toBe('/nonsense');
  });
});
