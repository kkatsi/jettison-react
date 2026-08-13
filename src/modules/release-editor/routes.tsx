import { lazy } from 'react';
import { Navigate, type RouteObject } from 'react-router';

import { ScreenErrorBoundary } from '@shared/ui';

// The wizard is one screen with four panes: the frame is the code-splitting
// boundary, and each step is a chunk of its own inside it (Ch. 2 §3).
const NewRelease = lazy(() =>
  import('./screens/NewRelease/NewRelease').then((module) => ({ default: module.NewRelease })),
);

const ReleaseWizard = lazy(() =>
  import('./screens/ReleaseWizard/ReleaseWizard').then((module) => ({
    default: module.ReleaseWizard,
  })),
);

const DetailsStep = lazy(() =>
  import('./screens/DetailsStep/DetailsStep').then((module) => ({ default: module.DetailsStep })),
);

const TracksStep = lazy(() =>
  import('./screens/TracksStep/TracksStep').then((module) => ({ default: module.TracksStep })),
);

const ArtworkStep = lazy(() =>
  import('./screens/ArtworkStep/ArtworkStep').then((module) => ({ default: module.ArtworkStep })),
);

const ReviewStep = lazy(() =>
  import('./screens/ReviewStep/ReviewStep').then((module) => ({ default: module.ReviewStep })),
);

export const releaseEditorRoutes: RouteObject[] = [
  {
    path: 'releases/new',
    element: (
      <ScreenErrorBoundary name="release-editor.new">
        <NewRelease />
      </ScreenErrorBoundary>
    ),
  },
  {
    path: 'releases/:id/edit',
    element: (
      <ScreenErrorBoundary name="release-editor.wizard">
        <ReleaseWizard />
      </ScreenErrorBoundary>
    ),
    children: [
      { index: true, element: <Navigate to="details" replace /> },
      { path: 'details', element: <DetailsStep /> },
      { path: 'tracks', element: <TracksStep /> },
      { path: 'artwork', element: <ArtworkStep /> },
      { path: 'review', element: <ReviewStep /> },
    ],
  },
];
