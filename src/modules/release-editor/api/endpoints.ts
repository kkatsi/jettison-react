// The endpoints this module owns (Ch. 4 §1). Catalog reads the same release
// through its own; the shared tag is what keeps both cache entries agreeing.

import { invalidateTagsAfterDelay } from '@core/api/cache-utils';
import { releaseSubmitted } from '@shared/events';

import { api } from '@core/api/api';

import { SESSION_ACTOR } from '../constants';
import { toDraft, toSubmission } from './transformations';
import type { ArtistDto, DraftPatch, ReleaseDraft, ReleaseDraftDto } from './types';

const draftTag = (id: string) => [{ type: 'ReleaseDetail' as const, id }];

export const releaseEditorApi = api.injectEndpoints({
  endpoints: (build) => ({
    draft: build.query<ReleaseDraft, string>({
      query: (id) => `/releases/${id}`,
      transformResponse: toDraft,
      providesTags: (_result, _error, id) => draftTag(id),
    }),

    artists: build.query<ArtistDto[], void>({
      query: () => '/artists',
      providesTags: ['Artists'],
    }),

    /** Asking again while the last one is still blank returns that same release. */
    startRelease: build.mutation<ReleaseDraft, void>({
      query: () => ({ url: '/releases', method: 'POST' }),
      transformResponse: (dto: ReleaseDraftDto) => toDraft(dto),
      // The backend deduplicates; a retry would just cost a round trip.
      extraOptions: { maxRetries: 0 },

      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data: draft } = await queryFulfilled;

        // The wizard is about to route here; seeding the cache saves a spinner.
        dispatch(releaseEditorApi.util.upsertQueryData('draft', draft.id, draft));

        // The list model has not projected it yet (ADR-002).
        invalidateTagsAfterDelay(dispatch, ['Releases']);
      },
    }),

    // The three saves below are Class A alike: the response is the patch.
    saveDraft: build.mutation<ReleaseDraft, { id: string; patch: DraftPatch }>({
      query: ({ id, patch }) => ({ url: `/releases/${id}`, method: 'PATCH', body: patch }),
      transformResponse: (dto: ReleaseDraftDto) => toDraft(dto),

      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        const { data: saved } = await queryFulfilled;
        dispatch(releaseEditorApi.util.updateQueryData('draft', id, () => saved));
      },
    }),

    addTrack: build.mutation<ReleaseDraft, { id: string; file: { name: string; size: number } }>({
      query: ({ id, file }) => ({ url: `/releases/${id}/tracks`, method: 'POST', body: file }),
      transformResponse: (dto: ReleaseDraftDto) => toDraft(dto),
      // The same file twice is two tracks, so a retry is not a repeat of the ask.
      extraOptions: { maxRetries: 0 },

      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        const { data: saved } = await queryFulfilled;
        dispatch(releaseEditorApi.util.updateQueryData('draft', id, () => saved));
      },
    }),

    /** Retitling, reordering and removing are one write: the tracklist is a list. */
    saveTracks: build.mutation<
      ReleaseDraft,
      { id: string; tracks: { id: string; title: string }[] }
    >({
      query: ({ id, tracks }) => ({ url: `/releases/${id}/tracks`, method: 'PUT', body: tracks }),
      transformResponse: (dto: ReleaseDraftDto) => toDraft(dto),

      // Optimistic on purpose: a dragged track that snapped back reads as a failed drag.
      async onQueryStarted({ id, tracks }, { dispatch, queryFulfilled }) {
        const optimistic = dispatch(
          releaseEditorApi.util.updateQueryData('draft', id, (draft) => {
            draft.tracks = tracks.flatMap((entry, index) => {
              const track = draft.tracks.find((candidate) => candidate.id === entry.id);
              return track ? [{ ...track, title: entry.title, number: index + 1 }] : [];
            });
          }),
        );

        try {
          const { data: saved } = await queryFulfilled;
          dispatch(releaseEditorApi.util.updateQueryData('draft', id, () => saved));
        } catch {
          optimistic.undo();
        }
      },
    }),

    discardDraft: build.mutation<void, string>({
      query: (id) => ({ url: `/releases/${id}`, method: 'DELETE' }),
      extraOptions: { maxRetries: 0 },

      async onQueryStarted(_id, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        // The catalogue has to stop showing it, once the list model catches up (ADR-002).
        invalidateTagsAfterDelay(dispatch, ['Releases']);
      },
    }),

    /** The mutation owns everything that follows it (Ch. 4 §4). */
    submitRelease: build.mutation<ReleaseDraft, ReleaseDraft>({
      query: (draft) => ({ url: `/releases/${draft.id}/submit`, method: 'POST' }),
      transformResponse: (dto: ReleaseDraftDto) => toDraft(dto),
      // Submitting twice delivers twice, and a retry cannot know which happened.
      extraOptions: { maxRetries: 0 },

      async onQueryStarted(draft, { dispatch, queryFulfilled }) {
        const { data: submitted } = await queryFulfilled;

        // Class A: the write model already agrees, so this is not optimism.
        dispatch(releaseEditorApi.util.updateQueryData('draft', draft.id, () => submitted));

        // Class C: somebody else's screens are none of this module's business —
        // they hear the fact and decide (Ch. 4 §5).
        dispatch(releaseSubmitted({ actor: SESSION_ACTOR, release: toSubmission(submitted) }));

        // Nothing Class B: each listener above schedules its own reconcile.
      },
    }),
  }),
});

export const {
  useDraftQuery,
  useArtistsQuery,
  useStartReleaseMutation,
  useSaveDraftMutation,
  useDiscardDraftMutation,
  useAddTrackMutation,
  useSaveTracksMutation,
  useSubmitReleaseMutation,
} = releaseEditorApi;
