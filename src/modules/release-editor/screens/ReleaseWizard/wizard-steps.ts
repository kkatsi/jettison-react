// Where the wizard is and where it can go next. No React, no router (R5) — the
// hook turns a slug into links, this decides the order.

import { STEPS, type StepSlug } from '../../constants';

export type StepStatus = 'done' | 'current' | 'ahead';

export type RailStep = {
  slug: StepSlug;
  label: string;
  hint: string;
  /** '1'…'4' while pending, a tick once the wizard has moved past it. */
  number: string;
  status: StepStatus;
  isLast: boolean;
};

const SLUGS = STEPS.map((step) => step.slug);

export function isStepSlug(value: string): value is StepSlug {
  return SLUGS.some((slug) => slug === value);
}

export function railSteps(current: StepSlug): RailStep[] {
  const position = SLUGS.indexOf(current);

  return STEPS.map((step, index) => {
    const status: StepStatus = index < position ? 'done' : index === position ? 'current' : 'ahead';

    return {
      slug: step.slug,
      label: step.label,
      hint: step.hint,
      number: status === 'done' ? '✓' : String(index + 1),
      status,
      isLast: index === STEPS.length - 1,
    };
  });
}

/** `null` at either end of the rail. */
export type AdjacentSteps = {
  previous: StepSlug | null;
  next: StepSlug | null;
};

/** Every step stays reachable: the review step's fix buttons jump forwards too. */
export function adjacentSteps(current: StepSlug): AdjacentSteps {
  const position = SLUGS.indexOf(current);

  return {
    previous: SLUGS[position - 1] ?? null,
    next: SLUGS[position + 1] ?? null,
  };
}

/** '2 of 4'. */
export function stepCounter(current: StepSlug): string {
  return `${SLUGS.indexOf(current) + 1} of ${SLUGS.length}`;
}
