import { Switch } from '@shared/ui';
import { cn } from '@shared/utils/cn';

export type BackendIndicator = {
  label: string;
  /** `true` when the console is deliberately running the broken cache demo. */
  degraded: boolean;
  demo: { label: string; isOn: boolean; onToggle: (isOn: boolean) => void };
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

      <div className="ml-auto flex items-center gap-3">
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
        <span className="font-mono text-xs text-idle">{backend.label}</span>

        <span className="h-5 w-px bg-line" />

        <label className="flex items-center gap-2">
          <span
            className={cn('font-mono text-xs', backend.degraded ? 'text-warning' : 'text-idle')}
          >
            {backend.demo.label}
          </span>
          <Switch
            size="sm"
            checked={backend.demo.isOn}
            onCheckedChange={backend.demo.onToggle}
            className="data-checked:bg-warning"
          />
        </label>
      </div>
    </header>
  );
}
