import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

import { cn } from '@shared/utils/cn';

// A pill with a dot. `tone` is the *visual* vocabulary (live/warning/danger/idle);
// mapping a domain status onto a tone is a module's job, not the kit's — the kit
// must stay publishable without mentioning releases (Ch. 1 §2).
const badge = cva(
  'inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full text-xs font-medium',
  {
    variants: {
      tone: {
        live: 'bg-live/10 text-live',
        warning: 'bg-warning/10 text-warning',
        danger: 'bg-danger/10 text-danger',
        idle: 'bg-idle/12 text-idle',
        accent: 'bg-accent/12 text-accent-soft',
      },
    },
    defaultVariants: { tone: 'idle' },
  },
);

const dot = cva('size-[5px] rounded-full', {
  variants: {
    tone: {
      live: 'bg-live',
      warning: 'bg-warning',
      danger: 'bg-danger',
      idle: 'bg-idle',
      accent: 'bg-accent',
    },
  },
  defaultVariants: { tone: 'idle' },
});

export type BadgeProps = ComponentProps<'span'> &
  VariantProps<typeof badge> & {
    /** The leading dot is the default; drop it for label-only pills. */
    withDot?: boolean;
  };

export function Badge({ className, tone, withDot = true, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badge({ tone }), className)} {...props}>
      {withDot ? <span className={dot({ tone })} /> : null}
      {children}
    </span>
  );
}
