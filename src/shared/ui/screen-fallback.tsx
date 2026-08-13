import { Card } from './card';
import { Skeleton } from './skeleton';

/** Shown while a screen's code, or its first data, is still on the way. */
export function ScreenFallback() {
  return (
    <div role="status" aria-label="Loading" className="flex min-h-0 flex-1 flex-col gap-4 p-6">
      <div className="flex flex-none items-center gap-2">
        <Skeleton className="h-7.5 w-65" />
        <Skeleton className="h-7.5 w-28" />
        <Skeleton className="h-7.5 w-28" />
      </div>

      <Card className="min-h-60 flex-1 gap-0 overflow-hidden py-0">
        <div className="flex h-9 flex-none items-center gap-6 border-b border-line px-4">
          <Skeleton className="h-2.5 w-28" />
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="ml-auto h-2.5 w-24" />
        </div>

        {ROWS.map((key) => (
          <div
            key={key}
            className="flex h-13 flex-none items-center gap-4 border-b border-panel px-4"
          >
            <Skeleton className="size-8 rounded-sm" />
            <Skeleton className="h-3 w-56" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="ml-auto h-3 w-20" />
          </div>
        ))}
      </Card>
    </div>
  );
}

const ROWS = Array.from({ length: 8 }, (_, index) => `row-${index}`);
