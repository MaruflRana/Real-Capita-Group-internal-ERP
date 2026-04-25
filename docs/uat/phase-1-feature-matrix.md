# Phase 1 Feature Matrix

This matrix summarizes the implemented Phase 1 release-candidate surface for Real Capita stakeholder review and UAT planning. It is based on the Prompt 26 route inventory, UAT checklist, release checklist, and handoff notes. It does not expand Phase 1 scope.

Checkpoint reference: `3bf83f5e`

## Verification Meaning

| Status | Meaning |
| --- | --- |
| Release-candidate verified | Covered by Prompt 26 repo validation, runtime smoke, live smoke, route inventory, and role-access spot checks. |
| Stakeholder UAT pending | Ready for human business validation, but not yet signed off by Real Capita stakeholders. |
| Out of scope | Explicitly not included in Phase 1. |

## Matrix

| Area | Included In Phase 1 | Key Capabilities | Excluded Or Deferred Items | Primary Roles | Verification Status |
| --- | --- | --- | --- | --- | --- |
| Org & Security | Yes | Company setup, locations, departments, users, company-scoped role assignment, role-aware access checks. | Password reset, MFA, invite flow, SSO, broader policy management UI. | `company_admin` | Release-candidate verified; stakeholder UAT pending. |
| Accounting | Yes | Chart of accounts, account classes, groups, ledger accounts, particular accounts, voucher list, voucher draft/detail/posting flow. | New accounting engines beyond implemented voucher posting, fake/demo accounting data, broader workflow approvals. | `company_admin`, `company_accountant` | Release-candidate verified; stakeholder UAT pending. |
| Financial Reports | Yes | Trial balance, general ledger, profit & loss, balance sheet, posted-voucher reporting, CSV export variants. | Report builder, project/cost-center report filters where not supported by current voucher-line schema, server-side PDF, `.xlsx`. | `company_admin`, `company_accountant` | Release-candidate verified; stakeholder UAT pending. |
| Project & Property Master | Yes | Projects, cost centers, phases, blocks, zones, unit types, unit statuses, units. | Public portals, new property domains beyond listed routes, fake/demo master data. | `company_admin` | Release-candidate verified; stakeholder UAT pending. |
| CRM & Property Desk | Yes | Customers, leads, bookings, sale contracts, installment schedules, collections, CRM selector references for projects, units, and vouchers. | Notifications, approval workflow engines, public-facing customer features, import systems. | `company_admin`, `company_sales` | Release-candidate verified; stakeholder UAT pending. |
| HR | Yes | Employees, attendance devices, device mappings, attendance logs, leave types, leave requests, HR selector references for departments, locations, and users. | HR workflows beyond implemented lifecycle actions, notifications, imports. | `company_admin`, `company_hr` | Release-candidate verified; stakeholder UAT pending. |
| Payroll | Yes | Salary structures, payroll runs, payroll run detail lines, payroll posting, payroll selector references for projects, cost centers, employees, and posting accounts. | Payslip PDF, bank payout/export, broader payroll reporting, new approval workflows. | `company_admin`, `company_hr`, `company_payroll` | Release-candidate verified; stakeholder UAT pending. |
| Audit & Documents | Yes | Attachment list/detail, direct browser-to-storage upload, finalize, link, download access, archive actions, audit event browsing for admins. | OCR/text extraction, virus scanning, e-signature, public sharing, document analytics. | Attachments: `company_admin`, `company_accountant`, `company_hr`, `company_payroll`, `company_sales`; Audit events: `company_admin` | Release-candidate verified; stakeholder UAT pending. |
| Dashboard | Yes | Authenticated landing page, company snapshot, recent activity, pending work, quick actions, role-aware widget visibility. | New dashboards, dashboard-heavy analytics, fake metrics. | All company roles | Release-candidate verified; stakeholder UAT pending. |
| Export/Print | Yes | CSV export for supported financial reports, voucher detail, and selected operational lists; browser-native print for financial reports and voucher detail. | `.xlsx` generation, server-side PDF rendering pipeline, additional export formats. | Same roles that can access each page | Release-candidate verified; stakeholder UAT pending. |
| Backup/Restore | Yes | PostgreSQL backup, backup verification, restore dry-run, explicit destructive restore confirmation, env safety check. | Automated scheduled backup service, point-in-time recovery, app-managed MinIO/S3 object backup. | Operator, release owner | Release-candidate verified; operational sign-off pending. |
| Role-Aware Access Control | Yes | Shared Phase 1 module access matrix, protected-route redirect, stable API `401`/`403`, frontend forbidden state, role-aware navigation and dashboard visibility. | Broader permissions service or policy-management UI. | All company roles | Release-candidate verified; stakeholder UAT pending. |

## Phase 1 Output Surfaces

| Surface | CSV Export | Browser Print |
| --- | --- | --- |
| Trial balance | Yes | Yes |
| General ledger | Yes | Yes |
| Profit & loss | Yes | Yes |
| Balance sheet | Yes | Yes |
| Voucher detail | Yes | Yes |
| Units | Yes | No |
| Customers | Yes | No |
| Bookings | Yes | No |
| Collections | Yes | No |
| Employees | Yes | No |
| Leave requests | Yes | No |
| Payroll runs | Yes | No |
| Attachments | Yes | No |
| Audit events | Yes | No |

## UAT Sign-Off Rule

Do not mark Phase 1 accepted if unresolved release-blocking issues remain in authentication, company selection, posting, role access, backup verification, restore dry-run, or data integrity.
