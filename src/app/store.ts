// =============================================================================
// The store — composed here, and only here.
// =============================================================================
// `app` is the one layer allowed to know which modules exist (Chapter 1 §2), so
// this is the file that knows the app's full shape: the API cache, every module
// slice, every module's reactions. No module knows about any of it.
//
// The two marked regions below are what the jettison test edits. Deleting a
// module means deleting its folder plus its lines in here and in router.tsx —
// `scripts/unregister-module.mjs` does exactly that, mechanically, in CI.
// =============================================================================

import { configureStore } from '@reduxjs/toolkit';

import { api } from '@core/api/api';
import { reactionsMiddleware } from '@core/redux/reactions';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,

    // jettison:reducers:start — one line per module slice
    // jettison:reducers:end
  },

  // Reactions run before the reducers so a domain event's cache patches are
  // dispatched in the same tick the event lands — the DevTools timeline then
  // reads as cause followed by effect, which is the debugging story Chapter 4
  // promises.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(reactionsMiddleware.middleware).concat(api.middleware),
});

// jettison:reactions:start — one registerXReactions() call per module
// jettison:reactions:end

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
