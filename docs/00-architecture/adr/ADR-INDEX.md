# ADR Index

All Architecture Decision Records for Smart Ladders Commerce Platform.

**Format:** `ADR-NNN-slug.md`
**Template:** `99-templates/adr-template.md`
**Lifecycle:** `proposed → accepted → superseded | deprecated`

---

## Status legend

- ✅ **Accepted** — decision locked, ADR signed off
- 🔵 **Proposed** — draft written, awaiting sign-off
- ⏳ **TODO** — placeholder, content not yet written
- ❌ **Rejected** — alternative considered and rejected
- 🔄 **Superseded** — replaced by a newer ADR

---

## Index

| # | Title | Status | File | Owner |
|---|---|---|---|---|
| ADR-001 | Frontend framework: Next.js 15 App Router + TypeScript | 🔵 | [ADR-001-frontend-framework.md](ADR-001-frontend-framework.md) | CTO |
| ADR-002 | Styling: Tailwind v4 + shadcn/ui | ⏳ | TODO | Frontend lead |
| ADR-003 | Animation strategy: CSS + Motion.dev (Phase 1) + Lottie (Phase 2) | ⏳ | TODO | Frontend lead |
| ADR-004 | Backend pattern: Next.js Route Handlers + Directus admin | ⏳ | TODO | CTO |
| ADR-005 | Add Laravel layer? No (defer until ERP integration) | ⏳ | TODO | CTO |
| ADR-006 | Database engine: PostgreSQL 16+ with RLS | 🔵 | [ADR-006-database-engine.md](ADR-006-database-engine.md) | DBA |
| ADR-007 | Vector store: pgvector on Postgres | ⏳ | TODO | DBA |
| ADR-008 | Search: Meilisearch self-hosted | ⏳ | TODO | Backend lead |
| ADR-009 | Cache + queue: Redis + BullMQ | ⏳ | TODO | Backend lead |
| ADR-010 | Realtime transport: Centrifugo (or Pusher) | ⏳ | TODO | Backend lead |
| ADR-011 | LLM default: Anthropic Claude (Sonnet 4.6 + Haiku 4.5) | 🔵 | [ADR-011-llm-default.md](ADR-011-llm-default.md) | AI lead |
| ADR-012 | LLM abstraction: internal `LLMProvider` interface | ⏳ | TODO | AI lead |
| ADR-013 | Media storage: Cloudflare R2 | ⏳ | TODO | Infra lead |
| ADR-014 | CDN / WAF: Cloudflare | ⏳ | TODO | Infra lead |
| ADR-015 | Messaging: WhatsApp Business Cloud API (Meta direct) | ⏳ | TODO | Ops lead |
| ADR-016 | Email/SMS: Resend + Unifonic + Vonage | ⏳ | TODO | Ops lead |
| ADR-017 | Hosting frontend: Vercel | ⏳ | TODO | Infra lead |
| ADR-018 | Hosting backend services: **Hetzner Frankfurt** (AWS me-south-1 future option) | ✅ | [ADR-018-hosting-backend.md](ADR-018-hosting-backend.md) | Infra lead |
| ADR-019 | Observability: Sentry + Grafana + Loki | ⏳ | TODO | Infra lead |
| ADR-020 | Auth (storefront): custom JWT or Auth.js | ⏳ | TODO | Backend lead |
| ADR-021 | Auth (admin): Directus built-in | ⏳ | TODO | Backend lead |
| ADR-022 | Secrets manager: **1Password Secrets Automation** | ✅ | [ADR-022-secrets-manager.md](ADR-022-secrets-manager.md) | Security lead |
| ADR-023 | Backup destination: **Cloudflare R2 primary + Backblaze B2 offsite** | ✅ | [ADR-023-backup-destination.md](ADR-023-backup-destination.md) | Infra lead |
| ADR-024 | CI/CD: GitHub Actions + Vercel CI | ⏳ | TODO | DevOps |
| ADR-025 | Locale routing: sub-path `/{locale}/` via `next-intl` | ⏳ | TODO | Frontend lead |
| ADR-026 | Country switcher: country and locale separate UI controls | ⏳ | TODO | Product |
| ADR-027 | Schema migration tool: **`node-pg-migrate`** | ✅ | [ADR-027-migration-tool.md](ADR-027-migration-tool.md) | DBA |
| ADR-028 | API doc tool: OpenAPI 3.1 + Stoplight or Redocly | ⏳ | TODO | Backend lead |
| ADR-029 | Component library generation: shadcn/ui CLI (copy components, don't depend) | ⏳ | TODO | Frontend lead |
| ADR-030 | Mobile push notifications: Web Push (VAPID) for PWA admin | ⏳ | TODO | Frontend lead |

---

## How to add a new ADR

1. Copy `99-templates/adr-template.md` to `ADR-NNN-slug.md` (next number).
2. Fill in: context, options considered, decision, consequences.
3. Set status to `Proposed`.
4. Open PR.
5. After review and sign-off, status moves to `Accepted`.
6. Add row to this index.

## Supersession

When a decision is replaced:
1. Old ADR status → `Superseded by ADR-NNN`.
2. New ADR references old in its "Supersedes" field.
3. Index updated.

The old ADR stays in the repo — never deleted.
