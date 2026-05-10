import { declarePageClassification } from '@/lib/rbac/page-classification';

// Audit log — country_scope_mode='global' (with optional country filter)
// per D-CSP-002.
export const classification = declarePageClassification(
  'global',
  'Audit log global view with optional country filter',
);

export default function AuditPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
        <span className="text-xs text-zinc-500">country_scope_mode: global</span>
      </header>

      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
        Audit log will populate as Phase 1 sprint 2+ migrations land and audit triggers fire.
        <br />
        <br />
        Per D-DB-010: <code className="font-mono">audit_log</code> is Class 2 (never hard-deleted);
        7-year retention; only <code className="font-mono">sensitive_cleanup_override</code> can
        archive entries.
      </div>
    </div>
  );
}
