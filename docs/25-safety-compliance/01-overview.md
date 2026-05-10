# Module 25 — Safety & Compliance Center

**Status:** 🟢 **Documentation locked 2026-05-07** (D-SAFE-001 🟢 Answered); schema reservations Phase 1; AI guardrail integration Phase 1; admin UI Phase 6; service-ticket integration Phase 9
**Owner:** Compliance Officer + Product Lead + Legal
**Source:** Strategic Enhancements Evaluation (2026-05-08); Master Plan v4 §1.4 (Override module — safety claim vector); `04-ai/05-guardrails.md`

> ⚠️ **Ladders are a regulated safety-related product.** This module is essential infrastructure, not a marketing add-on. Phase 1 ships the schema + AI guardrail integration; full UI ships Phase 6.

---

## Why this module exists

Every customer-facing surface (storefront, landing page, AI chat, WhatsApp) can claim safety attributes about a ladder. **Without a centralized approval system**, marketing copy and AI responses can drift toward unsupported claims (e.g., "100% accident-proof", "ISO certified" when no such certificate exists). Drift is a legal / reputational / customer-trust risk that compounds silently.

This module:
1. Catalogues approved **safety guidelines** (truth source for what the platform is allowed to say)
2. Catalogues approved **safety claims** with cited sources
3. Manages **certificates** with file uploads + expiry
4. Captures **safety incidents** as high-priority tickets
5. Enforces **AI guardrails** so the AI cannot mention any unapproved claim or certificate
6. Integrates with **landing page compliance check** (already in `19-performance-growth/...` §D.6)
7. Links **service tickets** (Phase 9) to incidents for full lifecycle traceability

---

## Sub-documents

| File | Purpose |
|---|---|
| [`01-overview.md`](01-overview.md) | This file |
| [`02-safety-claim-policy.md`](02-safety-claim-policy.md) | What claims are allowed; approval workflow; forbidden claims |
| [`03-incident-response.md`](03-incident-response.md) | What happens when a safety incident is reported |
| [`04-certificates-policy.md`](04-certificates-policy.md) | Certificate handling, file uploads, expiry, AI restrictions |

---

## Admin section (Phase 6 UI)

```
Safety & Compliance
  ├── Safety Guidelines
  ├── Approved Safety Claims
  ├── Certificates
  ├── Pending Safety Claim Approvals
  ├── Incident Reports
  └── Country Compliance Profiles
```

---

## Phase 1 schema reservations (Module 25)

> Reserved as empty/skeleton tables in Phase 1.

### `safety_guideline` (Phase 6)

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| key | text UNIQUE | e.g., `max_angle_75_degrees` |
| title_translations | jsonb | per locale |
| body_translations | jsonb | per locale |
| applies_to_categories | uuid[] | category scope |
| applies_to_countries | uuid[] NULL | NULL = all |
| jurisdiction_basis | text NULL | e.g., "Saudi Standards Org SASO 2870" |
| active | bool | |
| created_at, updated_at | timestamptz | |

### `safety_claim` (Phase 6)

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| claim_text_translations | jsonb | per locale |
| applies_to | text | `'product' \| 'variant' \| 'category' \| 'all'` |
| applies_to_id | uuid NULL | |
| evidence_source | text | URL / certificate ID / standard ID |
| evidence_document_url | text NULL | uploaded supporting document |
| approval_status | text | `'pending' \| 'approved' \| 'rejected' \| 'expired'` |
| approved_by_compliance_user_id | uuid FK NULL | |
| approved_by_product_user_id | uuid FK NULL | dual approval |
| approved_at | timestamptz NULL | |
| valid_until | timestamptz NULL | |
| jurisdictions | uuid[] | which countries this claim is approved for |
| created_at, updated_at | timestamptz | |

### `safety_claim_approval` (Phase 6)

History/audit table — one row per approval workflow event.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| safety_claim_id | uuid FK | |
| event | text | `'submitted' \| 'reviewed' \| 'approved' \| 'rejected' \| 'revoked'` |
| actor_user_id | uuid FK | |
| reason | text | |
| audit_log_id | uuid FK → `audit_log` | |
| created_at | timestamptz | |

### `safety_incident_report` (Phase 6)

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| reported_at | timestamptz | |
| reporter_type | text | `'customer' \| 'staff' \| 'partner' \| 'regulator' \| 'other'` |
| reporter_contact_jsonb | jsonb | name, phone, email |
| variant_id | uuid FK NULL | |
| order_id | uuid FK → `customer_orders.id` NULL | |
| serial_number | text NULL | |
| batch_id | uuid FK → `product_batch.id` NULL | |
| country_id | uuid FK | |
| incident_type | text | `'injury' \| 'property_damage' \| 'product_failure' \| 'misuse' \| 'near_miss' \| 'other'` |
| severity | text | `'low' \| 'medium' \| 'high' \| 'critical'` |
| description | text | |
| photos_jsonb | jsonb | media_asset references |
| status | text | `'reported' \| 'investigating' \| 'resolved' \| 'escalated_to_legal' \| 'closed'` |
| linked_service_ticket_id | uuid FK NULL | (Module 16, Phase 9) |
| resolution_notes | text NULL | |
| created_at, updated_at | timestamptz | |

