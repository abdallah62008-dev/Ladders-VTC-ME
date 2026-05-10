# Runbook — Safety Incident Response

**Status:** Stub (Phase 1 placeholder; full content Phase 6+)
**Owner:** Compliance Officer + Legal + Customer Support Lead
**Triggered by:** Alert category `safety_compliance`, severity Critical

> ⚠️ **Critical SLA: 1 hour first response** (per `25-safety-compliance/03-incident-response.md`).

---

## When this runbook applies

A safety incident report has been filed (`safety_incident_report.severity` = High or Critical). Examples:

- Customer reports injury during use
- Customer reports property damage from ladder failure
- Regulator inquiry about a product
- Internal staff observe a near-miss
- Multiple incidents on same product/batch within 30 days

---

## Immediate actions (within 1 hour)

1. **Acknowledge.** Compliance Officer acknowledges the alert and contacts reporter via WhatsApp using `safety_incident_acknowledge_ar/_en` template.
2. **Suppress automated marketing** for the affected customer (set marketing-suppression flag).
3. **Pull batch + serial information** — query `order_line.batch_id_snapshot` if order_id provided.
4. **Check incident count** for the same `product_batch.id` in last 30 days. If ≥ 2 prior incidents, consider Critical escalation.
5. **Decide severity revision** — initial reporter severity may need adjustment.

---

## Investigation phase

(Phase 6+ — full investigation procedure with evidence collection, batch traceability, supplier contact, internal RCA)

---

## Recall consideration

If batch-level concern surfaces, follow `batch-recall-procedure.md`.

---

## Customer-facing communication

- Auto-acknowledgment via WhatsApp within 5 minutes (template `safety_incident_acknowledge_ar/_en`).
- Compliance Officer follow-up within 1 hour.
- No automated promotional messages until incident closed.
- Order remains visible but annotated "Under safety review."

---

## Regulator notification

Per jurisdiction:
- KSA: SASO (Saudi Standards, Metrology and Quality Org)
- EG: GOEIC (General Organization for Export and Import Control)
- IQ: COSQC (Central Organization for Standardization and Quality Control)

(Phase 6+ — full per-country procedure with template letters reviewed by Legal.)

---

## TODO

- TODO: full investigation procedure Phase 6.
- TODO: regulator notification templates per country (Legal review).
- TODO: integration with Module 16 service_ticket Phase 9.
- TODO: define escalation path to outside legal counsel (high-severity injury).
