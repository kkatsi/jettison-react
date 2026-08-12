import { TriangleAlert } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';

import { Button } from './button';
import { Card } from './card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from './empty';

type Props = { name: string; children: ReactNode };
type State = { error: Error | null; errorId: string; at: string };

/**
 * One per routed screen, so a thrown tooltip doesn't blank the whole console.
 * Lives in the kit rather than app because modules wrap their own screens and
 * can't import app.
 */
export class ScreenErrorBoundary extends Component<Props, State> {
  state: State = { error: null, errorId: '', at: '' };

  static getDerivedStateFromError(error: Error): State {
    return {
      error,
      // Short enough to read out on a support call.
      errorId: `err_${crypto.randomUUID().replaceAll('-', '').slice(0, 8)}`,
      at: new Date().toLocaleTimeString('en-GB'),
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // A monitoring client would go here.
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
      <Card className="min-h-80 flex-1 ring-destructive/30">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon" className="bg-destructive/10 text-destructive">
              <TriangleAlert />
            </EmptyMedia>
            <EmptyTitle className="text-lg">
              This section failed — the rest of the console is unaffected
            </EmptyTitle>
            <EmptyDescription>
              Every other panel and screen is still live and safe to use.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className="flex items-center gap-2.5">
              <Button onClick={this.retry}>Try again</Button>
              <Button variant="outline" onClick={this.copyErrorId}>
                Copy error id
              </Button>
            </div>
            <div className="flex items-center gap-2.5 font-mono text-2xs text-dim">
              <span>{errorId}</span>
              <span>·</span>
              <span>{at}</span>
              <span>·</span>
              <span>boundary: {this.props.name}</span>
            </div>
          </EmptyContent>
        </Empty>
      </Card>
    );
  }
}
