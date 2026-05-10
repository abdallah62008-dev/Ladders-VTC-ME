# Module 26 — Trust Layer

**Status:** 🟢 **Documentation locked 2026-05-07** (D-TRUST-001 🟢 Answered); review schema reservation Phase 1; collection flow Phase 4 (WhatsApp); surface rendering Phase 6
**Owner:** Marketing Manager + Customer Support Lead
**Source:** Strategic Enhancements Evaluation (2026-05-08); Master Plan v4 §1.5

> ⚠️ **Mostly views over existing tables, plus a few new tables for reviews + media permission.** No new admin "Trust" CMS — surfaces are rendered from data that already exists across Modules 2 / 13 / 14 / 16 / 6.

---

## Purpose

Customer trust on a regulated safety product is a leading indicator of conversion AND a defense against complaints. This module unifies the trust signals already scattered across the platform and adds structured **reviews** + **media permissions**.

---

## Trust assets inventory

| Asset | Source | New? |
|---|---|---|
| Verified reviews (rating + text) | New `customer_review` table | ✅ NEW |
| Verified-purchase badge | Computed: `customer_review.order_id IS NOT NULL` | view |
| Customer product photos | `customer_review_media` + `media_asset` | ✅ NEW (small) |
| Real product videos | Existing `product_video` (Module 2) | reused |
| Warranty registration card | `warranty_registration` (Module 16, Phase 9) | reused |
| Delivery proof | `pre_dispatch_photo` (Module 16, existing) | reused |
| Safety instructions | `safety_guideline` (Module 25) | reused |
| Certificates | `product_certification` (Module 2, existing) | reused |
| Real product photos | `product_image` (Module 2, existing) | reused |

---

## Phase 1 schema reservations (Module 26)

> Reserved as empty/skeleton tables in Phase 1; populated when collection flow ships Phase 4–6.

### `customer_review` (Phase 4 collection; Phase 6 surface)

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| customer_id | uuid FK | |
| order_id | uuid FK → `customer_orders.id` | required — every review must link to a real order |
| product_id | uuid FK | |
| variant_id | uuid FK NULL | |
| country_id | uuid FK | |
| locale | text FK | |
| rating | int CHECK (rating BETWEEN 1 AND 5) | |
| title | text NULL | |
| body | text | |
| city_display | text NULL | shown to public; sourced from order address with customer permission |
| use_case_tag | text NULL | optional; ties to `recommendation_use_case` (Module 24) |
| collection_channel | text | `'whatsapp' \| 'email' \| 'web' \| 'admin_entry'` |
| collected_at | timestamptz | |
| submitted_at | timestamptz | |
| approval_status | text | `'pending' \| 'approved' \| 'rejected' \| 'flagged'` |
| approved_by_user_id | uuid FK NULL | |
| approved_at | timestamptz NULL | |
| reject_reason | text NULL | |
| flagged_for_safety_review | bool | true if mentions injury/incident keywords → routes to Module 25 |
| created_at, updated_at | timestamptz | |

### `customer_review_media` (Phase 4)

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| customer_review_id | uuid FK | |
| media_asset_id | uuid FK → `media_asset` | |
| caption | text NULL | |
| display_order | int | |
| customer_permission_to_publish | bool | required; default false; explicit consent capture |
| permission_captured_at | timestamptz | |
| permission_method | text | `'whatsapp_acknowledge' \| 'web_checkbox' \| 'email_reply'` |

### `customer_review_approval_log` (Phase 4)

History/audit table — one row per approval workflow event.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| customer_review_id | uuid FK | |
| event | text | `'submitted' \| 'reviewed' \| 'approved' \| 'rejected' \| 'flagged' \| 'unflagged'` |
| actor_user_id | uuid FK | |
| reason | text | |
| audit_log_id | uuid FK | |
| created_at | timestamptz | |

### `verified_purchase_badge` (computed view, Phase 6)

```sql
CREATE VIEW v_verified_purchase_review AS
SELECT cr.*, true AS verified_purchase_badge
FROM customer_review cr
WHERE cr.order_id IS NOT NULL
  AND cr.approval_status = 'approved'
  AND EXISTS (
    SELECT 1 FROM customer_orders co
    WHERE co.id = cr.order_id
      AND co.status IN ('delivered', 'completed')
  );
```

(Display rule: badge shown only when verified.)

---

## Collection flow (Phase 4 — WhatsApp)

5–7 days after delivery (per `customer_orders.status='delivered'` + 5d):

