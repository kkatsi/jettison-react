import { lazy } from 'react';
import type { RouteObject } from 'react-router';

import { ScreenErrorBoundary } from '@shared/ui';

// The screen is the code-splitting boundary, and echarts rides with it: the
// console's other four screens never pay for a chart library.
const Analytics = lazy(() =>
  import('./screens/Analytics/Analytics').then((module) => ({ default: module.Analytics })),
);

export const analyticsRoutes: RouteObject[] = [
  {
    path: 'analytics',
    element: (
      <ScreenErrorBoundary name="analytics.overview">
        <Analytics />
      </ScreenErrorBoundary>
    ),
  },
];
