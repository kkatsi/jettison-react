import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@shared/ui';

import type { TrackRow } from '../../api/types';
import { DeltaLabel } from '../../components/DeltaLabel';

// Widths for <colgroup>, so the header lines up with the body it describes.
const COLUMNS = ['w-8', 'w-auto', 'w-26', 'w-19'];

export function TopTracksPanel({ tracks, rangeLabel }: { tracks: TrackRow[]; rangeLabel: string }) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex h-12 flex-none items-center border-b border-line px-4">
        <span className="font-semibold">Top tracks</span>
        <span className="ml-auto font-mono text-xs text-faint">{rangeLabel}</span>
      </div>

      <Table className="table-fixed">
        <colgroup>
          {COLUMNS.map((width, index) => (
            <col key={index} className={width} />
          ))}
        </colgroup>

        <TableHeader>
          <TableRow className="h-7.5 border-line hover:bg-transparent">
            <TableHead className="pl-4 text-xs font-medium text-idle">#</TableHead>
            <TableHead className="text-xs font-medium text-idle">Track</TableHead>
            <TableHead className="text-right text-xs font-medium text-idle">Streams</TableHead>
            <TableHead className="pr-4 text-right text-xs font-medium text-idle">Trend</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {tracks.map((track) => (
            <TableRow key={track.id} className="h-10.25 border-panel hover:bg-raised/60">
              <TableCell className="pl-4 font-mono text-xs text-faint">{track.rank}</TableCell>
              <TableCell className="truncate pr-3 text-sm">{track.title}</TableCell>
              <TableCell className="text-right font-mono text-sm">{track.streamsLabel}</TableCell>
              <TableCell className="pr-4 text-right">
                <DeltaLabel delta={track.delta} arrow className="text-xs" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
