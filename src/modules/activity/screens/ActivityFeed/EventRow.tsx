import { cn } from '@shared/utils/cn';

import { TYPE_CHIP } from '../../constants';
import type { ActivityEvent } from '../../types';

// Props in, JSX out — no hook, because there is nothing to orchestrate (R2).
export function EventRow({ event }: { event: ActivityEvent }) {
  const { artwork } = event.release;

  return (
    <div className="grid h-13 grid-cols-[82px_224px_1fr_196px_116px] items-center gap-4 border-b border-panel px-6 hover:bg-raised/60">
      {/* UTC, like every other timestamp the console shows — a label delivers across time zones. */}
      <span className="font-mono text-xs text-subtle">{event.at.slice(11, 16)}</span>

      <span
        className={cn(
          'flex h-5.5 w-fit max-w-full items-center gap-1.75 rounded-sm px-2.25',
          TYPE_CHIP[event.type],
        )}
      >
        <span className="size-1.25 flex-none rounded-full bg-current" />
        <span className="truncate font-mono text-2xs">{event.type}</span>
      </span>

      <span className="truncate">{event.summary}</span>

      <div className="flex min-w-0 items-center gap-2.25">
        {/* Generated artwork: two seed colours, hatched. Inline because the values are data. */}
        <div
          className="size-5.5 flex-none rounded-sm"
          style={{
            background: artwork.from,
            backgroundImage: `repeating-linear-gradient(135deg, ${artwork.to} 0 3px, transparent 3px 7px)`,
          }}
        />
        <span className="truncate text-sm text-subtle">{event.release.title}</span>
        <span className="flex-none font-mono text-2xs text-dim">{event.release.catalogNumber}</span>
      </div>

      <span className="truncate text-right text-sm text-faint">{event.actor}</span>
    </div>
  );
}
