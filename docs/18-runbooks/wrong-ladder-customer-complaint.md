# Runbook — Wrong Ladder Customer Complaint

**Status:** Stub (Phase 1 placeholder; full content Phase 6+)
**Owner:** Customer Support Lead + Product Manager
**Triggered by:** Alert category `business`, sub-type `wrong_ladder_complaint`

---

## When this runbook applies

Customer received a ladder that does not match their stated need (too short, too tall, wrong material, wrong type for use case). Common patterns:

- Customer ordered VTC-TEL-OS-3.2M but needs villa exterior reach (should be 4.4m+)
- Customer ordered aluminum but needs electrician-safe (should be fiberglass)
- Customer ordered home-step ladder but needs daily contractor use

---

## First response (within 1 business hour)

1. Acknowledge complaint via WhatsApp.
2. Pull `recommendation_warning_log` for this customer's session — was a warning issued?
   - If yes (warning issued + acknowledged) → review acknowledgment evidence.
   - If no warning issued → flag as recommendation engine gap (auto-create `recommendation_engine_disagreement` ticket).
3. Pull `recommendation_event` for the order's session if available.

---

## Resolution paths

(Phase 6+ — full triage logic)

---

## TODO

- TODO: full content Phase 6 once Decision Engine is live.
- TODO: define service-recovery offer matrix (replacement / refund / partial credit).
- TODO: link to Decision Engine drift report (Phase 10).
