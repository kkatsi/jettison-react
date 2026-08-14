// One confirmation flow for three screens. Promoted here when the second one
// needed it (Ch. 2 §6).

import { useState } from 'react';

import { toast } from '@shared/ui';

import { useWithdrawReleaseMutation } from '../api/endpoints';
import { TOAST, WITHDRAWAL } from '../constants';
import { withdrawalAction, type PipelineStage } from '../services/release-status';

/** The least a caller has to know about the release it is taking back. */
export type WithdrawTarget = { id: string; title: string; stage: PipelineStage };

export type WithdrawModel = {
  /** null when this release cannot be taken back at all — a draft never left. */
  actionFor: (
    target: WithdrawTarget,
  ) => { label: string; short: string; isDestructive: boolean } | null;
  request: (target: WithdrawTarget) => void;
  isPending: boolean;
  /** The whole dialog, decided here so no view holds flow state (R3). */
  dialog: {
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    onCancel: () => void;
    onConfirm: () => void;
  };
};

export function useWithdrawRelease(): WithdrawModel {
  const [withdrawRelease, { isLoading }] = useWithdrawReleaseMutation();
  const [target, setTarget] = useState<WithdrawTarget | null>(null);

  const kind = target ? withdrawalAction(target.stage) : null;
  const copy = WITHDRAWAL[kind ?? 'withdraw'];

  return {
    actionFor: (candidate) => {
      const action = withdrawalAction(candidate.stage);
      if (!action) return null;

      return {
        label: WITHDRAWAL[action].action,
        short: WITHDRAWAL[action].short,
        isDestructive: action === 'withdraw',
      };
    },

    request: (candidate) => {
      if (withdrawalAction(candidate.stage)) setTarget(candidate);
    },

    isPending: isLoading,

    dialog: {
      isOpen: target !== null,
      title: copy.title.replace('{title}', target?.title ?? ''),
      description: copy.description,
      confirmLabel: copy.confirm,
      onCancel: () => setTarget(null),
      onConfirm: () => {
        if (!target) return;
        // The mutation owns everything that follows — its own cache patches, the
        // domain event, the delayed reconcile (Ch. 4 §4). Nothing to remember here.
        void withdrawRelease(target.id)
          .unwrap()
          .then(() => {
            const copy = TOAST[kind === 'cancel' ? 'cancelled' : 'withdrawn'](target.title);
            toast.success(copy.title, { description: copy.description });
          })
          .catch(() => toast.error(WITHDRAWAL[kind ?? 'withdraw'].failed));

        setTarget(null);
      },
    },
  };
}
