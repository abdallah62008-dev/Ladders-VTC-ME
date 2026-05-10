// Readiness Badge per D-READY-001 + D-READY-002.
//
// Surfaces composite readiness score 0–100 OR a missing-requirements list.
// Used on entity list/edit views (products, countries, landing pages, shipping
// providers, etc.) to make "configured ≠ active" visible.

import { cn } from '@/lib/cn';

export interface ReadinessBadgeProps {
  score?: number; // 0–100
  missingRequirements?: readonly string[];
  className?: string;
}

function scoreColor(score: number): string {
  if (score >= 90) return 'text-green-700 bg-green-50 ring-green-200';
  if (score >= 75) return 'text-blue-700 bg-blue-50 ring-blue-200';
  if (score >= 60) return 'text-amber-800 bg-amber-50 ring-amber-200';
  return 'text-red-700 bg-red-50 ring-red-300';
}

function scoreLabel(score: number): string {
  if (score >= 90) return 'Ready';
  if (score >= 75) return 'Needs review';
  if (score >= 60) return 'Weak';
  return 'Do not publish';
}

export function ReadinessBadge({ score, missingRequirements, className }: ReadinessBadgeProps) {
  if (typeof score === 'number') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
          scoreColor(score),
          className,
        )}
        title={`Readiness: ${score}/100 — ${scoreLabel(score)}`}
        data-readiness-score={score}
      >
        <span className="font-semibold">{score}</span>
        <span className="text-[10px] tracking-wide uppercase">{scoreLabel(score)}</span>
      </span>
    );
  }

  if (missingRequirements && missingRequirements.length > 0) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-300 ring-inset',
          className,
        )}
        title={`Missing: ${missingRequirements.join(', ')}`}
      >
        ⚠ {missingRequirements.length} missing
      </span>
    );
  }

  return null;
}
