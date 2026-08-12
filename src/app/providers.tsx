import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router';

import { router } from './router';
import { store } from './store';

// Assembled once. Screens see none of it.
export function Providers() {
  return (
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  );
}
