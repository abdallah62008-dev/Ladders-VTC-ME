# Pull Request Template

> Copy this checklist into every PR description.

## Summary

What does this PR change? Why?

## Scope

- [ ] Single-purpose PR (one feature / fix / refactor)
- [ ] Touches files in expected scope only
- [ ] Issue / ticket linked

## Quality

- [ ] Lint passes
- [ ] Type check passes
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] **RLS tests** pass (if touching cost/audit/scoped tables)
- [ ] Visual regression diffs reviewed (RTL + LTR)
- [ ] Lighthouse not regressed
- [ ] Cost-leak grep passes (no `actual_cost` strings in non-finance code)

## Security

- [ ] No secrets in code or commits
- [ ] Trufflehog scan clean
- [ ] Cost-bearing endpoints serializer-stripped
- [ ] PII redaction in place if logging

## Database

- [ ] Migration reversible OR clearly forward-only with reason
- [ ] Migration tested on staging via restored backup
- [ ] Pre-risky-change backup considered
- [ ] RLS policies updated if new cost-bearing columns added
- [ ] Audit triggers attached to new sensitive tables

## API

- [ ] OpenAPI spec updated
- [ ] Webhook event catalog updated
- [ ] Versioning policy respected (no breaking changes without major bump)

## Documentation

- [ ] Relevant `/docs/*` updated
- [ ] ADR added if architectural decision
- [ ] CHANGELOG updated (if customer-facing)

## Locale / RTL

- [ ] Tested in `ar-sa` and `en-sa` minimum
- [ ] RTL screenshot attached

## Profit Guardrails / Override

- [ ] Profit Guardrails respected (server-side validation)
- [ ] Override hooks present where applicable

## Reviewer checklist

- [ ] Two approvals before merge (or one approval + automated checks for low-risk)
- [ ] Senior review required for: cost paths, RLS, migrations, payments, AI prompts, override module
