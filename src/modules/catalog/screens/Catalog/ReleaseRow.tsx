import { Artwork, Badge, Sparkline, StatusBadge, TableCell, TableRow } from '@shared/ui';

import type { CatalogRow } from './useCatalog';

// Props in, JSX out — no hook, because there is nothing to orchestrate (R2).
export function ReleaseRow({ release }: { release: CatalogRow }) {
  return (
    <TableRow
      onClick={release.onOpen}
      className="h-13 cursor-pointer border-panel hover:bg-raised/60"
    >
      <TableCell className="pl-4">
        <Artwork artwork={release.artwork} className="size-8" />
      </TableCell>

      {/* max-w-0 lets the auto column truncate instead of pushing the table wide. */}
      <TableCell className="max-w-0 pr-6">
        <div className="truncate font-medium">{release.title}</div>
        <div className="font-mono text-2xs text-idle">{release.catalogNumber}</div>
      </TableCell>

      <TableCell className="truncate pr-4 text-sm text-subtle">{release.artistName}</TableCell>

      <TableCell>
        <Badge variant="outline" className="rounded-sm bg-raised text-xs text-subtle">
          {release.type}
        </Badge>
      </TableCell>

      <TableCell>
        <StatusBadge tone={release.stage.tone} busy={release.stage.busy}>
          {release.stage.label}
        </StatusBadge>
      </TableCell>

      <TableCell className="font-mono text-xs text-subtle">{release.releaseDate}</TableCell>

      <TableCell className="pr-4">
        <div className="flex items-center justify-end gap-3">
          <Sparkline points={release.streamsTrend} className="text-brand" />
          <span className="w-15 text-right font-mono text-sm">{release.streamsLabel}</span>
        </div>
      </TableCell>
    </TableRow>
  );
}
