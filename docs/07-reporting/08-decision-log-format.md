# Decision Log Format

**Status:** Draft (stub)
**Owner:** PM

---

## Purpose

Record significant business decisions with rationale, expected outcome, owner, review date. Distinct from ADRs (those are technical).

## Schema

```
decision_log (
  id, title, description, decided_at, decision_owner_id,
  rationale, expected_outcome, success_metric,
  review_date, review_outcome,
  related_entity_type, related_entity_id,
  status: 'open' | 'review_due' | 'reviewed_succeeded' | 'reviewed_failed' | 'reversed',
  tags: jsonb
)
```

## Examples of decisions to log

- Activate a country
- Launch a major campaign
- Change a tier's commission rate
- Switch a payment provider
- Change pricing model for a product group
- Approve a high-value override

## UX

- Surfaced in Reports & Intelligence dashboard.
- Searchable, filterable.
- Reviews queued automatically when `review_date` passes.

## TODO

- TODO: confirm what's "significant enough" to log.
- TODO: integration with override module (auto-create decision_log when high-impact override approved).
