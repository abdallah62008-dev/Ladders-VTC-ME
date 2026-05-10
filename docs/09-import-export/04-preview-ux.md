# Import Preview UX

**Status:** Draft (stub)
**Owner:** Design lead + Backend lead

---

## Preview screen

After validation, before applying, admin sees:

1. **Summary**
   - Total rows: N
   - Valid: V
   - Invalid: I
   - Will create: C
   - Will update: U
   - Unchanged: K

2. **Profit Guardrails impact** (if applicable)
   - Rows passing: P
   - Rows with warnings: W
   - Rows hard-blocked: H

3. **Per-row diff (first 50 + last 50)**
   - Existing values vs incoming values
   - Highlighted cells where values change

4. **Error list (downloadable CSV)**
   - row_num | column | error_code | message_en | message_ar | current_value | proposed_value

5. **CTAs**
   - "Cancel"
   - "Download error report"
   - "Re-upload corrected file"
   - "Apply" (disabled if any hard-blocked rows; enables after errors fixed OR override approved)

## Apply screen

- Per-row transaction.
- Progress bar.
- Failure on row N doesn't abort 1..N-1.
- Final report:
  - Succeeded
  - Failed (with reasons)
  - Audit log entries created

## Approval gate (cost imports)

For `actual_costs` / `marketer_costs` imports above threshold:
- "Apply" button replaced with "Submit for approval".
- Routes to Finance Admin for approval.
- Approval triggers actual apply.

## TODO

- TODO: full UX wireframe.
- TODO: bulk override flow if many rows breach guardrails.
- TODO: progress indication for long-running imports.
