# Entity Relationship Diagram

**Status:** Draft
**Owner:** DBA
**Last updated:** 2026-05-09

This file shows high-level entity relationships in Mermaid format. For full table specs, see `02-tables-by-module.md`.

The full ERD is split into **module clusters** because rendering 70+ entities in one diagram is unreadable.

> 🟢 **Modules 24–27 ERD expansion deferred to Phase 6 (locked 2026-05-09).** Modules 24 (Decision & Recommendation Engine), 25 (Safety & Compliance), 26 (Trust Layer), and 27 (Readiness Engine) currently have **Phase 1 schema reservations / planning docs only** in `02-tables-by-module.md`. Full ERD cluster diagrams for these modules are deferred to the **Phase 6 design window**, unless any Module 24–27 table becomes active earlier (in which case ERD detail follows the activation). **Phase 1 should not be blocked by full ERD detail for these future modules.** Existing ERD clusters (1–8) cover the active Phase 1 schema and remain authoritative.

---

## Cluster 1 — Geo / Catalog / Pricing / Stock

```mermaid
erDiagram
  country ||--o{ locale : has
  country ||--o{ warehouse : has
  country ||--o{ country_launch_readiness : tracked_by
  country ||--o{ variant_country_price : prices
  country ||--o{ variant_country_cost : costs
  country ||--o{ variant_marketer_cost : marketer_costs
  country ||--o{ product_country_readiness : readiness
  country ||--o{ shipping_zone : zones

  category ||--o{ category_translation : translates
  category ||--o{ product : groups
  product_group ||--o{ product : groups
  product ||--o{ product_translation : translates
  product ||--o{ product_variant : variants
  product ||--o{ product_image : images
  product ||--o{ product_video : videos
  product ||--o{ product_certification : certs

  product_variant ||--o{ variant_country_price : per_country
  product_variant ||--o{ variant_country_cost : per_country
  product_variant ||--o{ variant_marketer_cost : per_marketer
  product_variant ||--o{ variant_warehouse_stock : per_warehouse

  warehouse ||--o{ variant_warehouse_stock : stocks
  warehouse ||--o{ stock_movement : movements
  warehouse ||--o{ stock_reservation : reservations
  warehouse ||--o{ stock_transfer : transfers_from
```

## Cluster 2 — Customer / Cart / Customer Orders

> 🟢 D-DB-001 Answered 2026-05-07: main orders table is `customer_orders` (plural). Child tables `order_line`, `order_event`, etc. retain `order_*` prefix per `02-tables-by-module.md` Module 6 naming-convention callout.


```mermaid
erDiagram
  customer ||--o{ customer_address : addresses
  customer ||--o{ customer_consent : consents
  customer ||--o{ customer_segment_membership : segments
  customer ||--o{ customer_score : scores
  customer ||--o{ customer_intelligence : intelligence
  customer ||--o| b2b_account : optional_b2b

  customer ||--o{ cart : owns
  cart ||--o{ cart_line : lines
  cart ||--o{ cart_event : events

  customer ||--o{ draft_order : drafts
  customer ||--o{ customer_orders : orders
  customer_orders ||--o{ order_line : lines
  customer_orders ||--o{ order_address : addresses
  customer_orders ||--o{ order_event : events
  customer_orders ||--o| order_profit_snapshot : snapshot
  customer_orders ||--o| order_source_attribution : attribution
  customer_orders ||--o| order_risk_score : risk
```

## Cluster 3 — AI / Conversation / Auto-Reply / Messaging

```mermaid
erDiagram
  conversation ||--o{ chat_session : sessions
  conversation ||--o{ message : messages
  conversation ||--o{ conversation_state_log : state_history
  conversation ||--o{ handoff_request : handoffs
  conversation ||--o{ escalation_log : escalations

  message ||--o{ ai_tool_call : tools
  message ||--o| ai_response : ai_response

  ai_prompt ||--o{ ai_response : version_used
  faq_policy ||--o{ ai_tool_call : queried

  reply_profile ||--o{ reply_template : templates
  reply_profile ||--o{ reply_rule : rules
  reply_template ||--o{ reply_resolution_log : used
  reply_rule ||--o{ reply_resolution_log : matched

  message_template ||--o{ message_log : sent_as
  message_campaign ||--o{ message_log : in_campaign
  customer ||--o{ message_log : recipient
  customer ||--o{ satisfaction_response : surveyed
```

