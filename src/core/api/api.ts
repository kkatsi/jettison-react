// =============================================================================
// The one API client. There is no second one.
// =============================================================================
// Auth, retries and error handling are implemented here, once — the alternative
// is four subtly different token-refresh races discovered in production.
//
// Endpoints are NOT defined here. Each module injects its own into this client
// from `modules/<name>/api/endpoints.ts` (Chapter 4 §1), so endpoint ownership
// matches module ownership and this file never becomes the directory every team
// has to edit.
// =============================================================================

import { createApi, fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react';

import { config } from '@core/config/config';

const baseQuery = fetchBaseQuery({
  baseUrl: config.apiBaseUrl,
  prepareHeaders: (headers) => {
    // Simulated session. A real deployment reads this from wherever the session
    // lives; a real one would also refresh it here behind a mutex, so that N
    // concurrent 401s trigger exactly one refresh. The mock backend has no
    // refresh flow to build that against, so the seam is left honest and empty.
    headers.set('authorization', 'Bearer simulated-session-token');
    return headers;
  },
});

export const api = createApi({
  reducerPath: 'api',

  // Retries are a query affordance. A non-idempotent mutation must opt out with
  // `extraOptions: { maxRetries: 0 }` on its endpoint — retrying "submit for
  // distribution" would submit twice.
  baseQuery: retry(baseQuery, { maxRetries: 2 }),

  // ===========================================================================
  // The cache-tag registry — one block per module, appended as modules land.
  // ===========================================================================
  // This is the shared file the doctrine admits to (Chapter 4 §6): tags must be
  // declared centrally, so adding one is a visible, reviewable edit here rather
  // than a string invented inside a feature folder.
  //
  //   // activity
  //   'ActivityFeed',
  //
  //   // catalog
  //   'Release', 'ReleaseList', 'DistributionBoard',
  //
  // Empty on purpose: no module exists yet, and an unused tag is a lie about
  // what the app caches.
  tagTypes: [],

  endpoints: () => ({}),
});
