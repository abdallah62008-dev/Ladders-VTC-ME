# Route List with Rendering Strategy

**Status:** Draft (stub)
**Owner:** Frontend lead

---

## Strategies

| Strategy | When |
|---|---|
| **SSG/ISR** | Static-leaning pages refreshed on tag invalidation |
| **SSR** | Per-request rendering; fresh data |
| **CSR** | Client-rendered after initial shell (rare) |
| **RSC + streaming** | Default for App Router |

## Per-route

| Route | Strategy | Cache | Auth |
|---|---|---|---|
| `/{locale}/` | ISR (1h) | Cloudflare cached | None |
| `/{locale}/shop` | ISR (5m) per filter | Edge cache | None |
| `/{locale}/shop/[category]` | ISR (1h) | Edge cache | None |
| `/{locale}/groups/[group]` | ISR (1h) | Edge cache | None |
| `/{locale}/product/[slug]` | ISR (15m) | Edge cache | None |
| `/{locale}/compare` | SSR (no cache; URL-driven) | None | None |
| `/{locale}/ladder-finder` | SSR | None | None |
| `/{locale}/reach-calculator` | SSG | Edge cache | None |
| `/{locale}/fit-my-car` | SSG | Edge cache | None |
| `/{locale}/cart` | SSR | None | Optional auth |
| `/{locale}/checkout` | SSR | **No cache** | Often auth |
| `/{locale}/checkout/success/[order]` | SSR | None | Auth or magic link |
| `/{locale}/account/*` | SSR | None | Auth required |
| `/{locale}/business` | ISR (1h) | Edge | None |
| `/{locale}/business/quote` | SSR | None | Optional auth |
| `/{locale}/guides` | ISR (1h) | Edge | None |
| `/{locale}/guides/[slug]` | ISR (1h) | Edge | None |
| `/{locale}/landing/[slug]` | ISR (1h) | Edge | None |
| `/{locale}/{city}/[topic]` | ISR (1h) | Edge | None |
| `/{locale}/height/[h]` | ISR (1h) | Edge | None |
| `/{locale}/problem/[slug]` | ISR (1h) | Edge | None |
| `/lp/[slug]` | ISR (5m) | Edge cache | None (variant cookie) |
| `/r/[code]` | Edge middleware | None | None |
| `/qr/[code]` | Edge middleware | None | None |
| `/api/v1/*` | API | Per-route | Per-route |

## Cache invalidation

- Tag-based (`revalidateTag`) on:
  - product:slug
  - country:code (e.g., country-wide deactivation)
  - group:slug
  - guide:slug
  - landing:slug

## TODO

- TODO: confirm cache TTL per route post-launch.
- TODO: ISR vs SSR trade-off for high-traffic landing pages.
