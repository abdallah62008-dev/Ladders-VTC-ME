# Cost Import Policy

**Status:** Draft
**Owner:** Finance + Security lead

---

## Hard rules

- Cost imports (`actual_costs`, `marketer_costs`) require **`cost.write` scope**.
- Pre-import backup auto-triggered (Pre-Risky-Change).
- Profit Guardrails dry-run on every row.
- Approval required for batches > N rows (TODO threshold).
- Audit log per row, with `import_job_id` + `country_data_audit` entries.
- Cost values **never** appear in error reports for non-cost roles.

## Approval workflow

1. Finance Admin uploads cost CSV.
2. Validation runs.
3. If batch > threshold → submitted for approval.
4. Super Admin reviews preview (cost values visible to them only).
5. Super Admin approves OR rejects with reason.
6. On approval, apply runs.

## Cost-leakage protection during import

- Validation errors involving cost values redact the value to `***` for non-cost-role viewers.
- File uploaded by non-cost role rejected at upload time.
- Audit log entry on every cost import: who, what, when, how many rows, total computed margin shift.

## Tracking

- Imported costs flow to `cost_history` table for trend analysis.
- Material cost shifts (>X%) trigger Smart Notification to Finance.

## TODO

- TODO: confirm batch-size threshold for approval.
- TODO: confirm material cost shift % for alerts.
- TODO: legacy cost migration plan (if costs exist in current system).
