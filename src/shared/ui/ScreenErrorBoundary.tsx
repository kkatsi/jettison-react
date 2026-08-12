import { Component, type ErrorInfo, type ReactNode } from 'react';

import { Button } from './Button';
import { Panel } from './Panel';

type Props = { name: string; children: ReactNode };
type State = { error: Error | null; errorId: string; at: string };

/**
 * One boundary per routed screen (Chapter 2 §3). A single boundary at the app root
 * produces the enterprise experience of a blank page because a tooltip threw; this
 * one contains the failure to the screen that caused it and says so on screen —
 * the sidebar, the topbar and every other screen keep working.
 *
 * It lives in the kit, not in `app`, because every module wraps its own screens
 * with it — and a module may not import `app` (Chapter 1 §2).
 */
export class ScreenErrorBoundary extends Component<Props, State> {
  state: State = { error: null, errorId: '', at: '' };

  static getDerivedStateFromError(error: Error): State {
    return {
      error,
      // Short, sayable, and copyable: the id a user reads out on a support call.
      errorId: `err_${crypto.randomUUID().replaceAll('-', '').slice(0, 8)}`,
      at: new Date().toLocaleTimeString('en-GB'),
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Where a monitoring client belongs (core, when there is one to add).
    console.error(`[${this.props.name}]`, error, info.componentStack);
  }

  private retry = () => {
    this.setState({ error: null, errorId: '', at: '' });
  };

  private copyErrorId = () => {
    void navigator.clipboard?.writeText(this.state.errorId);
  };

  render() {
    const { error, errorId, at } = this.state;
    if (!error) return this.props.children;

    return (
      <Panel tone="danger" className="flex min-h-80 flex-1 flex-col">
        <div className="flex items-baseline justify-between">
          <span className="font-semibold">Something failed here</span>
          <span className="font-mono text-2xs text-dim">boundary: {this.props.name}</span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <div className="flex size-9 items-center justify-center rounded-md border border-danger/35 bg-danger/8 text-lg font-semibold text-danger">
            !
          </div>
          <div className="flex max-w-100 flex-col gap-2">
            <p className="text-lg font-semibold text-text">
              This section failed — the rest of the console is unaffected
            </p>
            <p className="text-sm leading-relaxed text-faint">
              Every other panel and screen is still live and safe to use.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Button onClick={this.retry}>Try again</Button>
            <Button variant="secondary" onClick={this.copyErrorId}>
              Copy error id
            </Button>
          </div>
          <div className="flex items-center gap-2.5 font-mono text-2xs text-dim">
            <span>{errorId}</span>
            <span>·</span>
            <span>{at}</span>
          </div>
        </div>
      </Panel>
    );
  }
}
