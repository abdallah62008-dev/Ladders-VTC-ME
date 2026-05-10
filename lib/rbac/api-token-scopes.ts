// D-RBAC-001 cost privacy — Layer 3 of the 9-layer defense-in-depth chain.
//
// API token scopes — Phase 1 reservation per /docs/03-rbac/04-cost-privacy.md.
// Cost-bearing scopes are excluded from default tokens; explicit grant
// required at issuance time.
//
// Sprint 2A scope: documentation + type-level reservation only. Token
// issuance UI / admin grant flow ships in Sprint 5+ alongside the
// developer_api_admin role's token-management surface.

/**
 * Token scope catalogue. Mirrors the permission slug catalogue in
 * /docs/03-rbac/matrix/role-permission-matrix.csv but represents what an
 * issued API token is authorized to access (separate from what the human
 * actor's role grants).
 *
 * **Locked rule:** the four cost-bearing scopes below are NEVER in the
 * default scope set for newly-issued tokens. They must be granted
 * explicitly by Super Admin + Finance Admin (dual approval) on the
 * `system_api_keys` admin page.
 */
export const COST_BEARING_SCOPES = [
  'cost.read',
  'cost.write',
  'cost.export',
  'marketer_cost.read',
  'marketer_cost.write',
  'export.cost_columns',
  'report.export.cost_columns',
] as const;

export type CostBearingScope = (typeof COST_BEARING_SCOPES)[number];

/**
 * Default token scopes — what a freshly-issued token gets without explicit
 * cost-scope grant. Includes the standard read scopes for catalog and
 * orders but NOTHING under COST_BEARING_SCOPES.
 *
 * Sprint 2A: documented as a constant. Sprint 5+ uses this when the
 * developer_api_admin issues a new token.
 */
export const DEFAULT_TOKEN_SCOPES = [
  'catalog.read',
  'order.read',
  'customer.read',
  'pricing.read',
  'stock.read',
] as const;

export type DefaultTokenScope = (typeof DEFAULT_TOKEN_SCOPES)[number];

/**
 * Returns true iff the requested scope is cost-bearing (and therefore
 * requires explicit Super Admin + Finance Admin dual approval to grant).
 */
export function isCostBearingScope(scope: string): scope is CostBearingScope {
  return (COST_BEARING_SCOPES as readonly string[]).includes(scope);
}

/**
 * Returns true iff the requested scope is in the default-issue set.
 */
export function isDefaultTokenScope(scope: string): scope is DefaultTokenScope {
  return (DEFAULT_TOKEN_SCOPES as readonly string[]).includes(scope);
}

/**
 * Gate at token issuance: rejects requests that include a cost-bearing scope
 * unless `dualApproval` is true (set by the issuance UI after Super Admin +
 * Finance Admin both confirm).
 *
 * Sprint 2A ships the gate function + tests. Sprint 5+ wires it into the
 * token-issuance admin endpoint.
 */
export class CostScopeRequiresDualApprovalError extends Error {
  readonly status = 403;
  readonly code = 'COST_SCOPE_DUAL_APPROVAL_REQUIRED';
  readonly offendingScopes: readonly string[];

  constructor(scopes: readonly string[]) {
    super(
      `Cost-bearing scopes require Super Admin + Finance Admin dual approval: ${scopes.join(', ')}`,
    );
    this.name = 'CostScopeRequiresDualApprovalError';
    this.offendingScopes = scopes;
  }
}

export function assertTokenScopesAllowed(
  requestedScopes: readonly string[],
  options: { dualApproval: boolean },
): void {
  const offending = requestedScopes.filter(isCostBearingScope);
  if (offending.length > 0 && !options.dualApproval) {
    throw new CostScopeRequiresDualApprovalError(offending);
  }
}
