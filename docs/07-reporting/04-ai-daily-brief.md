# AI Daily Business Brief

**Status:** Draft (stub)
**Owner:** AI lead + Analytics lead

---

## Purpose

AI-generated daily report for management. Highlights what changed yesterday and what needs attention today. **Marked advisory** — based on real data via tools, but not authoritative.

## Sections

1. **Yesterday at a glance** — revenue, orders, AOV, top product, top country
2. **Highest-profit campaign**
3. **Weakest campaign** — flagged for review
4. **High-risk marketer(s)** — quality score drops
5. **Low stock items** that need reorder action
6. **Most repeated objection** in chats — feeds into product page improvement
7. **Unresolved service issues** — ticket SLA breaches
8. **Landing pages needing attention** — slow / poor conversion
9. **AI performance summary** — handoff rate, top intents, anomalies
10. **Cash / COD issues** — collection variance, suspicious patterns
11. **Recommendations for today** — prioritized actions

## Generation

Cron job (e.g., 7am local per country) runs:
1. Aggregate yesterday's metrics (use materialized views).
2. Pass to LLM (Sonnet) with structured input + tools (`get_metric`, `get_anomaly`).
3. LLM produces narrative brief in admin's preferred locale.
4. Stored in `ai_daily_brief`.
5. Delivered: in-admin notification + email + WhatsApp (super_admin / finance / country_manager per opt-in).

## Constraints

- Must cite tool data; cannot invent figures.
- Must mark "advisory" prominently.
- Cost values redacted for non-finance recipients.
- Must NOT propose actions that violate Profit Guardrails or Override policies.

## TODO

- TODO: prompt template for brief generation.
- TODO: which metrics seed the brief.
- TODO: localization (per-country brief vs global).
