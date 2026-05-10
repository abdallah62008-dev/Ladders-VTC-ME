# Safety Claim Policy

**Status:** Draft (Phase 1 documentation; full enforcement Phase 6)
**Owner:** Compliance Officer
**Source:** D-SAFE-001 🟢 Answered 2026-05-07; `19-performance-growth/03-landing-pages.md` §D.6

---

## Principle

**No safety claim without an approved source.** Every safety claim made about a product on any customer-facing surface (storefront, landing page, AI chat, WhatsApp, social, packaging, manuals) must trace to a row in `safety_claim` with `approval_status='approved'`.

---

## Workflow

```
Drafted (any approved role)
    ↓
Submitted for review (sets approval_status='pending')
    ↓
Reviewed by Compliance Officer
    ↓
Reviewed by Product Manager (dual approval)
    ↓
Approved (approval_status='approved' + valid_until set)
    ↓
Used on customer-facing surface (logged in audit_log)
    ↓
[Optional revocation triggers immediate un-publish of all surfaces using this claim]
```

---

## Required fields per claim

| Field | Notes |
|---|---|
| `claim_text_translations` | Exact wording per locale (ar-sa, en-sa, ar-eg, en-eg, ar-iq, en-iq) |
| `applies_to` | `product` / `variant` / `category` / `all` |
| `applies_to_id` | UUID for the scoped entity |
| `evidence_source` | Required — URL, certificate ID, regulatory standard, or test report identifier |
| `evidence_document_url` | Required for certificate-backed claims (R2 file reference) |
| `jurisdictions` | Which countries this claim is valid in (a claim approved for KSA is NOT automatically valid in EG/IQ) |
| `valid_until` | Date — claim auto-expires; must be re-reviewed before customer-facing reuse |

---

## Forbidden claims (hard list)

These claims are **never approvable**, regardless of evidence:

| Forbidden phrasing | Why |
|---|---|
| "100% accident-proof" / "100% safe" / "completely safe" | Absolute claims are unsupportable; legal exposure |
| "Lifetime guarantee" / "Lifetime warranty" | Specific duration only (warranty in months/years) |
| "Best in [market/category]" without comparative test | Competition law in some jurisdictions |
| "Certified" / "Certified safe" without specific certificate ID | Vague certification claims are misleading |
| "Approved by [authority]" without authority confirmation | False endorsement |
| "Used by [airline/hospital/fire dept]" without contractual proof | False testimonial |
| Claims about competitor products being unsafe | Competition law + defamation risk |
| Medical / health-protection claims (e.g., "ergonomic for back") | Outside our regulated category |

CI grep test rejects any landing page draft or AI response containing these phrasings.

---

## Approved claim categories

| Category | Examples (subject to evidence) |
|---|---|
| **Load capacity** | "Max load 150 kg per EN-131 test" (with cert ID) |
| **Material** | "Aluminum 6061-T6 alloy" |
| **Dimensions** | "Folded length 88 cm" (with measurement) |
| **Standards conformance** | "Conforms to EN-131 / SASO 2870" (with cert ID + jurisdiction) |
| **Anti-slip features** | "Anti-slip rubber feet" (with photo + spec) |
| **Lock mechanism** | "Auto-locking telescopic mechanism" (with mechanical description + photo) |
| **Warranty period** | "12-month manufacturer warranty" (with `product.warranty_period`) |
| **Country of origin** | "Made in [country]" (with supplier confirmation) |
| **Tested for** | "Tested for [use case]" (with test report URL) |

---

## AI / landing page enforcement

### AI guardrails (per `04-ai/05-guardrails.md`)

Output validator rejects AI responses that:
- Mention a certificate not in `product_certification` for the cited SKU
- Make a safety claim not in `safety_claim` with `approval_status='approved'` for the cited locale
- Use any phrasing from the Forbidden Claims list above
- Compare safety to competitor products by name

### Landing page Pre-Publish Compliance Check

Per `19-performance-growth/03-landing-pages.md` §D.6:

| Check | Severity | Action |
|---|---|---|
| Page contains forbidden claim phrasing | 🔴 Critical | Hard block; cannot publish |
| Page references certificate not in `product_certification` | 🔴 Critical | Hard block |
| Page makes safety claim not in approved `safety_claim` rows | 🔴 Critical | Hard block; override path: `safety_claim_override` |
| Approved claim used outside its `jurisdictions` (e.g., KSA-approved claim on Egypt landing page) | 🟠 High | Approval required from Country Manager |

---

## Audit trail

Every approval, revocation, and use of a safety claim writes to `audit_log` + `safety_claim_approval`. Cost-bearing trail: every claim revocation triggers a recompute of all landing pages and AI tool calls referencing it; offending content is auto-unpublished pending re-review.

---

## TODO

- TODO: lock initial claim seed for `VTC-TEL-OS-4.4M` (hero SKU Phase 1) — likely 8–12 claims covering load, material, standard, warranty, manufacturer.
- TODO: confirm forbidden-claim grep regex with Legal (jurisdiction-aware).
- TODO: define re-review cadence for approved claims (recommendation: 12 months).
