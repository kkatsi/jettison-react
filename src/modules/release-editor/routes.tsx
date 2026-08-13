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
    ],
  },
];
