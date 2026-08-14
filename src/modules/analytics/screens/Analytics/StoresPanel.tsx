import { Card } from '@shared/ui';
import { cn } from '@shared/utils/cn';

import type { AnalyticsReport } from '../../api/types';
import { DeltaLabel } from '../../components/DeltaLabel';

export function StoresPanel({ stores }: { stores: AnalyticsReport['stores'] }) {
  return (
    <Card className="gap-4.5 p-4">
      <div className="flex items-baseline justify-between">
        <span className="font-semibold">Streams by store</span>
        <span className="font-mono text-xs text-faint">{stores.topShareLabel}</span>
      </div>

      <div className="flex flex-col gap-3.5">
        {stores.bars.map((store) => (
          <div key={store.id} className="grid grid-cols-[88px_1fr_96px_52px] items-center gap-3">
            <span className="text-sm text-subtle">{store.name}</span>

            <div className="h-2.5 overflow-hidden rounded-xs bg-canvas">
              <div
                className={cn('h-full rounded-xs', store.major ? 'bg-brand' : 'bg-dim')}
                style={{ width: `${store.widthPct}%` }}
              />
            </div>

            <span className="text-right font-mono text-sm">{store.streamsLabel}</span>
            <DeltaLabel delta={store.delta} className="text-right text-xs" />
          </div>
        ))}
      </div>
    </Card>
  );
}
