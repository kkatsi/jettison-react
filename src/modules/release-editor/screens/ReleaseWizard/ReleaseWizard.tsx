import { Suspense } from 'react';
import { Outlet } from 'react-router';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  ScreenFallback,
  Skeleton,
  TONE_TEXT,
} from '@shared/ui';
import { cn } from '@shared/utils/cn';

import { StepRail } from './StepRail';
import { useReleaseWizard } from './useReleaseWizard';

// The frame around the four steps: what release this is, whether it is saved, and
// how to get from one step to the next.
export function ReleaseWizard() {
  const { isLoading, unavailable, header, rail, footer, discard } = useReleaseWizard();

  if (isLoading) return <ScreenFallback />;

  if (unavailable) {
    return (
      <Empty className="flex-1">
        <EmptyHeader>
          <EmptyTitle className="text-lg">{unavailable.title}</EmptyTitle>
          <EmptyDescription>{unavailable.description}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={unavailable.onSelect}>{unavailable.action}</Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* The console's topbar names the section; this row is the draft's own —
          which release, whether it is saved, and how to abandon it. */}
      <header className="flex h-11 flex-none items-center gap-2.5 border-b border-line px-6">
        <span className="font-medium">{header.title}</span>
        <span className="mt-1 font-mono text-xs text-idle">{header.catalogNumber}</span>

        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={cn('size-1.25 rounded-full bg-current', TONE_TEXT[header.save.tone])}
            />
            <span className="text-sm text-subtle">{header.save.label}</span>
            {header.save.at ? (
              <span className="font-mono text-xs text-faint">{header.save.at}</span>
            ) : null}
            {header.save.onRetry ? (
              <button
                type="button"
                onClick={header.save.onRetry}
                className="text-sm font-medium text-brand-soft"
              >
                Retry
              </button>
            ) : null}
          </div>

          <span className="h-6 w-px bg-line" />

          <Button variant="outline" size="sm" onClick={header.onDiscard}>
            Discard
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <StepRail steps={rail.steps} footer={rail.footer} flagged={rail.flagged} />

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-10 py-8">
            {/* The step's own chunk, so a step change never blanks the frame. */}
            <Suspense key={footer.counter} fallback={<StepFallback />}>
              <Outlet />
            </Suspense>
          </div>

          <div className="flex h-16 flex-none items-center justify-between border-t border-line px-10">
            <span className="font-mono text-xs text-faint">{footer.counter}</span>

            <div className="flex items-center gap-3">
              {footer.submit?.note ? (
                <span className="text-sm text-faint">{footer.submit.note}</span>
              ) : null}

              <Button
                variant="outline"
                size="sm"
                onClick={footer.onBack ?? undefined}
                disabled={!footer.onBack}
              >
                Back
              </Button>

              {footer.next ? (
                <Button size="sm" onClick={footer.next.onSelect}>
                  {footer.next.label}
                </Button>
              ) : null}

              {footer.submit ? (
                <Button
                  size="sm"
                  onClick={footer.submit.onSubmit}
                  disabled={footer.submit.isDisabled}
                >
                  {footer.submit.label}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={discard.isOpen}
        onOpenChange={(open) => (open ? undefined : discard.onCancel())}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{discard.title}</DialogTitle>
            <DialogDescription>{discard.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={discard.onCancel}>
              Keep editing
            </Button>
            <Button variant="destructive" onClick={discard.onConfirm}>
              {discard.confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StepFallback() {
  return (
    <div role="status" aria-label="Loading" className="flex max-w-160 flex-col gap-7">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-9.5 w-full" />
      <Skeleton className="h-9.5 w-full" />
      <Skeleton className="h-9.5 w-2/3" />
    </div>
  );
}
