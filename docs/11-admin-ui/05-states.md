# Empty / Error / Loading States

**Status:** Draft (stub)
**Owner:** Design lead

---

## Empty states

Each major list view has a defined empty state with:
- Friendly icon (locale-appropriate)
- Headline
- Description
- Primary CTA (often "Create first X")

Examples:
- Empty products: "No products yet. Add your first product."
- Empty orders: "No orders match these filters."
- Empty conversations: "All caught up — no pending conversations."

## Error states

- Server error → friendly message + retry button + request ID.
- Permission denied → explicit "You don't have permission to view this. Contact admin if you think this is wrong."
- Validation error → inline per field.
- Network error → toast + retry.

## Loading states

- Skeleton screens for content (product list, order list, conversation thread).
- Spinners for actions (save, delete, approve).
- Progress bar for multi-step (import preview, backup, restore).

## Locale-aware messages

All states have ar + en versions. Avoid auto-translation; have copywriter review.

## Country Context badge states (🟢 D-CSP-001 locked 2026-05-09)

Per `03-rbac/03-scopes.md` §I. Every admin page declares `country_scope_mode` (`scoped` / `aware` / `global`). The top-bar Country Context Switcher shows different states based on user access + selected page mode.

### Top-bar widget states

| State | Appearance | When |
|---|---|---|
| **Single-country fixed** | Fixed text label (no dropdown affordance) | User has access to exactly one country and no `country_scope.all` |
| **Multi-country dropdown** | Dropdown with allowed countries; current selection bold | User has access to 2+ countries and no `country_scope.all` |
| **All-countries dropdown** | Dropdown with all active countries + "All Countries" entry; current selection bold | User has `country_scope.all` |
| **Disabled tooltip** | Selector grayed out; hover tooltip "Country selector does not apply to this page" | Active page has `country_scope_mode = 'global'` |

### Per-page badge states

| Page mode | Badge appearance |
|---|---|
| `scoped` | Yellow strip top of page: "You are editing Saudi Arabia data only." |
| `aware` | Subtle subtitle: "Showing Saudi Arabia context for global product VTC-TEL-OS-4.4M" |
| `global` | No badge (selector grayed out) |
| `all` selected on scoped page | **Red/orange strip:** "Viewing data across ALL countries — handle with care" |

### Country switch confirmation modal states

| State | When |
|---|---|
| **Direct switch** | No unsaved changes; navigate to equivalent page in new country |
| **Confirm-before-switch modal** | Unsaved changes detected; "Discard unsaved Saudi changes and switch to Egypt?" |
| **Selector reverts on cancel** | User clicks cancel; selector returns to prior country |
| **No-equivalent fallback** | Current page has no equivalent in new country (e.g., country-specific report); navigate to country list view |

### Permission-denied state extension

When user attempts to navigate via URL to a page for a country they don't have access to (e.g., types `/admin/orders?country=eg` but has KSA-only access):

- 403 from API / page route
- Empty/error state shows: "You don't have permission to view Egypt orders. Contact admin if you think this is wrong."
- `denied_cross_country_access_attempt` audit log entry created
- Top-bar selector remains on user's allowed country (no auto-switch)

## TODO

- TODO: copy review per state per locale.
- TODO: motion guidelines (subtle entry animations only).
- TODO: country switch animation polish (Phase 6 design window).
- TODO: confirm "fixed label vs dropdown-with-one-option" UX choice for single-country users (recommendation: fixed label to prevent misclick).
