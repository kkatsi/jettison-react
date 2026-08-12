import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@shared/ui/theme.css';
import { Providers } from '@app/providers';

import { startMockBackend } from './mocks/browser';

const root = document.getElementById('root');
if (!root) throw new Error('#root is missing from index.html');

// The mock is the backend (ADR-002), so it boots before the first render and no
// screen has to handle "worker not ready" as a state.
await startMockBackend();

createRoot(root).render(
  <StrictMode>
    <Providers />
  </StrictMode>,
);
