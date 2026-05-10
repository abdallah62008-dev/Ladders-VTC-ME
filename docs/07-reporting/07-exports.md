# Report Exports

**Status:** Draft (stub)
**Owner:** Analytics lead

---

## Formats

| Format | When used |
|---|---|
| CSV | Light; integrates with Excel/Google Sheets |
| Excel (XLSX) | Pre-formatted with multiple sheets |
| PDF | Final reports, board-ready |

## Cost redaction

Exports automatically redact cost columns unless caller has `report.export.cost_columns`. Auto-redaction:
- Replace value with `***`
- Add column note `[redacted]`
- Log export with caller + scope check result

## Storage

- Generated exports stored in R2 with signed URLs.
- 7-day expiry default.
- Logged in `report_export` table with `expires_at`.

## Scheduled delivery

- Email: Resend.
- WhatsApp: approved template `report_ready` with download link.

## TODO

- TODO: PDF template designs (RTL-aware for Arabic reports).
- TODO: signed URL TTL policy.
