# Consent and Opt-Out

**Status:** Draft
**Owner:** Ops lead + Legal

---

## Consent types

| Type | Default | Purpose |
|---|---|---|
| `messaging_transactional_consent` | Implied on order | Order updates, shipping, OFD, delivered |
| `messaging_marketing_consent` | **Opt-in only** | Broadcasts, abandoned cart, reorder reminder |
| `review_request_consent` | Opt-in (post-survey) | Review request after high satisfaction |

## Opt-in mechanisms

- Checkout form: explicit checkbox "أوافق على استلام عروض ترويجية عبر واتساب" (default unchecked).
- Account settings: toggle.
- AI conversation: explicit ask before adding to marketing.

## Opt-out detection

Inbound messages scanned for opt-out keywords (per-locale):
- ar: `إيقاف`, `الغاء الاشتراك`, `لا اريد رسائل`, `stop`
- en: `stop`, `unsubscribe`, `opt out`

On detection:
1. `customer_opt_out` row created with timestamp + reason category.
2. `messaging_marketing_consent` set to false immediately.
3. Confirmation message sent: "تم إيقاف الرسائل التسويقية. ستستمر إشعارات الطلبات المهمة فقط." (transactional remains).
4. Audit-logged.

## Frequency caps

| Type | Default cap |
|---|---|
| Marketing messages per customer per 7 days | 2 |
| Review request per order | 1 |
| Reorder reminder per quarter | 1 |
| Abandoned cart reminder per cart | 1 |

Caps enforced at dispatch time. Customer flagged "saturated" if cap reached.

## Quiet hours

- Default 9pm–9am local (per `country.business_hours.timezone`).
- Marketing messages held in queue until window opens.
- Transactional messages exempt (delivery updates urgent).

## Suppression triggers

Stop ALL marketing (transactional continues) when:
- Open complaint (`service_ticket.status` open and severity ≥ medium)
- Open dispute / chargeback
- Recent refund (within 14 days, configurable)
- Marked fraud

## Compliance

- Consent records stored in `customer_consent` with method, timestamp, IP, locale.
- KSA PDPL, Egyptian PDPL aware.
- Annual consent refresh policy TBD (TODO).

## TODO

- TODO: opt-out keyword list per locale finalized.
- TODO: consent storage retention period.
- TODO: confirm legal stance on implied consent for transactional.
- TODO: design consent management UI in customer account page.
