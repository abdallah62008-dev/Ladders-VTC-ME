# Experimentation Log Format

**Status:** Draft (stub)
**Owner:** PM + Analytics

---

## Purpose

Record A/B tests and rollouts with hypothesis, sample size, result, decision, learnings. Prevents re-running same experiment.

## Schema

```
experimentation_log (
  id, experiment_name, hypothesis, owner_user_id,
  start_date, end_date,
  variants: jsonb,                -- [{name, traffic_share, ...}]
  primary_metric, secondary_metrics: jsonb,
  sample_size_target, sample_size_actual,
  result: jsonb,                  -- {variant_lift, confidence, p_value}
  decision: 'ship' | 'kill' | 'iterate' | 'inconclusive',
  learnings,
  related_landing_page_id, related_campaign_id,
  related_ai_prompt_id,
  created_at
)
```

## Use cases

- Landing page A/B variants
- AI prompt versions
- Pricing variants (gated by Profit Guardrails)
- Email subject lines
- WhatsApp template variants

## Quality bar

- Minimum sample size before declaring winner.
- Minimum 3-day window.
- Statistical significance documented.

## TODO

- TODO: confirm minimum sample size policy per metric.
- TODO: integrate with `ab_test` table (Phase 6).
