# Row-Level Security Policies

**Status:** Draft
**Owner:** DBA + Security lead
**Last updated:** 2026-05-09
**Source:** Final Master Plan v4 §15 (Costs and Profit Guardrails); D-RBAC-001 (cost privacy); D-CSP-001/004 (country access)

This document specifies Postgres RLS policies that enforce **cost privacy** and **country/marketer data isolation** at the database layer.

> 🟢 **Modules 24–27 detailed RLS policies deferred to Phase 6 (locked 2026-05-09).** Modules 24 (Decision & Recommendation Engine), 25 (Safety & Compliance), 26 (Trust Layer), and 27 (Readiness Engine) currently have **Phase 1 schema reservations / planning docs only** in `02-tables-by-module.md`. Detailed per-table RLS policy text for these modules is deferred to the **Phase 6 design window**, unless any Module 24–27 table becomes active earlier.
>
> **Phase 1 should not be blocked by Module 24–27 RLS detail.** However, **the existing RLS rules below still apply** to ANY active country-scoped, cost-bearing, or sensitive table — including Module 24–27 tables IF they go active early:
> - Country-scope RLS template (per `03-rbac/03-scopes.md` §H) applies to any country-scoped table including future Module 24–27 tables (`recommendation_event.input_country_id`, `safety_incident_report.country_id`, `customer_review.country_id`, `readiness_check_run` with country-scoped entity_type).
> - Cost privacy RLS (D-RBAC-001) applies to any cost-bearing column including future Module 24–27 cost references (none currently planned, but `recommendation_event` could surface profit deltas Phase 6+).
> - Audit log entries written for any sensitive Module 24–27 action follow the existing `audit_log.entity_country_id` denormalization rule (D-CSP-004).
> - Class 1/2 deletion policy (D-DB-010) applies — `safety_incident_report` is Class 2 (never delete; 10-year retention); `customer_review`, `recommendation_event` are Class 1 soft-delete; `readiness_check_run` is Class 3 (hard delete after retention).

---

## Principle

The database, not the application, is the last line of defense for cost data. Every cost-bearing column has an RLS policy that returns 0 rows / NULL for unauthorized roles. Application bugs cannot leak what the database refuses to return.

---

## Application role binding

Every database session sets `app.current_user_role` and `app.current_user_id` from the authenticated session. RLS policies reference these via `current_setting()`.

```sql
-- Application sets per request:
SET LOCAL app.current_user_role = 'marketing_user';
SET LOCAL app.current_user_id = '<uuid>';
SET LOCAL app.current_user_country_scope = '["sa"]';
SET LOCAL app.current_marketer_id = '<uuid>';  -- when external marketer
```

---

## Roles relevant to RLS

| Role | Cost access |
|---|---|
| `super_admin` | Full read/write all cost columns |
| `finance_admin` | Full read/write all cost columns |
| `marketing_manager` | Read marketer_cost only; no actual_cost |
| `country_manager` | Read prices in scoped countries; no cost columns |
| `external_marketer` | Read marketer_cost ONLY for own marketer_id rows; no actual_cost |
| All other roles | No cost access |

---

## Policies

### `variant_country_cost`

```sql
ALTER TABLE variant_country_cost ENABLE ROW LEVEL SECURITY;

CREATE POLICY cost_read ON variant_country_cost
  FOR SELECT
  USING (
    current_setting('app.current_user_role', true) IN ('super_admin', 'finance_admin')
  );

CREATE POLICY cost_write ON variant_country_cost
  FOR INSERT, UPDATE, DELETE
  USING (
    current_setting('app.current_user_role', true) IN ('super_admin', 'finance_admin')
  );
```

### `variant_marketer_cost`

```sql
ALTER TABLE variant_marketer_cost ENABLE ROW LEVEL SECURITY;

CREATE POLICY marketer_cost_read ON variant_marketer_cost
  FOR SELECT
  USING (
    current_setting('app.current_user_role', true) IN (
      'super_admin', 'finance_admin', 'marketing_manager', 'marketer_manager'
    )
    OR
    (
      current_setting('app.current_user_role', true) = 'external_marketer'
      AND marketer_id = current_setting('app.current_marketer_id', true)::uuid
    )
  );

CREATE POLICY marketer_cost_write ON variant_marketer_cost
  FOR INSERT, UPDATE, DELETE
  USING (
    current_setting('app.current_user_role', true) IN (
      'super_admin', 'finance_admin', 'marketing_manager'
    )
  );
```