## Cluster 4 — Payments

```mermaid
erDiagram
  payment_provider ||--o{ payment_method : offers
  payment_method ||--o{ payment_transaction : used_in
  customer_orders ||--o{ payment_transaction : has
  payment_transaction ||--o{ payment_log : logs
  payment_transaction ||--o{ refund : refunds
  refund ||--o| dispute : disputed
  customer_orders ||--o{ deposit : deposits
  customer_orders ||--o{ invoice : invoiced
```

## Cluster 5 — Marketers / Coupons / Campaigns

```mermaid
erDiagram
  marketer_tier ||--o{ marketer : tier
  marketer ||--o{ marketer_referral_link : links
  marketer ||--o{ marketer_coupon : coupons_owned
  marketer ||--o{ marketer_event : events
  marketer ||--o{ marketer_order_attribution : attributions
  marketer ||--o{ marketer_payout : payouts
  marketer ||--o{ marketer_quality_score : score
  marketer ||--o{ marketer_fraud_flag : flags
  marketer ||--o{ marketer_content_submission : submissions

  coupon ||--o{ coupon_usage : uses
  coupon ||--o{ marketer_coupon : owned_by
  campaign ||--o{ campaign_product : products
  campaign ||--o{ campaign_attribution : attributions
  campaign ||--o| campaign_profit_forecast : forecast
```

## Cluster 6 — Landing / SEO / Media

```mermaid
erDiagram
  landing_page ||--o{ landing_page_variant : variants
  landing_page ||--o| ab_test : test
  ab_test ||--o{ ab_test_result : results

  group_sales_page ||--|| product_group : sells
  seo_page ||--o| guide : guide
  guide ||--o{ faq : faqs

  media_asset ||--o{ media_variant : variants
  media_asset ||--o{ media_usage : used_in
```

## Cluster 7 — Operations / Maintenance

```mermaid
erDiagram
  customer_orders ||--o{ packing_checklist : checklist
  customer_orders ||--o{ pre_dispatch_photo : photos
  customer_orders ||--o{ delivery_failure : failures
  customer_orders ||--o{ return_inspection : returns

  service_ticket ||--o{ fault_report : faults
  service_ticket ||--o| warranty_claim : warranty
  service_ticket ||--o| replacement_request : replacement
  service_ticket ||--o| repair_request : repair

  product_batch ||--o{ serial_number : serials
  product_variant ||--o{ serial_number : serials_of
```

## Cluster 8 — System / Audit / Override / Backup / Import

```mermaid
erDiagram
  user ||--|| role : role
  role ||--o{ role_permission : has
  permission ||--o{ role_permission : granted_to

  user ||--o{ audit_log : actor
  user ||--o{ approval : actor
  approval ||--o| audit_log : ref

  override_request ||--|| override_policy : policy
  override_request ||--|| audit_log : ref

  backup_job ||--o{ backup_verification : verifications
  backup_job ||--o| restore_job : restored_in

  import_export_job ||--|| import_template : uses
  import_export_job ||--o{ audit_log : audit_per_row
  country_data_audit ||--|| audit_log : extends
```

---

## Source files

ERD source files (DBML and Mermaid) live in `01-database/erd-source/` (TODO: create as Phase 0 work proceeds).

```
erd-source/
  schema.dbml         (full DBML — preferred for dbdiagram.io)
  schema.mermaid      (full Mermaid — embedded above per cluster)
  cluster-1-catalog.mermaid
  cluster-2-orders.mermaid
  ...
```

---

## TODO

- TODO: produce full `schema.dbml` and `schema.mermaid` files.
- TODO: render PNGs of each cluster for inclusion in design reviews.
- TODO: add foreign-key cardinality annotations after schema review.
