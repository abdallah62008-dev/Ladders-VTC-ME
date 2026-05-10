# Public Site RTL / LTR Rules

**Status:** Draft (stub)
**Owner:** Frontend lead

Same rules as admin (see `11-admin-ui/04-rtl-ltr-rules.md`), with additional public-facing considerations.

## Public-specific

- Hero typography needs review at large sizes for both RTL and LTR.
- Navigation menu mirrored properly; mega-menu expansion direction respects locale.
- Forms (checkout, B2B quote) carefully tested in both directions.
- Currency and price display consistent: currency symbol position per locale (`Intl.NumberFormat`).
- Phone country codes always displayed left-to-right even within RTL paragraphs (use `&lrm;` or `<bdi>`).

## Critical surfaces

- Homepage hero
- PDP gallery + spec table
- Group sales page
- Landing page (fast)
- Cart drawer (slides from `inset-inline-end`)
- Checkout multi-step
- Account dashboard

Each tested in CI via visual regression in both directions.

## Fonts

- Arabic body: IBM Plex Sans Arabic / Noto Sans Arabic
- Arabic display: Tajawal / Cairo
- English body: Inter / Geist / Manrope
- Self-hosted (no Google Fonts request from MENA users)

## TODO

- TODO: font subsetting strategy (Arabic + Latin separate).
- TODO: confirm font choices (per ADR — TODO ADR for typography).
