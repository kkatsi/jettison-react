import { ChevronRight } from 'lucide-react';

import { Card, Skeleton } from '@shared/ui';
import { cn } from '@shared/utils/cn';

/**
 * The release before its data arrives. The chrome a release always has — the
 * breadcrumb back to the catalogue, the panel titles, the tracklist's column
 * headers — is structure and renders at once. What is left grey is the part that
 * differs from one release to the next.
 *
 * The withdraw button is absent rather than ghosted: whether a release can be
 * taken back is a fact about it, and a placeholder in that corner would promise
 * an action that may not exist once the answer lands.
 */
export function ReleaseDetailSkeleton({ trackColumns }: { trackColumns: string }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="flex h-11 flex-none items-center gap-2 border-b border-line px-6">
        <span className="text-sm text-idle">Catalog</span>
        <ChevronRight className="size-3 text-dim" />
        <Skeleton className="h-3.5 w-44" />
        <Skeleton className="h-3 w-16" />
      </div>

      <div className="flex flex-col gap-4 p-6">
        <Card className="flex-none flex-row items-start gap-5 p-5">
          <Skeleton className="size-24 rounded-sm" />

          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-5 w-14 rounded-sm" />
              <Skeleton className="h-5.5 w-20 rounded-4xl" />
            </div>

            <Skeleton className="h-4 w-32" />

            <dl className="mt-0.5 flex items-center gap-6">
              {['released', 'submitted', 'tracks', 'streams'].map((fact) => (
                <div key={fact} className="flex flex-col gap-1.5">
                  <Skeleton className="h-2.5 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </dl>
          </div>
        </Card>

        <div className="grid grid-cols-[1fr_460px] items-start gap-4">
          <Card className="gap-0 overflow-hidden py-0">
            <PanelHeaderSkeleton title="Tracklist" />
            <div
              className={cn(trackColumns, 'h-8 border-b border-line text-xs font-medium text-idle')}
            >
              <span>#</span>
              <span>Title</span>
              <span>ISRC</span>
              <span className="text-right">Length</span>
              <span className="text-right">Audio</span>
            </div>
            {TRACKS.map((key, index) => (
              <div
                key={key}
                className={cn(trackColumns, 'h-11.5 border-b border-panel last:border-0')}
              >
                <Skeleton className="h-3 w-3" />
                <Skeleton className={index % 3 === 0 ? 'h-3 w-56' : 'h-3 w-40'} />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="ml-auto h-3 w-8" />
                <Skeleton className="ml-auto h-5.5 w-16 rounded-4xl" />
              </div>
            ))}
          </Card>

          <Card className="gap-0 overflow-hidden py-0 self-stretch">
            <PanelHeaderSkeleton title="Distribution status" />
            {STORES.map((key) => (
              <div
                key={key}
                className="flex h-13 items-center gap-3 border-b border-panel px-4 last:border-0"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2.5 w-28" />
                </div>
                <Skeleton className="h-5.5 w-20 rounded-4xl" />
              </div>
            ))}
          </Card>
        </div>

        <Card className="gap-0 overflow-hidden py-0">
          <PanelHeaderSkeleton title="Recent activity" />
          {ENTRIES.map((key) => (
            <div
              key={key}
              className="grid h-11 grid-cols-[150px_24px_1fr_190px] items-center gap-3 border-b border-panel px-4 last:border-0"
            >
              <Skeleton className="h-3 w-28" />
              <Skeleton className="size-1.5 justify-self-center rounded-full" />
              <Skeleton className="h-3 w-72" />
              <Skeleton className="ml-auto h-3 w-24" />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function PanelHeaderSkeleton({ title }: { title: string }) {
  return (
    <div className="flex h-11 items-center gap-2.5 border-b border-line px-4">
      <span className="font-semibold">{title}</span>
      <Skeleton className="h-3 w-28" />
    </div>
  );
}

const TRACKS = Array.from({ length: 6 }, (_, index) => `track-${index}`);
const STORES = Array.from({ length: 5 }, (_, index) => `store-${index}`);
const ENTRIES = Array.from({ length: 4 }, (_, index) => `entry-${index}`);
