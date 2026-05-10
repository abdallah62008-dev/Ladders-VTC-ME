# Certificates Policy

**Status:** Draft (Phase 1 documentation; full UI Phase 6)
**Owner:** Compliance Officer + Product Manager
**Source:** D-SAFE-001 🟢 Answered 2026-05-07

---

## Principle

**No certificate claim without an uploaded certificate.** Every reference to a standard / certification / approval body on any customer-facing surface (storefront, landing page, AI, WhatsApp, packaging) must trace to a row in `product_certification` (existing — Module 2) with a valid uploaded document.

---

## Schema reference

`product_certification` (existing in Module 2 Catalog):

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| product_id | uuid FK | |
| variant_id | uuid FK NULL | |
| certificate_type | text | e.g., `EN-131`, `SASO 2870`, `CE`, `ISO 9001` |
| certificate_number | text | issuing-body identifier |
| issuing_body | text | e.g., "Saudi Standards Org", "TÜV Süd" |
| issue_date, expiry_date | date | |
| document_url | text | R2 reference to uploaded PDF/image |
| jurisdictions | uuid[] | which countries it's valid in |
| approval_status | text | `'pending' \| 'approved' \| 'expired' \| 'revoked'` |
| approved_by_compliance_user_id | uuid FK | |
| approved_at | timestamptz | |

(Phase 6 may add additional columns for renewal workflow, document hash, etc.)

---

## Allowed standards (initial set)

| Certificate | Issuing body | Jurisdictions | Notes |
|---|---|---|---|
| EN-131 | European Committee for Standardization | EU + recognized in KSA / EG / IQ | Industry-standard ladder safety |
| SASO 2870 | Saudi Standards, Metrology and Quality Org | KSA only | Required for some KSA government contracts |
| CE | EU Declaration of Conformity | EU + recognized | General EU compliance marking |
| ISO 9001 | International Organization for Standardization | All | Quality management system; not a product safety cert |
| TÜV / GS | German technical inspection | EU + recognized | Optional premium marker |

Other certificates may be added with Compliance Officer approval (workflow below).

---

## Adding a new certificate type

1. Compliance Officer drafts certificate type entry (`certificate_type` slug, full name, issuing body, jurisdictions).
2. Legal reviews jurisdiction validity.
3. Product Manager confirms supplier evidence.
4. Approval workflow (dual approval: Compliance Officer + Product Manager).
5. Once approved, certificate type can be referenced in `product_certification` rows.

---

## Document upload requirements

- Supported formats: PDF (preferred), JPG, PNG.
- Max file size: 10 MB per document.
- Stored on R2 with versioned filename (e.g., `cert/EN-131/VTC-TEL-OS-4.4M-2026-05-07.pdf`).
- File hash stored for tamper detection.
- Document accessible only to authenticated admin roles with `certificate.upload` or `certificate.read` permissions.
- Documents NOT included in storefront cache (private R2 bucket).

---

## Expiry handling

- `expiry_date` mandatory on all uploaded certificates.
- 60 days before expiry: Medium-severity Alert to Compliance Officer (`safety_compliance` category).
- 30 days before expiry: High-severity Alert.
- On expiry: status auto-transitions `'approved' → 'expired'`; any landing page or AI tool referencing this certificate is flagged for review.
- Expired certificate cannot be cited in any new content; existing content surfaces a Critical alert until reviewed.

---

## AI / landing page enforcement

### AI guardrails (per `04-ai/05-guardrails.md`)

Output validator rejects AI responses mentioning a certificate not in `product_certification` for the cited SKU **with `approval_status='approved'`**. Already in existing guardrails — Module 25 strengthens the rule by adding explicit jurisdiction check.

### Landing page Pre-Publish Compliance Check

Per `19-performance-growth/03-landing-pages.md` §D.6:

- Page references certificate not in `product_certification` → 🔴 Critical block.
- Page references expired certificate → 🔴 Critical block.
- Page references certificate outside its `jurisdictions` (e.g., SASO 2870 on Egypt landing page) → 🟠 High; approval required.

### Forbidden patterns

CI grep test rejects:
- "ISO certified" without specific ISO number
- "CE certified" without document reference
- "EN certified" without "EN-131" or specific standard
- "Internationally certified" (vague)
- "Officially approved" (vague)

---

## Customer-facing display

On PDP / landing pages:
- Certificate logos display with link to verification (download document or external verifier URL where available)
- Logos restricted to **`approval_status='approved'`** rows only
- Hover/tooltip shows: certificate number, issuing body, expiry date, jurisdiction
- Click to open document (PDF) in new tab — document watermarked with order number on customer-side download (Phase 6+)

---

## RBAC

| Slug | Owner | Notes |
|---|---|---|
| `certificate.read` | All admin roles | Read-only |
| `certificate.upload` | Compliance Officer + Product Manager | Upload new document |
| `certificate.approve` | Compliance Officer | Mark as currently active (sole approver for renewals; dual for new types) |
| `certificate.revoke` | Compliance Officer + Super Admin | Revoke (auto-unpublishes referencing content) |

---

## TODO

- TODO: confirm initial certificate uploads for hero SKU `VTC-TEL-OS-4.4M` (Phase 0).
- TODO: design certificate logo asset library (centralized media_asset references) so PDP/LP rendering is consistent.
- TODO: confirm document watermarking strategy on customer download (Phase 6 design).
- TODO: certificate-renewal-reminder runbook stub.
