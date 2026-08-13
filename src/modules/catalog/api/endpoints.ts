// The endpoints this module owns, registered with the one client in core
// (Ch. 4 §1). Transformation happens here, at the edge, so no screen below ever
// sees a DTO.

import { api } from '@core/api/api';

import { toRelease, toReleaseDetail } from './transformations';
import type { Release, ReleaseDetail, ReleaseDto, StoreDto } from './types';

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
  }),
});

export const { useReleasesQuery, useReleaseDetailQuery, useStoresQuery } = catalogApi;
