import { X } from 'lucide-react';

import { cn } from '@shared/utils/cn';

export type RaceMark = {
  /** 0–100, as a percentage across the axis. */
  left: number;
  time: string;
  label: string;
  tone: 'warning' | 'live';
};

export type NaiveBannerProps = {
  label: string;
  sublabel: string;
  description: string;
  race: {
    marks: RaceMark[];
    /** The stretch where the cache holds a list that is missing the new release. */
    window: { left: number; width: number; label: string };
  };
  remedy: string;
  /** Absent when the module that would demonstrate it has been thrown overboard. */
  action: { label: string; onSelect: () => void } | null;
  onDismiss: () => void;
};

// Props in, JSX out. Only under `?cache=naive`, where the console is deliberately
// running the broken path — drawn as the race it is, on the console's own axis.
export function NaiveBanner({
  label,
  sublabel,
  description,
  race,
  remedy,
  action,
  onDismiss,
}: NaiveBannerProps) {
  return (
    <div className="flex flex-none items-start gap-8 border-b border-line bg-panel px-6 py-4">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-baseline gap-2.5">
          <span className="font-mono text-2xs tracking-[0.14em] text-warning">{label}</span>
          <span className="font-mono text-2xs tracking-[0.08em] text-dim">{sublabel}</span>
        </div>

        <p className="max-w-3xl text-sm leading-relaxed text-subtle">{description}</p>
        <p className="max-w-3xl text-sm leading-relaxed text-faint">{remedy}</p>
      </div>

      <div className="relative mt-1 h-14 w-full max-w-2xl flex-none">
        <div className="absolute top-6 right-0 left-0 h-px bg-line" />
        <div className="absolute top-4.5 left-0 h-3 w-px bg-line-strong" />
        <div className="absolute top-9 left-0 font-mono text-2xs whitespace-nowrap text-dim">
          submit
        </div>

        <div
          className="absolute top-6 h-px bg-warning"
          style={{ left: `${race.window.left}%`, width: `${race.window.width}%` }}
        />
        <div
          className="absolute top-6 h-6 bg-warning/8"
          style={{ left: `${race.window.left}%`, width: `${race.window.width}%` }}
        />
        <div
          className="absolute top-9 font-mono text-2xs whitespace-nowrap text-warning/70"
          style={{
            left: `${race.window.left + race.window.width / 2}%`,
            transform: 'translateX(-50%)',
          }}
        >
          {race.window.label}
        </div>

        {race.marks.map((mark) => (
          <div
            key={mark.label}
            className="absolute top-0 -translate-x-1/2"
            style={{ left: `${mark.left}%` }}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="font-mono text-2xs whitespace-nowrap text-faint">{mark.time}</span>
              <span
                className={cn(
                  'size-1.5 rotate-45',
                  mark.tone === 'warning' ? 'bg-warning' : 'bg-live',
                )}
              />
            </div>
            <div className="mt-1.5 -translate-x-1/2 pl-[50%] font-mono text-2xs whitespace-nowrap text-dim">
              {mark.label}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-none items-center gap-1">
        {action ? (
          <button
            type="button"
            onClick={action.onSelect}
            className="h-7 rounded-lg border border-line px-3 text-sm whitespace-nowrap text-subtle hover:border-line-strong hover:text-text"
          >
            {action.label}
          </button>
        ) : null}

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="flex size-6.5 items-center justify-center rounded-lg text-dim hover:text-subtle"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
