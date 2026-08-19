// Step 1's one hook (R2). The form is React Hook Form's (Ch. 4 §2); everything
// the view needs to draw around it is decided here.

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch, type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import type { FilterOption, Tone } from '@shared/ui';

import { useArtistsQuery } from '../../api/endpoints';
import type { ReleaseType } from '../../api/types';
import { EMPTY_CREDITS, GENRES, LEAD_HINT, TYPES, TYPE_HINT } from '../../constants';
import { useDraft } from '../../hooks/useDraft';
import { useDraftAutosave } from '../../hooks/useDraftAutosave';
import { leadDays, MIN_LEAD_DAYS } from '../../services/release-eligibility';

/** A draft may be incomplete — that is what a draft is. It may not be malformed. */
const detailsSchema = z.object({
  title: z.string().max(120, 'Stores truncate anything past 120 characters'),
  artistId: z.string(),
  genre: z.string(),
  type: z.enum(['Single', 'EP', 'Album']),
  releaseDate: z.iso.date('Use YYYY-MM-DD'),
  pLine: z.string().max(120),
});

export type DetailsValues = z.infer<typeof detailsSchema>;

export type DetailsModel = {
  form: UseFormReturn<DetailsValues>;
  artists: FilterOption[];
  genres: FilterOption[];
  types: { value: ReleaseType; label: string; isSelected: boolean; onSelect: () => void }[];
  typeHint: string;
  /** The date field's own verdict, in the words step 4 would use. */
  lead: { text: string; tone: Tone };
};

export function useDetailsStep(): DetailsModel {
  const { id, draft } = useDraft();
  const { data: artists } = useArtistsQuery();

  const form = useForm<DetailsValues>({
    resolver: zodResolver(detailsSchema),
    mode: 'onBlur',
    // `draft ?? server`, resolved once: the frame does not render a step until the
    // release is in the cache, so there is nothing to wait for here.
    defaultValues: {
      title: draft?.title ?? '',
      artistId: draft?.artistId ?? '',
      genre: draft?.genre ?? '',
      type: draft?.type ?? 'Single',
      releaseDate: draft?.releaseDate ?? '',
      pLine: draft?.credits.pLine ?? '',
    },
  });

  useDraftAutosave(id, form, (values) => ({
    title: values.title,
    artistId: values.artistId,
    genre: values.genre,
    type: values.type,
    releaseDate: values.releaseDate,
    // The ℗ line is part of the credits the stores receive; this step just shows
    // it early, because it is the one credit that is the label's, not the artist's.
    credits: { ...(draft?.credits ?? EMPTY_CREDITS), pLine: values.pLine },
  }));

  // `useWatch`, not `form.watch`: the subscribing hook is the one the compiler can
  // reason about, and these two values drive the panel around the form.
  const type = useWatch({ control: form.control, name: 'type' });
  const releaseDate = useWatch({ control: form.control, name: 'releaseDate' });

  return {
    form,
    artists: (artists ?? []).map((artist) => ({ value: artist.id, label: artist.name })),
    genres: GENRES.map((genre) => ({ value: genre, label: genre })),
    types: TYPES.map((candidate) => ({
      value: candidate,
      label: candidate,
      isSelected: candidate === type,
      onSelect: () => form.setValue('type', candidate, { shouldDirty: true }),
    })),
    typeHint: TYPE_HINT[type],
    lead: leadHint(releaseDate),
  };
}

function leadHint(releaseDate: string): { text: string; tone: Tone } {
  const days = leadDays(releaseDate, new Date().toISOString().slice(0, 10));

  return days >= MIN_LEAD_DAYS
    ? { text: LEAD_HINT.ok(days), tone: 'idle' }
    : { text: LEAD_HINT.tooSoon, tone: 'warning' };
}
