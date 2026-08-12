// One query, so one file — `api/endpoints.ts` + `transformations.ts` + `types.ts`
// would be three files describing one GET (Chapter 2 §5). The feed arrives in the
// shape the screen wants, so there is nothing to transform.

import { api } from '@core/api/api';

import type { ActivityEvent } from '../types';

export const activityApi = api.injectEndpoints({
  endpoints: (build) => ({
    activityFeed: build.query<ActivityEvent[], void>({
      query: () => '/activity',
      providesTags: ['ActivityFeed'],
    }),
  }),
});

export const { useActivityFeedQuery } = activityApi;
