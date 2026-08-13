// The one API client. Auth, retries and error handling live here so they exist
// once. Endpoints don't — each module injects its own from api/endpoints.ts.

import { createApi, fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react';

import { config } from '@core/config/config';

const baseQuery = fetchBaseQuery({
  baseUrl: config.apiBaseUrl,
  prepareHeaders: (headers) => {
    // Simulated session. A real one would refresh here, behind a mutex — the mock
    // backend has no refresh flow to build that against.
    headers.set('authorization', 'Bearer simulated-session-token');
    return headers;
  },
});

export const api = createApi({
  reducerPath: 'api',

  // A mutation that isn't idempotent must opt out: extraOptions: { maxRetries: 0 }.
  baseQuery: retry(baseQuery, { maxRetries: 2 }),

  // The tag registry, one block per module. Modules inject endpoints but cannot
  // add tag types, so this list is the one shared file they append to — the cost
  // Chapter 4 §6 owns up to. An unused tag is a lie about what the app caches.
  tagTypes: [
    // activity
    'ActivityFeed',

    // catalog
    'Releases',
    'ReleaseDetail',
    'ReleaseActivity',
    'Stores',
  ],

  endpoints: () => ({}),
});
