// The endpoints this module owns, registered with the one client in core
// (Ch. 4 §1). Transformation happens here, at the edge, so no screen below ever
// sees a DTO.

import { invalidateTagsAfterDelay, patchListItem } from '@core/api/cache-utils';
import { releaseWithdrawn } from '@shared/events';

import { api } from '@core/api/api';

import { SESSION_ACTOR } from '../constants';
import { toActivityEntry, toRelease, toReleaseDetail } from './transformations';
import type {
  ActivityEntry,
  ActivityEntryDto,
  Release,
  ReleaseDetail,
  ReleaseDto,
  StoreDto,
} from './types';

export const catalogApi = api.injectEndpoints({
  endpoints: (build) => ({
    // One list, two screens: the catalogue table and the distribution board are
    // views of the same releases, so they share a cache entry — and a patch that
    // lands for one lands for both.
    releases: build.query<Release[], void>({
      query: () => '/releases',
      transformResponse: (dtos: ReleaseDto[]) => dtos.map(toRelease),
      providesTags: ['Releases'],
    }),

    releaseDetail: build.query<ReleaseDetail, string>({
      query: (id) => `/releases/${id}`,
      transformResponse: toReleaseDetail,
      providesTags: (_result, _error, id) => [{ type: 'ReleaseDetail' as const, id }],
    }),

    // The five stores are label configuration: they change about once a year, so
    // the detail screen joins against them rather than the backend denormalising
    // a store name onto every delivery.
    stores: build.query<StoreDto[], void>({
      query: () => '/stores',
      providesTags: ['Stores'],
    }),

    // The same resource activity owns a feed of, defined again here rather than
    // imported from it (Ch. 4 §1). Its own tag: invalidating this panel must not
    // drag another module's feed into a refetch.
    releaseActivity: build.query<ActivityEntry[], string>({
      query: (releaseId) => `/activity?releaseId=${releaseId}`,
      transformResponse: (dtos: ActivityEntryDto[]) => dtos.map(toActivityEntry),
      providesTags: (_result, _error, releaseId) => [
        { type: 'ReleaseActivity' as const, id: releaseId },
      ],
    }),

    /**
     * Withdrawal, and everything that follows from it — declared here, where a
     * second call path cannot forget it (Ch. 4 §4). Class A: patch this module's
     * own detail and list. Class C: announce it, and let whoever cares react.
     */
    withdrawRelease: build.mutation<ReleaseDetail, string>({
      query: (id) => ({ url: `/releases/${id}/withdraw`, method: 'POST' }),
      transformResponse: toReleaseDetail,
      // Withdrawing twice is not the same as withdrawing once, and a retry after
      // a timeout cannot know which happened.
      extraOptions: { maxRetries: 0 },

      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const { data: withdrawn } = await queryFulfilled;

        // Own cache, patched from the response: the write model already agrees,
        // so this is not optimism, it is the answer arriving early.
        dispatch(catalogApi.util.updateQueryData('releaseDetail', id, () => withdrawn));
        dispatch(
          catalogApi.util.updateQueryData('releases', undefined, (releases) => {
            patchListItem(releases, id, {
              status: withdrawn.status,
              submittedAt: null,
              submittedLabel: withdrawn.submittedLabel,
              deliveries: withdrawn.deliveries,
            });
          }),
        );

        // Somebody else's screens are none of this module's business — they hear
        // the fact and decide for themselves (Ch. 4 §5).
        dispatch(
          releaseWithdrawn({
            actor: SESSION_ACTOR,
            release: {
              id: withdrawn.id,
              catalogNumber: withdrawn.catalogNumber,
              title: withdrawn.title,
              artwork: withdrawn.artwork,
            },
          }),
        );

        // Verify: by the time this fires the read models have caught up, so the
        // refetch confirms the patch instead of undoing it. The history panel
        // arrives with it — nobody is staring at it while the button is clicked.
        invalidateTagsAfterDelay(dispatch, ['Releases', { type: 'ReleaseActivity', id }]);
      },
    }),
  }),
});

export const {
  useReleasesQuery,
  useReleaseDetailQuery,
  useReleaseActivityQuery,
  useStoresQuery,
  useWithdrawReleaseMutation,
} = catalogApi;
