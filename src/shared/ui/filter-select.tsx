import { cn } from '@shared/utils/cn';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

/** Generic over its values, so a screen's filter union survives the round trip. */
export type FilterOption<Value extends string = string> = { value: Value; label: string };

export type FilterSelectProps<Value extends string> = {
  /** Sits inside the trigger, dimmed: "Type single" reads as one control. */
  label: string;
  options: readonly FilterOption<Value>[];
  value: Value;
  onValueChange: (value: Value) => void;
  className?: string;
};

/** Born in activity's feed; promoted when the catalogue needed exactly it (Ch. 2 §6). */
export function FilterSelect<Value extends string>({
  label,
  options,
  value,
  onValueChange,
  className,
}: FilterSelectProps<Value>) {
  return (
    // The select isn't clearable, so `null` never arrives — and dropping it beats
    // inventing an empty value that every filter union would have to admit.
    <Select
      items={options}
      value={value}
      onValueChange={(next) => {
        if (next !== null) onValueChange(next);
      }}
    >
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
