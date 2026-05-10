# Error Report Format

**Status:** Draft (stub)
**Owner:** Backend lead

---

## Format

CSV with header row:

```
row_number, sheet, column, error_code, message_en, message_ar, current_value, proposed_value
```

Example:
```
3, Sheet1, regular_price, INVALID_TYPE, "Must be a number", "يجب أن يكون رقماً", "abc", "abc"
7, Sheet1, country_code, FK_NOT_FOUND, "Country code 'xx' not found", "رمز الدولة 'xx' غير موجود", , "xx"
12, Sheet1, actual_cost, PROFIT_GUARDRAIL_BREACH, "Below 18% margin floor (computed: 8%)", "أقل من حد الهامش 18% (محسوب: 8%)", "1000.00", "500.00"
```

## Storage

- Generated file uploaded to R2.
- Signed URL valid 7 days.
- Stored on `import_export_job.output_file_url`.

## Localization

- Headers in admin's locale (Arabic admins get Arabic headers).
- Both `message_en` and `message_ar` always present per row.

## TODO

- TODO: confirm whether to also produce XLSX with conditional formatting.
