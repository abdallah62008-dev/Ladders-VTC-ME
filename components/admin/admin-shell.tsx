// Admin Shell scaffold — Phase 1 sprint 1.
//
// Sidebar groups per /docs/11-admin-ui/01-information-architecture.md.
// Country Context Switcher in top bar per D-CSP-001.
// Build Now, Activate When Ready surfacing per D-READY-002.
//
// Sprint 1 ships placeholder routes only. Functional CRUD lands sprint 2+.

import Link from 'next/link';
import type { ReactNode } from 'react';
import { CountryContextSwitcher } from './country-context-switcher';
import type { CountryCode } from '@/lib/i18n/config';

export interface AdminShellProps {
  locale: string;
  children: ReactNode;
}

interface NavItem {
  href: string;
  label: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { href: 'admin', label: 'Dashboard' },
  { href: 'admin/products', label: 'Products' },
  { href: 'admin/countries', label: 'Countries' },
  { href: 'admin/warehouses', label: 'Warehouses' },
  { href: 'admin/audit', label: 'Audit Log' },
];

export function AdminShell({ locale, children }: AdminShellProps) {
  // Sprint 1 scaffold defaults: stub user with KSA-only access.
  // Sprint 2+ reads from session + user_country_access table.
  const stubAllowedCountries: readonly CountryCode[] = ['sa'];
  const stubHasAllCountriesAccess = false;
  const stubCurrent: CountryCode = 'sa';

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/admin`} className="text-lg font-semibold">
            Smart Ladders Admin
          </Link>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-800 uppercase">
            Phase 1 sprint 1 scaffold
          </span>
        </div>

        <div className="flex items-center gap-3">
          <CountryContextSwitcher
            allowedCountries={stubAllowedCountries}
            hasAllCountriesAccess={stubHasAllCountriesAccess}
            current={stubCurrent}
          />
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-56 border-r border-zinc-200 bg-white px-3 py-4">
          <nav>
            <ul className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={`/${locale}/${item.href}`}
                    className="block rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
