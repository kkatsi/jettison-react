import { cn } from '@shared/utils/cn';

export type FieldProps = {
  label: string;
  /** What the label cannot say in two words. Replaced by an error when there is one. */
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
};

// Props in, JSX out: every field in the wizard is a label, a control and one line
// underneath, and they line up because they are all this component.
export function Field({ label, hint, error, className, children }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label className="text-sm font-medium text-subtle">{label}</label>
      {children}
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-faint">{hint}</p>
      ) : null}
    </div>
  );
}
