import { Plus, Upload } from 'lucide-react';
import { useRef } from 'react';

import { Card } from '@shared/ui';

import { TrackRow } from './TrackRow';
import { useTracksStep } from './useTracksStep';

// Step 2 — the audio, and the running order the stores will publish.
export function TracksStep() {
  const { rows, summary, isEmpty, isUploading, onFiles } = useTracksStep();
  const picker = useRef<HTMLInputElement>(null);

  return (
    <div className="flex max-w-190 flex-col gap-5">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Tracks</h2>
          <p className="mt-1.5 text-sm text-faint">Drag to reorder. WAV or FLAC, 24-bit minimum.</p>
        </div>
        <span className="font-mono text-xs text-faint">{summary}</span>
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        {rows.map((row) => (
          <TrackRow key={row.id} row={row} />
        ))}

        <button
          type="button"
          onClick={() => picker.current?.click()}
          disabled={isUploading}
          className="flex h-13 items-center gap-2.5 border-t border-panel px-3.5 text-sm font-medium text-brand first:border-t-0 hover:bg-raised disabled:text-idle"
        >
          <span className="flex size-4.5 items-center justify-center rounded-sm border border-dashed border-brand/40">
            <Plus className="size-3" />
          </span>
          {isUploading ? 'Uploading…' : 'Add track'}
        </button>
      </Card>

      <label
        onDrop={(event) => {
          event.preventDefault();
          onFiles(event.dataTransfer.files);
        }}
        onDragOver={(event) => event.preventDefault()}
        className="flex items-center gap-3 rounded-xl border border-dashed border-line-strong px-4 py-3.5 text-sm text-faint hover:border-brand/40"
      >
        <span className="flex size-5.5 items-center justify-center rounded-sm border border-line-strong text-dim">
          <Upload className="size-3" />
        </span>
        {isEmpty
          ? 'Drop audio files here to add the first track — filenames become titles you can edit.'
          : 'Drop audio files here to add tracks — filenames become titles you can edit.'}
        <input
          ref={picker}
          type="file"
          // Hidden, unlike the cover's: the "Add track" button above is focusable
          // and clicks this, so a second tab stop would only duplicate it.
          multiple
          accept="audio/*,.wav,.flac"
          className="hidden"
          onChange={(event) => {
            onFiles(event.target.files);
            event.target.value = '';
          }}
        />
      </label>
    </div>
  );
}
