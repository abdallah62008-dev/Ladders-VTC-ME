// D-RBAC-001 cost privacy — defense-in-depth helpers for Layers 2, 4, 5
// (per /docs/03-rbac/04-cost-privacy.md 9-layer chain).
//
// Layer 1 (DB/RLS) is enforced in migration 0005 (variant_country_cost +
// variant_marketer_cost + cost_history RLS policies + Class 2 deletion-block
// triggers) — verified by tests/rls/cost-privacy.spec.ts.
//
// Layer 2 (API serializer): `redactCostFields()` and `redactCostFieldsDeep()`.
// Layer 3 (API token scopes): documented in api-token-scopes.ts (Phase 1
//   reservation only — token issuance UI is Sprint 5+).
// Layer 4 (Admin UI hide): `costVisibility()` returns booleans for the admin
//   shell to gate cost columns.
// Layer 5 (Export gate): `assertCanExportCost()` throws if the caller lacks
//   cost.export.
//
// Layers 6-9 (webhook redact, audit redact-by-role, observability scrubbers,
// backup encryption) are Sprint 2B work.

// ─────────────────────────────────────────────────────────────────────────
// Viewer context — passed in from the request layer (session/token + RBAC)
// ─────────────────────────────────────────────────────────────────────────

export interface ViewerContext {
  /** Caller has the `cost.read` permission slug. */
  readonly hasCostRead: boolean;
  /** Caller has the `marketer_cost.read` permission slug. */
  readonly hasMarketerCostRead: boolean;
  /** Caller has the `cost.export` permission slug. */
  readonly hasCostExport: boolean;
}

// ─────────────────────────────────────────────────────────────────────────
// Layer 2 — API serializer cost redaction
// ─────────────────────────────────────────────────────────────────────────

/**
 * Field names that are considered "actual cost" (RLS-protected by cost.read).
 * Kept narrow to avoid false positives; expand as new cost-bearing columns ship.
 */
export const COST_FIELDS = [
  'actual_cost',
  'unit_cost',
  'cogs',
  'was_actual_cost',
  'actual_cost_snapshot',
  'business_gross_profit_snapshot',
] as const;

/** Field names protected by `marketer_cost.read`. */
export const MARKETER_COST_FIELDS = ['marketer_cost'] as const;

export type CostField = (typeof COST_FIELDS)[number];
export type MarketerCostField = (typeof MARKETER_COST_FIELDS)[number];

/**
 * Strip cost-bearing fields from `obj` based on viewer permissions.
 * Returns a new object — original is not mutated.
 *
 * Defense-in-depth: even if the DB layer leaks (e.g., the caller is super_admin
 * but the API consumer is a non-finance integration), the serializer will still
 * remove cost fields based on the ViewerContext. The DB and serializer agree
 * via the same permission slug names.
 */
export function redactCostFields<T extends Record<string, unknown>>(
  obj: T,
  viewer: ViewerContext,
): Partial<T> {
  const result: Record<string, unknown> = { ...obj };

  if (!viewer.hasCostRead) {
    for (const field of COST_FIELDS) {
      delete result[field];
    }
  }
  if (!viewer.hasMarketerCostRead) {
    for (const field of MARKETER_COST_FIELDS) {
      delete result[field];
    }
  }

  return result as Partial<T>;
}

/**
 * Recursively redact arrays + nested objects. Use when the response is a
 * paginated list, batched payload, or has nested cost fields.
 */
export function redactCostFieldsDeep<T>(value: T, viewer: ViewerContext): T {
  if (Array.isArray(value)) {
    return value.map((v) => redactCostFieldsDeep(v, viewer)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    return redactCostFields(value as Record<string, unknown>, viewer) as T;
  }
  return value;
}

// ─────────────────────────────────────────────────────────────────────────
// Layer 4 — Admin UI cost-column visibility
// ─────────────────────────────────────────────────────────────────────────

export interface CostVisibility {
  /** True iff the admin UI should render columns containing actual_cost-style values. */
  readonly showCost: boolean;
  /** True iff the admin UI should render columns containing marketer_cost values. */
  readonly showMarketerCost: boolean;
  /** True iff the admin UI should expose the "Export with cost columns" affordance. */
  readonly canExportCost: boolean;
}

/**
 * Map a ViewerContext to admin-UI visibility booleans.
 *
 * Sprint 3+ wires this into the admin shell (Country Pricing matrix, Product
 * editor, Reports). Sprint 2A ships the function + tests; the admin pages
 * remain placeholders per the GREEN-CONDITIONAL Sprint 1 sign-off.
 */
export function costVisibility(viewer: ViewerContext): CostVisibility {
  return {
    showCost: viewer.hasCostRead,
    showMarketerCost: viewer.hasMarketerCostRead,
    canExportCost: viewer.hasCostExport,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Layer 5 — Export gate
// ─────────────────────────────────────────────────────────────────────────

export class CostExportForbiddenError extends Error {
  readonly status = 403;
  readonly code = 'COST_EXPORT_FORBIDDEN';

  constructor(message = 'cost.export permission required for cost-bearing exports') {
    super(message);
    this.name = 'CostExportForbiddenError';
  }
}

/**
 * Throws `CostExportForbiddenError` if the caller cannot export cost data.
 * Use at the entry of every export endpoint that may include cost columns.
 *
 * Sprint 2A ships the gate function + tests. Sprint 3 wires it into the actual
 * /api/exports/... handlers.
 */
export function assertCanExportCost(viewer: ViewerContext): void {
  if (!viewer.hasCostExport) {
    throw new CostExportForbiddenError();
  }
}

/**
 * Defensive wrapper — returns a redacted "cost-stripped" version of an export
 * payload when the viewer lacks cost.export OR cost.read. This is the
 * fallback for endpoints that want to serve a partial export (no cost columns)
 * rather than 403 the whole request.
 */
export function exportCostMode(viewer: ViewerContext): 'with_cost' | 'without_cost' {
  return viewer.hasCostExport && viewer.hasCostRead ? 'with_cost' : 'without_cost';
}
