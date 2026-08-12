// The mock backend runs in a service worker, in the browser, in every
// environment including the deployed demo — that is what makes this a static
// link with no infrastructure behind it (ADR-002).

import { setupWorker } from 'msw/browser';

import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

/** Awaited before the first render, so no screen ever races the worker's boot. */
export async function startMockBackend(): Promise<void> {
  await worker.start({
    quiet: true,
    // Requests the mock does not implement (fonts, the app's own assets) pass through.
    onUnhandledRequest: 'bypass',
  });
}
