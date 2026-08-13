// A module exports a route tree from its index.ts; this file spreads it in. That
// spread is the module's registration — and the line the jettison test deletes.

import { createBrowserRouter } from 'react-router';

import { activityRoutes } from '@modules/activity';
import { catalogRoutes } from '@modules/catalog';
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
      ...activityRoutes,
      ...catalogRoutes,
      // jettison:routes:end

      { index: true, element: unbuilt },
      { path: '*', element: unbuilt },
    ],
  },
]);
