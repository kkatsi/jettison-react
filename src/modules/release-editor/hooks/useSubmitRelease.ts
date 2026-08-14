// Chapter 3's worked example, in one hook: the service returns codes, this maps
// them to copy and to the action that fixes each one, and the view renders the
// result. The mutation owns everything that happens after the click (Ch. 4 §4).

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router';

import { toast, type Tone } from '@shared/ui';

import { useDraftQuery, useSubmitReleaseMutation } from '../api/endpoints';
import { ISSUE, REVIEW, TOAST, type StepSlug } from '../constants';
import { releaseIssues, type IssueCode } from '../services/release-eligibility';
import { draftClosed, mergeEdits, selectPendingEdits, type WithDraft } from '../state/draft-slice';

export type IssueRow = {
  code: IssueCode;
  title: string;
  detail: string;
  action: string;
  onFix: () => void;
};

export type SubmitModel = {
  issues: IssueRow[];
  allClear: boolean;
  /** The panel header, and the same words under the rail. */
  headline: { title: string; count: string; note: string; tone: Tone };
  submit: {
    label: string;
    note: string;
    isDisabled: boolean;
    isPending: boolean;
    onSubmit: () => void;
  };
  /** Which steps the rail should flag, so problems are visible from any step. */
  flaggedSteps: StepSlug[];
  error: string | null;
};

export function useSubmitRelease(): SubmitModel {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { data: release } = useDraftQuery(id);
  const edits = useSelector((state: WithDraft) => selectPendingEdits(state, id));
  const [submitRelease, { isLoading }] = useSubmitReleaseMutation();
  const [hasFailed, setHasFailed] = useState(false);

  const draft = release ? mergeEdits(release, edits) : null;
  const today = new Date().toISOString().slice(0, 10);
  const issues = draft ? releaseIssues(draft, today) : [];
  const allClear = draft !== null && issues.length === 0;
  const stores = draft?.storeIds.length ?? 0;

  return {
    issues: issues.map((issue) => {
      const copy = ISSUE[issue.code];

      return {
        code: issue.code,
        title: copy.title(issue),
        detail: copy.detail(issue),
        action: copy.action,
        onFix: () => void navigate(`/releases/${id}/edit/${copy.step}`),
      };
    }),

    allClear,

    headline: allClear
      ? {
          title: REVIEW.clear.title,
          count: '0 open',
          note: REVIEW.clear.note(stores),
          tone: 'live',
        }
      : {
          title: REVIEW.blocked.title,
          count: REVIEW.blocked.count(issues.length),
          note: REVIEW.blocked.note,
          // Amber, not red: an unfinished release has not failed, and red is what
          // this console says when a store has rejected something.
          tone: 'warning',
        },

    submit: {
      label: isLoading ? REVIEW.submitting : REVIEW.submit,
      note: allClear ? '' : REVIEW.blocked.footer(issues.length),
      isDisabled: !allClear || isLoading,
      isPending: isLoading,

      onSubmit: () => {
        if (!draft || !allClear) return;
        setHasFailed(false);

        void submitRelease(draft)
          .unwrap()
          .then((submitted) => {
            // The draft is the stores' problem now; nothing local outlives it.
            dispatch(draftClosed());
            // The board is a table of twenty rows, and in naive mode the new one
            // is briefly not among them — so the confirmation travels with us.
            const copy = TOAST.submitted(submitted.title, submitted.storeIds.length);
            toast.success(copy.title, { description: copy.description });
            // Journey A ends where the release now lives (PLAN §8.1).
            return navigate('/distribution');
          })
          .catch(() => setHasFailed(true));
      },
    },

    flaggedSteps: [...new Set(issues.map((issue) => ISSUE[issue.code].step))],
    error: hasFailed ? REVIEW.failed : null,
  };
}
