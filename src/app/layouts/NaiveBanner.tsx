import { X } from 'lucide-react';

export type NaiveBannerProps = {
  label: string;
  sublabel: string;
  description: string;
  /** Absent when the module that would demonstrate it has been thrown overboard. */
  action: { label: string; onSelect: () => void } | null;
  onDismiss: () => void;
};

// Props in, JSX out. Only under `?cache=naive`, where the console is deliberately
// running the broken path.
export function NaiveBanner({ label, sublabel, description, action, onDismiss }: NaiveBannerProps) {
  return (
    <div className="flex flex-none items-baseline gap-3 border-b border-line bg-panel px-6 py-3">
      <span className="font-mono text-2xs tracking-[0.14em] whitespace-nowrap text-warning">
        {label}
      </span>
      <span className="font-mono text-2xs tracking-[0.08em] whitespace-nowrap text-dim">
        {sublabel}
      </span>

      <p className="max-w-4xl text-sm leading-relaxed text-subtle">{description}</p>

      <div className="ml-auto flex flex-none items-center gap-1 self-center">
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
