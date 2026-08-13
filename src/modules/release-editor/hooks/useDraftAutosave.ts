// "Everything is saved as you type", in one place: debounce the form, flush what
// is pending when the step goes away, and let the slice hold the rest.

import { useEffect, useRef } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';

import type { DraftPatch } from '../api/types';
import { useDraftSave } from './useDraftSave';

/** Long enough that a sentence is one save, short enough to feel automatic. */
const DEBOUNCE_MS = 800;

export function useDraftAutosave<T extends FieldValues>(
  releaseId: string,
  form: UseFormReturn<T>,
  toPatch: (values: T) => DraftPatch,
): void {
  const { save } = useDraftSave(releaseId);

  // Read through a ref so the subscription below can be set up once: resubscribing
  // on every render would restart the debounce on every keystroke.
  const latest = useRef({ save, toPatch, getValues: form.getValues });
  useEffect(() => {
    latest.current = { save, toPatch, getValues: form.getValues };
  });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const flush = () => {
      timer = undefined;
      void latest.current.save(latest.current.toPatch(latest.current.getValues()));
    };

    const subscription = form.watch(() => {
      clearTimeout(timer);
      timer = setTimeout(flush, DEBOUNCE_MS);
    });

    return () => {
      subscription.unsubscribe();
      // A step change must not cost the last thing typed.
      if (timer !== undefined) {
        clearTimeout(timer);
        flush();
      }
    };
  }, [form]);
}
