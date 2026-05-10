// Unit tests for D-RBAC-001 cost privacy helpers (Layers 2, 4, 5).
//
// Layer 1 (DB/RLS) is exercised by tests/rls/cost-privacy.spec.ts against a
// real Postgres connection. The unit tests below verify the application-side
// helpers that sit on top of the DB layer.

import { describe, expect, test } from 'vitest';
import {
  COST_FIELDS,
  CostExportForbiddenError,
  MARKETER_COST_FIELDS,
  assertCanExportCost,
  costVisibility,
  exportCostMode,
  redactCostFields,
  redactCostFieldsDeep,
  type ViewerContext,
} from '@/lib/rbac/cost-privacy';
import {
  COST_BEARING_SCOPES,
  CostScopeRequiresDualApprovalError,
  DEFAULT_TOKEN_SCOPES,
  assertTokenScopesAllowed,
  isCostBearingScope,
  isDefaultTokenScope,
} from '@/lib/rbac/api-token-scopes';

const noCost: ViewerContext = {
  hasCostRead: false,
  hasMarketerCostRead: false,
  hasCostExport: false,
};
const finance: ViewerContext = {
  hasCostRead: true,
  hasMarketerCostRead: true,
  hasCostExport: true,
};
const marketingOnly: ViewerContext = {
  hasCostRead: false,
  hasMarketerCostRead: true,
  hasCostExport: false,
};

// ─────────────────────────────────────────────────────────────────────────
// Layer 2 — redactCostFields
// ─────────────────────────────────────────────────────────────────────────

describe('Layer 2 — redactCostFields (D-RBAC-001)', () => {
  test('strips every cost field when viewer has no cost.read', () => {
    const obj = {
      name: 'Variant A',
      actual_cost: 99.99,
      unit_cost: 50.0,
      cogs: 30,
      was_actual_cost: 75,
      actual_cost_snapshot: 80,
      business_gross_profit_snapshot: 20,
      regular_price: 199,
    };
    const result = redactCostFields(obj, noCost);
    expect(result).toEqual({ name: 'Variant A', regular_price: 199 });
  });

  test('preserves all cost fields when viewer has cost.read', () => {
    const obj = { name: 'X', actual_cost: 50, unit_cost: 30 };
    const result = redactCostFields(obj, finance);
    expect(result).toEqual({ name: 'X', actual_cost: 50, unit_cost: 30 });
  });

  test('strips marketer_cost when viewer lacks marketer_cost.read', () => {
    const obj = { name: 'X', marketer_cost: 25.5 };
    const result = redactCostFields(obj, noCost);
    expect(result).toEqual({ name: 'X' });
  });

  test('preserves marketer_cost when viewer has marketer_cost.read but not cost.read', () => {
    const obj = { name: 'X', marketer_cost: 25.5, actual_cost: 99 };
    const result = redactCostFields(obj, marketingOnly);
    expect(result).toEqual({ name: 'X', marketer_cost: 25.5 });
  });

  test('does not mutate the input object', () => {
    const obj = { name: 'X', actual_cost: 50 };
    redactCostFields(obj, noCost);
    expect(obj.actual_cost).toBe(50);
  });

  test('COST_FIELDS catalogue contains canonical column names from migration 0005', () => {
    expect(COST_FIELDS).toContain('actual_cost');
    expect(COST_FIELDS).toContain('was_actual_cost');
    expect(MARKETER_COST_FIELDS).toContain('marketer_cost');
  });
});

