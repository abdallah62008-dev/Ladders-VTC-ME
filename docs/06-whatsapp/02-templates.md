# WhatsApp Message Templates

**Status:** Draft
**Owner:** Ops lead + Content lead

> 🟢 **Build Now, Activate When Ready** (D-READY-002 locked 2026-05-09): Templates may be `draft / submitted / pending_meta_approval`. They cannot be used in customer flows until `approved` by Meta AND `active=true` AND template content reviewed. **Backend rejects send-attempts using inactive templates.** Per-country isolation enforced (per `03-numbers.md`). See `../GLOSSARY.md` "Build Now, Activate When Ready" + `../27-readiness-engine/01-unified-readiness.md` for the full activation lifecycle.

---

## What are templates

Pre-approved message structures Meta requires for any outbound message **outside** the 24h customer-initiated window. Submission via Meta Business Manager; approval typically 1–7 days.

## Template categories

Meta classifies templates as `MARKETING`, `UTILITY`, or `AUTHENTICATION`. We use `MARKETING` (broadcasts) and `UTILITY` (transactional).

## Templates to submit (60+ across 6 locales)

Per locale × per category, the following templates are required:

### Transactional (UTILITY)
1. `order_confirmation` — order placed, summary
2. `shipping_notification` — shipped + tracking
3. `out_for_delivery` — courier OFD
4. `delivered` — delivered confirmation
5. `cod_confirmation_request` — COD pre-dispatch confirmation request
6. `payment_link` — generated payment link
7. `service_ticket_created` — fault reported
8. `quote_ready` — B2B quote ready

### Lifecycle (UTILITY)
9. `satisfaction_survey` — 24–48h post-delivery
10. `review_request` — only if rating ≥ 4

### Marketing (MARKETING)
11. `abandoned_cart` — 24h cart abandonment
12. `reorder_reminder` — B2B / loyal customer reorder prompt
13. `seasonal_campaign` — generic campaign template

## Total

11 templates × 6 locales = **66 templates** to submit. Some can be parameterized to reduce count, but locale variants are still per-language.

## Template structure example (`order_confirmation` ar-sa)

```
HEADER (image): brand logo
BODY:
  أهلاً {{1}} 👋
  
  تم استلام طلبك ✅
  رقم الطلب: {{2}}
  المنتج: {{3}}
  الإجمالي: {{4}} ر.س
  العنوان: {{5}}
  التوصيل المتوقع: {{6}} - {{7}} يوم
  
  للأسئلة، رد على هذه الرسالة.
  شكراً لاختيارك [Brand] 🪜

FOOTER:
  [Brand] - متجر السلالم الذكي
BUTTONS:
  - "تتبع الطلب" (URL — /orders/{{8}})
  - "اتصل بنا" (PHONE)
```

Variables `{{1}}..{{8}}` filled at send time.

## Submission workflow

1. Draft template in markdown (`templates-by-locale/<locale>/<key>.md`).
2. Content review by Arabic copywriter (per-country tone).
3. Submit via Meta Business Manager.
4. Approval: 1–7 days.
5. On approval, store `provider_template_id` in `message_template`.
6. Available for sending.

## TODO

- TODO: write all 66 template drafts (high effort — start in week 1 of Phase 0).
- TODO: per-country tone alignment (formal Gulf KSA, friendly EG, direct IQ).
- TODO: media headers — final brand logo URL for header image.
- TODO: button URL patterns — confirm `/orders/{{id}}` works without auth (or with magic-link).
