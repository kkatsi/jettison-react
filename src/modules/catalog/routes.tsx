import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router';

import { ScreenErrorBoundary } from '@shared/ui';

// Screens are the code-splitting boundary, and each gets its own boundary so a
// failure here cannot blank the console (Ch. 2 §3).
const Catalog = lazy(() =>
  import('./screens/Catalog/Catalog').then((module) => ({ default: module.Catalog })),
);

export const catalogRoutes: RouteObject[] = [
  {
    path: 'catalog',
    element: (
      <ScreenErrorBoundary name="catalog.list">
        <Suspense fallback={null}>
          <Catalog />
        </Suspense>
      </ScreenErrorBoundary>
    ),
  },
];
