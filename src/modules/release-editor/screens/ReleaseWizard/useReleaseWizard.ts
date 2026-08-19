// The wizard frame's one hook (R2). The steps read the same cache entry, so
// nothing is passed down and no context has to exist.

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router';

import { toast, type Tone } from '@shared/ui';

import { useDiscardDraftMutation } from '../../api/endpoints';
import type { ReleaseDraft } from '../../api/types';
import { CONTINUE, DISCARD, SAVE, TOAST, UNAVAILABLE, type StepSlug } from '../../constants';
import { useDraft } from '../../hooks/useDraft';
import { useDraftSave } from '../../hooks/useDraftSave';
import { useSubmitRelease, type SubmitModel } from '../../hooks/useSubmitRelease';
import { draftClosed, draftOpened, selectSaveStatus } from '../../state/draft-slice';
import { adjacentSteps, isStepSlug, railSteps, stepCounter, type StepStatus } from './wizard-steps';

export type RailEntry = {
  slug: StepSlug;
  label: string;
  hint: string;
  number: string;
  status: StepStatus;
  isLast: boolean;
  onSelect: () => void;
};

/** The panel under the rail says something different on every step. */
export type RailFooter =
  | { kind: 'note'; text: string }
  | { kind: 'progress'; label: string; value: string; percent: number }
  | { kind: 'issues'; label: string; count: string; note: string; tone: Tone };

export type WizardModel = {
  isLoading: boolean;
  /** Gone, or already with the stores — either way there is nothing to edit. */
  unavailable: { title: string; description: string; action: string; onSelect: () => void } | null;
  header: {
    title: string;
    catalogNumber: string;
    save: { label: string; tone: Tone; at: string | null; onRetry: (() => void) | null };
    onDiscard: () => void;
  };
  rail: { steps: RailEntry[]; footer: RailFooter; flagged: StepSlug[] };
  footer: {
    counter: string;
    onBack: (() => void) | null;
    next: { label: string; onSelect: () => void } | null;
    /** Only on the last step, where the button stops being "next". */
    submit: SubmitModel['submit'] | null;
  };
  discard: {
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    onCancel: () => void;
    onConfirm: () => void;
  };
};

export function useReleaseWizard(): WizardModel {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { id, draft, isLoading, isError } = useDraft();
  const saved = useSelector(selectSaveStatus);
  const { retry } = useDraftSave(id);
  // The rail flags problems from every step, not only the one that lists them.
  const submission = useSubmitRelease();
  const [discardDraft] = useDiscardDraftMutation();
  const [isDiscarding, setIsDiscarding] = useState(false);

  // A release the wizard has not seen before starts with nothing pending; the same
  // one reopened on another step keeps what was typed on the last.
  useEffect(() => {
    dispatch(draftOpened(id));
  }, [dispatch, id]);

  const current = currentStep(pathname);
  const { previous, next } = adjacentSteps(current);
  const indicator = SAVE[saved.state];

  const goTo = (slug: StepSlug) => () => void navigate(`/releases/${id}/edit/${slug}`);
  // `status` is never in a patch, so the merged draft answers this as the server would.
  const isDraft = draft === null || draft.status === 'draft';

  return {
    isLoading,
    unavailable:
      isError || !isDraft ? { ...UNAVAILABLE, onSelect: () => void navigate('/catalog') } : null,
    header: {
      title: draft?.title || 'New release',
      catalogNumber: draft?.catalogNumber ?? '',
      save: {
        label: indicator.label,
        tone: indicator.tone,
        at: saved.at,
        onRetry: indicator.retry ? retry : null,
      },
      onDiscard: () => setIsDiscarding(true),
    },
    rail: {
      steps: railSteps(current).map((step) => ({ ...step, onSelect: goTo(step.slug) })),
      footer: railFooter(current, draft, submission),
      flagged: submission.flaggedSteps,
    },
    footer: {
      counter: stepCounter(current),
      onBack: previous ? goTo(previous) : null,
      next: next ? { label: CONTINUE[next], onSelect: goTo(next) } : null,
      submit: next === null ? submission.submit : null,
    },
    discard: {
      isOpen: isDiscarding,
      title: DISCARD.title.replace('{title}', draft?.title || 'this draft'),
      description: DISCARD.description,
      confirmLabel: DISCARD.confirm,
      onCancel: () => setIsDiscarding(false),
      onConfirm: () => {
        setIsDiscarding(false);
        dispatch(draftClosed());
        void discardDraft(id);

        // A row missing from a table of thirty is not something anyone can see.
        const copy = TOAST.discarded(draft?.catalogNumber ?? '');
        toast.success(copy.title, { description: copy.description });

        void navigate('/catalog');
      },
    },
  };
}

/** The URL is the wizard's state: the last segment is the step. */
function currentStep(pathname: string): StepSlug {
  const last = pathname.split('/').pop() ?? '';
  return isStepSlug(last) ? last : 'details';
}

function railFooter(
  current: StepSlug,
  draft: ReleaseDraft | null,
  submission: SubmitModel,
): RailFooter {
  if (current === 'review') {
    return {
      kind: 'issues',
      label: 'Blocking issues',
      count: submission.headline.count,
      note: submission.headline.note,
      tone: submission.headline.tone,
    };
  }

  if (current !== 'tracks') return { kind: 'note', text: RAIL_NOTE[current] };

  const total = draft?.tracks.length ?? 0;
  const ready = draft?.tracks.filter((track) => track.audioStatus === 'ready').length ?? 0;

  return {
    kind: 'progress',
    label: 'Audio processed',
    value: `${ready}/${total}`,
    percent: total === 0 ? 0 : Math.round((ready / total) * 100),
  };
}

const RAIL_NOTE = {
  details: 'Everything is saved as you type. You can leave and return to this draft from Catalog.',
  tracks: '',
  artwork: 'Artwork is checked against store requirements as soon as it is uploaded.',
  review: 'Submission stays locked until every blocking issue is cleared.',
} satisfies Record<StepSlug, string>;
