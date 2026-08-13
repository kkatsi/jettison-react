import { cn } from '@shared/utils/cn';

import { Card } from './card';
import { TONE_TEXT, type Tone } from './status-badge';

export type StatTileProps = {
  label: string;
  /** Pre-formatted — the tile renders numbers, it doesn't format them (R3). */
  value: string;
  delta?: { value: string; tone: Tone };
  hint: string;
};

export function StatTile({ label, value, delta, hint }: StatTileProps) {
  return (
    <Card className="gap-3 py-4">
      <div className="px-4 text-sm font-medium text-subtle">{label}</div>
      <div className="flex items-baseline gap-2.5 px-4">
        <span className="font-mono text-[26px] leading-none font-medium tracking-tight">
          {value}
        </span>
        {delta ? (
          <span className={cn('font-mono text-sm leading-none', TONE_TEXT[delta.tone])}>
            {delta.value}
          </span>
        ) : null}
      </div>
      <div className="px-4 text-sm text-faint">{hint}</div>
    </Card>
  );
}
