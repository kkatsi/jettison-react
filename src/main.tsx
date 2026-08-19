import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@shared/ui/theme.css';
import { Providers } from '@app/providers';
import { BootFailure } from '@app/screens/BootFailure';

import { startMockBackend } from './mocks/browser';

const root = document.getElementById('root');
if (!root) throw new Error('#root is missing from index.html');

// The mock is the backend (ADR-002), so it boots before the first render and no
// screen has to handle "worker not ready" as a state. The cost of that ordering is
// this branch: if the worker never registers there is nothing behind the app, so the
// shell is replaced by the reason rather than left blank.
let failure: string | null = null;

try {
  await startMockBackend();
} catch (error) {
  failure = error instanceof Error ? error.message : String(error);
  console.error('[boot] the simulated backend did not start:', error);
}

createRoot(root).render(
  <StrictMode>
    {failure === null ? (
      <Providers />
    ) : (
      <BootFailure reason={failure} onRetry={() => window.location.reload()} />
    )}
  </StrictMode>,
);
