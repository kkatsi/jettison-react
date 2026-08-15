// Step 3's one hook (R2). The cover is a file the stores measure and a pair of
// colours this console can draw; both are decided the moment one is dropped.

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import type { Tone } from '@shared/ui';

import type { Artwork, ArtworkFile, Credits } from '../../api/types';
import { ARTWORK, CREDIT_FIELDS, EMPTY_CREDITS } from '../../constants';
import { useDraft } from '../../hooks/useDraft';
import { useDraftAutosave } from '../../hooks/useDraftAutosave';
import { useDraftSave } from '../../hooks/useDraftSave';
import { artworkFromSample } from '../../services/artwork';
import { meetsArtworkRequirements } from '../../services/release-eligibility';

const line = z.string().max(200);

/** Credits are free text the stores print verbatim; only the length is ours to hold. */
const creditsSchema = z.object({
  composer: line,
  producer: line,
  publisher: line,
  pLine: line,
  cLine: line,
});

export type CreditsValues = z.infer<typeof creditsSchema>;

export type ArtworkModel = {
  form: UseFormReturn<CreditsValues>;
  fields: typeof CREDIT_FIELDS;
  cover: {
    /** The file itself while this tab is open; the colours after that. */
    previewUrl: string | null;
    artwork: Artwork;
    fileLabel: string;
    verdict: { label: string; tone: Tone } | null;
    isEmpty: boolean;
  };
  requirements: string[];
  onFile: (file: File | null | undefined) => void;
  onRemove: () => void;
  /** Reading a file the browser cannot decode is the one failure worth naming. */
  error: string | null;
};

export function useArtworkStep(): ArtworkModel {
  const { id, draft } = useDraft();
  const { save } = useDraftSave(id);

  const credits = draft?.credits ?? EMPTY_CREDITS;
  const artworkFile = draft?.artworkFile ?? null;

  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreditsValues>({
    resolver: zodResolver(creditsSchema),
    mode: 'onBlur',
    defaultValues: credits,
  });

  useDraftAutosave(id, form, (values) => ({ credits: values as Credits }));

  return {
    form,
    fields: CREDIT_FIELDS,
    cover: {
      previewUrl: preview,
      artwork: draft?.artwork ?? { from: '#2A3040', to: '#12161F' },
      fileLabel: artworkFile
        ? `${artworkFile.name} · ${artworkFile.width}×${artworkFile.height}`
        : '',
      verdict: artworkFile
        ? meetsArtworkRequirements(artworkFile)
          ? { label: ARTWORK.passes, tone: 'live' }
          : { label: ARTWORK.tooSmall, tone: 'warning' }
        : null,
      isEmpty: artworkFile === null,
    },
    requirements: ARTWORK.requirements,

    onFile: (file) => {
      if (!file) return;
      setError(null);

      void readArtworkFile(file)
        .then((reading) => {
          // The cover it replaces is off screen the moment this renders.
          setPreview((previous) => {
            if (previous) URL.revokeObjectURL(previous);
            return reading.previewUrl;
          });
          // Saved together: the colours are only true of this file.
          return save({ artworkFile: reading.file, artwork: reading.artwork });
        })
        .catch(() => setError(ARTWORK.unreadable));
    },

    onRemove: () => {
      setPreview((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return null;
      });
      void save({ artworkFile: null });
    },
    error,
  };
}

type ArtworkReading = {
  file: ArtworkFile;
  artwork: Artwork;
  /** Lives as long as the tab does — the mock backend stores no files. */
  previewUrl: string;
};

/** The DOM half, beside the hook that orchestrates it — services stay pure (Ch. 3 §1). */
async function readArtworkFile(file: File): Promise<ArtworkReading> {
  const bitmap = await createImageBitmap(file);
  // Read before closing: close() zeroes the bitmap's own dimensions.
  const size = { width: bitmap.width, height: bitmap.height };

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 2;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('artwork: no 2d context');

  context.imageSmoothingQuality = 'high';
  context.drawImage(bitmap, 0, 0, 1, 2);
  const { data } = context.getImageData(0, 0, 1, 2);
  bitmap.close();

  return {
    file: { name: file.name, ...size },
    artwork: artworkFromSample(data),
    previewUrl: URL.createObjectURL(file),
  };
}
