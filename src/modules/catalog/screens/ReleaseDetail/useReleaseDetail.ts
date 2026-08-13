// The screen's one hook (R2). Three queries and a mutation in, one view-model
// out (R3) — including the confirm dialog's whole state, so the view holds none.

import { useNavigate, useParams } from 'react-router';

import type { Tone } from '@shared/ui';

import {
  useReleaseActivityQuery,
  useReleaseDetailQuery,
  useStoresQuery,
} from '../../api/endpoints';
import { toStoreDeliveries } from '../../api/transformations';
import type { ActivityEntry, ReleaseDetail, StoreDelivery, Track } from '../../api/types';
import { AUDIO, DELIVERY, STAGE } from '../../constants';
import { useWithdrawRelease, type WithdrawModel } from '../../hooks/useWithdrawRelease';
import { deliveryProgress, pipelineStage } from '../../services/release-status';

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
  /** One release on screen, so the flow needs no target passing through the view. */
  withdraw: Omit<WithdrawModel, 'actionFor' | 'request'> & {
    /** null when this release cannot be taken back — the button is not rendered. */
    button: { label: string } | null;
    request: () => void;
  };
  onBack: () => void;
};

export function useReleaseDetail(): ReleaseDetailModel {
  const { id = '' } = useParams();
  const navigate = useNavigate();

  const { data: release, isLoading, isError, refetch } = useReleaseDetailQuery(id);
  const { data: stores } = useStoresQuery();
  const { data: activity } = useReleaseActivityQuery(id);
  const withdraw = useWithdrawRelease();

  const stage = release ? pipelineStage(release) : 'draft';
  const takeBack = release
    ? withdraw.actionFor({ id: release.id, title: release.title, stage })
    : null;
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
      ...withdraw,
      button: takeBack ? { label: takeBack.label } : null,
      request: () => {
        if (release) withdraw.request({ id: release.id, title: release.title, stage });
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
