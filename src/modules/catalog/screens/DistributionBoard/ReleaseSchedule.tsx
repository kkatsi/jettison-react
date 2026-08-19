import { useState } from 'react';

import { Artwork, Card, StatusBadge } from '@shared/ui';
import { cn } from '@shared/utils/cn';

import type { SchedulePin } from './useDistributionBoard';
import type { ScheduleAxis } from './board-timeline';

// Street dates for everything in the pipeline, on one four-week axis.
export function ReleaseSchedule({ axis, pins }: { axis: ScheduleAxis; pins: SchedulePin[] }) {
  // Which pin the pointer is on: local UI state, so it stays in the component
  // (Ch. 4 §2) rather than travelling through the view-model.
  const [hovered, setHovered] = useState<string | null>(null);
  const active = pins.find((pin) => pin.id === hovered) ?? null;

  return (
    <Card className="flex-none gap-0 px-5 pt-4 pb-5">
      <div className="mb-5.5 flex items-baseline gap-2.5">
        <span className="font-semibold">Release schedule</span>
        <span className="text-sm text-faint">
          Street dates for submissions currently in the pipeline
        </span>
        <span className="ml-auto font-mono text-xs text-faint">{axis.rangeLabel}</span>
      </div>

      <div className="relative h-29.5">
        <div className="absolute top-13 right-0 left-0 h-px bg-line" />

        {axis.weeks.map((week) => (
          <div key={week.label}>
            <div
              className="absolute top-13 h-1.5 w-px bg-line-strong/70"
              style={{ left: `${week.left}%` }}
            />
            {week.showLabel ? (
              <div
                className="absolute top-16 font-mono text-2xs whitespace-nowrap text-dim"
                style={{ left: `${week.left}%` }}
              >
                {week.label}
              </div>
            ) : null}
          </div>
        ))}

        {axis.todayLeft === null ? null : (
          <>
            <div
              className="absolute top-3.5 h-9.5 w-px bg-brand"
              style={{ left: `${axis.todayLeft}%` }}
            />
            <div
              className="absolute top-0 -translate-x-1/2 font-mono text-3xs tracking-[0.08em] whitespace-nowrap text-brand-soft"
              style={{ left: `${axis.todayLeft}%` }}
            >
              TODAY
            </div>
          </>
        )}

        {pins.map((pin) => (
          <div
            key={pin.id}
            onMouseEnter={() => setHovered(pin.id)}
            onMouseLeave={() => setHovered(null)}
            className="absolute top-3 flex -translate-x-1/2 cursor-default flex-col items-center"
            style={{ left: `${pin.left}%` }}
          >
            <Artwork artwork={pin.artwork} className="size-7.5 border border-line-strong/60" />
            <div className={cn('h-2 w-px', toneRule[pin.tone])} />
            <div
              className={cn(
                '-mt-px size-1.75 rounded-full border-1.5 bg-panel',
                toneRing[pin.tone],
              )}
            />
            <div className="mt-1.5 font-mono text-2xs whitespace-nowrap text-subtle">
              {pin.dateLabel}
            </div>
            {pin.showTitle ? (
              <div className="mt-0.75 max-w-24 truncate text-xs text-faint">{pin.title}</div>
            ) : null}
          </div>
        ))}

        {active ? (
          <div
            className="pointer-events-none absolute top-17 z-5 flex items-center gap-3 rounded-xl border border-line-strong bg-raised px-3.5 py-2.5 shadow-lg shadow-black/45"
            style={{
              left: `${active.left}%`,
              transform: `translateX(${active.left < 18 ? '-8%' : active.left > 78 ? '-92%' : '-50%'})`,
            }}
          >
            <Artwork artwork={active.artwork} className="size-8.5" />
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="font-medium">{active.detail.title}</span>
                <span className="font-mono text-2xs text-faint">{active.detail.catalogNumber}</span>
              </div>
              <div className="flex items-center gap-2.5 whitespace-nowrap">
                <span className="text-xs text-subtle">{active.detail.artistName}</span>
                <span className="text-dim">·</span>
                <span className="font-mono text-xs text-subtle">{active.detail.releaseDate}</span>
                <span className="text-dim">·</span>
                <span className="font-mono text-xs text-subtle">{active.detail.storeLabel}</span>
                <StatusBadge tone={active.detail.stage.tone}>
                  {active.detail.stage.label}
                </StatusBadge>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

const toneRule = {
  live: 'bg-live',
  warning: 'bg-warning',
  danger: 'bg-danger',
  idle: 'bg-idle',
  brand: 'bg-brand',
} satisfies Record<SchedulePin['tone'], string>;

const toneRing = {
  live: 'border-live',
  warning: 'border-warning',
  danger: 'border-danger',
  idle: 'border-idle',
  brand: 'border-brand',
} satisfies Record<SchedulePin['tone'], string>;
