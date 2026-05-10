# Runbook — Landed Cost Spike Investigation

**Status:** Stub (Phase 1 placeholder; full content Phase 8 when landed cost components populate)
**Owner:** Finance Admin + Operations Director
**Triggered by:** Alert category `business`, sub-type `landed_cost_spike`

---

## When this runbook applies

`variant_country_cost.landed_cost_components` shows an unexpected jump in one or more components (international shipping, customs, local handling, storage, damage allowance, payment fees) for a recently inbound batch.

Common patterns:
- International shipping spike (oil price surge, route disruption)
- Customs valuation revised by authority
- Currency exchange rate shifted significantly
- Damage allowance higher than typical (batch-level quality issue → links to batch quality runbook)
- Storage charges accumulated (slow-moving stock)

---

## Investigation steps (Phase 8+)

1. Pull `variant_country_cost` rows for the affected SKU/country in last 90 days.
2. Diff `landed_cost_components` jsonb across batches.
3. Identify which component spiked + by how much.
4. Check supplier invoices, shipping invoices, customs documents.
5. Compare to industry benchmarks (Phase 10 reporting).

---

## Profit guardrail impact

If spike pushes computed margin below `country.business_min_margin`:
- Auto-creates Profit Guardrail alert
- Affected SKU may auto-transition to `pricing_review_required` state in admin
- Active landing pages referencing the SKU may need price update or pause

---

## Resolution paths

(Phase 8 — full procedure with supplier renegotiation, route alternatives, currency hedging, customer-side price adjustment with override.)

---

## TODO

- TODO: full procedure Phase 8 once landed cost is populated.
- TODO: define spike threshold (recommendation: > 15% jump on any single component).
- TODO: integration with Profit Guardrails (auto-flag SKUs that breach floor due to landed cost).
