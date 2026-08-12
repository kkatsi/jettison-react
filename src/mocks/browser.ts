// The backend runs in a service worker, in every environment including the
// deployed demo — which is why the demo is a static link (ADR-002).

import { setupWorker } from 'msw/browser';

import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

/** Awaited before the first render, so no screen races the worker. */
export async function startMockBackend(): Promise<void> {
  await worker.start({
    quiet: true,
    // Fonts and app assets pass through.
    onUnhandledRequest: 'bypass',
  });
}
