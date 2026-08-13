import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router';

import { ScreenErrorBoundary, ScreenFallback } from '@shared/ui';

// Screens are the code-splitting boundary, and each gets its own boundary so a
// failure here cannot blank the console (Ch. 2 §3).
const Catalog = lazy(() =>
  import('./screens/Catalog/Catalog').then((module) => ({ default: module.Catalog })),
);

const DistributionBoard = lazy(() =>
  import('./screens/DistributionBoard/DistributionBoard').then((module) => ({
    default: module.DistributionBoard,
  })),
);

const ReleaseDetail = lazy(() =>
  import('./screens/ReleaseDetail/ReleaseDetail').then((module) => ({
    default: module.ReleaseDetail,
  })),
);

export const catalogRoutes: RouteObject[] = [
  {
    path: 'catalog',
    element: (
      <ScreenErrorBoundary name="catalog.list">
        <Suspense fallback={<ScreenFallback />}>
          <Catalog />
        </Suspense>
      </ScreenErrorBoundary>
    ),
  },
  {
    path: 'catalog/:id',
    element: (
      <ScreenErrorBoundary name="catalog.detail">
        <Suspense fallback={<ScreenFallback />}>
          <ReleaseDetail />
        </Suspense>
      </ScreenErrorBoundary>
    ),
  },
  {
    // The pipeline is the same releases seen from the stores' side, so catalog
    // owns it — a second module for one view of one list would be a folder, not
    // a boundary.
    path: 'distribution',
    element: (
      <ScreenErrorBoundary name="catalog.distribution">
        <Suspense fallback={<ScreenFallback />}>
          <DistributionBoard />
        </Suspense>
      </ScreenErrorBoundary>
    ),
  },
];
