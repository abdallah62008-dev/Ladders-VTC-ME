# Accessibility Checklist

**Status:** Draft (stub)
**Owner:** Frontend lead

Target: WCAG 2.1 AA.

## Per-component checks

- Semantic HTML (use `<button>`, `<nav>`, `<main>`, `<article>`)
- ARIA labels for icon-only buttons
- Focus visible
- Tab order correct (especially in RTL)
- Form labels associated with inputs
- Error messages associated with inputs
- Color contrast ≥ 4.5:1 for text
- Images have alt text (per locale)
- Videos have captions if dialog
- Tables have proper headers
- Dialogs trap focus; ESC closes
- Skip-to-content link

## RTL-specific

- Tab order respects direction
- Screen reader pronounces Arabic correctly
- Focus rings work in both directions

## Tooling

- axe-core via Playwright in CI
- Manual screen reader testing per major release

## TODO

- TODO: per-component checklist file.
- TODO: screen reader test schedule.
