// app is the only layer that knows which modules exist, so the store is composed
// here. The marked regions are what scripts/unregister-module.mjs edits.

import { configureStore } from '@reduxjs/toolkit';

import { registerActivityReactions } from '@modules/activity';
import { registerCatalogReactions } from '@modules/catalog';

import { api } from '@core/api/api';
import { reactionsMiddleware } from '@core/redux/reactions';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,

    // jettison:reducers:start — one line per module slice
    // jettison:reducers:end
  },

  // Reactions run before the reducers, so an event and the cache patches it caused
  // land in the same tick and read as cause then effect in DevTools.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(reactionsMiddleware.middleware).concat(api.middleware),
});

// jettison:reactions:start — one registerXReactions() call per module
registerActivityReactions();
registerCatalogReactions();
// jettison:reactions:end

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
