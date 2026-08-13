import { Skeleton } from '@shared/ui';

/**
 * The feed before its data arrives. Day headings are part of the feed's shape, so
 * they stay — but their labels are grey, because whether the newest events are
 * from today or from a fortnight ago is exactly what has not been answered yet.
 */
export function ActivityFeedSkeleton() {
  return (
    <div aria-hidden>
      {GROUPS.map((group) => (
        <div key={group.key}>
          <div className="flex h-8.5 items-center gap-2.5 border-b border-line/70 px-6">
            <Skeleton className="h-2.5 w-20" />
            <div className="h-px flex-1 bg-panel" />
            <Skeleton className="h-2.5 w-14" />
          </div>

          {group.rows.map((key, index) => (
            <EventRowSkeleton key={key} index={index} />
          ))}
        </div>
      ))}
    </div>
  );
}

function EventRowSkeleton({ index }: { index: number }) {
  const wide = index % 3 === 1;

  return (
    <div className="grid h-13 grid-cols-[82px_224px_1fr_196px_116px] items-center gap-4 border-b border-panel px-6">
      <Skeleton className="h-3 w-10" />
      <Skeleton className="h-5.5 w-44 rounded-sm" />
      <Skeleton className={wide ? 'h-3 w-80' : 'h-3 w-56'} />

      <div className="flex items-center gap-2.25">
        <Skeleton className="size-5.5 rounded-sm" />
        <Skeleton className="h-3 w-24" />
      </div>

      <Skeleton className="ml-auto h-3 w-20" />
    </div>
  );
}

const GROUPS = [
  { key: 'day-0', rows: ['a', 'b', 'c', 'd', 'e'] },
  { key: 'day-1', rows: ['f', 'g', 'h', 'i'] },
];
