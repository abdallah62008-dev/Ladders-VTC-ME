# Image and Video Optimization

**Status:** 🟢 **Confirmed and locked — 2026-05-07** (part of D-PERF-001)
**Owner:** Frontend Lead + Media Manager
**Source:** Master Plan v4 §22

> Section B of the Performance, Cleanup, Landing Page Growth & Alerts System. See [`00-index.md`](./00-index.md) for the full module overview.

---

## B.1 Image pipeline

```
Original Upload (raw)
    ↓
Compression (mozjpeg / cwebp / avif)
    ↓
WebP / AVIF conversion (with JPG fallback)
    ↓
Responsive sizes (per B.2)
    ↓
CDN upload (Cloudflare R2 + edge resize)
    ↓
Alt text per locale
    ↓
Usage tracking (which page, which campaign)
    ↓
Performance monitoring (load time, fail rate)
```

Tooling: Sharp / squoosh-cli at build time + Cloudflare Image Resizing for runtime variants.

## B.2 Required image variants (per asset)

| Variant | Width | Height | Use |
|---|---|---|---|
| Hero Desktop | 1920 | 1080 | Homepage / landing-page hero |
| Hero Mobile | 768 | 1024 | Mobile hero override |
| Product Card | 600 | 600 | PLP / category grid / comparison |
| Thumbnail | 200 | 200 | Cart / search / related products |
| OpenGraph image | 1200 | 630 | Social sharing |
| WhatsApp preview image | 800 | 800 | WhatsApp deep-link previews |

All variants pre-generated and stored on R2 with versioned filenames (per `13-brand/photography-brief.md` naming convention). AVIF + WebP + JPG fallback ladder.

## B.3 Video rules

- **No heavy autoplay on landing pages** — `<video autoplay muted playsinline>` only after user interaction or viewport-intersect; never block LCP.
- **Use poster images** — SVG or AVIF poster while video lazy-loads.
- **Lazy-load video player** — `<video preload="none">`; load full source on click.
- **Compress videos** — MP4 H.265 + WebM dual codec; 8s max for product demo unfolding clips; 2 MB ceiling per clip.
- **Track `video_played` events** (pixel taxonomy per Master Plan v4 §19).
- **Use product demo videos strategically** — only on PDP and high-intent landing pages; not on SEO guides.

## B.4 Auto Image Quality Scanner (Phase 10)

Future scanner job runs nightly and flags:

| Issue | Detection rule |
|---|---|
| Oversized images | File > 200 KB after compression |
| Missing alt text | `media_asset.alt_translations` missing for active locale |
| Duplicate images | Perceptual hash (pHash) match |
| Wrong dimensions | Variant doesn't match category-specific aspect ratio |
| Unused media | Last referenced > 90 days ago |
| Low-quality background | ML-based quality score < threshold |
| Incorrect branding | OCR-based logo detection |
| Missing product association | Image not linked to any product / variant / campaign |

Output: rows in `media_quality_issue` table (Phase 10 schema), surfaced in **Data Quality Center** dashboard.
