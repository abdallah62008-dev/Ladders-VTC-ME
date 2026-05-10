import { declarePageClassification } from '@/lib/rbac/page-classification';
import { StatusBadge } from '@/components/ui/status-badge';

// Countries page — country_scope_mode='global' per D-CSP-002.
// Managing the country list itself is a meta-level system action; not filtered
// by the country selector (super_admin / country_manager only).
export const classification = declarePageClassification(
  'global',
  'Manage country list (meta-level admin)',
);

// Sprint 1 placeholder. Sprint 2+ reads from country + country_launch_readiness.
const placeholderCountries = [
  { code: 'sa', name: 'Saudi Arabia', status: 'pending_configuration' as const },
  { code: 'eg', name: 'Egypt', status: 'draft' as const },
  { code: 'iq', name: 'Iraq', status: 'draft' as const },
];

export default function CountriesPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Countries</h1>
        <span className="text-xs text-zinc-500">country_scope_mode: global</span>
      </header>

      <div className="rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-left">
            <tr>
              <th className="px-4 py-2 font-medium text-zinc-700">Code</th>
              <th className="px-4 py-2 font-medium text-zinc-700">Name</th>
              <th className="px-4 py-2 font-medium text-zinc-700">Status</th>
              <th className="px-4 py-2 font-medium text-zinc-700">Activation</th>
            </tr>
          </thead>
          <tbody>
            {placeholderCountries.map((c) => (
              <tr key={c.code} className="border-b border-zinc-100 last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{c.code}</td>
                <td className="px-4 py-3">{c.name}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={c.status} />
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    disabled
                    className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-400"
                    title="D-READY-002: activation requires all readiness checks to pass"
                  >
                    Activate (disabled)
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
