// The endpoints this module owns, registered with the one client in core
// (Ch. 4 §1). Catalog reads the same release through its own endpoint; the shared
// tag is what keeps the two cache entries agreeing.

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

    /**
     * The catalogue number is the label's to allocate, so the wizard asks for
     * one rather than inventing it — and asking again while the last one is
     * still blank returns that same release instead of a second number.
     */
    startRelease: build.mutation<ReleaseDraft, void>({
      query: () => ({ url: '/releases', method: 'POST' }),
      transformResponse: (dto: ReleaseDraftDto) => toDraft(dto),
      // The backend deduplicates, but a retry would still cost a round trip on a
      // request whose whole job is to be cheap.
      extraOptions: { maxRetries: 0 },

      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data: draft } = await queryFulfilled;

        // The wizard is about to route to this release; seeding its own cache is
        // the difference between a screen and a spinner.
        dispatch(releaseEditorApi.util.upsertQueryData('draft', draft.id, draft));

        // A draft belongs in the catalogue, but the list model has not projected
        // it yet — the same window every write in this app lives with (ADR-002).
        // Harmless when the backend handed back one the list already has.
        invalidateTagsAfterDelay(dispatch, ['Releases']);
      },
    }),

    // The three saves below are Class A alike: the write answers with the whole
    // release, so the response *is* the patch — earlier than a refetch, and never
    // a guess.
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

      // The only optimistic write in the app, and it earns it: a dragged track that
      // snapped back for the length of a round trip would read as a failed drag.
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
        // The catalogue has to stop showing it, and the list model needs the same
        // couple of seconds it needs for every other write (ADR-002).
        invalidateTagsAfterDelay(dispatch, ['Releases']);
      },
    }),

    /** The mutation owns everything that follows it (Ch. 4 §4). */
    submitRelease: build.mutation<ReleaseDraft, ReleaseDraft>({
      query: (draft) => ({ url: `/releases/${draft.id}/submit`, method: 'POST' }),
      transformResponse: (dto: ReleaseDraftDto) => toDraft(dto),
      // Submitting twice would deliver twice, and a retry cannot know which
      // happened.
      extraOptions: { maxRetries: 0 },

      async onQueryStarted(draft, { dispatch, queryFulfilled }) {
        const { data: submitted } = await queryFulfilled;

        // Class A: the write model already agrees, so this is not optimism.
        dispatch(releaseEditorApi.util.updateQueryData('draft', draft.id, () => submitted));

        // Class C: catalog has to show a release its list endpoint will not return
        // for another couple of seconds, and activity has to log the fact. Neither
        // is this module's business — they hear it and decide (Ch. 4 §5).
        dispatch(releaseSubmitted({ actor: SESSION_ACTOR, release: toSubmission(submitted) }));

        // Nothing Class B: every list that changed belongs to a module that
        // reacted above, and each one schedules its own reconcile.
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
