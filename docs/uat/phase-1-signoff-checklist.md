# Phase 1 Sign-Off Checklist

Use this checklist after UAT execution, issue triage, and demo review. It records whether the current release candidate is acceptable for Phase 1 handoff.

Checkpoint reference: `3bf83f5e`

## Sign-Off Metadata

| Field | Value |
| --- | --- |
| Git revision |  |
| Environment URL |  |
| UAT start date |  |
| UAT end date |  |
| Test lead |  |
| Business stakeholder |  |
| Technical owner |  |
| Backup file verified |  |
| Restore dry-run command/result |  |
| Issue log location |  |

## Functional Sign-Off

| Area | Required Evidence | Result | Sign-Off Name/Date | Notes |
| --- | --- | --- | --- | --- |
| Login and company selection | Login works; multi-company branch verified where test account exists; protected routes redirect unauthenticated users. |  |  |  |
| Dashboard | Dashboard loads; role-aware widgets and quick actions behave as expected. |  |  |  |
| Org & Security | Admin can review companies, locations, departments, users, and role assignments. |  |  |  |
| Accounting | Chart of accounts loads; voucher draft/detail/posting scenarios pass; unbalanced posting is rejected. |  |  |  |
| Financial Reports | Trial balance, general ledger, profit & loss, and balance sheet render from posted voucher data or clear empty states. |  |  |  |
| Project & Property Master | Admin can access expected master-data pages. |  |  |  |
| CRM & Property Desk | Admin/sales can access customers, leads, bookings, sale contracts, installment schedules, and collections. |  |  |  |
| HR | Admin/HR can access employees, attendance pages, leave types, and leave requests. |  |  |  |
| Payroll | Admin/HR/payroll can access salary structures, payroll runs, run detail, and posting. |  |  |  |
| Audit & Documents | Document-authorized roles can use attachments; admin can browse audit events. |  |  |  |

## Role Access Sign-Off

| Role | Expected Allowed Areas | Expected Denied Areas Checked | Result | Sign-Off Name/Date | Notes |
| --- | --- | --- | --- | --- | --- |
| `company_admin` | All Phase 1 modules. | None in implemented Phase 1 module set. |  |  |  |
| `company_accountant` | Dashboard, Accounting, Financial Reports, Attachments. | Org, Project/Property, CRM, HR, Payroll, Audit Events. |  |  |  |
| `company_hr` | Dashboard, HR, Payroll, Attachments. | Org, Accounting, Financial Reports, Project/Property, CRM, Audit Events. |  |  |  |
| `company_payroll` | Dashboard, Payroll, Attachments. | Org, Accounting, Financial Reports, Project/Property, CRM, HR, Audit Events. |  |  |  |
| `company_sales` | Dashboard, CRM & Property Desk, Attachments. | Org, Accounting, Financial Reports, Project/Property, HR, Payroll, Audit Events. |  |  |  |
| `company_member` | Dashboard. | Org, Accounting, Financial Reports, Project/Property, CRM, HR, Payroll, Audit & Documents, Audit Events. |  |  |  |

## Finance And Accounting Sign-Off

| Check | Result | Sign-Off Name/Date | Notes |
| --- | --- | --- | --- |
| Voucher draft and detail behavior accepted. |  |  |  |
| Balanced voucher posting behavior accepted. |  |  |  |
| Unbalanced posting rejection accepted. |  |  |  |
| Trial balance behavior accepted. |  |  |  |
| General ledger behavior accepted. |  |  |  |
| Profit & loss behavior accepted. |  |  |  |
| Balance sheet behavior, including any unclosed earnings adjustment, accepted. |  |  |  |

## HR And Payroll Sign-Off

| Check | Result | Sign-Off Name/Date | Notes |
| --- | --- | --- | --- |
| Employee and HR reference behavior accepted. |  |  |  |
| Attendance pages accepted for Phase 1 scope. |  |  |  |
| Leave request behavior accepted. |  |  |  |
| Salary structure behavior accepted. |  |  |  |
| Payroll run and line review behavior accepted. |  |  |  |
| Payroll posting behavior accepted. |  |  |  |

## CRM And Property Desk Sign-Off

| Check | Result | Sign-Off Name/Date | Notes |
| --- | --- | --- | --- |
| Customer and lead behavior accepted. |  |  |  |
| Booking behavior and selectors accepted. |  |  |  |
| Sale contract behavior accepted. |  |  |  |
| Installment schedule behavior accepted. |  |  |  |
| Collection behavior and accounting context accepted. |  |  |  |

## Audit And Document Sign-Off

| Check | Result | Sign-Off Name/Date | Notes |
| --- | --- | --- | --- |
| Attachment upload intent, direct upload, finalize, and detail behavior accepted. |  |  |  |
| Attachment link behavior accepted. |  |  |  |
| Attachment download access behavior accepted. |  |  |  |
| Non-admin attachment scope behavior accepted. |  |  |  |
| Audit events admin-only browsing accepted. |  |  |  |

## Export And Print Sign-Off

| Check | Result | Sign-Off Name/Date | Notes |
| --- | --- | --- | --- |
| Financial report CSV export accepted. |  |  |  |
| Voucher detail CSV export accepted. |  |  |  |
| Supported operational CSV exports accepted. |  |  |  |
| Financial report browser print accepted. |  |  |  |
| Voucher detail browser print accepted. |  |  |  |
| Absence of `.xlsx` and server-side PDF actions acknowledged. |  |  |  |

## Backup And Restore Dry-Run Sign-Off

| Check | Command Or Evidence | Result | Sign-Off Name/Date | Notes |
| --- | --- | --- | --- | --- |
| PostgreSQL backup created. | `corepack pnpm backup:db` |  |  |  |
| PostgreSQL backup verified. | `corepack pnpm verify:backup -- --file backups/postgres/<backup>.dump` |  |  |  |
| Restore dry-run completed without mutation. | `corepack pnpm restore:db -- --file backups/postgres/<backup>.dump --dry-run` |  |  |  |
| Destructive restore guard acknowledged. | Actual restore requires `--confirm-destroy-data`. |  |  |  |
| MinIO/S3 object backup responsibility acknowledged. | Operator-managed outside app backup. |  |  |  |

## Known Limitations Acknowledgement

| Limitation | Acknowledged By | Date | Notes |
| --- | --- | --- | --- |
| CSV is the only Phase 1 structured export format. |  |  |  |
| Browser print is the only Phase 1 print/PDF-from-browser path. |  |  |  |
| No `.xlsx` generation exists in Phase 1. |  |  |  |
| No server-side PDF rendering pipeline exists in Phase 1. |  |  |  |
| No automated scheduled backup infrastructure exists in this repo. |  |  |  |
| No point-in-time recovery exists in this repo. |  |  |  |
| MinIO/S3 object bytes are not backed up by PostgreSQL backup helpers. |  |  |  |
| Production browser sessions outside localhost require HTTPS. |  |  |  |
| Real release use requires real secrets and strict env validation. |  |  |  |
| `S3_PUBLIC_ENDPOINT` must be browser-resolvable. |  |  |  |
| Swagger should not be exposed publicly in production unless intentional. |  |  |  |
| Freshly bootstrapped companies may have empty lists and reports until real data is entered. |  |  |  |

## Release Candidate Acceptance Decision

| Decision | Select One | Name/Date | Notes |
| --- | --- | --- | --- |
| Accept for Phase 1 handoff. |  |  |  |
| Accept with explicitly approved deferred issues. |  |  |  |
| Not accepted; Prompt 28 must be UAT bug-fix sprint. |  |  |  |

Final decision summary:

```text

```