### `order_line` cost columns

> 🟢 D-DB-001 Answered 2026-05-07: parent table renamed `order` → `customer_orders` (plural). The child `order_line` table name is preserved (no SQL collision; `order_X` ≠ `ORDER BY`). FK column `order_line.order_id` references `customer_orders.id`.

`order_line` is read by many roles for fulfillment, but cost columns must be redacted. We achieve this with a **column-level** approach: a view exposes non-cost columns to general roles; the base table is RLS-restricted on cost columns.

Since Postgres RLS is row-level, not column-level, we use **two views**:

```sql
-- Base table accessible only to finance roles for full access
ALTER TABLE order_line ENABLE ROW LEVEL SECURITY;

CREATE POLICY order_line_full ON order_line
  FOR ALL
  USING (
    current_setting('app.current_user_role', true) IN ('super_admin', 'finance_admin')
  );

-- View for general consumption — strips cost columns
CREATE VIEW v_order_line_public AS
SELECT
  id, order_id, variant_id, qty, unit_selling_price, currency_code,
  shipping_share, payment_fee_share, discount_share,
  marketer_id_snapshot,
  -- cost columns redacted via NULL
  NULL::numeric AS actual_cost_snapshot,
  NULL::numeric AS marketer_cost_snapshot,
  NULL::numeric AS platform_fee_percent_snapshot,
  marketer_profit_snapshot,
  NULL::numeric AS business_gross_profit_snapshot,
  name_snapshot, sku_snapshot,
  coupon_snapshot, campaign_snapshot
FROM order_line;
```

Application reads via `v_order_line_public` for non-finance roles, `order_line` direct for finance.

### `country_data_audit`

```sql
ALTER TABLE country_data_audit ENABLE ROW LEVEL SECURITY;

-- Finance roles see all entries unredacted.
CREATE POLICY audit_full ON country_data_audit
  FOR SELECT
  USING (
    current_setting('app.current_user_role', true) IN ('super_admin', 'finance_admin')
  );

-- Country managers see entries scoped to their countries, but cost-related fields show "***".
-- Application enforces redaction; RLS limits country scope.
CREATE POLICY audit_country_scoped ON country_data_audit
  FOR SELECT
  USING (
    current_setting('app.current_user_role', true) = 'country_manager'
    AND country_id::text = ANY(
      string_to_array(current_setting('app.current_user_country_scope', true), ',')
    )
  );
```

### `backup_job`, `restore_job`, `backup_verification`

```sql
ALTER TABLE backup_job ENABLE ROW LEVEL SECURITY;

CREATE POLICY backup_admin_only ON backup_job
  FOR SELECT
  USING (
    current_setting('app.current_user_role', true) IN ('super_admin', 'finance_admin', 'developer_api_admin')
  );

CREATE POLICY backup_read_log ON backup_job
  FOR SELECT
  USING (
    current_setting('app.current_user_role', true) = 'read_only_auditor'
  );
```

`restore_job` and `backup_verification` follow the same pattern.

### `override_request`

```sql
ALTER TABLE override_request ENABLE ROW LEVEL SECURITY;

-- Requester sees their own
CREATE POLICY override_own ON override_request
  FOR SELECT
  USING (
    requested_by = current_setting('app.current_user_id', true)::uuid
  );

-- Approver of the matching role sees pending requests
CREATE POLICY override_approver ON override_request
  FOR SELECT
  USING (
    status = 'pending'
    AND approval_required_role = current_setting('app.current_user_role', true)
  );

-- Super admin sees all
CREATE POLICY override_admin ON override_request
  FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'super_admin'
  );
```

---

## Country scope enforcement (🟢 D-CSP-001 + D-CSP-004 locked 2026-05-09)

Every country-scoped table has a country-scope RLS policy. Per D-CSP-004, every leaf-level country-scoped table includes `country_id` (or `country_id_snapshot`) directly — RLS policies use this column directly without JOINs.

### Session variables read by RLS

```sql
-- Set on every authenticated request:
SET LOCAL app.current_user_id = '<uuid>';
SET LOCAL app.current_user_role = '<role>';
SET LOCAL app.current_user_country_scope = 'sa,eg';   -- comma-separated; from user.country_scope cache
SET LOCAL app.current_user_has_country_scope_all = 'true';  -- when user has country_scope.all permission
SET LOCAL app.current_user_warehouse_scope = '<uuid>,<uuid>';
SET LOCAL app.current_marketer_id = '<uuid>';         -- only for external_marketer
```

