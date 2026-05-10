// Status Badge per D-READY-002 ("Build Now, Activate When Ready").
//
// Configured ≠ active. Every entity with a status lifecycle surfaces a
// color-coded badge. Customer-facing surfaces only render entities with
// status === 'active' (enforced backend; this component is presentation only).
//
// Canonical states per /docs/GLOSSARY.md "Build Now, Activate When Ready":
//   draft / pending_configuration / pending_approval / ready / active / paused / blocked / archived

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
  {
    variants: {
      status: {
        draft: 'bg-zinc-50 text-zinc-700 ring-zinc-200',
        pending_configuration: 'bg-amber-50 text-amber-800 ring-amber-200',
        pending_approval: 'bg-amber-50 text-amber-800 ring-amber-300',
        ready: 'bg-blue-50 text-blue-800 ring-blue-200',
        active: 'bg-green-50 text-green-800 ring-green-200',
        paused: 'bg-orange-50 text-orange-800 ring-orange-200',
        blocked: 'bg-red-50 text-red-800 ring-red-300',
        archived: 'bg-zinc-50 text-zinc-500 ring-zinc-200',
      },
    },
    defaultVariants: {
      status: 'draft',
    },
  },
);

export type StatusValue =
  | 'draft'
  | 'pending_configuration'
  | 'pending_approval'
  | 'ready'
  | 'active'
  | 'paused'
  | 'blocked'
  | 'archived';

export interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  status: StatusValue;
  label?: string;
  className?: string;
}

const dotByStatus: Record<StatusValue, string> = {
  draft: 'bg-zinc-400',
  pending_configuration: 'bg-amber-500',
  pending_approval: 'bg-amber-600',
  ready: 'bg-blue-500',
  active: 'bg-green-500',
  paused: 'bg-orange-500',
  blocked: 'bg-red-500',
  archived: 'bg-zinc-400',
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(statusBadgeVariants({ status }), className)}
      data-status={status}
      aria-label={`Status: ${label ?? status}`}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', dotByStatus[status])} aria-hidden="true" />
      {label ?? status.replace(/_/g, ' ')}
    </span>
  );
}
