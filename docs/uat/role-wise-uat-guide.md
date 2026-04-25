# Role-Wise UAT Guide

Use this guide to validate Phase 1 behavior by company role. Run it against the Docker Compose release-candidate stack unless the test lead explicitly chooses another environment.

Recommended URL: `http://localhost:3000`

Checkpoint reference: `3bf83f5e`

## Shared Login Expectations

- Open `http://localhost:3000/login`.
- Sign in with the assigned UAT account.
- If the account belongs to more than one active company, confirm the company selector appears after the first sign-in attempt.
- Select the intended company and sign in again.
- Confirm the app lands on `/dashboard`.
- Confirm the session menu shows the correct company, email, and role labels.
- Sign out and confirm protected routes redirect to `/login?next=...`.

## Access Matrix

| Module | `company_admin` | `company_accountant` | `company_hr` | `company_payroll` | `company_sales` | `company_member` |
| --- | --- | --- | --- | --- | --- | --- |
| Dashboard | Allowed | Allowed | Allowed | Allowed | Allowed | Allowed |
| Org & Security | Allowed | Denied | Denied | Denied | Denied | Denied |
| Accounting | Allowed | Allowed | Denied | Denied | Denied | Denied |
| Financial Reports | Allowed | Allowed | Denied | Denied | Denied | Denied |
| Project & Property Master | Allowed | Denied | Denied | Denied | Denied | Denied |
| CRM & Property Desk | Allowed | Denied | Denied | Denied | Allowed | Denied |
| HR | Allowed | Denied | Allowed | Denied | Denied | Denied |
| Payroll | Allowed | Denied | Allowed | Allowed | Denied | Denied |
| Audit & Documents | Allowed | Allowed | Allowed | Allowed | Allowed | Denied |
| Audit Events | Allowed | Denied | Denied | Denied | Denied | Denied |

Denied direct route access should show a clear forbidden state for authenticated users. Unauthenticated access should redirect to login.

## `company_admin`

Allowed modules:

- Dashboard
- Org & Security
- Accounting
- Financial Reports
- Project & Property Master
- CRM & Property Desk
- HR
- Payroll
- Audit & Documents
- Audit Events

Denied modules to verify:

- None in the implemented Phase 1 module set.

Core scenarios:

| Scenario | Expected Behavior | Pass/Fail | Notes/Issues |
| --- | --- | --- | --- |
| Admin login and session | Admin signs in and lands on `/dashboard`; session menu shows company and admin role. |  |  |
| Org setup access | Companies, locations, departments, users, and role assignments load. |  |  |
| Role assignment | Admin can assign or confirm UAT roles and user rows reflect expected role state. |  |  |
| Full module route spot check | Representative routes across all Phase 1 modules load without a page-level error. |  |  |
| Audit event browsing | Audit Events page loads with filters and compact metadata preview. |  |  |
| Backup/restore operator check | Admin or operator can record backup verification and restore dry-run results in sign-off docs. |  |  |

## `company_accountant`

Allowed modules:

- Dashboard
- Accounting
- Financial Reports
- Audit & Documents attachments

Denied modules to verify:

- Org & Security
- Project & Property Master
- CRM & Property Desk
- HR
- Payroll
- Audit Events

Core scenarios:

| Scenario | Expected Behavior | Pass/Fail | Notes/Issues |
| --- | --- | --- | --- |
| Accountant login | User lands on `/dashboard` with accounting-related navigation only where permitted. |  |  |
| Chart of accounts | Chart of accounts loads and account hierarchy is readable. |  |  |
| Voucher flow | Voucher list and voucher detail load; balanced voucher can be posted when test data is ready; unbalanced posting is rejected. |  |  |
| Reports | Trial balance, general ledger, profit & loss, and balance sheet load from posted vouchers only. |  |  |
| Finance output | CSV export and browser print are available on financial reports and voucher detail. |  |  |
| Denied HR route | Direct `/hr/employees` access shows forbidden state. |  |  |

