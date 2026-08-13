import { Artwork, Badge, Sparkline, StatusBadge, TableCell, TableRow } from '@shared/ui';

import { COLUMNS } from './columns';
import type { CatalogRow } from './useCatalog';

// Props in, JSX out — no hook, because there is nothing to orchestrate (R2).
export function ReleaseRow({ release }: { release: CatalogRow }) {
  return (
    <TableRow
      onClick={release.onOpen}
      className={`${COLUMNS} h-13 cursor-pointer items-center border-panel px-4 hover:bg-raised/60`}
    >
      <TableCell className="p-0">
        <Artwork artwork={release.artwork} className="size-8" />
      </TableCell>

      <TableCell className="flex min-w-0 flex-col gap-0.5 p-0 pr-4">
        <span className="truncate font-medium">{release.title}</span>
        <span className="font-mono text-2xs text-idle">{release.catalogNumber}</span>
      </TableCell>

      <TableCell className="truncate p-0 pr-3 text-sm text-subtle">{release.artistName}</TableCell>

      <TableCell className="p-0">
        <Badge variant="outline" className="rounded-sm bg-raised text-xs text-subtle">
          {release.type}
        </Badge>
      </TableCell>

      <TableCell className="p-0">
        <StatusBadge tone={release.stage.tone} busy={release.stage.busy}>
          {release.stage.label}
        </StatusBadge>
      </TableCell>

      <TableCell className="p-0 font-mono text-xs text-subtle">{release.releaseDate}</TableCell>

      <TableCell className="flex items-center justify-end gap-3 p-0">
        <Sparkline points={release.streamsTrend} className="text-brand" />
        <span className="w-15 text-right font-mono text-sm">{release.streamsLabel}</span>
      </TableCell>
    </TableRow>
  );
}
