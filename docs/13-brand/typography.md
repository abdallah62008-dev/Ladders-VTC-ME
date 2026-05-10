# Typography

**Status:** Draft (stub)
**Owner:** Design lead

---

## Pair

| Slot | Family | Weights | Use |
|---|---|---|---|
| Arabic body | TODO (recommend IBM Plex Sans Arabic / Noto Sans Arabic) | 400, 500, 700 | Long-form Arabic |
| Arabic display | TODO (recommend Tajawal / Cairo) | 700, 800 | Headings in Arabic |
| Latin body | Inter / Geist / Manrope | 400, 500, 700 | Long-form English |
| Latin display | Same family heavier weights OR display family | 700, 800 | Headings in English |

## Self-hosting

Self-hosted fonts (no external request). Subsetted per script (Arabic + Latin separate files).

## Line-height

- Arabic body: 1.7–1.8
- Latin body: 1.4–1.5
- Display (both): 1.1–1.2

## Fallback chain

```
font-family: 'IBM Plex Sans Arabic', 'Noto Sans Arabic', 'Tahoma', sans-serif;
font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
```

## TODO

- TODO: lock font choices (license).
- TODO: subsetting strategy.
- TODO: variable fonts vs static weights.
