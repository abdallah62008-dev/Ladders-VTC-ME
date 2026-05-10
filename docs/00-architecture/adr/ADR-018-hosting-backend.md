# ADR-018 — Hosting backend services: Hetzner Frankfurt

**Status:** ✅ **Accepted — 2026-05-07**
**Date:** 2026-05-07
**Owner:** Infra lead
**Supersedes:** none
**Tracker decision:** D-INFRA-001 (🟢 Answered 2026-05-07)

---

## Context

Phase 1 needs hosting for backend services: PostgreSQL 16+ (with pgvector), Redis (cache + BullMQ queue), Directus admin, Meilisearch, Centrifugo (realtime), and BullMQ workers.

The decision affects:
- Cost — Phase 1 budget (gated by D-LAUNCH-006 hosting budget approval).
- Operational complexity — managed services vs self-managed VMs.
- ZATCA Phase 2 compliance — Saudi tax authority preference for in-region data residency (KSA / GCC).
- Latency to MENA customers — Cloudflare CDN absorbs most of this; backend latency only matters for admin and API.
- Vendor lock-in — switching providers later is non-trivial for stateful services.
- Backup proximity — primary backup R2 (Cloudflare) is region-agnostic; offsite B2 is region-agnostic.

Frontend hosting (Vercel) is decided separately in ADR-017.

## Options considered

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **Hetzner Frankfurt** | Lowest cost; great Docker / Coolify fit; simple operational model; physical data center; SSD/NVMe at low price; predictable bill | EU region (not in MENA); Cloudflare PoPs in MENA mitigate latency for end users; less mature managed-services menu vs hyperscalers | ✅ **Selected for Phase 1** |
| AWS me-south-1 (Bahrain) | In-region for KSA + Egypt + Iraq → ZATCA-friendly; mature managed services (RDS, ElastiCache); compliance-ready posture | Significantly more expensive; complex pricing; team operational overhead higher; harder to predict cost | 🔵 **Future migration option** if compliance / latency / enterprise tier demands it |
| DigitalOcean Frankfurt | Friendly DX; managed Postgres + Redis; reasonable cost | More expensive than Hetzner; smaller European presence | ❌ Rejected — Hetzner wins on cost |
| GCP me-central1 (Doha/Dammam) | In-region; mature; serverless options | Newer region; team less familiar; more expensive than Hetzner | ❌ Rejected for Phase 1 |
| Self-hosted on bare metal in MENA | Lowest run cost long-term; full control | Operations burden enormous; high upfront cost | ❌ Rejected — over-engineered for Phase 1 |

## Decision

Use **Hetzner Frankfurt** as the Phase 1 backend hosting region.

### Why Hetzner Frankfurt for Phase 1

- **Cost-effective for MVP and early launch** — Hetzner's pricing for VPS + dedicated servers is roughly 40–60% lower than AWS me-south-1 for equivalent compute/RAM/storage. Phase 1 doesn't need hyperscaler features.
- **Suitable for Dockerized backend services** — Postgres, Redis, Meilisearch, Centrifugo, Directus, BullMQ workers all run cleanly on Hetzner Cloud or dedicated boxes via Docker Compose / Coolify.
- **Operational simplicity** — Hetzner Cloud Console is straightforward; no maze of IAM/VPC/subnet configuration to navigate before getting a service up.
- **Easier and cheaper than AWS for the initial build** — team can ship Phase 1 without AWS expertise.
- **Cloudflare in front absorbs MENA latency** — customer-facing requests hit Cloudflare's global network; admin + API latency from Frankfurt to KSA is acceptable for Phase 1.

### Why AWS me-south-1 stays as a future option

- **ZATCA Phase 2 compliance** prefers (does not strictly mandate at all data classifications) in-Kingdom or in-region storage. If a future audit, regulator, or enterprise customer requires data residency, AWS me-south-1 (Bahrain) is the in-region option.
- **Higher latency tolerance for power-users** — if admin users in KSA report sluggish admin workflows, in-region hosting cuts ~50–80ms RTT.
- **Enterprise tier requirements** — large B2B customers may have procurement clauses requiring hyperscaler hosting.

