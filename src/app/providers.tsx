import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router';

import { router } from './router';
import { store } from './store';

/** Everything the tree needs, assembled once. Screens see none of this. */
export function Providers() {
  return (
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  );
}
