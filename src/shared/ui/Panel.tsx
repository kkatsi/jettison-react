import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

import { cn } from '@shared/utils/cn';

const panel = cva('bg-panel border border-line rounded-lg', {
  variants: {
    // `flush` exists because tables own their own edge padding — a padded panel
    // wrapping a table produces a border that floats away from its header row.
    padding: { normal: 'p-5', flush: 'p-0' },
    tone: { default: 'border-line', danger: 'border-danger/35' },
  },
  defaultVariants: { padding: 'normal', tone: 'default' },
});

export type PanelProps = ComponentProps<'div'> & VariantProps<typeof panel>;

export function Panel({ className, padding, tone, ...props }: PanelProps) {
  return <div className={cn(panel({ padding, tone }), className)} {...props} />;
}
