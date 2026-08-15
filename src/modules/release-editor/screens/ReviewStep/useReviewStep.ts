// Step 4's one hook (R2). The issues come from the shared submission hook; what
// this adds is the four panels that say what is about to be delivered.

import { useNavigate } from 'react-router';

import { totalDuration } from '../../api/transformations';
import { REVIEW, type StepSlug } from '../../constants';
import { useDraft } from '../../hooks/useDraft';
import { useSubmitRelease, type SubmitModel } from '../../hooks/useSubmitRelease';
import { readyCount } from '../../services/tracklist';

export type SummaryRow = { key: string; label: string; value: string; mono?: boolean };

export type SummaryPanel = {
  title: string;
  rows: SummaryRow[];
  onEdit: () => void;
};

export type ReviewModel = {
  catalogNumber: string;
  lede: string;
  issues: SubmitModel['issues'];
  allClear: boolean;
  headline: SubmitModel['headline'];
  clearLine: string;
  panels: SummaryPanel[];
  error: string | null;
};

const NONE = '—';

export function useReviewStep(): ReviewModel {
  const navigate = useNavigate();
  const { id, draft } = useDraft();
  const { issues, allClear, headline, error } = useSubmitRelease();

  const tracks = draft?.tracks ?? [];
  const goTo = (step: StepSlug) => () => void navigate(`/releases/${id}/edit/${step}`);

  return {
    catalogNumber: draft?.catalogNumber ?? '',
    lede: REVIEW.lede(draft?.storeIds.length ?? 0),
    issues,
    allClear,
    headline,
    clearLine: REVIEW.clear.line,
    error,

    panels: [
      {
        title: 'Details',
        onEdit: goTo('details'),
        rows: [
          { key: 'title', label: 'Title', value: draft?.title || NONE },
          { key: 'artist', label: 'Artist', value: draft?.artistName || NONE },
          { key: 'type', label: 'Type', value: draft?.type ?? NONE },
          { key: 'genre', label: 'Genre', value: draft?.genre || NONE },
          { key: 'date', label: 'Release date', value: draft?.releaseDate ?? NONE, mono: true },
        ],
      },
      {
        title: 'Tracks',
        onEdit: goTo('tracks'),
        rows: [
          { key: 'count', label: 'Count', value: String(tracks.length), mono: true },
          {
            key: 'running',
            label: 'Running time',
            // Only the finished files have a length worth quoting.
            value: allClear || readyCount(tracks) === tracks.length ? totalDuration(tracks) : NONE,
            mono: true,
          },
          {
            key: 'ready',
            label: 'Audio ready',
            value: `${readyCount(tracks)}/${tracks.length}`,
            mono: true,
          },
        ],
      },
      {
        title: 'Artwork',
        onEdit: goTo('artwork'),
        rows: [
          { key: 'file', label: 'File', value: draft?.artworkFile?.name ?? NONE, mono: true },
          {
            key: 'dimensions',
            label: 'Dimensions',
            value: draft?.artworkFile
              ? `${draft.artworkFile.width}×${draft.artworkFile.height}`
              : NONE,
            mono: true,
          },
        ],
      },
      {
        title: 'Credits & rights',
        onEdit: goTo('artwork'),
        rows: [
          { key: 'composer', label: 'Composer', value: draft?.credits.composer || NONE },
          { key: 'producer', label: 'Producer', value: draft?.credits.producer || NONE },
          { key: 'pline', label: '℗', value: draft?.credits.pLine || NONE, mono: true },
          { key: 'cline', label: '©', value: draft?.credits.cLine || NONE, mono: true },
        ],
      },
    ],
  };
}
