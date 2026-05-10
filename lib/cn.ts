import { clsx, type ClassValue } from 'clsx';

// Lightweight class-name helper. Used by status-badge, readiness-badge,
// country-context-switcher, admin-shell, etc.
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
