# Confidence Scoring

**Status:** Draft
**Owner:** AI lead

---

## Self-reported confidence

LLM returns `confidence: 0.0–1.0` per turn as part of structured output.

## Signal-adjusted confidence

Adjusted by:
| Signal | Effect |
|---|---|
| Answer derived from tool result | +0.10 |
| 2+ clarification rounds on same intent | −0.20 |
| Frustration keyword detected (per-locale list) | −0.30 |
| Customer types in different language than expected (mid-conversation switch) | −0.10 |
| Tool call failed | −0.20 |
| Output validator rejected first attempt | −0.20 |

Final clamped to 0.0–1.0.

## Thresholds (initial — TODO confirm)

| Range | Action |
|---|---|
| ≥0.75 | Proceed normally |
| 0.50–0.75 | Proceed but flag for admin review |
| <0.50 | Trigger handoff with reason `low_confidence` |

## Override triggers (regardless of confidence)

- Explicit human request (`أبي أكلم موظف`, `human please`)
- B2B intent above threshold
- Refund/return intent
- Complaint/abuse language
- Fraud signal
- Out of business hours + customer pushes

## Calibration

Phase 3 includes a 200-conversation audit:
- Sample conversations across locales/intents.
- Human grader rates: did AI give correct answer? (yes/no/partial)
- Compare to AI-reported confidence.
- Adjust signal weights and thresholds.
- Re-run audit monthly during Phase 3–4.

## Per-actor confidence anomalies

If an admin observes consistent over-confidence on wrong answers (e.g., AI confidence 0.9 but answer wrong) → flagged in AI dashboard for prompt iteration.

## TODO

- TODO: confirm initial thresholds (0.5 or 0.6 cutoff?).
- TODO: per-locale frustration keyword list curator.
- TODO: dashboard showing confidence histogram per intent.
