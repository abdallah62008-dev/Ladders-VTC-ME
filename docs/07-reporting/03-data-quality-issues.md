# Data Quality Center — Issue Catalog

**Status:** Draft
**Owner:** Analytics lead

---

## Issue catalog

| # | Issue | Severity | Detection rule |
|---|---|---|---|
| 1 | Product without price in active country | High | `product.status='active' AND vcp.active=true` but no `regular_price` |
| 2 | Product without stock in active country | High | active in country but no `variant_warehouse_stock` row |
| 3 | Product without primary image | Medium | `product.primary_image_id IS NULL` |
| 4 | Product without SEO meta | Medium | missing `meta_title` or `meta_desc` per locale |
| 5 | Country missing payment settings | Critical | `country.active=true` but `payment_methods` empty |
| 6 | Country missing shipping settings | Critical | `country.active=true` but `shipping_methods` empty |
| 7 | Warehouse without any stock | Low | `warehouse.active=true` but no rows in `variant_warehouse_stock` |
| 8 | Coupon without end date | Medium | `coupon.ends_at IS NULL` |
| 9 | Landing page without CTA | Medium | `landing_page.blocks` lacks any CTA block |
| 10 | Broken pixel | High | last `pixel_event_log.success=true` > 1 hour ago |
| 11 | Webhook delivery failures | High | `webhook_delivery_log.status='failed'` count > threshold |
| 12 | Missing alt text on image | Low | `media_asset.alt_translations` missing for active locale |
| 13 | Missing translation | Medium | product without translation for any active locale |
| 14 | Product active in country but missing price | Critical | redundant with #1; emphasize |
| 15 | Product priced below `min_selling_price` | High | `vcp.regular_price < vcp.min_selling_price` |
| 16 | Stock negative | Critical | `variant_warehouse_stock.qty_on_hand < 0` |
| 17 | Order without attribution | Low | `order.marketer_id IS NULL` AND `order.utm_*` IS NULL AND non-direct (Phase 5+) |
| 18 | Hreflang missing | Medium | page rendered without all locale alternates |
| 19 | Slow page (CWV breach) | Medium | LCP > target on tracked page |
| 20 | Stale FAQ content | Low | `faq_policy.updated_at` > 6 months ago |
| 21 | Landing page score below "Ready" threshold | High | `landing_page.score < 90` (per `19-performance-growth/03-landing-pages.md` §D.2) |
| 22 | Landing page failed pre-publish quality gate | Critical | One or more critical checks failed in `landing_page_quality_gate_run` (per §D.1) |
| 23 | Landing page references out-of-stock product | High | `landing_page.product_id` joined to `qty_available_total = 0` AND no waitlist mode |
| 24 | Landing page references expired coupon | High | `landing_page.coupon_id` joined to `coupon.ends_at < now()` |
| 25 | Landing page WhatsApp CTA broken | Critical | `landing_page.whatsapp_cta = true` AND linked country `whatsapp_number` missing/inactive |
| 26 | Landing page direct buy CTA broken | Critical | `landing_page.direct_buy_cta = true` AND product not purchasable in target country |
| 27 | Landing page violates profit guardrail | Critical | Computed margin < `country.business_min_margin` AND no active override (per §D.7) |
| 28 | Landing page contains forbidden compliance claim | Critical | Pattern match against `landing_page_compliance_rule` table (per §D.6: false safety claims, fake certificates, "best in market" without proof) |
| 29 | Landing page missing translation for active locale | High | Country has active locale but `landing_page_translation` row missing |
| 30 | Landing page exceeds page weight budget | High | Measured `page_weight_kb > performance_budget_kb` (per §A.3) |
| 31 | Landing page Lighthouse below page-class target | High | Latest CI/RUM measurement below page-class budget (per §A.3) |
| 32 | Image asset oversized | Medium | `media_asset.size_kb > 200` after compression (per §B.4 Auto Image Quality Scanner — Phase 10) |
| 33 | Orphan media asset | Low | `media_asset` with no `media_usage` rows for 90+ days (per §F.3) |
| 34 | Script weight unreviewed for 90+ days | Medium | `script_inventory.last_review_date < now() - 90 days` (per §A.6) |
| 35 | Custom script not approved | High | `script_inventory.approval_status != 'approved'` AND `active_pages` non-empty (per §A.6) |

## Output

Surfaced in **Data Quality Center** dashboard:
- Per issue: count of affected records, link list, severity, suggested fix.
- Daily digest email to owner role.
- Critical issues fire Smart Notification immediately.

## Schema

```
data_quality_issue (
  id, issue_type, severity, entity, entity_id, country_id?,
  detected_at, resolved_at, resolved_by, suggested_fix, related_url
)
```

## TODO

- TODO: confirm severity mappings.
- TODO: implement detector cron jobs (Phase 10).
- TODO: per-issue runbook (`how to fix issue #N`).
