# Runbook — Batch Recall Procedure

**Status:** Stub (Phase 1 placeholder; full content Phase 9)
**Owner:** Compliance Officer + Operations Director + Super Admin
**Triggered by:** Alert category `batch_quality`, severity Critical (recall_flag set)

> ⚠️ **High-stakes operation.** Dual approval required: Compliance Officer + Operations Director + Super Admin (3-party).

---

## When this runbook applies

A `product_batch` row has been flagged for recall:
- `product_batch.recall_flag = true`
- Triggered by: 3+ safety incidents in 30 days OR any single Critical incident OR supplier-disclosed defect OR regulator order

---

## Immediate actions (within 1 hour of recall flag)

1. **Pause sales** of the affected batch (auto-handled by `recall_flag = true` — `variant_warehouse_stock` rows in that batch become unavailable to checkout).
2. **Pause active landing pages and AI recommendations** referencing the affected SKU + batch combination.
3. **Identify affected customers** via `order_line.batch_id_snapshot`.
4. **Notify Super Admin + Legal + Insurance Provider** (templates Phase 9).
5. **Create incident summary** for regulator notification.

---

## Customer notification

(Phase 9 — full per-customer outreach procedure with WhatsApp + email + SMS, refund/replacement/repair offer matrix.)

---

## Regulator notification

(Phase 9 — per-country procedure with template letters; legal review required.)

---

## Stock disposition

- Affected stock at warehouses: hold pending decision (return to supplier / destroy / repair / disposition by regulator).
- Affected stock with customers: option for return + refund + replacement.
- Affected stock in transit: recall before delivery.

---

## Lessons learned + RCA

After recall closed:
- Root cause analysis with supplier
- Update `safety_guideline` + `safety_claim` if claims contradicted
- Update product specs if needed
- Update Decision Engine rules if recommendation logic was a contributor

---

## TODO

- TODO: full procedure Phase 9 once warranty/service ticket workflow lands.
- TODO: insurance provider notification template.
- TODO: legal review checklist.
- TODO: cross-jurisdiction regulator notification matrix.
