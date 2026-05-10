# Roadmap

High-level phase summary. Detailed phase plans live in `15-phases/`.

| Phase | Duration | Goal | Status |
|---|---|---|---|
| **0 — Final planning + infra** | 3 wk | All decisions documented; infrastructure provisioned (empty); applications submitted | **In progress** |
| **1 — Foundation MVP (KSA)** | 4 wk | Next.js scaffold; locale routing; RTL/LTR; dynamic country/warehouse/pricing/stock schema with RLS; 1 product live ar-sa+en-sa; daily backups; Lighthouse mobile ≥90 | Not started |
| **2 — Commerce core** | 4 wk | Cart, draft orders, checkout foundation, stock reservation, COD flow, WhatsApp order flow, payment-provider abstraction, Import/Export skeleton | Not started |
| **3 — AI chat MVP + Auto-Reply** | 5 wk | Web chat widget, orchestrator, state machine, LLM tools, pgvector FAQ, guardrails, admin live inbox, Auto-Reply rules engine | Not started |
| **4 — Customer Messaging** | 3 wk | WhatsApp confirmation flow, satisfaction surveys, review requests, opt-out, frequency caps, broadcast tooling | Not started |
| **5 — Marketers + Coupons + Profit Guardrails** | 5 wk | Marketer accounts, tiers, links, coupons, payouts, training portal, content approval, Profit Guardrails enforcement, Override Module full rollout | Not started |
| **6 — Landing Pages + Group Sales + Smart Tools** | 4 wk | Group sales pages, fast landing pages, builder + A/B + pixels, Ladder Finder, Reach Calculator, Fit-My-Car standalone, Compare | Not started |
| **7 — Payments expansion (incl. Stripe)** | 4 wk | Stripe Checkout + Payment Intents, local gateway adapters, Payment Routing Engine, deposits & payment links, ZATCA Phase 2 e-invoices | Not started |
| **8 — Multi-country: Egypt + Iraq + B2B** | 5 wk | Country-templated address forms, EG/IQ payment integrations, per-country WhatsApp, AI tone variation, B2B accounts, quote pipeline | Not started |
| **9 — Operations + Maintenance/Warranty** | 4 wk | Multi-warehouse, smart reservation, packing checklist, pre-dispatch photo proof, courier perf, service tickets, warranty claims, serial/batch tracking | Not started |
| **10 — Intelligence & Reporting** | ongoing | All 16 dashboards, Data Quality Center, AI Daily Brief, Smart Notifications, Report Builder, Decision/Experimentation logs, advanced analytics | Not started |

**Total:** 10–14 months full launch · **Soft launch (KSA + AI chat MVP):** ~12 weeks.

## Source of truth

Final Master Plan v4 — the document that replaced v3 and earlier iterations. v4 deltas: Import/Export module, Backup/Restore Dashboard, Mobile Responsive Admin, Manual Override with Reason.

## Delays

See `15-phases/phase-1-execution-plan.md` for what is explicitly delayed beyond Phase 1.