### Country-scope RLS policy template (apply to every country-scoped table)

```sql
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;

CREATE POLICY country_scope_read ON <table>
  FOR SELECT
  USING (
    -- All-countries permission shortcut
    current_setting('app.current_user_has_country_scope_all', true) = 'true'
    OR
    -- Specific country in user's scope
    country_id::text = ANY(
      string_to_array(current_setting('app.current_user_country_scope', true), ',')
    )
  );

CREATE POLICY country_scope_write ON <table>
  FOR INSERT, UPDATE, DELETE
  USING (
    current_setting('app.current_user_has_country_scope_all', true) = 'true'
    OR
    country_id::text = ANY(
      string_to_array(current_setting('app.current_user_country_scope', true), ',')
    )
  );
```

For tables using `country_id_snapshot` (immutable history: `order_line`, `order_event`, `payment_transaction`, `refund`), substitute `country_id_snapshot` in the policy.

CI test asserts every country-scoped table has a matching country-scope policy. Defense in depth with API `X-Country-Context` header check (per `02-api/01-conventions.md`).

### Example for `variant_country_price`

```sql
ALTER TABLE variant_country_price ENABLE ROW LEVEL SECURITY;

CREATE POLICY price_read_global ON variant_country_price
  FOR SELECT
  USING (
    current_setting('app.current_user_role', true) IN (
      'super_admin', 'admin', 'product_manager', 'finance_admin', 'marketing_manager'
    )
    AND (
      current_setting('app.current_user_has_country_scope_all', true) = 'true'
      OR
      country_id::text = ANY(
        string_to_array(current_setting('app.current_user_country_scope', true), ',')
      )
    )
  );

CREATE POLICY price_read_country_scoped ON variant_country_price
  FOR SELECT
  USING (
    current_setting('app.current_user_role', true) = 'country_manager'
    AND country_id::text = ANY(
      string_to_array(current_setting('app.current_user_country_scope', true), ',')
    )
  );
```

---

## Read-only auditor

```sql
CREATE POLICY auditor_read_all ON <every relevant table>
  FOR SELECT
  USING (
    current_setting('app.current_user_role', true) = 'read_only_auditor'
  );
```

For cost tables, auditor reads via redacted view (cost columns NULL).

---

## CI test plan

These tests run in Phase 1 CI and continue forever:

```sql
-- Test 1: marketing_user cannot read actual_cost
SET LOCAL app.current_user_role = 'marketing_user';
SELECT count(*) FROM variant_country_cost;  -- expected: 0

-- Test 2: external_marketer reads only own marketer_cost
SET LOCAL app.current_user_role = 'external_marketer';
SET LOCAL app.current_marketer_id = '<uuid-A>';
SELECT count(*) FROM variant_marketer_cost WHERE marketer_id <> '<uuid-A>'::uuid;  -- expected: 0

-- Test 3: country_manager scoped to KSA cannot see EG prices
SET LOCAL app.current_user_role = 'country_manager';
SET LOCAL app.current_user_country_scope = 'sa';
SELECT count(*) FROM variant_country_price vcp
  JOIN country c ON c.id = vcp.country_id
  WHERE c.code = 'eg';  -- expected: 0

-- Test 4: super_admin sees all
SET LOCAL app.current_user_role = 'super_admin';
SELECT count(*) FROM variant_country_cost;  -- expected: > 0
```

CI fails if any expectation is violated.

---

## Performance considerations

- RLS policies add per-row predicates; ensure indexes cover `current_setting`-derived filters.
- Use `LEAKPROOF` functions in policies where possible (Postgres docs).
- Avoid joins inside policies — keep policies simple boolean expressions.

---

## TODO

- TODO: implement RLS test harness in CI before Phase 1 Day 14.
- TODO: review every API serializer in Phase 1 to ensure cost fields are stripped from non-finance responses.
- TODO: penetration test for cost leakage end-to-end before public launch.
- TODO: confirm whether `developer_api_admin` should ever read cost (recommendation: no).

---

## References

- Master Plan v4 §15 (Costs and Profit Guardrails)
- ADR-006 (Database engine)
- `03-rbac/04-cost-privacy.md`
- `03-rbac/02-permissions.md`