A future migration is documented in §"Future migration to AWS me-south-1" below — this ADR is **not** a permanent commitment to Hetzner; it is the right Phase 1 choice given current scale, cost discipline, and team capability.

## Architecture topology (Phase 1, Hetzner Frankfurt)

```
Cloudflare (global edge)
    │
    ├── ladders.vtc-me.com           → Vercel (frontend, ADR-017)
    └── api.* / admin.* (CNAME)      → Hetzner Frankfurt
                                          │
                ┌─────────────────────────┼─────────────────────────┐
                │                         │                          │
        Hetzner Cloud Server(s)    Hetzner Cloud Server         Hetzner Cloud Server
        (app + Directus admin)     (Postgres + pgvector)        (Redis + BullMQ +
                                                                 Meilisearch +
                                                                 Centrifugo)

  Backups:
    Postgres pg_dump / pgBackRest WAL → Cloudflare R2 (primary, ADR-013/023)
                                       → Backblaze B2 (offsite, ADR-023)

  Secrets:
    All credentials in 1Password vaults (ADR-022)
    Servers fetch via `op` CLI at boot — no plaintext secrets on disk

  CI/CD:
    GitHub Actions (ADR-024) deploys via Coolify or Docker Compose over SSH
```

### Specific Hetzner sizing (Phase 1 starter — TODO confirm with budget)

| Service | Hetzner product (recommended) | Spec |
|---|---|---|
| App + Directus admin | CCX13 or CCX23 (dedicated CPU) | 2–4 vCPU, 8–16 GB RAM |
| Postgres + pgvector | CCX23 or dedicated EX44 | 4–6 vCPU, 16–32 GB RAM, NVMe SSD |
| Redis + BullMQ + Meilisearch + Centrifugo | CX22 or CCX13 | 2–4 vCPU, 8 GB RAM |
| BullMQ workers | CX22 (small, scaled out as needed) | 2 vCPU, 4 GB RAM |

Total Phase 1 baseline cost target: ~€100–200/month (vs ~€500–1,200/month equivalent AWS me-south-1). Final sizing pending D-LAUNCH-006 budget approval.

## Ops tooling

- **Coolify** (self-hosted PaaS) recommended for application deploy + Docker orchestration on Hetzner Cloud servers. OR plain Docker Compose with GitHub Actions deploy via SSH. Decision deferred to Phase 1 sprint planning; not blocking.
- **Hetzner Cloud Backups** enabled at instance level (additional safety on top of Postgres logical/PITR backups to R2).
- **Floating IPs** for production servers to enable zero-downtime swaps during maintenance.
- **Hetzner Storage Box** optional for additional cold storage if R2 + B2 combination ever has cost concerns (unlikely Phase 1).

## Production secrets handling (locked rule)

Production secrets MUST NOT be stored on the server as plaintext. Servers fetch from 1Password (ADR-022) at boot using `op` CLI:

```
# pseudocode at app boot (NOT actual code — illustrative only)
DATABASE_URL=$(op read "op://vtc-prod-infra/db/url")
REDIS_URL=$(op read "op://vtc-prod-infra/redis/url")
ANTHROPIC_API_KEY=$(op read "op://vtc-prod-ai/anthropic/api_key")
# etc.
```

This rule applies whether the host is Hetzner, AWS, or anywhere else. Future migration to AWS me-south-1 inherits this constraint unchanged.

## Future migration to AWS me-south-1

If at any point one of the following triggers occurs, document a new ADR (ADR-NNN-hosting-migration) and migrate:

| Trigger | Likely action |
|---|---|
| ZATCA mandates in-Kingdom data storage | Migrate to AWS me-south-1 (Bahrain) before next audit |
| Latency complaints from KSA admin users (p95 > 300ms repeatedly) | Profile; consider in-region admin host |
| Enterprise B2B contract requires hyperscaler | Migrate or maintain dual-hosting (HA) |
| Hetzner outage SLA insufficient for traffic profile | Add redundancy in another provider OR migrate |
| Budget no longer constrains hyperscaler use | Re-evaluate; possible migration |

