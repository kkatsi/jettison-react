import { Card } from '@shared/ui';

import type { AnalyticsReport } from '../../api/types';
import { DeltaLabel } from '../../components/DeltaLabel';

// One template for the header and every row, so the columns cannot drift apart.
const ROW = 'grid grid-cols-[84px_1fr_40px_104px_76px] items-center gap-3';

export function StoresPanel({
  stores,
  comparisonLabel,
}: {
  stores: AnalyticsReport['stores'];
  comparisonLabel: string;
}) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex h-12 flex-none items-center border-b border-line px-4">
        <span className="font-semibold">Streams by store</span>
        <span className="ml-auto font-mono text-xs text-faint">{stores.totalLabel}</span>
      </div>

      <div
        className={`${ROW} h-7.5 border-b border-line px-4 text-xs font-medium text-idle`}
        aria-hidden
      >
        <span>Store</span>
        <span>Share</span>
        <span />
        <span className="text-right">Streams</span>
        <span className="text-right">{comparisonLabel}</span>
      </div>

      {/* Rows the height of the tracks table's beside it, so the two panels rhyme. */}
      <div className="flex flex-col px-4 py-1">
        {stores.bars.map((store) => (
          <div key={store.id} className={`${ROW} h-10.25`}>
            <span className="truncate text-sm text-subtle">{store.name}</span>

            <div className="h-2.5 overflow-hidden rounded-xs bg-canvas">
              <div className="h-full rounded-xs bg-brand" style={{ width: `${store.widthPct}%` }} />
            </div>

            <span className="text-right font-mono text-xs text-subtle">{store.shareLabel}</span>
            <span className="text-right font-mono text-sm">{store.streamsLabel}</span>
            <DeltaLabel delta={store.delta} className="text-right text-xs" />
          </div>
        ))}
      </div>
    </Card>
  );
}
