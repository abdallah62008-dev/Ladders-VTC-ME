# KSA — J&T Express Onboarding Checklist

**Status:** 🟢 **Selected 2026-05-07** as initial primary logistics provider for Saudi Arabia (D-OPS-003 🟢 Answered for selection)
**Owner:** Operations Director
**Source:** D-OPS-003 + `20-shipping-logistics/01-overview.md` §N

> ⚠️ **This is an execution checklist, not a decision document.** The selection decision (J&T as KSA initial primary) is locked. The items below are the operational onboarding work that must close before checkout ships in Phase 2.

---

## Phase 0 deliverables (target: weeks 1–3)

### Week 1
- [ ] Business account application submitted to J&T Express KSA
- [ ] Initial commercial conversation: volumes, package types, COD limits, pickup cadence
- [ ] Account manager assigned (capture name + phone + email; populate `shipping_provider.contact_*` fields when row created)

### Week 2
- [ ] Rate card finalized with J&T (per-city / per-weight / COD fee / return fee / failed-delivery fee)
- [ ] Rate card entered into `shipping_rate_card` rows (Phase 0 = paper draft; admin entry happens Phase 1 sprint 1 after schema migration ships)
- [ ] COD support confirmed in writing:
  - Maximum amount per shipment (KSA threshold)
  - COD fee structure (flat vs % of order)
  - COD settlement cadence (daily / weekly / monthly)
  - COD reconciliation report format (CSV / API / portal)
- [ ] Reconciliation process documented (who reads J&T COD reports; cadence; what happens on mismatch)

### Week 3
- [ ] Pickup process from `RUH-01` (Riyadh Main Warehouse) documented:
  - Pickup time windows
  - Number of daily pickups
  - Driver contact procedure
  - Pickup manifest format
  - Disputes / damage-on-pickup policy
- [ ] City coverage list received from J&T:
  - Positive list (covered cities)
  - Negative list (not covered → require alternate provider OR refuse order)
  - Entered as `shipping_rule.city_coverage` row when admin available Phase 1
- [ ] SLA by city / zone:
  - Delivery promise min/max days per zone
  - Entered as `shipping_method.delivery_promise_min/max_days` per (city × method) when admin available Phase 1
- [ ] Package size + weight limits documented:
  - Max length / width / height / weight per package
  - Volumetric weight formula
  - Entered as `shipping_rate_card.package_size_limit_jsonb` + `volumetric_weight_rule`

---

## Phase 1 deliverables (target: sprints 1–3)

### Sprint 1
- [ ] Migration 0010 reserves `shipping_provider`, `shipping_method`, `shipping_rate_card`, `shipping_zone`, `shipping_rule`, `shipment`, `shipment_event` as Phase 1 skeletons.
- [ ] J&T provider row seeded in migration 0012:
  - `provider_code = 'jt-express'`
  - `country_id = <KSA>`
  - `status = 'active'` (or `inactive` until business account approved)
  - `supports_cod = true`
  - `supports_api = false` (initially `manual` mode until API integration)
  - `supports_label_generation = false` (initially)
  - `supports_tracking = false` (initially)
  - `supports_returns = true` (manual)
- [ ] `shipping_method` rows seeded for J&T: `standard`, `cod_delivery`, `return`, `manual`.
- [ ] Initial rate card rows seeded for major KSA cities (Riyadh, Jeddah, Dammam, Mecca, Medina, Khobar, Tabuk).
- [ ] Label generation method confirmed (J&T portal manual vs API vs file upload).

### Sprint 2
- [ ] Tracking API / webhook integration spec received from J&T (if available)
- [ ] Adapter spec drafted in `20-shipping-logistics/03-jt-adapter-spec.md` (Phase 0 stub; full content Phase 1 sprint 2)
- [ ] Webhook receiver endpoint reserved at `/api/v1/webhooks/courier/jt` (per `02-api/03-webhook-events.md` pattern)

### Sprint 3
- [ ] Return workflow documented:
  - Customer-initiated return → admin creates return label
  - Drop-off vs pickup decision per city
  - Return fee structure
  - Refund timing relative to inspection
- [ ] Failed delivery workflow documented:
  - Re-attempt count (typically 2–3)
  - Storage fee at J&T after N days
  - Return-to-warehouse trigger
  - Customer notification template via WhatsApp

---

## Phase 2+ deliverables

### Phase 2 — Checkout integration
- [ ] Checkout queries `shipping_method` + `shipping_rate_card` for J&T at checkout fee display.
- [ ] Order creates `shipment` row on confirmation; status `pending_pickup`.
- [ ] Manual mode UI: admin records label number + tracking number after physical pickup.

### Phase 4 — Customer messaging
- [ ] WhatsApp templates for shipment events approved by Meta:
  - `shipment_picked_up_ar/_en`
  - `shipment_in_transit_ar/_en`
  - `shipment_out_for_delivery_ar/_en`
  - `shipment_delivered_ar/_en`
  - `shipment_failed_delivery_ar/_en`

### Phase 7 — Payment reconciliation
- [ ] COD reconciliation workflow against J&T daily/weekly settlement reports.
- [ ] `payment_transaction` row posted automatically on `shipment_event=delivered` for COD orders.

### Phase 9 — Performance + returns
- [ ] `courier_performance_log` populated nightly with on-time rate, failed-delivery rate, average transit time per zone.
- [ ] J&T API integration activated when J&T API tier approved → flip `supports_api = true` + populate 1Password vault `op://vtc-prod-infra/shipping/jt-express`.
- [ ] Tracking webhook receiver activated → flip `supports_tracking_webhook = true`.

### Phase 10 — Intelligence
- [ ] Courier scorecard dashboard.
- [ ] Route optimization suggestions (warehouse-to-city routing).
- [ ] COD fraud pattern detection (high-failure customers / cities).

---

## Open questions (tracked with TODO entries; not decisions)

- TODO: confirm if J&T offers a sandbox / staging environment for API integration testing before Phase 9.
- TODO: confirm J&T's webhook signing mechanism (HMAC? Bearer token?); needed before adapter implementation.
- TODO: confirm J&T's response to high-value packages (insurance / declared value cap).
- TODO: verify J&T compliance with ZATCA Phase 2 e-invoicing for shipping invoices (if J&T issues us invoices that we re-invoice to customers via deposits).
- TODO: confirm Aramex KSA + SMSA + Bosta as backup providers — do we need Phase 1 backup or only Phase 6+?

---

## References

- `20-shipping-logistics/01-overview.md` (umbrella architecture)
- `27-readiness-engine/01-unified-readiness.md` (country launch readiness shipping checks)
- `15-phases/PHASE_0_DECISIONS_TODO_TRACKER.md` D-OPS-003 + D-OPS-010
- `01-database/02-tables-by-module.md` Module 16 (Operations & Maintenance)
- `08-backups/05-secrets-exclusion-policy.md` (1Password vault structure)
