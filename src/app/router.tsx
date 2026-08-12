// =============================================================================
// The router — the only file that knows which modules the console contains.
// =============================================================================
// A module exports a route tree from its `index.ts` and nothing else; this file
// spreads it into the shell. That single spread is the module's registration —
// the line the jettison test deletes when it throws the module overboard.
//
// Screens are lazy per module (Chapter 2 §3), so a jettisoned module also stops
// being downloaded, not merely stops being reachable.
// =============================================================================

import { createBrowserRouter } from 'react-router';

import { ScreenErrorBoundary } from '@shared/ui';

import { AppLayout } from './layouts/AppLayout';
import { UnbuiltSection } from './screens/UnbuiltSection';

const unbuilt = (
  <ScreenErrorBoundary name="shell.unbuilt">
    <UnbuiltSection />
  </ScreenErrorBoundary>
);

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppLayout,
    children: [
      // jettison:routes:start — one spread per module
      // jettison:routes:end

      // The landing screen, and every section whose module has not shipped.
      { index: true, element: unbuilt },
      { path: '*', element: unbuilt },
    ],
  },
]);
