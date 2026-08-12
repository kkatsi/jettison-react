import { cn } from '@shared/utils/cn';

export type BackendIndicator = {
  label: string;
  sublabel: string;
  /** `true` when the console is deliberately running the broken cache demo. */
  degraded: boolean;
};

export type TopbarProps = {
  title: string;
  backend: BackendIndicator;
};

/** Presentational: props in, JSX out, no hook (R2). */
export function Topbar({ title, backend }: TopbarProps) {
  const bars = [5, 8, 12, 7];

  return (
    <header className="flex h-14 flex-none items-center gap-4 border-b border-line px-6">
      <h1 className="text-lg font-semibold">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        {/* Signal strength: the mock backend, and how it is behaving today. */}
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
        <div className="leading-tight">
          <div className={cn('font-mono text-xs', backend.degraded ? 'text-warning' : 'text-text')}>
            {backend.label}
          </div>
          <div className="font-mono text-3xs text-faint">{backend.sublabel}</div>
        </div>
      </div>
    </header>
  );
}
