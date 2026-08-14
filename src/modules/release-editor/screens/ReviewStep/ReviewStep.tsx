import { Check } from 'lucide-react';

import { Button, Card, TONE_TEXT } from '@shared/ui';
import { cn } from '@shared/utils/cn';

import { useReviewStep } from './useReviewStep';

// Step 4 — everything that is about to be delivered, and everything stopping it.
export function ReviewStep() {
  const { catalogNumber, lede, issues, allClear, headline, clearLine, panels, error } =
    useReviewStep();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Review &amp; submit</h2>
          <p className="mt-1.5 text-sm text-faint">{lede}</p>
        </div>
        <span className="font-mono text-xs text-faint">{catalogNumber}</span>
      </div>

      <Card className={cn('gap-0 overflow-hidden py-0', !allClear && 'border-warning/25')}>
        <div className="flex h-11 items-center gap-2.5 border-b border-line px-4">
          <span className={cn('size-1.5 rounded-full bg-current', TONE_TEXT[headline.tone])} />
          <span className="font-semibold">{headline.title}</span>
          <span className="ml-auto font-mono text-xs text-faint">{headline.count}</span>
        </div>

        {allClear ? (
          <div className="flex items-center gap-3 p-4">
            <span className="flex size-5 items-center justify-center rounded-sm bg-live/10 text-live">
              <Check className="size-3" />
            </span>
            <span className="text-subtle">{clearLine}</span>
          </div>
        ) : (
          issues.map((issue) => (
            <div
              key={issue.code}
              className="flex h-14 items-center gap-3 border-b border-panel px-4 last:border-b-0"
            >
              {/* One mark for all of them: they block submission equally. */}
              <span className="flex size-5 flex-none items-center justify-center rounded-sm bg-warning/10 text-xs font-semibold text-warning">
                !
              </span>

              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate">{issue.title}</span>
                <span className="truncate text-xs text-faint">{issue.detail}</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="ml-auto flex-none"
                onClick={issue.onFix}
              >
                {issue.action}
              </Button>
            </div>
          ))
        )}
      </Card>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="grid grid-cols-2 items-start gap-4">
        {panels.map((panel) => (
          <Card key={panel.title} className="gap-0 overflow-hidden py-0">
            <div className="flex h-10 items-center border-b border-line px-4">
              <span className="text-sm font-semibold text-subtle">{panel.title}</span>
              <button
                type="button"
                onClick={panel.onEdit}
                className="ml-auto text-sm text-brand hover:text-brand-soft"
              >
                Edit
              </button>
            </div>

            <div className="px-4 pt-1.5 pb-3">
              {panel.rows.map((row) => (
                <div key={row.key} className="flex h-8 items-center justify-between gap-4">
                  <span className="text-sm text-faint">{row.label}</span>
                  <span className={cn('truncate text-sm text-subtle', row.mono && 'font-mono')}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
