# Runbook — Recommendation Engine Disagreement

**Status:** Stub (Phase 1 placeholder; full content Phase 10 when AI-assisted scoring lands)
**Owner:** AI Supervisor + Product Manager
**Triggered by:** Alert category `recommendation_drift`

---

## When this runbook applies

The Decision Engine's rule-based recommendation disagrees with:
- AI-assisted scoring (Phase 10) for the same input → drift detected
- Customer's actual selection (high disagreement rate signals UX or copy issue)
- Sales team manual recommendation (high disagreement signals rule-set staleness)

---

## Common patterns

- Rule says X, AI says Y for >5% of evaluations → rule-set may be stale or AI may be hallucinating
- Customer overrides recommendation in >30% of sessions → recommendation copy may not be persuasive OR rule scoring is wrong
- Sales team consistently recommends a non-top-3 SKU → tribal knowledge that hasn't been encoded as rules

---

## Investigation steps (Phase 10)

1. Pull `recommendation_event` rows where rule and AI disagree.
2. Sample 10 disagreements across use cases.
3. Manual review by Product Manager + AI Supervisor.
4. Decide: update rules, update AI prompt, update recommendation copy, or accept as edge cases.

---

## Resolution paths

- **Update rules** if AI is correct: edit `recommendation_rule` rows; new versioned row + `effective_until` on old row.
- **Update AI prompt** if rule is correct: revise `ai_prompt` row for the recommendation tool.
- **Update copy** if recommendation reasoning is unclear: revise `reasoning_template_key` translations.
- **Accept as edge case** if both are reasonable: document in decision log.

---

## TODO

- TODO: full procedure Phase 10 when AI-assisted scoring is operational.
- TODO: define drift threshold (recommendation: >5% disagreement weekly).
- TODO: integrate with `decision_log` (Module 18) for traceable rule-change history.
