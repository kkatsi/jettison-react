// A module exports a route tree from its index.ts; this file spreads it in. That
// spread is the module's registration — and the line the jettison test deletes.
//
// The table lives here rather than beside `createBrowserRouter` so it can be handed
// to a memory router in a test: routes.test.ts asserts what `/` resolves to, which is
// the kind of claim that is easy to make and easy to lose.

import { redirect } from 'react-router';

import { activityRoutes } from '@modules/activity';
import { analyticsRoutes } from '@modules/analytics';
import { catalogRoutes } from '@modules/catalog';
import { releaseEditorRoutes } from '@modules/release-editor';
import { ScreenErrorBoundary } from '@shared/ui';

import { AppLayout } from './layouts/AppLayout';
import { NAV } from './navigation';
import { UnbuiltSection } from './screens/UnbuiltSection';

const unbuilt = (
  <ScreenErrorBoundary name="shell.unbuilt">
    <UnbuiltSection />
  </ScreenErrorBoundary>
);

/**
 * `/` is not a screen. It forwards to the first section the sidebar offers, read from
 * NAV rather than hardcoded, so ejecting a module moves the landing page instead of
 * breaking it. With every module overboard there is nowhere to forward to, and the
 * empty state is the honest answer.
 */
const landing = NAV[0];

// A loader rather than a `<Navigate>` element: the redirect then happens while the
// router is deciding, instead of after a render that shows nothing. It is also the
// only form a test can observe without a browser — see routes.test.ts.
const landingRoute = landing
  ? { index: true, loader: () => redirect(landing.to) }
  : { index: true, element: unbuilt };

export const routes = [
  {
    path: '/',
    Component: AppLayout,
    children: [
      // jettison:routes:start — one spread per module
      ...activityRoutes,
      ...analyticsRoutes,
      ...catalogRoutes,
      ...releaseEditorRoutes,
      // jettison:routes:end

      landingRoute,
      { path: '*', element: unbuilt },
    ],
  },
];
