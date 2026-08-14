import { ChevronRight, X } from 'lucide-react';

export type NaiveBannerProps = {
  title: string;
  description: string;
  /** The race, in the order it happens. */
  sequence: string[];
  remedy: string;
  /** Absent when the module that would demonstrate it has been thrown overboard. */
  action: { label: string; onSelect: () => void } | null;
  onDismiss: () => void;
};

// Props in, JSX out. Only ever rendered under `?cache=naive`, where the console
// is deliberately running the broken path.
export function NaiveBanner({
  title,
  description,
  sequence,
  remedy,
  action,
  onDismiss,
}: NaiveBannerProps) {
  return (
    <div className="flex flex-none items-start gap-3.5 border-b border-warning/25 bg-warning/6 px-6 py-3.5">
      <span className="mt-0.5 flex size-5 flex-none items-center justify-center rounded-sm bg-warning/12 text-xs font-bold text-warning">
        !
      </span>

      <div className="flex min-w-0 flex-col gap-2">
        <span className="font-medium text-warning/90">{title}</span>
        <p className="max-w-4xl text-sm leading-relaxed text-warning/60">{description}</p>

        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs text-warning/70">
          {sequence.map((step, index) => (
            <span key={step} className="flex items-center gap-1.5">
              {index > 0 ? <ChevronRight className="size-3 text-warning/40" /> : null}
              <span className="rounded-sm bg-warning/10 px-1.5 py-0.5">{step}</span>
            </span>
          ))}
        </div>

        <p className="max-w-4xl text-sm leading-relaxed text-warning/60">{remedy}</p>
      </div>

      <div className="ml-auto flex flex-none items-center gap-1">
        {action ? (
          <button
            type="button"
            onClick={action.onSelect}
            className="h-7 rounded-lg border border-warning/30 bg-warning/6 px-3 text-sm whitespace-nowrap text-warning hover:bg-warning/12"
          >
            {action.label}
          </button>
        ) : null}

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="flex size-6.5 items-center justify-center rounded-lg text-warning/50 hover:text-warning"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
