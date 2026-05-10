# WhatsApp Numbers

**Status:** Draft (stub)
**Owner:** Ops lead

---

## Per-country numbers

| Country | Number | Display name | Status |
|---|---|---|---|
| KSA | TODO +966 ... | Smart Ladders KSA | TODO Meta verification |
| Egypt | TODO +20 ... | Smart Ladders Egypt | TODO |
| Iraq | TODO +964 ... | Smart Ladders Iraq | TODO |

## Verification process

1. Acquire dedicated phone number per country (SIM, virtual line, or hosted number).
2. Add to Meta Business Manager.
3. Verify ownership (SMS or call).
4. Submit for display name approval.
5. Number is "registered with Cloud API" — accepts webhooks + sends.

## Routing

- Storefront and AI agent know `country.whatsapp_number` and use it.
- Inbound webhooks identify country by which number received the message.

## Per-country isolation (🟢 D-CSP-001 locked 2026-05-09)

Per `03-rbac/03-scopes.md` §I + `04-ai/05-guardrails.md` cross-country mixing rules:

- **WhatsApp numbers are isolated per country.** An agent assigned only to Saudi Arabia cannot send via the Egypt or Iraq WhatsApp number. Backend rejects + audit-logs as `denied_cross_country_access_attempt`.
- **WhatsApp templates are isolated per country.** Templates approved by Meta for KSA cannot be reused for Egypt without separate Meta approval per number. `messaging_template.country_ids[]` array filters per-country variants.
- **Inbound message routing.** When a message arrives on the KSA WhatsApp number, `conversation.country_id` is set to KSA; agents without KSA access cannot view that conversation; AI guardrails enforce no cross-country price/stock/promise mixing.
- **Outbound broadcasts** target a country (`customer_segment.country_id`). Initiator must have `user_country_access` for that country. Multi-country broadcast = `country_scope.all` permission required.
- **WhatsApp Numbers admin page** is `country_scope_mode = 'scoped'` — selecting Saudi Arabia in the top-bar shows KSA number; selecting Egypt shows Egypt number.

## Reserved numbers (future)

Two reserved numbers per country (one for B2B sales rep, one for customer support — TODO confirm).

## TODO

- TODO: number procurement plan.
- TODO: hosted number provider vs dedicated SIM.
- TODO: backup number per country in case of suspension.
