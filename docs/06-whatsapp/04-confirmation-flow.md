# WhatsApp Order Confirmation Flow

**Status:** Draft
**Owner:** Ops lead

---

## Statuses

```
pending_confirmation → confirmation_sent → confirmed_by_customer
                                        ↘ confirmation_failed
                                        ↘ no_reply
                                        ↘ manual_followup_required
                                        ↘ cancelled_by_customer
                                        ↘ expired
```

## Triggers per country

| Country | When confirmation required |
|---|---|
| KSA | Optional for online-paid orders; **required for COD** |
| Egypt | Required for COD |
| Iraq | **Required for all orders** (high COD %, address quality varies) |

## Flow

1. Order created with status `pending_cod_confirmation` (or similar).
2. WhatsApp template `cod_confirmation_request` sent.
3. Customer replies: "نعم" / "Yes" / "تأكيد" / "Confirm" → status `confirmed`.
4. Customer replies: "لا" / "Cancel" → status `cancelled`.
5. No reply within X hours → ops auto-call → status `manual_followup_required`.
6. After Y hours total → status `expired`; release stock reservation.

## Detection

Reply text matched against per-locale confirmation/cancellation keywords:
- ar-sa: confirm = `تأكيد`, `نعم`, `موافق`; cancel = `لا`, `إلغاء`
- ar-eg: confirm = `تأكيد`, `أيوة`, `أوكي`; cancel = `لا`, `إلغاء`
- ar-iq: confirm = `تأكيد`, `هاي`, `موافق`; cancel = `لا`, `الغاء`
- en: confirm = `confirm`, `yes`, `ok`; cancel = `no`, `cancel`

If unclear → AI agent asks clarifying question.

## SLA

| Country | Auto-call after | Expire after |
|---|---|---|
| KSA | 4 h | 24 h |
| Egypt | 4 h | 24 h |
| Iraq | 4 h | 48 h |

## Stock impact

- `pending_cod_confirmation` reserves stock with TTL = expire timeout.
- On `expired` or `cancelled` → reservation released → stock restored to `qty_available`.

## TODO

- TODO: lock per-locale keyword lists.
- TODO: confirm SLAs with ops team.
- TODO: integrate with calling system (phone agent CRM).
