import { X } from 'lucide-react';

export type NaiveBannerProps = {
  title: string;
  description: string;
  /** Absent when the module that would demonstrate it has been thrown overboard. */
  action: { label: string; onSelect: () => void } | null;
  onDismiss: () => void;
};

// Props in, JSX out. Only ever rendered under `?cache=naive`, where the console
// is deliberately running the broken path.
export function NaiveBanner({ title, description, action, onDismiss }: NaiveBannerProps) {
  return (
    <div className="flex flex-none items-center gap-3.5 border-b border-warning/25 bg-warning/6 px-6 py-3">
      <span className="flex size-5 flex-none items-center justify-center rounded-sm bg-warning/12 text-xs font-bold text-warning">
        !
      </span>

      <div className="flex min-w-0 flex-col gap-0.75">
        <span className="text-warning/90">{title}</span>
        <span className="text-sm text-warning/60">{description}</span>
      </div>

      {action ? (
        <button
          type="button"
          onClick={action.onSelect}
          className="ml-auto h-7 flex-none rounded-lg border border-warning/30 bg-warning/6 px-3 text-sm text-warning hover:bg-warning/12"
        >
          {action.label}
        </button>
      ) : null}

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className={`flex size-6.5 flex-none items-center justify-center rounded-lg text-warning/50 hover:text-warning ${action ? '' : 'ml-auto'}`}
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
