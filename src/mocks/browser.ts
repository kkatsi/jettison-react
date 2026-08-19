// The backend runs in a service worker, in every environment including the
// deployed demo — which is why the demo is a static link (ADR-002).

import { setupWorker } from 'msw/browser';

import { withDeadline } from '@shared/utils/with-deadline';

import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

/**
 * Long enough for a cold registration on a slow machine, short enough that nobody
 * mistakes the wait for a hung page.
 */
const BOOT_TIMEOUT_MS = 8000;

/**
 * Awaited before the first render, so no screen races the worker. Registration can
 * refuse *and* it can hang — a browser with service workers off never answers — so
 * this always settles, and main.tsx has something to show either way.
 */
export async function startMockBackend(timeoutMs = BOOT_TIMEOUT_MS): Promise<void> {
  await withDeadline(
    worker.start({
      quiet: true,
      // Fonts and app assets pass through.
      onUnhandledRequest: 'bypass',
    }),
    timeoutMs,
    `the service worker did not register within ${timeoutMs}ms`,
  );
}