1. WhatsApp template `review_request_with_photo_ar/_en` sent (Meta approval required).
2. Customer replies with rating (1–5) + text.
3. Optional: customer attaches photos. WhatsApp permission to publish captured via reply ("Reply YES to allow your photo to be shown to other customers").
4. `customer_review` row created with `approval_status='pending'`.
5. AI moderation runs: scans for safety incidents (`flagged_for_safety_review`), profanity, competitor mentions.
6. Customer Support reviews flagged items + approves/rejects.

---

## Approval rules

| Rule | Action |
|---|---|
| Review mentions injury, accident, hospital, broke, snapped, fell | Auto-flag → Module 25 incident review |
| Review mentions competitor brand by name | Auto-flag for editorial review (likely reject) |
| Review profanity / abuse | Auto-flag for moderation |
| Review under 10 chars body | Auto-reject (low value) |
| 5-star with no text + no photo | Auto-approve (rating-only) |
| 1-star or 2-star reviews | Always Customer Support review (potential service recovery opportunity) |

---

## Customer-facing surfaces

| Surface | Behavior |
|---|---|
| **PDP** | Reviews block shows **only `approval_status='approved'`** + verified badge. Sort: most helpful → most recent. Filter by rating + use-case tag. |
| **PLP / category pages** | Average rating + count badge from approved reviews only. |
| **Landing pages** | Reviews block opt-in per landing page; defaults to off. When on, surfaces approved reviews matching landing page's product. |
| **WhatsApp shop view** | Top-3 highest-rated reviews shown when customer asks "is this any good?" — AI guardrails ensure factual phrasing. |

---

## Media permission rule

Customer photos may be displayed publicly **only if**:
1. `customer_review_media.customer_permission_to_publish = true`
2. `permission_captured_at` is set
3. `permission_method` is one of the documented methods
4. No other moderation flag

If permission is later revoked (customer support request), media moves to `archived_at` state and is removed from public surfaces within 1 cache cycle (per `19-performance-growth/...` §E smart cache invalidation).

---

## Integration with existing modules

| Module | Integration |
|---|---|
| **Module 6 — Cart & Order** | `customer_review.order_id` joins to `customer_orders.id` (verified-purchase logic) |
| **Module 10 — Customer Messaging** | Review request templates live in `messaging_template`; collection flow lives in customer messaging engine |
| **Module 14 — Media** | `customer_review_media.media_asset_id` joins to `media_asset` |
| **Module 16 — Operations & Maintenance** | Warranty registration link displays as trust asset on PDP (Phase 9) |
| **Module 25 — Safety & Compliance** | Reviews flagged for safety automatically create `safety_incident_report` rows |
| **Module 24 — Decision Engine** | Approved reviews tagged with `use_case_tag` feed back into recommendation reasoning ("3 villa owners rated this 5 stars") |

---

## RBAC (per `03-rbac/02-permissions.md`)

| Slug | Owner |
|---|---|
| `review.read` | Customer Support + Marketing + Super Admin (others scoped) |
| `review.approve` | Customer Support |
| `review.reject` | Customer Support |
| `review.flag` | Any admin (low-stakes flagging) |
| `trust_asset.read` | All admin roles |
| `trust_asset.write` | Marketing Manager + Super Admin |

---

## Alerts (per `19-performance-growth/...` §H)

New alert sub-category under existing `business`:
- Medium: Review pending approval > 48 hours
- High: Review flagged for safety mention (auto-routes to Module 25)
- Low: Product without any approved review at launch
- Low: Average rating drop > 0.5 stars in 7 days

---

## Phase placement

| Phase | Work |
|---|---|
| **Phase 1** | Schema reservation: `customer_review`, `customer_review_media`, `customer_review_approval_log` |
| Phase 4 | Collection flow via WhatsApp; review request template; auto-moderation; Customer Support review queue |
| Phase 6 | Surface rendering on PDP / PLP / Landing pages; verified-purchase badge view; media permission flow on web |
| Phase 9 | Warranty registration as trust asset (links to Module 16) |
| Phase 10 | Trust Layer Coverage report (% products with reviews / photos / videos / warranties) |

---

## TODO

- TODO: lock review request WhatsApp template wording (`review_request_with_photo_ar/_en`) with Marketing + Legal.
- TODO: define moderation training set / prompts for auto-flagging.
- TODO: confirm city display rule with Legal (PDPL — is order-address city PII?).
- TODO: design "service recovery" workflow for 1–2 star reviews (Phase 4 detail).