describe('Layer 2 — redactCostFieldsDeep', () => {
  test('redacts cost fields in array elements', () => {
    const list = [
      { name: 'A', actual_cost: 10 },
      { name: 'B', actual_cost: 20 },
    ];
    const result = redactCostFieldsDeep(list, noCost);
    expect(result).toEqual([{ name: 'A' }, { name: 'B' }]);
  });

  test('redacts cost fields in nested objects', () => {
    const tree = {
      product: { name: 'X', actual_cost: 50 },
      meta: { count: 1 },
    };
    const result = redactCostFieldsDeep(tree, noCost);
    expect(result).toEqual({
      product: { name: 'X' },
      meta: { count: 1 },
    });
  });

  test('handles primitives without crashing', () => {
    expect(redactCostFieldsDeep('hello', noCost)).toBe('hello');
    expect(redactCostFieldsDeep(42, noCost)).toBe(42);
    expect(redactCostFieldsDeep(null, noCost)).toBe(null);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Layer 4 — costVisibility (admin UI gate)
// ─────────────────────────────────────────────────────────────────────────

describe('Layer 4 — costVisibility (D-RBAC-001)', () => {
  test('finance role sees all cost UI affordances', () => {
    expect(costVisibility(finance)).toEqual({
      showCost: true,
      showMarketerCost: true,
      canExportCost: true,
    });
  });

  test('non-finance role sees no cost UI affordances', () => {
    expect(costVisibility(noCost)).toEqual({
      showCost: false,
      showMarketerCost: false,
      canExportCost: false,
    });
  });

  test('marketing role sees marketer_cost only', () => {
    expect(costVisibility(marketingOnly)).toEqual({
      showCost: false,
      showMarketerCost: true,
      canExportCost: false,
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Layer 5 — assertCanExportCost / exportCostMode
// ─────────────────────────────────────────────────────────────────────────

describe('Layer 5 — export gate (D-RBAC-001)', () => {
  test('finance can export cost (no throw)', () => {
    expect(() => assertCanExportCost(finance)).not.toThrow();
  });

  test('non-finance cannot export cost (throws CostExportForbiddenError)', () => {
    expect(() => assertCanExportCost(noCost)).toThrow(CostExportForbiddenError);
  });

  test('thrown error has status 403 and stable error code', () => {
    try {
      assertCanExportCost(noCost);
      expect.unreachable('expected CostExportForbiddenError');
    } catch (e) {
      expect(e).toBeInstanceOf(CostExportForbiddenError);
      const err = e as CostExportForbiddenError;
      expect(err.status).toBe(403);
      expect(err.code).toBe('COST_EXPORT_FORBIDDEN');
    }
  });

  test('exportCostMode returns with_cost only when both export + read granted', () => {
    expect(exportCostMode(finance)).toBe('with_cost');
    expect(exportCostMode(noCost)).toBe('without_cost');
    expect(exportCostMode({ ...finance, hasCostRead: false })).toBe('without_cost');
    expect(exportCostMode({ ...finance, hasCostExport: false })).toBe('without_cost');
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Layer 3 — API token scope catalogue
// ─────────────────────────────────────────────────────────────────────────

describe('Layer 3 — API token scopes (D-RBAC-001)', () => {
  test('cost-bearing scope set is non-empty and includes the canonical four', () => {
    expect(COST_BEARING_SCOPES.length).toBeGreaterThanOrEqual(4);
    expect(COST_BEARING_SCOPES).toContain('cost.read');
    expect(COST_BEARING_SCOPES).toContain('cost.write');
    expect(COST_BEARING_SCOPES).toContain('cost.export');
    expect(COST_BEARING_SCOPES).toContain('marketer_cost.read');
  });

  test('default token scopes do NOT contain any cost-bearing scope', () => {
    for (const scope of DEFAULT_TOKEN_SCOPES) {
      expect(isCostBearingScope(scope)).toBe(false);
    }
  });

  test('isCostBearingScope correctly classifies cost slugs', () => {
    expect(isCostBearingScope('cost.read')).toBe(true);
    expect(isCostBearingScope('catalog.read')).toBe(false);
    expect(isCostBearingScope('marketer_cost.read')).toBe(true);
  });

  test('isDefaultTokenScope only matches the default-issue set', () => {
    expect(isDefaultTokenScope('catalog.read')).toBe(true);
    expect(isDefaultTokenScope('cost.read')).toBe(false);
  });

  test('assertTokenScopesAllowed accepts non-cost scopes', () => {
    expect(() =>
      assertTokenScopesAllowed(['catalog.read', 'order.read'], { dualApproval: false }),
    ).not.toThrow();
  });

  test('assertTokenScopesAllowed rejects cost scope without dual approval', () => {
    expect(() =>
      assertTokenScopesAllowed(['cost.read', 'catalog.read'], { dualApproval: false }),
    ).toThrow(CostScopeRequiresDualApprovalError);
  });

  test('assertTokenScopesAllowed accepts cost scope with dual approval', () => {
    expect(() =>
      assertTokenScopesAllowed(['cost.read'], { dualApproval: true }),
    ).not.toThrow();
  });

  test('CostScopeRequiresDualApprovalError lists offending scopes', () => {
    try {
      assertTokenScopesAllowed(['cost.read', 'cost.write', 'catalog.read'], {
        dualApproval: false,
      });
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(CostScopeRequiresDualApprovalError);
      const err = e as CostScopeRequiresDualApprovalError;
      expect(err.status).toBe(403);
      expect(err.offendingScopes).toEqual(['cost.read', 'cost.write']);
    }
  });
});
