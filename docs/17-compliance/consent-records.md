# Consent Records

**Status:** Draft (stub)
**Owner:** Legal + Security lead

---

## Consent types

| Type | Default | Source |
|---|---|---|
| `messaging_transactional_consent` | Implied on order | Transactional necessity |
| `messaging_marketing_consent` | Opt-in | Checkout/account/AI |
| `review_request_consent` | Opt-in (post-survey) | Survey |
| `data_processing_consent` | Implied on signup with notice | Signup |
| `cookie_consent` | Opt-in (per banner) | Banner |

## Schema (`customer_consent`)

```
id, customer_id, consent_type, granted: bool,
granted_at, ip, user_agent, locale, source,
revoked_at?, revoked_via?
```

## Audit

Every grant + revoke logged with full context. Retained 7 years.

## DSAR (data subject access request) workflow

Customer requests:
1. Access — receive copy of their data.
2. Rectification — admin updates.
3. Deletion — soft delete + scheduled hard delete (after retention windows).
4. Objection — stop processing for marketing.

Workflow:
- Request submitted via account or contact form.
- Privacy officer / DPO (🟢 D-LAUNCH-013 designated 2026-05-09 — see `GLOSSARY.md` "DPO" entry) reviews.
- Response within statutory window (KSA PDPL: 30 days; EG PDPL: similar).

## TODO

- ~~TODO: designate privacy officer.~~ — 🟢 **ANSWERED 2026-05-09 (D-LAUNCH-013):** Internal DPO designated. Either Legal Lead (preferred) OR Operations Director as interim with explicit privacy responsibility + training. DPO is involved in marketing consent governance, customer data export, deletion / anonymization requests. See `GLOSSARY.md` "DPO" entry + `17-compliance/ksa-pdpl.md` for full responsibilities.
- TODO: DSAR workflow UI.
- TODO: per-locale consent text.
