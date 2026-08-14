import { GripVertical, X } from 'lucide-react';

import { Input, StatusBadge } from '@shared/ui';
import { cn } from '@shared/utils/cn';

import type { TrackRow as Row } from './useTracksStep';

// One track: its place in the running order, its title, and where its audio is.
export function TrackRow({ row }: { row: Row }) {
  return (
    <div
      draggable
      onDragStart={row.onDragStart}
      onDragEnter={row.onDragEnter}
      onDragOver={(event) => event.preventDefault()}
      onDrop={row.onDrop}
      className={cn(
        'grid h-14 grid-cols-[22px_30px_1fr_230px_28px] items-center gap-3 border-b border-panel px-3.5 last:border-b-0',
        row.audio.status === 'processing' && 'bg-warning/3',
        row.isDropTarget && 'border-t border-t-brand',
      )}
    >
      <GripVertical className="size-3.5 cursor-grab text-dim" />
      <span className="font-mono text-xs text-faint">{row.number}</span>

      <Input
        defaultValue={row.title}
        onChange={(event) => row.onTitle(event.target.value)}
        placeholder="Track title"
        className="h-8 border-transparent bg-transparent hover:border-line hover:bg-panel"
      />

      <div className="flex items-center justify-end gap-2.5">
        {row.audio.status === 'uploading' ? (
          <div className="h-1 w-24 overflow-hidden rounded-sm bg-raised">
            <div className="h-full w-2/3 animate-pulse rounded-sm bg-brand" />
          </div>
        ) : row.audio.status === 'ready' ? (
          <span className="font-mono text-xs text-subtle">{row.duration}</span>
        ) : null}

        <StatusBadge tone={row.audio.tone} busy={row.audio.status === 'processing'}>
          {row.audio.label}
        </StatusBadge>
      </div>

      <button
        type="button"
        onClick={row.onRemove}
        aria-label={`Remove ${row.title || 'this track'}`}
        className="flex justify-center text-dim hover:text-danger"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
