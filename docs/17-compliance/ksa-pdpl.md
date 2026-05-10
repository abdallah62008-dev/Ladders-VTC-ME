# KSA PDPL Compliance

**Status:** Draft (stub)
**Owner:** Legal + Security lead

Saudi Personal Data Protection Law (PDPL).

---

## Key obligations

- Lawful basis for processing personal data.
- Customer rights: access, rectification, deletion, objection.
- Data residency: prefer in-Kingdom or covered jurisdictions; document cross-border transfers.
- Data breach notification within statutory window.
- Designated Data Protection Officer (DPO) if thresholds met.
- Records of processing activities (RoPA).

## Application impact

- Customer consent capture at signup + checkout.
- Customer can request data deletion via account or contact.
- Soft delete + scheduled hard delete.
- Encryption at rest + in transit.
- Audit log of every personal-data access.

## TODO

- TODO: legal review of consent text per locale.
- ~~TODO: DPO designation.~~ — 🟢 **ANSWERED 2026-05-09 (D-LAUNCH-013):** Internal DPO designated. Either Legal Lead (preferred) OR Operations Director as interim with explicit privacy responsibility + training. External DPO Phase 4+ if customer messaging volume / multi-country privacy complexity / regulatory review warrants. DPO responsibilities cover privacy governance during Phase 1, customer data export, deletion / anonymization requests (per D-DB-010 Class 4 anonymization workflow), marketing consent governance. See `GLOSSARY.md` "DPO" entry for the canonical responsibility list.
- TODO: RoPA document.
- TODO: data residency confirmed (hosting region).
- TODO: data subject access request (DSAR) workflow.
