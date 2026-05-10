# Design Tokens

**Status:** Draft (stub)
**Owner:** Design lead

Tokens to be exported as `tokens.json` (Style Dictionary or similar).

## Categories

### Color

```
brand/primary, brand/primary-foreground
brand/secondary, brand/secondary-foreground
brand/accent
neutral/50..950
semantic/success, warning, danger, info
```

TODO: actual values pending brand finalization.

### Typography

```
font-family/arabic-body
font-family/arabic-display
font-family/latin-body
font-family/latin-display
font-size/{xs..5xl}
line-height/{tight, normal, relaxed-arabic, relaxed-latin}
font-weight/{normal, medium, semibold, bold}
```

### Spacing

Tailwind defaults plus a few custom (e.g., `safe-area-bottom` for mobile).

### Radius

Tailwind defaults.

### Shadow

Tailwind defaults.

### Motion

```
duration/{fast, normal, slow}
easing/{in-out, in, out}
```

## Per-locale overrides

`line-height/relaxed-arabic` (1.7–1.8) vs `line-height/relaxed-latin` (1.4–1.5).

## TODO

- TODO: lock palette after brand review.
- TODO: export tokens to JSON for use across web + admin.
- TODO: dark mode strategy.
