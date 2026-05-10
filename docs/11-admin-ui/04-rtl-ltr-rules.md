# RTL / LTR Rules

**Status:** Draft
**Owner:** Frontend lead

---

## Principles

- **Default direction is RTL** — Arabic is the primary locale.
- LTR is the deviation, applied per route based on locale.
- Use **logical CSS properties** everywhere: `padding-inline-start`, `margin-block-end`, `border-inline`, `inset-inline-start`. Tailwind v4 supports `ps-*`, `pe-*`, `ms-*`, `me-*` natively.
- **Ban** `pl-*` and `pr-*` in code review.

## Document direction

`<html dir="rtl" lang="ar">` set per request based on locale. Set server-side; do not flip client-side after hydration.

## Icon flipping

Icons that imply direction (arrows, chevrons, breadcrumb separators) wrap in `<DirIcon>` that flips based on `dir`.

## Forms

- Labels above inputs (RTL languages handle this better than inline labels).
- Numeric keypad for phone (`inputmode="tel"`), numeric for postal code.
- Phone country code locked to current country.
- Numbers in Western digits (0–9) by default; Arabic-Indic optional in user prefs.

## Punctuation

- Comma `،` instead of `,`, question mark `؟` for Arabic.
- Don't hardcode Latin punctuation in Arabic copy.

## Line height

- Arabic body: 1.7–1.8.
- Latin body: 1.4–1.5.
- Different fonts → use the fonts' recommended line-heights.

## Currency formatting

- `Intl.NumberFormat(locale, { style: 'currency', currency })`.
- Test rendering of ر.س (SAR), ج.م (EGP), د.ع (IQD).

## Carousels and sliders

- Verify swipe direction matches text direction (RTL: swipe right reveals next).
- Test keyboard nav: Tab order respects direction.

## Sticky positioning

- Use `inset-inline-start` not `left`.

## Visual regression

- CI runs visual regression in **both** directions on every component.
- Catches direction-flip bugs early.

## TODO

- TODO: shadcn/ui component audit for RTL bugs.
- TODO: test on real Arabic content (not lorem ipsum).
- TODO: document third-party library RTL status (carousel, date picker, charts).
