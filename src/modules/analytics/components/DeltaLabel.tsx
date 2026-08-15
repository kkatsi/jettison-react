import { TONE_TEXT } from '@shared/ui';
import { cn } from '@shared/utils/cn';

import type { Delta } from '../api/types';

/** A dash where there is nothing to compare against — an unsigned 0% would be a claim. */
export function DeltaLabel({
  delta,
  arrow = false,
  className,
}: {
  delta: Delta;
  arrow?: boolean;
  className?: string;
}) {
  if (!delta) return <span className={cn('font-mono text-dim', className)}>—</span>;

  return (
    <span className={cn('font-mono', delta.up ? TONE_TEXT.live : TONE_TEXT.danger, className)}>
      {arrow ? (delta.up ? '↑ ' : '↓ ') : ''}
      {delta.label}
    </span>
  );
}
