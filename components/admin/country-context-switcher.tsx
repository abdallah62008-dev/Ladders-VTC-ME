'use client';

// Country Context Switcher per D-CSP-001 (locked 2026-05-09).
//
// Top-bar admin widget. Phase 1 sprint 1 SCAFFOLD: read-only; backend
// permissions not fully implemented. Sprint 2+ wires user_country_access
// + permission cache + X-Country-Context header per /docs/03-rbac/03-scopes.md §I.
//
// CRITICAL SAFETY NOTE: this component does NOT bypass RBAC. All country-scoped
// queries use RLS at the DB layer. The selector is UX only — backend independently
// validates X-Country-Context against the user's allowed countries on every
// request and returns 403 if invalid (per /docs/02-api/01-conventions.md).

import { useState } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { cn } from '@/lib/cn';
import { countries, type CountryCode } from '@/lib/i18n/config';

export interface CountryContextSwitcherProps {
  /** Countries this user can access (from user_country_access). */
  allowedCountries: readonly CountryCode[];
  /** True if user has country_scope.all permission. */
  hasAllCountriesAccess: boolean;
  /** Currently selected country, or 'all' for All Countries mode. */
  current: CountryCode | 'all';
  onChange?: (next: CountryCode | 'all') => void;
  /** When true, the page itself is country_scope_mode='global'; selector greyed out. */
  pageIsGlobal?: boolean;
}

const countryNames: Record<CountryCode, string> = {
  sa: 'Saudi Arabia',
  eg: 'Egypt',
  iq: 'Iraq',
};

export function CountryContextSwitcher({
  allowedCountries,
  hasAllCountriesAccess,
  current,
  onChange,
  pageIsGlobal = false,
}: CountryContextSwitcherProps) {
  const [open, setOpen] = useState(false);

  // Single-country user → fixed label (no dropdown affordance per D-CSP-001 UX).
  const isSingleCountry = !hasAllCountriesAccess && allowedCountries.length === 1;

  if (pageIsGlobal) {
    return (
      <div
        className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-500"
        title="This page is global — country selector does not apply"
      >
        <Globe className="h-4 w-4" aria-hidden />
        <span>Global page</span>
      </div>
    );
  }

  if (isSingleCountry) {
    // tsconfig has noUncheckedIndexedAccess: true → allowedCountries[0]
    // is typed `CountryCode | undefined`. The `isSingleCountry` boolean
    // guarantees length === 1 at runtime, but TS doesn't narrow array
    // indexing through length checks. Add an explicit type guard so
    // `c` is narrowed to `CountryCode` before indexing `countryNames`.
    const c = allowedCountries[0];
    if (!c) return null;
    return (
      <div className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm">
        <Globe className="h-4 w-4 text-zinc-500" aria-hidden />
        <span className="font-medium">Country: {countryNames[c]}</span>
      </div>
    );
  }

  const currentLabel = current === 'all' ? 'All Countries' : countryNames[current];
  const isAllMode = current === 'all';

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium',
          isAllMode
            ? 'border-orange-300 bg-orange-50 text-orange-900'
            : 'border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50',
        )}
      >
        <Globe className="h-4 w-4" aria-hidden />
        <span>Country: {currentLabel}</span>
        <ChevronDown className="h-4 w-4 text-zinc-500" aria-hidden />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute top-full right-0 z-10 mt-1 w-56 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg"
        >
          {countries
            .filter((c) => allowedCountries.includes(c))
            .map((c) => (
              <li key={c}>
                <button
                  type="button"
                  role="option"
                  aria-selected={current === c}
                  onClick={() => {
                    onChange?.(c);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-50',
                    current === c && 'bg-zinc-50 font-medium',
                  )}
                >
                  {countryNames[c]}
                  {current === c && <span className="ml-auto text-green-600">✓</span>}
                </button>
              </li>
            ))}
          {hasAllCountriesAccess && (
            <>
              <li className="border-t border-zinc-100" role="separator" />
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={current === 'all'}
                  onClick={() => {
                    onChange?.('all');
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-orange-50',
                    current === 'all' && 'bg-orange-50 font-medium text-orange-900',
                  )}
                >
                  All Countries
                  {current === 'all' && <span className="ml-auto text-orange-600">✓</span>}
                </button>
              </li>
            </>
          )}
        </ul>
      )}
    </div>
  );
}
