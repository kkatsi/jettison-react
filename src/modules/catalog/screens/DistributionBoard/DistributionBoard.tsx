import {
  Artwork,
  Button,
  Card,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  FilterSelect,
  ScreenFallback,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/ui';
import { cn } from '@shared/utils/cn';
import { Rocket } from 'lucide-react';

import { WithdrawDialog } from '../../components/WithdrawDialog';
import { ReleaseSchedule } from './ReleaseSchedule';
import { useDistributionBoard, type BoardRow } from './useDistributionBoard';

// Widths for <colgroup>: the browser's own column algorithm keeps the header and
// the body honest, which a grid template repeated in two places does not. The
// artwork rides in the Release cell — it names the release, it is not a column.
const COLUMNS = ['w-auto', 'w-37.5', 'w-37.5', 'w-33', 'w-33', 'w-28'];

// Everything the label has handed to the stores, and how far each one got.
export function DistributionBoard() {
  const {
    isLoading,
    failure,
    rows,
    isEmpty,
    isPipelineEmpty,
    countLabel,
    footerLabel,
    schedule,
    counts,
    filters,
    withdraw,
    onNewRelease,
  } = useDistributionBoard();

  if (isLoading) return <ScreenFallback />;

  if (isPipelineEmpty) {
    return (
      <div className="flex min-h-0 flex-1 flex-col p-6">
        <Card className="flex min-h-100 flex-1 flex-col justify-center">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Rocket />
              </EmptyMedia>
              <EmptyTitle className="text-xl">Nothing in the pipeline</EmptyTitle>
              <EmptyDescription>
                Submitted releases appear here on their way to the stores.
              </EmptyDescription>
            </EmptyHeader>
            <Button onClick={onNewRelease}>New release</Button>
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-6">
      <ReleaseSchedule axis={schedule.axis} pins={schedule.pins} />

      <div className="flex flex-none items-center gap-2">
        <FilterSelect
          label="Artist"
          options={filters.artists}
          value={filters.artist}
          onValueChange={filters.onArtist}
        />
        <FilterSelect
          label="Status"
          options={filters.stages}
          value={filters.stage}
          onValueChange={filters.onStage}
        />

        {filters.isActive ? (
          <Button variant="ghost" size="sm" className="h-7.5 text-idle" onClick={filters.onReset}>
            Reset
          </Button>
        ) : null}

        <div className="ml-auto flex items-center gap-3.5 font-mono text-xs text-faint">
          <span>
            <span className="text-warning">●</span> {counts.inFlight} in flight
          </span>
          <span>
            <span className="text-danger">●</span> {counts.blocked} blocked
          </span>
          <span>
            <span className="text-live">●</span> {counts.live} live
          </span>
        </div>
      </div>

      <Card className="min-h-60 flex-1 gap-0 overflow-hidden py-0">
        {/* The kit's own table wrapper is the scroll container — see Catalog.tsx. */}
        <div className="min-h-0 flex-1 *:data-[slot=table-container]:h-full *:data-[slot=table-container]:overflow-y-auto">
          <Table className="table-fixed">
            <colgroup>
              {COLUMNS.map((width, index) => (
                <col key={index} className={width} />
              ))}
            </colgroup>

            <TableHeader className="sticky top-0 z-10 bg-panel">
              <TableRow className="h-9 border-line hover:bg-transparent">
                <TableHead className="pl-4 text-xs font-medium text-idle">Release</TableHead>
                <TableHead className="text-xs font-medium text-idle">Artist</TableHead>
                <TableHead className="text-xs font-medium text-idle">Submitted</TableHead>
                <TableHead className="text-xs font-medium text-idle">Stores</TableHead>
                <TableHead className="text-xs font-medium text-idle">Status</TableHead>
                <TableHead className="pr-4 text-right text-xs font-medium text-idle">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((release) => (
                <PipelineRow key={release.id} release={release} />
              ))}
            </TableBody>
          </Table>

          {failure ? (
            <Notice>
              <span>The pipeline could not be loaded.</span>
              <Button variant="outline" size="sm" onClick={failure.retry}>
                Try again
              </Button>
            </Notice>
          ) : null}

          {isEmpty ? (
            <Notice>
              <span className="text-subtle">No submissions match these filters</span>
              <button type="button" className="text-sm text-brand" onClick={filters.onReset}>
                Clear filters
              </button>
            </Notice>
          ) : null}
        </div>

        <div className="flex h-10 flex-none items-center justify-between border-t border-line px-4 text-xs text-idle">
          <span className="font-mono">{footerLabel}</span>
          <span>{countLabel}</span>
        </div>
      </Card>

      <WithdrawDialog dialog={withdraw.dialog} />
    </div>
  );
}

function PipelineRow({ release }: { release: BoardRow }) {
  return (
    <TableRow
      onClick={release.onOpen}
      className="h-13 cursor-pointer border-panel hover:bg-raised/60"
    >
      <TableCell className="max-w-0 pr-6 pl-4">
        <div className="flex items-center gap-3">
          <Artwork artwork={release.artwork} className="size-8" />
          <div className="min-w-0">
            <div className="truncate font-medium">{release.title}</div>
            <div className="font-mono text-2xs text-idle">
              {release.catalogNumber} · {release.type}
            </div>
          </div>
        </div>
      </TableCell>

      <TableCell className="truncate pr-4 text-sm text-subtle">{release.artistName}</TableCell>

      <TableCell className="font-mono text-xs text-subtle">{release.submittedLabel}</TableCell>

      <TableCell>
        <div className="flex items-center gap-2">
          <span className="flex gap-0.5">
            {release.segments.map((segment) => (
              <span
                key={segment.storeId}
                className={cn(
                  'h-1 w-2 rounded-xs',
                  segment.rejected ? 'bg-danger' : segment.done ? 'bg-live' : 'bg-line-strong',
                )}
              />
            ))}
          </span>
          <span className="font-mono text-xs text-subtle">{release.storeLabel}</span>
        </div>
      </TableCell>

      <TableCell>
        <StatusBadge tone={release.stage.tone} busy={release.stage.busy}>
          {release.stage.label}
        </StatusBadge>
      </TableCell>

      <TableCell className="pr-4 text-right">
        {release.action ? (
          <button
            type="button"
            onClick={(event) => {
              // The row opens the release; this does not.
              event.stopPropagation();
              release.action?.onSelect();
            }}
            className="text-sm text-idle hover:text-danger"
          >
            {release.action.label}
          </button>
        ) : null}
      </TableCell>
    </TableRow>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-50 flex-col items-center justify-center gap-2 font-mono text-xs text-dim">
      {children}
    </div>
  );
}
