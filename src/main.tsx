import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@shared/ui/theme.css';
import { Providers } from '@app/providers';

import { startMockBackend } from './mocks/browser';

const root = document.getElementById('root');
if (!root) throw new Error('#root is missing from index.html');

// The mock backend is the backend (ADR-002), so it boots before the first render.
// Awaiting it here is the whole reason no screen has to handle "the worker was not
// ready yet" as a state.
await startMockBackend();

createRoot(root).render(
  <StrictMode>
    <Providers />
  </StrictMode>,
);
