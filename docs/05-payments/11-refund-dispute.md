# Refunds and Disputes

**Status:** Draft
**Owner:** Backend lead + Finance

---

## Refund types

- Full
- Partial (e.g., partial return, missing item)
- Store credit (Phase 5+)

## Approval

| Refund value | Approver | Override |
|---|---|---|
| ≤ X (TODO) | Customer Support Agent | None |
| > X to Y | Finance Admin | None |
| > Y | Finance Admin + Super Admin | Dual |
| Refund > original charge | Finance Admin + Super Admin | Override required (`payment_refund_exception`) |
| Without delivery proof | Finance Admin + Super Admin | Override required |

## Reason capture

Mandatory enum:
- `customer_changed_mind`
- `wrong_product_received`
- `damaged_in_delivery`
- `did_not_fit_car`
- `did_not_fit_use_case`
- `late_delivery`
- `quality_issue`
- `safety_concern`
- `other` (free text required)

## Flow

1. Refund request created (`refund_request`).
2. Reason captured.
3. Approval per matrix above.
4. `PaymentProvider.refund` invoked.
5. Provider webhook updates `refund.status`.
6. Order status updated.
7. Stock movement (return-to-stock if applicable).

## Disputes / chargebacks

1. Provider webhook `charge.dispute.created` → row in `dispute`.
2. Operations team uploads evidence:
   - Delivery proof (pre-dispatch photo + courier confirmation)
   - Conversation proof (chat transcript)
   - Photos/videos
3. Submitted via provider API.
4. Outcome via provider webhook.

## Audit

Every refund + dispute event logged:
- Reason
- Approver(s)
- Evidence references
- Customer-facing communications

## Marketer impact

Refunds reduce marketer profit (snapshot adjustment). High refund rate per marketer affects quality score.

## TODO

- TODO: confirm approval thresholds.
- TODO: store credit module spec (Phase 5).
- TODO: dispute response template per provider.
- TODO: Payment Risk Score recalculation on refund.
