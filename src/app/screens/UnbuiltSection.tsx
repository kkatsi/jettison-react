import { EmptyState, Panel } from '@shared/ui';

/**
 * The shell's stand-in for a section whose module has not shipped yet — and, once
 * they all have, for a URL that matches nothing. It is also the honest answer for
 * a jettisoned module: the nav entry goes, the route goes, and anyone holding a
 * bookmark lands here instead of on a blank screen.
 */
export function UnbuiltSection() {
  return (
    <Panel padding="flush" className="flex min-h-100 flex-1 flex-col">
      <EmptyState
        title="Nothing here yet"
        description="This section arrives with its module. The catalogue, distribution board, release wizard and analytics are on their way."
      />
    </Panel>
  );
}
