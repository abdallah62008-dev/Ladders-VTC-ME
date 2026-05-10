# API Versioning

**Status:** Draft (stub)
**Owner:** Backend lead

---

## Strategy

URL-path versioning: `/api/v1/`, `/api/v2/`, etc.

## Policy

- `v1` is the launch version. New endpoints added without bumping major.
- Major bump only for **breaking changes** (removed endpoints, removed fields, semantically changed responses).
- Old major versions supported for **90 days** after the next major's GA.
- Deprecation announced via `Deprecation` header + email to API token holders.
- After 90 days, old endpoints return 410 Gone.

## Non-breaking changes (allowed without bump)

- Adding new endpoints
- Adding new optional request fields
- Adding new response fields (clients must ignore unknown)
- Adding new enum values to non-strict fields
- Loosening validation

## Breaking changes (require bump)

- Removing endpoints or fields
- Renaming fields
- Changing field types or semantics
- Tightening validation

## Documentation

OpenAPI spec versioned per major. `info.version` reflects exact minor.

## TODO

- TODO: deprecation runbook (how to communicate to token holders).
- TODO: detect breaking changes via `oasdiff` in CI.