Auto-creates a Critical-severity Alert (per `19-performance-growth/...` §H — alert category `safety_compliance`) on insert.

### `country_compliance_profile` (Phase 1 column on `country` table)

```
country.compliance_profile jsonb DEFAULT '{}'::jsonb
```

Shape:
```json
{
  "return_window_days": 14,
  "warranty_minimum_months": 12,
  "delivery_promise_enforceability": "strict",
  "consumer_protection_law_ref": "KSA Consumer Protection Law 2017",
  "approved_certificates": ["EN-131", "SASO 2870"],
  "forbidden_claims": ["100% accident-proof", "lifetime guarantee"]
}
```

Populated Phase 8 (when EG + IQ activate); Phase 1 seeds KSA only.

---

## RBAC (per `03-rbac/02-permissions.md`)

| Slug | Owner | Notes |
|---|---|---|
| `safety.read` | All admin roles | Read-only access to safety guidelines + claims |
| `safety.claim.write` | Compliance Officer + Product Manager | Submit a new claim |
| `safety.claim.approve` | Compliance Officer + Product Manager (**dual approval**) | Approve a submitted claim |
| `safety.claim.revoke` | Compliance Officer + Super Admin | Revoke an approved claim |
| `safety.incident.read` | Compliance Officer + Operations + Customer Support + Legal | |
| `safety.incident.write` | Customer Support + Operations | File an incident report |
| `safety.incident.escalate` | Compliance Officer + Legal | Escalate to legal |
| `compliance.profile.write` | Legal + Country Manager (**dual approval**) | Edit `country.compliance_profile` |
| `certificate.upload` | Compliance Officer + Product Manager | Upload supporting documents |
| `certificate.approve` | Compliance Officer (sole approver for renewals) | Mark a cert as currently active |

---

## Integration with existing modules

| Module | Integration |
|---|---|
| **Module 2 — Catalog** | `product_certification` (existing) joins to `safety_claim.evidence_source` when claim is certificate-backed |
| **Module 13 — Landing Pages** | Pre-Publish Compliance Check (D.6 of Performance module) consults `safety_claim` rows — page cannot publish if it makes a claim not in approved list |
| **Module 16 — Operations & Maintenance** | `safety_incident_report.linked_service_ticket_id` joins to `service_ticket` (Phase 9) for repair/replacement workflow |
| **Module 19 — System & Audit** | Every safety_claim approval/revocation writes `audit_log` row |
| **Module 8 — Conversations & AI** | `04-ai/05-guardrails.md` extended: AI cannot mention any certificate not in `product_certification` AND any claim not in `safety_claim` with `approval_status='approved'` |

---

## Override types (per `10-overrides/01-override-types.md`)

- `safety_claim_override` — Admin permits a borderline claim that lacks formal approval but has compelling reasoning. Super Admin + Compliance Officer dual approval; reason ≥30 chars; auto-expires 30 days; revocation triggers immediate landing-page un-publish if claim was used.

---

## Alerts (per `19-performance-growth/...` §H)

New alert category `safety_compliance`:
- Critical: incident report filed (any severity > low)
- High: unapproved safety claim found in published content
- High: certificate expired and still referenced in published content
- Medium: claim approval pending > 7 days

---

## Phase placement

| Phase | Work |
|---|---|
| **Phase 1** | Schema reservation (all tables above as skeletons); AI guardrail integration extension; KSA `country.compliance_profile` populated; `safety.*` permission slugs defined |
| Phase 6 | Admin UI ships; `safety_guideline`, `safety_claim`, `certificate.upload` workflows live; Pre-Publish Compliance Check enforced |
| Phase 8 | EG + IQ `country.compliance_profile` populated |
| Phase 9 | Incident reports → service ticket integration |
| Phase 10 | Compliance Profile drift dashboard; cross-jurisdiction claim coverage report |

---

## TODO

- TODO: confirm initial KSA `compliance_profile` content with Legal (Phase 0).
- TODO: lock `safety_claim` taxonomy initial seed (12–20 known approved claims for hero SKU `VTC-TEL-OS-4.4M`).
- TODO: review certificate scan/upload workflow with Compliance Officer.
- TODO: incident-response runbook stub created at `18-runbooks/safety-incident-response.md`; full content Phase 1+.
