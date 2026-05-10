# Country Switching UX

**Status:** Draft (stub)
**Owner:** Product

---

## UI

- Country and language are separate controls (per ADR-026).
- Country switcher shows flag + name in current locale.
- Reachable from header on all pages.

## Switch flow

When user changes country:
1. If cart non-empty → modal: "Your cart is for [old country]. Switching to [new country] will clear it. Continue?"
2. On confirm: cart cleared (preserved per old country in storage in case user returns), new country's locale chosen automatically (default), URL updated.
3. Storefront shows only products active in the new country.
4. Currency, payment methods, shipping all switch.
5. WhatsApp button uses new country's number.
6. AI tone profile per new country.

## Edge cases

- Customer logged in: country preference stored in `customer.default_country_id`; updated on switch.
- Guest: stored in cookie.
- Country deactivated mid-session: redirect to default country with banner.

## TODO

- TODO: modal copy per locale.
- TODO: confirm whether to preserve cart across country switch (recommendation: separate cart per country).
