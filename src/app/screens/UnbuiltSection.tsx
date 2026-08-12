import { Disc3 } from 'lucide-react';

import { Card, Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@shared/ui';

/**
 * The shell's stand-in for a section whose module has not shipped yet — and, once
 * they all have, for a URL that matches nothing. It is also the honest answer for
 * a jettisoned module: the nav entry goes, the route goes, and anyone holding a
 * bookmark lands here instead of on a blank screen.
 */
export function UnbuiltSection() {
  return (
    <Card className="flex min-h-100 flex-1 flex-col justify-center">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Disc3 />
          </EmptyMedia>
          <EmptyTitle className="text-xl">Nothing here yet</EmptyTitle>
          <EmptyDescription>
            This section arrives with its module. The catalogue, distribution board, release wizard
            and analytics are on their way.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </Card>
  );
}
