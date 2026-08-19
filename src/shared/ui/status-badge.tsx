import { cn } from '@shared/utils/cn';

import { Badge } from './badge';

/** Tones, not release statuses: shared may not speak the domain (Ch. 2 §7). */
export type Tone = 'live' | 'warning' | 'danger' | 'idle' | 'brand';

export const TONE_TEXT = {
  live: 'text-live',
  warning: 'text-warning',
  danger: 'text-danger',
  idle: 'text-idle',
  brand: 'text-brand-soft',
} satisfies Record<Tone, string>;

const TONE_SURFACE = {
  live: 'bg-live/10',
  warning: 'bg-warning/10',
  danger: 'bg-danger/10',
  idle: 'bg-idle/12',
  brand: 'bg-brand/10',
} satisfies Record<Tone, string>;

export type StatusBadgeProps = {
  tone: Tone;
  /** Pulses the dot — for states the backend is still working through. */
  busy?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function StatusBadge({ tone, busy = false, className, children }: StatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn('h-5.5 gap-1.5 px-2.25', TONE_SURFACE[tone], TONE_TEXT[tone], className)}
    >
      <span className={cn('size-1.25 rounded-full bg-current', busy && 'animate-pulse')} />
      {children}
    </Badge>
  );
}
