import { declarePageClassification } from '@/lib/rbac/page-classification';
import { StatusBadge } from '@/components/ui/status-badge';
import { ReadinessBadge } from '@/components/ui/readiness-badge';

// Products page is country_scope_mode='aware' per D-CSP-002:
// the product master is global; per-country context (price/stock/readiness)
// surfaces for the active country selector.
export const classification = declarePageClassification(
  'aware',
  'Products: global master + per-country context overlay',
);

export default function ProductsPage() {
  // Sprint 1 placeholder rows. Sprint 2+ reads from product + product_country_readiness.
  const placeholderProducts = [
    {
      sku: 'VTC-TEL-OS-4.4M',
      name: 'Telescopic One Side 4.4m',
      status: 'pending_configuration' as const,
      readiness: 0,
      missing: ['country_price', 'warehouse_stock', 'media', 'arabic_copy'],
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <span className="text-xs text-zinc-500">country_scope_mode: aware</span>
      </header>

      <div className="rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-left">
            <tr>
              <th className="px-4 py-2 font-medium text-zinc-700">SKU</th>
              <th className="px-4 py-2 font-medium text-zinc-700">Name</th>
              <th className="px-4 py-2 font-medium text-zinc-700">Status</th>
              <th className="px-4 py-2 font-medium text-zinc-700">Readiness</th>
            </tr>
          </thead>
          <tbody>
            {placeholderProducts.map((p) => (
              <tr key={p.sku} className="border-b border-zinc-100 last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                <td className="px-4 py-3">{p.name}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-3">
                  <ReadinessBadge missingRequirements={p.missing} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
