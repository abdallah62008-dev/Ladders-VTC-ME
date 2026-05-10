# Feature Flags

**Status:** 🟢 **Confirmed and locked — 2026-05-07** (part of D-PERF-001); admin UI Phase 6+; runtime Phase 10
**Owner:** Infra Lead + Engineering Lead
**Source:** Master Plan v4 §22

> Section I of the Performance, Cleanup, Landing Page Growth & Alerts System. See [`00-index.md`](./00-index.md) for the full module overview.

---

## I.1 Suggested flags (Phase 1+)

- `enable_ai_chat`
- `enable_ladder_finder`
- `enable_payment_online`
- `enable_whatsapp_confirmation`
- `enable_marketer_dashboard`
- `enable_landing_ab_test`
- `enable_new_checkout`
- `enable_product_landing_pages`
- `enable_category_landing_pages`
- `enable_cleanup_jobs`
- `enable_performance_alerts`
- `enable_static_landing_snapshots`
- `enable_adaptive_landing_pages`
- `enable_smart_cta_engine`
- `enable_image_quality_scanner`
- `enable_partitioning`

## I.2 Feature flag attributes

Each flag supports:

| Attribute | Description |
|---|---|
| `country` | Per-country rollout |
| `locale` | Per-locale rollout |
| `user_role` | Restrict to certain roles (e.g., admin-only beta) |
| `percentage_rollout` | 0–100% of traffic |
| `start_at` / `end_at` | Time-windowed |
| `rollback` | One-click disable |
| `audit_log` | Every flip recorded |

Stored in `feature_flag` table (Phase 10 schema reservation; admin UI ships Phase 6+).
