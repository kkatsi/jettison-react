import { ChevronRight } from 'lucide-react';

import { Artwork, Badge, Button, Card, StatusBadge } from '@shared/ui';
import { cn } from '@shared/utils/cn';

import { WithdrawDialog } from '../../components/WithdrawDialog';

import { useReleaseDetail, type StoreRow, type TrackRow } from './useReleaseDetail';

const TRACK_COLUMNS = 'grid grid-cols-[34px_1fr_132px_72px_108px] items-center gap-3 px-4';

// One release, everything the label knows about it, and the one destructive
// thing it can do to it.
export function ReleaseDetail() {
  const {
    isLoading,
    failure,
    release,
    stage,
    facts,
    tracks,
    trackSummary,
    stores,
    storeSummary,
    activity,
    withdraw,
    onBack,
  } = useReleaseDetail();

  if (isLoading || !release) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center font-mono text-xs text-dim">
        {failure ? (
          <div className="flex flex-col items-center gap-2">
            <span>{failure.message}</span>
            <Button variant="outline" size="sm" onClick={failure.retry}>
              Try again
            </Button>
          </div>
        ) : (
          'Loading the release…'
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="flex h-11 flex-none items-center gap-2 border-b border-line px-6">
        <button type="button" onClick={onBack} className="text-sm text-idle hover:text-text">
          Catalog
        </button>
        <ChevronRight className="size-3 text-dim" />
        <span className="font-semibold">{release.title}</span>
        <span className="font-mono text-xs text-idle mt-1">{release.catalogNumber}</span>
      </div>

      <div className="flex flex-col gap-4 p-6">
        <Card className="flex-none flex-row items-start gap-5 p-5">
          <Artwork artwork={release.artwork} className="size-24" />

          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-semibold tracking-tight">{release.title}</h2>
              <Badge variant="outline" className="rounded-sm bg-raised text-xs text-subtle">
                {release.type}
              </Badge>
              <StatusBadge tone={stage.tone} busy={stage.busy}>
                {stage.label}
              </StatusBadge>
            </div>

            <div className="text-lg text-subtle">{release.artistName}</div>

            <dl className="mt-0.5 flex items-center gap-6">
              {facts.map((fact) => (
                <div key={fact.label} className="flex flex-col gap-0.75">
                  <dt className="text-xs text-faint">{fact.label}</dt>
                  <dd className="font-mono text-sm text-subtle">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {withdraw.button ? (
            <Button
              variant="outline"
              size="sm"
              disabled={withdraw.isPending}
              onClick={() => withdraw.request()}
              className="flex-none border-danger/30 text-danger hover:border-danger/50 hover:bg-danger/10 hover:text-danger"
            >
              {withdraw.button.label}
            </Button>
          ) : null}
        </Card>

        <div className="grid grid-cols-[1fr_460px] items-start gap-4">
          <Card className="gap-0 overflow-hidden py-0 self-stretch">
            <PanelHeader title="Tracklist" note={trackSummary} />
            <div
              className={cn(
                TRACK_COLUMNS,
                'h-8 border-b border-line text-xs font-medium text-idle',
              )}
            >
              <span>#</span>
              <span>Title</span>
              <span>ISRC</span>
              <span className="text-right">Length</span>
              <span className="text-right">Audio</span>
            </div>
            {tracks.map((track) => (
              <TrackLine key={track.id} track={track} />
            ))}
          </Card>

          <Card className="gap-0 overflow-hidden py-0 self-stretch">
            <PanelHeader title="Distribution status" note={storeSummary} />
            {stores.map((store) => (
              <StoreLine key={store.storeId} store={store} />
            ))}
          </Card>
        </div>

        <Card className="gap-0 overflow-hidden py-0">
          <PanelHeader title="Recent activity" note={`${activity.length} events`} />
          {activity.length === 0 ? (
            <div className="flex h-20 items-center justify-center font-mono text-xs text-dim">
              Nothing recorded for this release yet
            </div>
          ) : (
            activity.map((entry) => (
              <div
                key={entry.id}
                className="grid h-11 grid-cols-[150px_24px_1fr_190px] items-center gap-3 border-b border-panel px-4 last:border-0"
              >
                <span className="font-mono text-xs text-faint">{entry.at}</span>
                <span
                  className={cn('size-1.5 justify-self-center rounded-full', KIND_DOT[entry.kind])}
                />
                <span className="truncate text-sm text-subtle">{entry.summary}</span>
                <span className="truncate text-right text-sm text-faint">{entry.actor}</span>
              </div>
            ))
          )}
        </Card>
      </div>

      <WithdrawDialog dialog={withdraw.dialog} />
    </div>
  );
}

function PanelHeader({ title, note }: { title: string; note: string }) {
  return (
    <div className="flex h-11 items-center gap-2.5 border-b border-line px-4">
      <span className="font-semibold">{title}</span>
      <span className="font-mono text-xs text-idle">{note}</span>
    </div>
  );
}

function TrackLine({ track }: { track: TrackRow }) {
  return (
    <div className={cn(TRACK_COLUMNS, 'h-11.5 border-b border-panel last:border-0')}>
      <span className="font-mono text-xs text-faint">{track.number}</span>
      <span className="truncate pr-3">{track.title}</span>
      <span className="font-mono text-xs text-subtle">{track.isrc}</span>
      <span className="text-right font-mono text-xs text-subtle">{track.duration}</span>
      <span className="flex justify-end">
        <StatusBadge tone={track.audio.tone} busy={track.audio.busy}>
          {track.audio.label}
        </StatusBadge>
      </span>
    </div>
  );
}

function StoreLine({ store }: { store: StoreRow }) {
  return (
    <div className="flex h-13 items-center gap-3 border-b border-panel px-4 last:border-0">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span>{store.storeName}</span>
        <span className="font-mono text-2xs text-faint">{store.deliveredLabel}</span>
      </div>
      <StatusBadge tone={store.status.tone}>{store.status.label}</StatusBadge>
    </div>
  );
}

const KIND_DOT: Record<'submitted' | 'withdrawn' | 'processed', string> = {
  submitted: 'bg-brand',
  withdrawn: 'bg-danger',
  processed: 'bg-live',
};
