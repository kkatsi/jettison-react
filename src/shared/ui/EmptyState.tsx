import type { ReactNode } from 'react';

import { cn } from '@shared/utils/cn';

export type EmptyStateProps = {
  title: string;
  description: string;
  /** Buttons or links. The kit does not decide what "nothing here" should offer. */
  actions?: ReactNode;
  /** Mono footnote under the actions — a count, a hint, a pointer elsewhere. */
  footnote?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, actions, footnote, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-[18px] p-8 text-center',
        className,
      )}
    >
      {/* Three empty artwork slots: the console's signature for "no records here". */}
      <div className="flex gap-2" aria-hidden>
        <div className="size-[34px] rounded border border-dashed border-line" />
        <div className="size-[34px] rounded border border-dashed border-line" />
        <div className="size-[34px] rounded border border-dashed border-line" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="text-xl font-semibold text-text">{title}</p>
        <p className="max-w-100 text-sm leading-relaxed text-faint">{description}</p>
      </div>
      {actions ? <div className="flex items-center gap-2.5">{actions}</div> : null}
      {footnote ? <p className="font-mono text-xs text-dim">{footnote}</p> : null}
    </div>
  );
}
