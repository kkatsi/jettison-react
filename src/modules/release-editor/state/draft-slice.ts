// The module's own slice (Ch. 2 §8): what the user has typed but the server has
// not acknowledged yet. It is not a copy of the release — the query cache owns
// that — which is why it holds a patch and not a record.

import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { DraftPatch, ReleaseDraft } from '../api/types';

export type SaveState = 'idle' | 'saving' | 'saved' | 'failed';

export type DraftState = {
  /** Which release these edits belong to; a different one discards them. */
  releaseId: string | null;
  values: DraftPatch;
  saveState: SaveState;
  /** '14:32:08' — the indicator shows the clock the user saw, not an ISO string. */
  savedAt: string | null;
};

const initialState: DraftState = {
  releaseId: null,
  values: {},
  saveState: 'idle',
  savedAt: null,
};

export const draftSlice = createSlice({
  name: 'releaseDraft',
  initialState,
  reducers: {
    draftOpened: (state, { payload }: PayloadAction<string>) => {
      if (state.releaseId === payload) return;
      return { ...initialState, releaseId: payload };
    },

    /** Written when a step unmounts, so a step change never costs a keystroke. */
    draftEdited: (state, { payload }: PayloadAction<DraftPatch>) => {
      state.values = { ...state.values, ...payload };
    },

    draftSaving: (state) => {
      state.saveState = 'saving';
    },

    draftSaved: (state, { payload }: PayloadAction<string>) => {
      state.saveState = 'saved';
      state.savedAt = payload;
    },

    draftSaveFailed: (state) => {
      state.saveState = 'failed';
    },

    draftClosed: () => initialState,
  },
});

export const { draftOpened, draftEdited, draftSaving, draftSaved, draftSaveFailed, draftClosed } =
  draftSlice.actions;

/** What a selector here needs of the store — modules cannot import the app's RootState. */
export type WithDraft = { [draftSlice.reducerPath]: DraftState };

const selectSlice = (state: WithDraft) => state[draftSlice.reducerPath];

/** Edits belonging to another release are somebody else's — never merged into this one. */
export const selectPendingEdits = createSelector(
  [selectSlice, (_state: WithDraft, releaseId: string) => releaseId],
  (draft, releaseId): DraftPatch => (draft.releaseId === releaseId ? draft.values : {}),
);

export const selectSaveStatus = createSelector([selectSlice], (draft) => ({
  state: draft.saveState,
  at: draft.savedAt,
}));

/** `draft ?? server`, field by field — the whole point of keeping the slice. */
export function mergeEdits(release: ReleaseDraft, edits: DraftPatch): ReleaseDraft {
  return { ...release, ...edits };
}
