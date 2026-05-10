# Monthly Governance Review

**Status:** Draft (stub) — synced to 15-type model 2026-05-09
**Owner:** Super Admin + Finance
**Source:** `01-override-types.md` (15 override types — 8 original + 5 from D-PERF-003 + 2 from Strategic Enhancements)

> 🟢 **Synced 2026-05-09 (D-DOC-001 Step 2 cleanup):** Governance review covers **all 15 override types**. Material additions to the cadence vs original 8-type model: the 5 override types added with D-PERF-003 (`performance_budget_override`, `landing_quality_gate_override`, `landing_profit_guardrail_override`, `landing_inventory_guardrail_override`, `sensitive_cleanup_override`) carry **server-side auto-revert on expiry** which means governance now also reviews "did the underlying issue actually get fixed before expiry, or did the override expire and revert leaving the original problem?" — a new failure mode the original 8 types didn't have.

---

## Cadence

Monthly review. Quarterly deeper review.

## Inputs

- `mv_override_usage_summary` materialized view
- Anomaly alerts from past month
- Approval rate per type
- Top requesters
- Top reasons
- Total business impact (for cost-bearing types)

## Questions to answer

1. Are any override types becoming routine? If yes, the underlying policy may need revising (e.g., raise the floor).
2. Are any approvers rubber-stamping (high approval rate, low rejection rate, low dwell time)?
3. Are any requesters anomalous (excessive overrides)?
4. Are reasons consistent with business outcomes? (audit a sample)
5. Has any override led to a negative business outcome? (post-hoc)
6. **For auto-revert types (5 from D-PERF-003):** did the underlying issue get remediated before override expiry, or did expiry trigger auto-revert? If many auto-reverts: pattern of half-done remediation work.
7. **For `sensitive_cleanup_override`:** did pre-cleanup backup actually run? Was post-cleanup audit log entry created? Was legal/compliance basis adequately documented?
8. **For `safety_claim_override`:** were borderline claims promoted to formal `safety_claim` rows by expiry? Or did they auto-revert leaving customer-facing surfaces flagged for re-review?
9. **For `recommendation_override`:** is the Decision Engine rule set drifting from real-world recommendations? Should rules be updated rather than admins repeatedly overriding?

## Per-type review focus (15 types)

| Type group | Governance focus |
|---|---|
| **Original 8** (profit_guardrail / price_below_min / campaign_loss / stock_override / warranty_exception / payout_exception / country_activation / payment_refund_exception) | Standard frequency + business-outcome review |
| **D-PERF-003 5** (performance_budget / landing_quality_gate / landing_profit_guardrail / landing_inventory_guardrail / sensitive_cleanup) | + auto-revert remediation tracking + remediation-plan completion rate |
| **Strategic Enhancements 2** (safety_claim / recommendation) | + claim-promotion-to-formal rate + Decision Engine rule-drift signal |

## Outputs

- Decision Log entries for any policy changes.
- Coaching feedback to requesters/approvers if needed.
- Quarterly: written governance report shared with Super Admin + Finance.

## TODO

- TODO: review meeting cadence + attendees.
- TODO: report template.
