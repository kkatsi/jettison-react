import { PlugZap } from 'lucide-react';

import {
  Button,
  Card,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@shared/ui';

type BootFailureProps = {
  /** Whatever the worker said, for the console and for a bug report. */
  reason: string;
  onRetry: () => void;
};

// The one failure with no smaller blast radius: this console's API *is* a service
// worker (ADR-002), so if it will not register there is no screen to degrade — only
// a reason to state. Ch. 2's doctrine says a failure names itself; a blank page is
// the one thing this app must never be.
export function BootFailure({ reason, onRetry }: BootFailureProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page p-6">
      <Card className="w-full max-w-160 ring-destructive/30">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon" className="bg-destructive/10 text-destructive">
              <PlugZap />
            </EmptyMedia>
            <EmptyTitle className="text-xl">The simulated backend did not start</EmptyTitle>
            <EmptyDescription>
              This console has no server: its API lives in a service worker, and the browser did not
              register one. Nothing can load until it does. A reload usually settles it — but a
              browser with service workers disabled, or blocked by policy, never will.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={onRetry}>Reload the console</Button>
            <p className="font-mono text-2xs text-dim">{reason}</p>
          </EmptyContent>
        </Empty>
      </Card>
    </div>
  );
}
