import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router';

import { ScreenErrorBoundary, ScreenFallback } from '@shared/ui';

// Screens are the code-splitting boundary, and each gets its own boundary so a
// failure here cannot blank the console (Chapter 2 §3).
const ActivityFeed = lazy(() =>
  import('./screens/ActivityFeed/ActivityFeed').then((module) => ({
    default: module.ActivityFeed,
  })),
);

export const activityRoutes: RouteObject[] = [
  {
    path: 'activity',
    element: (
      <ScreenErrorBoundary name="activity.feed">
        <Suspense fallback={<ScreenFallback />}>
          <ActivityFeed />
        </Suspense>
      </ScreenErrorBoundary>
    ),
  },
];
