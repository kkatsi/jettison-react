import { Upload } from 'lucide-react';

import { Input, StatusBadge } from '@shared/ui';
import { cn } from '@shared/utils/cn';

import { Field } from '../../components/Field';
import { useArtworkStep } from './useArtworkStep';

// Step 3 — the cover every store shows, and the credits they all print verbatim.
export function ArtworkStep() {
  const { form, fields, cover, requirements, onFile, onRemove, error } = useArtworkStep();
  const { errors } = form.formState;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Artwork &amp; credits</h2>
        <p className="mt-1.5 text-sm text-faint">
          Cover art is delivered to every store at full resolution.
        </p>
      </div>

      <div className="grid grid-cols-[300px_1fr] items-start gap-8">
        <div className="flex flex-col gap-3">
          {cover.isEmpty ? (
            <label
              onDrop={(event) => {
                event.preventDefault();
                onFile(event.dataTransfer.files[0]);
              }}
              onDragOver={(event) => event.preventDefault()}
              className="flex h-47.5 w-75 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line-strong bg-canvas hover:border-brand/40 hover:bg-panel"
            >
              <span className="flex size-8.5 items-center justify-center rounded-lg border border-line-strong text-faint">
                <Upload className="size-4" />
              </span>
              <span className="text-sm text-subtle">
                Drop cover art or <span className="text-brand">browse</span>
              </span>
              <span className="flex flex-col items-center gap-0.75 font-mono text-2xs text-dim">
                {requirements.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </span>
              <FilePicker onFile={onFile} />
            </label>
          ) : (
            <>
              <div
                className="relative size-75 overflow-hidden rounded-sm border border-line"
                style={
                  cover.previewUrl
                    ? undefined
                    : {
                        background: `linear-gradient(135deg, ${cover.artwork.from}, ${cover.artwork.to})`,
                      }
                }
              >
                {cover.previewUrl ? (
                  <img src={cover.previewUrl} alt="" className="size-full object-cover" />
                ) : null}

                <div className="absolute inset-x-0 bottom-0 flex h-11 items-center justify-between border-t border-line bg-canvas px-3">
                  <span className="truncate font-mono text-2xs text-subtle">{cover.fileLabel}</span>
                  {cover.verdict ? (
                    <StatusBadge tone={cover.verdict.tone}>{cover.verdict.label}</StatusBadge>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-3.5 text-sm">
                <label className="text-brand">
                  Replace
                  <FilePicker onFile={onFile} />
                </label>
                <button type="button" onClick={onRemove} className="text-idle hover:text-danger">
                  Remove
                </button>
              </div>
            </>
          )}

          {error ? <p className="text-xs text-danger">{error}</p> : null}
        </div>

        <div className="flex max-w-115 flex-col gap-5">
          {fields.map((field) => (
            <Field
              key={field.name}
              label={field.label}
              hint={field.hint}
              error={errors[field.name]?.message}
            >
              <Input
                {...form.register(field.name)}
                className={cn('h-9.5', field.mono && 'font-mono')}
              />
            </Field>
          ))}
        </div>
      </div>
    </div>
  );
}

function FilePicker({ onFile }: { onFile: (file: File | null | undefined) => void }) {
  return (
    <input
      type="file"
      accept="image/png,image/jpeg"
      className="hidden"
      onChange={(event) => {
        onFile(event.target.files?.[0]);
        event.target.value = '';
      }}
    />
  );
}
