// The endpoints this module owns, registered with the one client in core (Ch. 4 §1).

import { api } from '@core/api/api';

import { findPlaylistSpike } from '../services/playlist-spike';
import { toAnalyticsReport } from './transformations';
import type { AnalyticsReport, AnalyticsReportDto, ScopeArtistDto, ScopeReleaseDto } from './types';

export const analyticsApi = api.injectEndpoints({
  endpoints: (build) => ({
    analyticsReport: build.query<AnalyticsReport, { scope: string; days: number }>({
      query: ({ scope, days }) => `/analytics?scope=${scope}&days=${days}`,
      // The spike is found here, at the edge, so the screen is handed a band to
      // draw rather than a series to reason about.
      transformResponse: (dto: AnalyticsReportDto) =>
        toAnalyticsReport(dto, findPlaylistSpike(dto.series)),
      providesTags: ['Analytics'],
    }),

    // Catalog owns an endpoint for this list too. Two five-line definitions under
    // the same tag, rather than a data module coupling the modules (Ch. 4 §1).
    scopeReleases: build.query<ScopeReleaseDto[], void>({
      query: () => '/releases',
      providesTags: ['Releases'],
    }),

    scopeArtists: build.query<ScopeArtistDto[], void>({
      query: () => '/artists',
      providesTags: ['Artists'],
    }),
  }),
});

export const { useAnalyticsReportQuery, useScopeReleasesQuery, useScopeArtistsQuery } =
  analyticsApi;
