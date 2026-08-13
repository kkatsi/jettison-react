// One save path for the whole wizard: the steps debounce into it, the header's
// retry calls it again with what the slice still holds.

import { useDispatch, useSelector } from 'react-redux';

import { useSaveDraftMutation } from '../api/endpoints';
import type { DraftPatch } from '../api/types';
import {
  draftEdited,
  draftSaveFailed,
  draftSaved,
  draftSaving,
  selectPendingEdits,
  type WithDraft,
} from '../state/draft-slice';

export type DraftSave = {
  save: (patch: DraftPatch) => Promise<void>;
  /** Sends the same patch again — it is still in the slice, which is why it is there. */
  retry: () => void;
};

export function useDraftSave(releaseId: string): DraftSave {
  const dispatch = useDispatch();
  const [saveDraft] = useSaveDraftMutation();
  const pending = useSelector((state: WithDraft) => selectPendingEdits(state, releaseId));

  const save = async (patch: DraftPatch) => {
    // Recorded before the request, so a failed save leaves something to retry and
    // a step change never outruns the network.
    dispatch(draftEdited(patch));
    dispatch(draftSaving());

    try {
      await saveDraft({ id: releaseId, patch }).unwrap();
      dispatch(draftSaved(new Date().toLocaleTimeString('en-GB')));
    } catch {
      dispatch(draftSaveFailed());
    }
  };

  return { save, retry: () => void save(pending) };
}
