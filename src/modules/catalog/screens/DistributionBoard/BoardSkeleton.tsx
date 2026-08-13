import { Card, Skeleton, TableCell, TableRow } from '@shared/ui';

/**
 * The board before its data arrives. Same two rules as the catalogue's: structure
 * only, and first load only — never a refetch, or the reconcile timer would
 * strobe the pipeline after every withdrawal.
 */
export function PipelineRowSkeleton({ index }: { index: number }) {
  const wide = index % 3 === 0;

  return (
    <TableRow className="h-13 border-panel hover:bg-transparent">
      <TableCell className="pl-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-sm" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className={wide ? 'h-3 w-48' : 'h-3 w-32'} />
            <Skeleton className="h-2 w-20" />
          </div>
        </div>
      </TableCell>

      <TableCell>
        <Skeleton className={wide ? 'h-3 w-26' : 'h-3 w-20'} />
      </TableCell>

      <TableCell>
        <Skeleton className="h-3 w-28" />
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2">
          <span className="flex gap-0.5">
            {[0, 1, 2, 3, 4].map((store) => (
              <Skeleton key={store} className="h-1 w-2 rounded-xs" />
            ))}
          </span>
          <Skeleton className="h-3 w-7" />
        </div>
      </TableCell>

      <TableCell>
        <Skeleton className="h-5.5 w-20 rounded-4xl" />
      </TableCell>

      <TableCell className="pr-4">
        <Skeleton className="ml-auto h-3 w-14" />
      </TableCell>
    </TableRow>
  );
}

/**
 * The schedule strip, waiting. Deliberately no pins and no dates: a placeholder
 * that puts marks on a calendar is inventing a release plan, and this one does
 * not know yet whether there is anything in the window at all. The axis, its
 * title and the rule are structure, so they stay.
 */
export function ReleaseScheduleSkeleton() {
  return (
    <Card className="flex-none gap-0 px-5 pt-4 pb-5">
      <div className="mb-5.5 flex items-baseline gap-2.5">
        <span className="font-semibold">Release schedule</span>
        <span className="text-sm text-faint">
          Street dates for submissions currently in the pipeline
        </span>
        <Skeleton className="ml-auto h-3 w-28" />
      </div>

      <div className="relative h-29.5">
        <div className="absolute top-13 right-0 left-0 h-px bg-line" />
        {[0, 22.5, 45, 67.5, 90].map((left) => (
          <div key={left}>
            <div
              className="absolute top-13 h-1.5 w-px bg-line-strong/70"
              style={{ left: `${left}%` }}
            />
            <Skeleton className="absolute top-16 h-2.5 w-8" style={{ left: `${left}%` }} />
          </div>
        ))}
      </div>
    </Card>
  );
}
