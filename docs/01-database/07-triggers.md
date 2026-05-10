# Triggers and Functions

**Status:** Draft
**Owner:** DBA

---

## Audit triggers

### `audit_country_data_changes`
Fires on INSERT/UPDATE/DELETE on:
- `variant_country_price`
- `variant_country_cost`
- `variant_marketer_cost`
- `variant_warehouse_stock`
- `country` (active flag flip)

For each change, inserts a row into `country_data_audit` with old/new values + actor + override_request_id (if set in session).

```sql
CREATE OR REPLACE FUNCTION audit_country_data_changes()
RETURNS trigger AS $$
DECLARE
  v_actor uuid := current_setting('app.current_user_id', true)::uuid;
  v_actor_role text := current_setting('app.current_user_role', true);
  v_override uuid := NULLIF(current_setting('app.current_override_request_id', true), '')::uuid;
  v_field text;
  v_old text;
  v_new text;
  v_redact bool;
BEGIN
  -- Per-column comparison; redact cost columns for non-finance audit reads.
  -- Implementation detail TBD in Phase 1.
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Attach to each table:
CREATE TRIGGER trg_audit_vcp
  AFTER INSERT OR UPDATE OR DELETE ON variant_country_price
  FOR EACH ROW EXECUTE FUNCTION audit_country_data_changes();
-- ... and so on for the other tables.
```

---

## `set_updated_at`
Generic timestamp updater.
```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```
Attached to every table with an `updated_at` column.

---

## `recompute_product_country_readiness`
Recomputes `product_country_readiness.status` when relevant fields change.

Triggers:
- After UPSERT on `variant_country_price`
- After UPSERT on `variant_warehouse_stock`
- After UPDATE on `product_translation`
- After UPDATE on `product_image`

Recompute logic checks: price exists, currency exists, stock available, content present, image present, SEO present, country active. Sets status accordingly.

---

## `enforce_override_dual_approval`
Trigger on `override_request` UPDATE:
- If `requires_dual_approval = true`, reject UPDATE setting `status = 'approved'` unless both `approved_by` and `second_approved_by` are set AND distinct AND of distinct roles.

```sql
CREATE OR REPLACE FUNCTION enforce_override_dual_approval()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'approved' AND NEW.requires_dual_approval THEN
    IF NEW.approved_by IS NULL OR NEW.second_approved_by IS NULL THEN
      RAISE EXCEPTION 'Dual approval required';
    END IF;
    IF NEW.approved_by = NEW.second_approved_by THEN
      RAISE EXCEPTION 'Dual approval requires two distinct users';
    END IF;
    -- TODO: also check role distinctness via lookup
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## `prevent_audit_log_modification`
Trigger on `audit_log` and `country_data_audit` to reject UPDATE/DELETE except for super_admin with explicit reason.

---

## TODO

- TODO: full trigger DDL with column-level diff capture.
- TODO: confirm performance impact of audit triggers on hot write paths (`variant_warehouse_stock`).
- TODO: decide whether to use logical replication / Debezium for downstream consumers (e.g., feeding analytics pipeline) instead of trigger-driven audit.
