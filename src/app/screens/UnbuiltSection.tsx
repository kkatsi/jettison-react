import { Disc3 } from 'lucide-react';

import { Card, Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@shared/ui';

// Stands in for a section whose module hasn't shipped — and for a jettisoned one,
// whose bookmarks have to land somewhere.
export function UnbuiltSection() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto p-6">
      <Card className="flex min-h-100 flex-1 flex-col justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Disc3 />
            </EmptyMedia>
            <EmptyTitle className="text-xl">Nothing here yet</EmptyTitle>
            <EmptyDescription>
              This section arrives with its module. The catalogue, distribution board, release
              wizard and analytics are on their way.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Card>
    </div>
  );
}