Migration plan template (high-level):
1. New AWS account in me-south-1 + IAM + VPC + subnets.
2. Provision RDS Postgres (matching Hetzner version), ElastiCache Redis, ECS/Fargate or EKS for app + Directus.
3. Restore latest backup to RDS (R2 → S3 → restore path).
4. Run dual-write for X days to verify parity.
5. DNS cutover via Cloudflare with rollback plan.
6. Decommission Hetzner after 30-day stable window.

This is **future work**; Phase 1 ships on Hetzner Frankfurt.

## Consequences

### Positive
- Lowest practical Phase 1 hosting cost.
- Fast, predictable monthly bill.
- Operational simplicity — small team can manage without hyperscaler expertise.
- Good Docker / Coolify fit; CI/CD straightforward.
- Cloudflare in front handles MENA edge latency.

### Negative / risks
- Not in MENA region — ZATCA review may surface concerns later (mitigated: physical encryption at rest + EU GDPR-aligned posture; current ZATCA guidance does not strictly bar EU storage at our data classifications).
- Hetzner outages historically rare but happen. Mitigated: backups in R2 + B2; can spin up replacement on alternate Hetzner DC or alternate provider in hours.
- Less mature managed-services menu — we run Postgres + Redis + Meili ourselves. Mitigated: experienced team, mature OSS tools, good monitoring (Sentry + Grafana + Loki per ADR-019).
- Vendor lock-in to Hetzner Cloud control plane (modest; servers are standard Linux + Docker).

### Mitigations
- Backups stored at Cloudflare (different control plane) + Backblaze (different cloud) → catastrophic provider loss does not lose data.
- Phase 9 disaster-recovery runbook covers Hetzner outage scenarios (`08-backups/07-disaster-recovery.md`).
- Document migration path to AWS me-south-1 (this ADR §"Future migration") so it's a known move, not a panic.

## Phase 0 deliverables

- [ ] Hetzner Cloud account created (with billing).
- [ ] Initial server inventory provisioned (empty — no production data yet).
- [ ] SSH key pairs generated; private keys stored in 1Password `vtc-prod-infra`.
- [ ] Coolify or Docker Compose setup decision finalized (Phase 1 sprint 1 task).
- [ ] DNS records prepared in Cloudflare (`api.ladders.vtc-me.com`, `staging.api.ladders.vtc-me.com`, `dev.api.ladders.vtc-me.com`).

## Phase 1 deliverables

- All backend services running on Hetzner Frankfurt.
- Postgres backups streaming to R2 daily; weekly archives replicated to B2.
- Application reading secrets via `op` CLI from 1Password vaults.
- CI deploys to staging environment automatically; production deploys gated.
- Monitoring (Sentry + Grafana) reporting from production.

## Open hosting-related decisions (still 🔴)

- **D-LAUNCH-006** — Hosting budget tier approval (gates final Hetzner sizing + Vercel Pro + Cloudflare plan + 1Password seats + Backblaze B2 budget).
- **D-INFRA-002** — Frontend hosting: Vercel Pro vs self-hosted (separate ADR-017; default Vercel; budget-pending).
- **D-INFRA-013** — Observability stack confirmation (Sentry + Grafana + Loki recommended).
- **D-INFRA-015** — Cloudflare plan tier (Free vs Pro vs Business).

## References

- Master Plan v4 §2 (Stack), §3 (Alternatives)
- Pre-coding question #53
- D-INFRA-001 (Tracker decision, 🟢 Answered 2026-05-07)
- ADR-013 (Cloudflare R2)
- ADR-017 (Vercel for frontend)
- ADR-022 (1Password — secrets)
- ADR-023 (R2 + B2 backups)
- ADR-024 (GitHub Actions CI/CD)
- `00-architecture/environment-topology.md`
- `08-backups/07-disaster-recovery.md`
