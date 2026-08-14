import { Switch } from '@shared/ui';
import { cn } from '@shared/utils/cn';

export type BackendIndicator = {
  label: string;
  demo: { label: string; isOn: boolean; onToggle: (isOn: boolean) => void };
};

export type TopbarProps = {
  title: string;
  backend: BackendIndicator;
};

const BARS = [5, 8, 12, 7];

// Props in, JSX out — no hook needed.
export function Topbar({ title, backend }: TopbarProps) {
  return (
    <header className="flex h-14 flex-none items-center gap-4 border-b border-line px-6">
      <h1 className="text-lg font-semibold">{title}</h1>

      {/* A control, boxed as one. */}
      <label
        className={cn(
          'ml-auto flex h-7.5 items-center gap-2.5 rounded-lg border px-2.5',
          backend.demo.isOn ? 'border-warning/40 bg-warning/6' : 'border-line bg-panel',
        )}
      >
        <span className={cn('font-mono text-xs', backend.demo.isOn ? 'text-warning' : 'text-idle')}>
          {backend.demo.label}
        </span>
        <Switch
          size="sm"
          checked={backend.demo.isOn}
          onCheckedChange={backend.demo.onToggle}
          className="data-checked:bg-warning"
        />
      </label>

      {/* A fact. The mock behaves the same in either mode, so this never changes. */}
      <div className="flex items-center gap-2">
        <div className="flex h-3 items-end gap-0.5" aria-hidden>
          {BARS.map((height, index) => (
            <span
              key={height}
              className={cn('w-0.5 bg-live', index === BARS.length - 1 && 'opacity-50')}
              style={{ height }}
            />
          ))}
        </div>
        <span className="font-mono text-xs text-idle">{backend.label}</span>
      </div>
    </header>
  );
}
