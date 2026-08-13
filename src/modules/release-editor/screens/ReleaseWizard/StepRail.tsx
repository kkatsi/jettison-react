import { cn } from '@shared/utils/cn';

import type { RailEntry, RailFooter } from './useReleaseWizard';

export type StepRailProps = {
  steps: RailEntry[];
  footer: RailFooter;
  /** Steps holding a blocking issue, so the rail says where the problems are. */
  flagged?: readonly string[];
};

export function StepRail({ steps, footer, flagged = [] }: StepRailProps) {
  return (
    <div className="flex w-66 flex-none flex-col border-r border-line px-5 py-6">
      {steps.map((step) => (
        <button
          key={step.slug}
          type="button"
          onClick={step.onSelect}
          className="grid grid-cols-[24px_1fr] items-start gap-3 text-left"
        >
          <div className="flex flex-col items-center">
            <span
              className={cn(
                'flex size-5.5 items-center justify-center rounded-full border-1.5 font-mono text-2xs',
                step.status === 'done' && 'border-live bg-live/10 text-live',
                step.status === 'current' && 'border-brand bg-brand/14 text-brand-soft',
                step.status === 'ahead' && 'border-line-strong text-dim',
              )}
            >
              {step.number}
            </span>
            {step.isLast ? null : (
              <span
                className={cn('h-11 w-px', step.status === 'done' ? 'bg-live/40' : 'bg-line')}
              />
            )}
          </div>

          <div className={cn(step.isLast ? 'pb-0' : 'pb-6.5')}>
            <div className="flex items-center gap-1.75">
              <span
                className={cn(
                  'text-base',
                  step.status === 'current' && 'font-semibold text-text',
                  step.status === 'done' && 'font-medium text-subtle',
                  step.status === 'ahead' && 'font-medium text-faint',
                )}
              >
                {step.label}
              </span>
              {flagged.includes(step.slug) ? (
                <span className="size-1.25 rounded-full bg-warning" />
              ) : null}
            </div>
            <div className="mt-1 text-xs text-faint">{step.hint}</div>
          </div>
        </button>
      ))}

      <div className="mt-auto border-t border-line pt-4">
        {footer.kind === 'note' ? (
          <p className="text-xs leading-relaxed text-faint">{footer.text}</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-faint">{footer.label}</span>
              <span className="font-mono text-xs text-subtle">{footer.value}</span>
            </div>
            <div className="h-1 overflow-hidden rounded-sm bg-raised">
              <div
                className="h-full rounded-sm bg-live transition-[width] duration-500"
                style={{ width: `${footer.percent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
