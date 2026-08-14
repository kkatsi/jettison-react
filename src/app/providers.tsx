import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router';

import { Toaster } from '@shared/ui';

import { router } from './router';
import { store } from './store';

// Assembled once. Screens see none of it.
export function Providers() {
  return (
    <Provider store={store}>
      <RouterProvider router={router} />
      {/* Outside the router: a toast usually outlives the screen that raised it —
          submitting a release announces itself from the board it lands on. */}
      <Toaster position="bottom-right" />
    </Provider>
  );
}
