import { Button, Card, ScreenFallback } from '@shared/ui';
import { cn } from '@shared/utils/cn';

import type { Kpi } from '../../api/types';
import { DeltaLabel } from '../../components/DeltaLabel';
import { ScopePicker } from '../../components/ScopePicker';
import { ChartCard } from './ChartCard';
import { StoresPanel } from './StoresPanel';
import { TopTracksPanel } from './TopTracksPanel';
import { useAnalytics } from './useAnalytics';

// What the label earned, by scope and by window.
export function Analytics() {
  const { isLoading, failure, report, scope, range, axis } = useAnalytics();

  if (isLoading) return <ScreenFallback />;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-6">
      <div className="flex flex-none items-center gap-2.5">
        <ScopePicker groups={scope.groups} selected={scope.selected} onSelect={scope.onSelect} />

        <div className="inline-flex gap-0.5 rounded-md border border-line bg-panel p-0.75">
          {range.options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => range.onSelect(option.value)}
              className={cn(
                'h-6.5 rounded-md px-3.5 font-mono text-xs',
                option.value === range.value
                  ? 'bg-brand text-white'
                  : 'text-subtle hover:text-text',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {report ? (
          <div className="ml-auto flex items-center gap-6">
            {report.kpis.map((kpi) => (
              <Figure key={kpi.label} kpi={kpi} />
            ))}
          </div>
        ) : null}
      </div>

      {failure ? (
        <Card className="flex min-h-100 flex-1 items-center justify-center gap-3">
          <span className="font-mono text-xs text-dim">The numbers could not be loaded.</span>
          <Button variant="outline" size="sm" onClick={failure.retry}>
            Try again
          </Button>
        </Card>
      ) : null}

      {report ? (
        <div className="grid flex-none grid-cols-2 gap-4">
          <ChartCard
            title="Daily streams"
            panel={report.streams}
            formatAxis={axis.streams}
            band={report.streams.band}
            note={
              report.streams.spikeLabel ? (
                <div className="flex items-center gap-1.75">
                  <span className="size-2 rounded-xs border border-brand/40 bg-brand/15" />
                  <span className="text-xs text-faint">{report.streams.spikeLabel}</span>
                </div>
              ) : null
            }
          />

          <ChartCard
            title="Revenue"
            panel={report.revenue}
            formatAxis={axis.revenue}
            area
            note={<span className="font-mono text-2xs text-dim">net of distribution fees</span>}
          />

          <StoresPanel stores={report.stores} comparisonLabel={report.comparisonLabel} />
          <TopTracksPanel
            tracks={report.tracks}
            rangeLabel={report.rangeLabel}
            comparisonLabel={report.comparisonLabel}
          />
        </div>
      ) : null}
    </div>
  );
}

function Figure({ kpi }: { kpi: Kpi }) {
  return (
    <div className="flex flex-col items-start gap-0.75">
      <span className="text-xs text-faint">{kpi.label}</span>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-xl">{kpi.value}</span>
        <DeltaLabel delta={kpi.delta} className="text-xs" />
      </div>
    </div>
  );
}
