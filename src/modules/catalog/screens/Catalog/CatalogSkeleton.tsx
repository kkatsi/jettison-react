import { Skeleton, TableCell, TableRow } from '@shared/ui';

/**
 * The catalogue before its data arrives. Two rules it follows, and the reason it
 * is written by hand rather than derived from the real row:
 *
 * - it shows *structure*, not a grey copy of the last response — the widths come
 *   from CATALOG_COLUMNS, the height from the row, and nothing else pretends to
 *   know what is coming;
 * - it never appears on a refetch. Only the first load has nothing to show, and
 *   this console refetches on a timer after every mutation (Ch. 4 §5) — keying
 *   this off anything but `isLoading` would strobe the table every few seconds.
 */
export function ReleaseRowSkeleton({ index }: { index: number }) {
  // A little variety in the widths: a column of identical bars reads as a
  // rendering bug rather than as data on its way.
  const wide = index % 3 === 0;

  return (
    <TableRow className="h-13 border-panel hover:bg-transparent">
      <TableCell className="pl-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-sm" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className={wide ? 'h-3 w-52' : 'h-3 w-36'} />
            <Skeleton className="h-2 w-16" />
          </div>
        </div>
      </TableCell>

      <TableCell>
        <Skeleton className={wide ? 'h-3 w-28' : 'h-3 w-20'} />
      </TableCell>

      <TableCell>
        <Skeleton className="h-5 w-14 rounded-sm" />
      </TableCell>

      <TableCell>
        <Skeleton className="h-5.5 w-20 rounded-4xl" />
      </TableCell>

      <TableCell>
        <Skeleton className="h-3 w-22" />
      </TableCell>

      <TableCell>
        <div className="flex justify-end">
          <Skeleton className="h-4.5 w-16" />
        </div>
      </TableCell>

      <TableCell className="text-right">
        <Skeleton className="ml-auto h-3 w-12" />
      </TableCell>

      <TableCell className="pr-2">
        <Skeleton className="ml-auto size-4 rounded-sm" />
      </TableCell>
    </TableRow>
  );
}

export function StatTileSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card py-4 ring-1 ring-foreground/10">
      <Skeleton className="mx-4 h-3 w-24" />
      <Skeleton className="mx-4 h-6.5 w-20" />
      <Skeleton className="mx-4 h-3 w-32" />
    </div>
  );
}
