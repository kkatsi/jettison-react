import { Card, TimeSeriesChart, type TimeSeriesBand } from '@shared/ui';
import type { ReactNode } from 'react';

import type { ChartPanel } from '../../api/types';

export type ChartCardProps = {
  title: string;
  panel: ChartPanel;
  formatAxis: (value: number) => string;
  /** The legend or footnote on the right of the header. */
  note?: ReactNode;
  band?: TimeSeriesBand | null;
  area?: boolean;
};

export function ChartCard({ title, panel, formatAxis, note, band, area }: ChartCardProps) {
  return (
    <Card className="gap-1.5 p-4 pb-3">
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-2.5">
          <span className="font-semibold">{title}</span>
          <span className="font-mono text-xs text-faint">{panel.totalLabel}</span>
        </div>
        {note}
      </div>

      <TimeSeriesChart points={panel.points} formatAxis={formatAxis} band={band} area={area} />
    </Card>
  );
}