## `company_hr`

Allowed modules:

- Dashboard
- HR
- Payroll
- Audit & Documents attachments

Denied modules to verify:

- Org & Security
- Accounting
- Financial Reports
- Project & Property Master
- CRM & Property Desk
- Audit Events

Core scenarios:

| Scenario | Expected Behavior | Pass/Fail | Notes/Issues |
| --- | --- | --- | --- |
| HR login | User lands on `/dashboard` with HR, payroll, and attachment access where permitted. |  |  |
| HR employee pages | Employees, attendance devices, device mappings, attendance logs, leave types, and leave requests load. |  |  |
| HR selectors | Department, location, and user selectors load without requiring Org & Security access. |  |  |
| Leave request lifecycle | Submit and process a leave request through available actions when test data is ready. |  |  |
| Payroll access for HR | Salary structures, payroll runs, run detail, and posting pages are reachable. |  |  |
| Denied accounting route | Direct `/accounting/vouchers` access shows forbidden state. |  |  |

## `company_payroll`

Allowed modules:

- Dashboard
- Payroll
- Audit & Documents attachments

Denied modules to verify:

- Org & Security
- Accounting
- Financial Reports
- Project & Property Master
- CRM & Property Desk
- HR
- Audit Events

Core scenarios:

| Scenario | Expected Behavior | Pass/Fail | Notes/Issues |
| --- | --- | --- | --- |
| Payroll login | User lands on `/dashboard` with payroll navigation where permitted. |  |  |
| Payroll setup access | Salary structures and payroll runs pages load. |  |  |
| Payroll run detail | Payroll run detail and lines are visible when a run exists. |  |  |
| Payroll posting | Finalized payroll run can be posted through available workflow when test data is ready. |  |  |
| Attachment access | Attachment list/detail can be used within document-access rules. |  |  |
| Denied HR route | Direct `/hr/employees` access shows forbidden state. |  |  |

## `company_sales`

Allowed modules:

- Dashboard
- CRM & Property Desk
- Audit & Documents attachments

Denied modules to verify:

- Org & Security
- Accounting
- Financial Reports
- Project & Property Master
- HR
- Payroll
- Audit Events

Core scenarios:

| Scenario | Expected Behavior | Pass/Fail | Notes/Issues |
| --- | --- | --- | --- |
| Sales login | User lands on `/dashboard` with CRM and attachment access where permitted. |  |  |
| CRM pages | Customers, leads, bookings, sale contracts, installment schedules, and collections load. |  |  |
| CRM selectors | Booking forms can use project and unit selectors without requiring admin project/property navigation. |  |  |
| Collections context | Collections use voucher-backed accounting context where the workflow expects it. |  |  |
| Attachment access | Attachment list/detail can be used within document-access rules. |  |  |
| Denied payroll route | Direct `/payroll/runs` access shows forbidden state. |  |  |

## `company_member`

Allowed modules:

- Dashboard

Denied modules to verify:

- Org & Security
- Accounting
- Financial Reports
- Project & Property Master
- CRM & Property Desk
- HR
- Payroll
- Audit & Documents
- Audit Events

Core scenarios:

| Scenario | Expected Behavior | Pass/Fail | Notes/Issues |
| --- | --- | --- | --- |
| Member login | User lands on `/dashboard`. |  |  |
| Limited navigation | Module navigation is limited to reachable areas. |  |  |
| Dashboard only | Dashboard renders without exposing unauthorized module actions. |  |  |
| Denied org route | Direct `/org-security/users` access shows forbidden state. |  |  |
| Denied attachments route | Direct `/audit-documents/attachments` access shows forbidden state. |  |  |

## Multi-Company Selection Notes

- A user with one active company assignment signs in directly after valid credentials.
- A user with multiple active company assignments should see the company selector after the first sign-in attempt.
- The tester must choose the intended company and sign in again.
- The selected company should drive the session menu, module access, dashboard visibility, and all company-scoped routes.
