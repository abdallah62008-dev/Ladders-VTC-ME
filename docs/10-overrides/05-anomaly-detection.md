# Override Anomaly Detection

**Status:** Draft (stub) — synced to 15-type model 2026-05-09
**Owner:** Security lead
**Source:** `01-override-types.md` (15 override types — 8 original + 5 from D-PERF-003 + 2 from Strategic Enhancements)

> 🟢 **Synced 2026-05-09 (D-DOC-001 Step 2 cleanup):** This document references the **15 override types** locked in `01-override-types.md`. Anomaly thresholds apply across all 15 types unless explicitly noted per-type. No new override types introduced; no override logic changed.

---

## Anomalies

| Anomaly | Trigger | Action |
|---|---|---|
| Same actor exceeds 3 overrides per week | rolling 7-day count | Smart Notification to Super Admin |
| Same approver pairing > N times in 30 days | pair-count | Flag for governance review |
| Override approved in < 5 seconds | approver dwell time | Soft block |
| Same override type approved 5+ times for same entity in 30 days | entity-level count | Suggest policy review |
| Override breaches floor by > 50% | impact | Require Super Admin override |
| Override applied outside business hours | time | Notification to compliance |
| Override expired without being applied | expiry | Notification to requester (was action ever needed?) |

## Detection

- Cron daily.
- Rolling-window aggregations on `override_request` across all 15 override types.
- Surfaces in **Override Usage Report** + **Smart Notification Center**.

## Per-type anomaly emphasis (15 types)

| Override type | Highest-risk anomaly to watch |
|---|---|
| `profit_guardrail` | Same approver pairing repeatedly + breach > 50% |
| `price_below_min` | Cluster on same product/country (price drift) |
| `campaign_loss` | Multiple campaigns from same marketer |
| `stock_override` | Frequent oversells of same SKU (inventory accuracy issue) |
| `warranty_exception` | High-value cluster (potential fraud) |
| `payout_exception` | Same marketer recurring early-payout requests |
| `country_activation` | Pre-readiness activation against checklist |
| `payment_refund_exception` | Refund > original charge cluster |
| `performance_budget_override` ✨ | Repeated overrides on same page (chronic regression) |
| `landing_quality_gate_override` ✨ | Same author repeatedly bypassing gate |
| `landing_profit_guardrail_override` ✨ | Marketing pushing margin-thin offers |
| `landing_inventory_guardrail_override` ✨ | Repeated out-of-stock CTA mode (real demand vs supply gap) |
| `sensitive_cleanup_override` ✨ | **Highest scrutiny** — every use is reviewed by Security Lead next day |
| `safety_claim_override` 🆕 | Borderline claim trends (compliance risk) |
| `recommendation_override` 🆕 | Admin overriding Decision Engine repeatedly (signal: rules need update) |

✨ = added 2026-05-07 with D-PERF-003.
🆕 = added 2026-05-07 with Strategic Enhancements (D-DEC-001 + D-SAFE-001).

## Quarterly governance review

Operations + Finance + Legal review:
- Top override types by frequency
- Top requesters
- Top reasons
- Whether thresholds need adjustment (e.g., raise floor)
- Whether certain overrides should become standard policy

Outcomes recorded in `decision_log`.

## TODO

- TODO: confirm anomaly thresholds.
- TODO: ML-based anomaly detection (Phase 10+).
