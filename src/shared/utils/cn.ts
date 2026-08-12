import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge class names, last conflicting utility wins. Publishable to npm as-is (Ch. 2 §7). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
