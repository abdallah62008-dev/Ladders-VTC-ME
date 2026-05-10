# Override Policy Defaults

**Status:** Draft (stub)
**Owner:** Security lead

---

## Initial seed of `override_policy` rows

Seeded in migration 0012 (Phase 1):

| override_type | default_approver_role | requires_dual_approval | max_validity_hours | allowed_reason_categories |
|---|---|---|---|---|
| `profit_guardrail` | finance_admin | false | 24 | strategic_loss_leader, dead_stock_clearance, competitor_match, error_correction, seasonal_campaign, other |
| `price_below_min` | super_admin | false | 24 | strategic_loss_leader, supplier_change, error_correction, other |
| `campaign_loss` | super_admin + marketing_manager | true | 168 (7d) | strategic_loss_leader, brand_awareness, customer_acquisition, other |
| `stock_override` | inventory_manager | false | 6 | promised_to_customer, fulfillment_bridge, error_correction, other |
| `warranty_exception` | maintenance_manager (+ finance high-value) | conditional | 720 (30d) | goodwill_gesture, batch_recall, customer_loyalty, other |
| `payout_exception` | finance_admin + super_admin | true | 720 (30d) | early_payout_cashflow, dispute_resolution, marketer_offboarding, other |
| `country_activation` | super_admin + country_manager | true | TODO (until readiness) | soft_launch, beta_program, marketing_window, other |
| `payment_refund_exception` | finance_admin + super_admin | true | 720 (30d) | goodwill_gesture, dispute_resolution, regulatory_requirement, other |

## Notification recipients

Per type, who gets notified on:
- Request created → approver(s)
- Approval → super_admin (always) + requester
- Rejection → requester + escalation if appropriate
- Application → super_admin + finance_admin

## Editing

Only `override.policy.write` (super_admin only) can edit policy. Changes audit-logged.

## TODO

- TODO: finalize default validity hours.
- TODO: confirm reason categories per type with Finance + Legal.
- TODO: notification recipient config.
