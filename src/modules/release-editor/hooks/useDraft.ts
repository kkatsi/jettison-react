// The one door onto the draft: what the server acknowledged, plus what has been
// typed since. Every reader comes through here, so the merge is a mechanism and
// not a rule (Ch. 4 §3).

import { useSelector } from 'react-redux';
import { useParams } from 'react-router';

import { useDraftQuery } from '../api/endpoints';
import type { ReleaseDraft } from '../api/types';
import { mergeEdits, selectPendingEdits, type WithDraft } from '../state/draft-slice';

export type DraftModel = {
  id: string;
  /** null until the release is in the cache, and after it fails to arrive. */
  draft: ReleaseDraft | null;
  isLoading: boolean;
  isError: boolean;
};

export function useDraft(): DraftModel {
  const { id = '' } = useParams();
  const { data, isLoading, isError } = useDraftQuery(id);
  const edits = useSelector((state: WithDraft) => selectPendingEdits(state, id));

  return { id, draft: data ? mergeEdits(data, edits) : null, isLoading, isError };
}
