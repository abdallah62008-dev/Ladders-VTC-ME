// Page classification per D-CSP-002 (locked 2026-05-09).
//
// Every admin route declares country_scope_mode: 'scoped' | 'aware' | 'global'.
// CI grep test (scripts/ci/grep-checks.sh) rejects admin route files without
// this declaration.
//
// scoped:  page filtered by selected country
// aware:   page is global master data with country-specific overlay
// global:  page not affected by country selector
//
// See /docs/03-rbac/03-scopes.md §F for the full classification table.

export type CountryScopeMode = 'scoped' | 'aware' | 'global';

export interface PageClassification {
  readonly country_scope_mode: CountryScopeMode;
  readonly description?: string;
}

/**
 * Helper to declare a page's country_scope_mode in a way the CI grep test
 * can reliably detect. Use as:
 *
 *   export const classification = declarePageClassification('scoped', 'Orders');
 *
 * The string literal 'country_scope_mode' must appear in the source.
 */
export function declarePageClassification(
  mode: CountryScopeMode,
  description?: string,
): PageClassification {
  // The literal property name 'country_scope_mode' below is what the CI grep
  // test scans for. Do not refactor away.
  return {
    country_scope_mode: mode,
    description,
  };
}
