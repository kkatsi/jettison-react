// The screen's one hook (R2). Three queries and a mutation in, one view-model
// out (R3) — including the confirm dialog's whole state, so the view holds none.

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import type { Tone } from '@shared/ui';

import {
  useReleaseActivityQuery,
  useReleaseDetailQuery,
  useStoresQuery,
  useWithdrawReleaseMutation,
} from '../../api/endpoints';
import { toStoreDeliveries } from '../../api/transformations';
import type { ActivityEntry, ReleaseDetail, StoreDelivery, Track } from '../../api/types';
import { AUDIO, DELIVERY, STAGE } from '../../constants';
import { canWithdraw, deliveryProgress, pipelineStage } from '../../services/release-status';

export type TrackRow = Track & { audio: { label: string; tone: Tone; busy: boolean } };

/** The code is replaced by what it means: the view renders words, not statuses (R6). */
export type StoreRow = Omit<StoreDelivery, 'status'> & {
  status: { label: string; tone: Tone };
};

export type ReleaseDetailModel = {
  isLoading: boolean;
  /** The release does not exist, or the console could not reach the backend. */
  failure: { message: string; retry: () => void } | null;
  release: ReleaseDetail | null;
  stage: { label: string; tone: Tone; busy: boolean };
  facts: { label: string; value: string }[];
  tracks: TrackRow[];
  trackSummary: string;
  stores: StoreRow[];
  storeSummary: string;
  activity: ActivityEntry[];
  withdraw: {
    /** Absent entirely when withdrawal is not on the table for this release. */
    isAvailable: boolean;
    isPending: boolean;
    confirm: { isOpen: boolean; open: () => void; cancel: () => void; submit: () => void };
  };
  onBack: () => void;
};

export function useReleaseDetail(): ReleaseDetailModel {
  const { id = '' } = useParams();
  const navigate = useNavigate();

  const { data: release, isLoading, isError, refetch } = useReleaseDetailQuery(id);
  const { data: stores } = useStoresQuery();
  const { data: activity } = useReleaseActivityQuery(id);
  const [withdrawRelease, { isLoading: isWithdrawing }] = useWithdrawReleaseMutation();

  // Whether a dialog is open is local flow state, and it belongs to the one hook
  // that orchestrates the flow (Ch. 4 §2).
  const [isConfirming, setIsConfirming] = useState(false);

  const stage = release ? pipelineStage(release) : 'draft';
  const progress = release ? deliveryProgress(release.deliveries) : null;
  const storeRows = release ? toStoreDeliveries(release.deliveries, stores ?? []) : [];

  return {
    isLoading,
    failure: isError
      ? { message: 'This release could not be loaded.', retry: () => void refetch() }
      : null,
    release: release ?? null,
    stage: STAGE[stage],
    facts: release
      ? [
          { label: 'Released', value: release.releaseDate },
          { label: 'Submitted', value: release.submittedLabel },
          { label: 'Tracks', value: String(release.tracks.length) },
          { label: 'Streams · 30d', value: release.streamsLabel },
        ]
      : [],
    tracks: (release?.tracks ?? []).map((track) => ({
      ...track,
      audio: { ...AUDIO[track.audioStatus], busy: track.audioStatus !== 'ready' },
    })),
    trackSummary: summariseTracks(release),
    stores: storeRows.map((store) => ({ ...store, status: DELIVERY[store.status] })),
    storeSummary: progress ? `${progress.delivered}/${progress.total} delivered` : '',
    activity: activity ?? [],
    withdraw: {
      isAvailable: canWithdraw(stage),
      isPending: isWithdrawing,
      confirm: {
        isOpen: isConfirming,
        open: () => setIsConfirming(true),
        cancel: () => setIsConfirming(false),
        submit: () => {
          setIsConfirming(false);
          // The mutation owns everything that follows — the caller just awaits it
          // (Ch. 4 §4). Nothing to remember, so nothing to forget.
          void withdrawRelease(id);
        },
      },
    },
    onBack: () => void navigate('/catalog'),
  };
}

function summariseTracks(release: ReleaseDetail | undefined): string {
  if (!release) return '';

  const processing = release.tracks.filter((track) => track.audioStatus !== 'ready').length;
  const count = `${release.tracks.length} tracks`;

  return processing ? `${count} · ${processing} still processing` : `${count} · all audio ready`;
}
