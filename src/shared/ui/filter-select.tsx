import { cn } from '@shared/utils/cn';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

export type FilterOption = { value: string; label: string };

export type FilterSelectProps = {
  /** Sits inside the trigger, dimmed: "Type single" reads as one control. */
  label: string;
  options: readonly FilterOption[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
};

/**
 * The console's filter control. Born inside activity's feed screen; promoted
 * here when the catalogue became a second module needing exactly it (Ch. 2 §6).
 */
export function FilterSelect({
  label,
  options,
  value,
  onValueChange,
  className,
}: FilterSelectProps) {
  return (
    // An empty value can't happen here — the select isn't clearable — and would
    // fall back to the default on the next read anyway.
    <Select items={options} value={value} onValueChange={(next) => onValueChange(next ?? '')}>
      <SelectTrigger size="sm" className={cn('h-7.5 gap-2 bg-panel text-sm', className)}>
        <span className="text-idle">{label}</span>
        <SelectValue className="font-mono text-xs text-subtle" />
      </SelectTrigger>
      <SelectContent className="min-w-44">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="font-mono text-xs">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
