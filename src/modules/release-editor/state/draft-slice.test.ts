import type { UnknownAction } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';

import { EMPTY_CREDITS } from '../constants';
import type { ReleaseDraft } from '../api/types';
import {
  draftClosed,
  draftEdited,
  draftOpened,
  draftSaved,
  draftSaving,
  draftSlice,
  mergeEdits,
  selectPendingEdits,
  selectSaveStatus,
} from './draft-slice';

const stateWith = (actions: UnknownAction[]) => ({
  [draftSlice.reducerPath]: actions.reduce(draftSlice.reducer, draftSlice.getInitialState()),
});

describe('the draft slice', () => {
  it('accumulates edits for the release it was opened on', () => {
    const state = stateWith([
      draftOpened('lor-0074'),
      draftEdited({ title: 'Signal Fade' }),
      draftEdited({ type: 'EP' }),
    ]);

    expect(selectPendingEdits(state, 'lor-0074')).toEqual({ title: 'Signal Fade', type: 'EP' });
  });

  it('does not hand one release the edits made to another', () => {
    const state = stateWith([draftOpened('lor-0074'), draftEdited({ title: 'Signal Fade' })]);

    expect(selectPendingEdits(state, 'lor-0042')).toEqual({});
  });

  it('starts clean when a different release is opened', () => {
    const state = stateWith([
      draftOpened('lor-0074'),
      draftEdited({ title: 'Signal Fade' }),
      draftOpened('lor-0075'),
    ]);

    expect(selectPendingEdits(state, 'lor-0075')).toEqual({});
  });

  it('keeps the edits when the same release is opened again — a step change is not a new draft', () => {
    const state = stateWith([
      draftOpened('lor-0074'),
      draftEdited({ title: 'Signal Fade' }),
      draftOpened('lor-0074'),
    ]);

    expect(selectPendingEdits(state, 'lor-0074')).toEqual({ title: 'Signal Fade' });
  });

  it('reports what the save indicator shows', () => {
    expect(selectSaveStatus(stateWith([draftSaving()]))).toEqual({ state: 'saving', at: null });
    expect(selectSaveStatus(stateWith([draftSaved('14:32:08')]))).toEqual({
      state: 'saved',
      at: '14:32:08',
    });
  });

  it('forgets everything when the wizard closes', () => {
    const state = stateWith([draftOpened('lor-0074'), draftEdited({ title: 'x' }), draftClosed()]);

    expect(selectPendingEdits(state, 'lor-0074')).toEqual({});
  });
});

describe('mergeEdits', () => {
  const release: ReleaseDraft = {
    id: 'lor-0074',
    catalogNumber: 'LOR-0074',
    title: '',
    artistId: '',
    artistName: '',
    type: 'Single',
    status: 'draft',
    releaseDate: '2026-09-18',
    submittedAt: null,
    genre: '',
    credits: EMPTY_CREDITS,
    artwork: { from: '#2A3040', to: '#12161F' },
    artworkFile: null,
    tracks: [],
    storeIds: ['soundry'],
  };

  it('lets a typed value win over the saved one', () => {
    expect(mergeEdits(release, { title: 'Signal Fade' }).title).toBe('Signal Fade');
  });

  it('leaves everything nobody has touched alone', () => {
    const merged = mergeEdits(release, { title: 'Signal Fade' });

    expect(merged.catalogNumber).toBe('LOR-0074');
    expect(merged.tracks).toBe(release.tracks);
  });
});
