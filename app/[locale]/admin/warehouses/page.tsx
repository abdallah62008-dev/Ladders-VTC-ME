import { declarePageClassification } from '@/lib/rbac/page-classification';
import { StatusBadge } from '@/components/ui/status-badge';

// Warehouses page — country_scope_mode='scoped' per D-CSP-002.
// Per D-COUNTRY-013: Admin Dashboard is the Phase 1 inventory authority.
// No external ERP integration in Phase 1.
export const classification = declarePageClassification(
  'scoped',
  'Warehouse list scoped to selected country',
);

const placeholderWarehouses = [
  {
    code: 'RUH-01',
    name: 'Riyadh Main Warehouse',
    country: 'sa',
    status: 'pending_configuration' as const,
  },
];

export default function WarehousesPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Warehouses</h1>
        <span className="text-xs text-zinc-500">country_scope_mode: scoped</span>
      </header>

      <div className="rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-left">
            <tr>
              <th className="px-4 py-2 font-medium text-zinc-700">Code</th>
              <th className="px-4 py-2 font-medium text-zinc-700">Name</th>
              <th className="px-4 py-2 font-medium text-zinc-700">Country</th>
              <th className="px-4 py-2 font-medium text-zinc-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {placeholderWarehouses.map((w) => (
              <tr key={w.code} className="border-b border-zinc-100 last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{w.code}</td>
                <td className="px-4 py-3">{w.name}</td>
                <td className="px-4 py-3 uppercase">{w.country}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={w.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <strong>Inventory authority (D-COUNTRY-013):</strong> Admin Dashboard is the Phase 1
        inventory source of truth. No external ERP integration in Phase 1. Stock changes
        audit-logged via <code className="font-mono">stock_movement</code>. Manual adjustments
        require reason + audit log.
      </div>
    </div>
  );
}
