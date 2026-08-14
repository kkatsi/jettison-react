import { cn } from '@shared/utils/cn';

export type CacheModeOption = {
  value: string;
  label: string;
  isCurrent: boolean;
  onSelect: () => void;
};

export type BackendIndicator = {
  sublabel: string;
  /** `true` when the console is deliberately running the broken cache demo. */
  degraded: boolean;
  modes: CacheModeOption[];
};

export type TopbarProps = {
  title: string;
  backend: BackendIndicator;
};

// Props in, JSX out — no hook needed.
export function Topbar({ title, backend }: TopbarProps) {
  const bars = [5, 8, 12, 7];

  return (
    <header className="flex h-14 flex-none items-center gap-4 border-b border-line px-6">
      <h1 className="text-lg font-semibold">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        {/* Signal strength: how the mock backend is behaving today. */}
        <div className="flex h-3 items-end gap-0.5" aria-hidden>
          {bars.map((height, index) => (
            <span
              key={height}
              className={cn(
                'w-0.5',
                backend.degraded ? 'bg-warning' : 'bg-live',
                index === bars.length - 1 && 'opacity-50',
              )}
              style={{ height }}
            />
          ))}
        </div>

        <div className="flex flex-col items-end gap-1">
          <div
            role="group"
            aria-label="Cache mode"
            className="flex gap-0.5 rounded-lg border border-line bg-panel p-0.5"
          >
            {backend.modes.map((mode) => (
              <button
                key={mode.value}
                type="button"
                onClick={mode.onSelect}
                aria-pressed={mode.isCurrent}
                className={cn(
                  'h-5 rounded-md px-2 font-mono text-xs',
                  mode.isCurrent && !backend.degraded && 'bg-live/12 text-live',
                  mode.isCurrent && backend.degraded && 'bg-warning/12 text-warning',
                  !mode.isCurrent && 'text-idle hover:text-subtle',
                )}
              >
                {mode.label}
              </button>
            ))}
          </div>
          <div className="font-mono text-3xs text-faint">{backend.sublabel}</div>
        </div>
      </div>
    </header>
  );
}
