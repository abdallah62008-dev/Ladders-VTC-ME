import { declarePageClassification } from '@/lib/rbac/page-classification';
import { StatusBadge } from '@/components/ui/status-badge';

// Admin dashboard — country_scope_mode is required per D-CSP-002.
// Dashboard shows per-country KPIs, so it's 'scoped'.
export const classification = declarePageClassification(
  'scoped',
  'Admin dashboard with per-country KPIs',
);

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <StatusBadge status="pending_configuration" label="Sprint 1 scaffold" />
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: 'Active products', value: '—' },
          { label: 'Active warehouses', value: '—' },
          { label: 'Open orders', value: '—' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="text-sm text-zinc-500">{stat.label}</div>
            <div className="mt-1 text-2xl font-semibold text-zinc-900">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <strong>Build Now, Activate When Ready (D-READY-002):</strong> dashboard is{' '}
        <code className="font-mono">pending_configuration</code> until country, products, warehouses
        are seeded and activated.
      </div>
    </div>
  );
}
