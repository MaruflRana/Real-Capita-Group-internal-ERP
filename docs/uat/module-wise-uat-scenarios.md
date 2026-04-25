# Module-Wise UAT Scenarios

Use these scenarios as the working UAT pack for Phase 1. Keep test evidence in the issue log or sign-off checklist as appropriate.

Recommended environment: Docker Compose release-candidate stack.

Recommended URL: `http://localhost:3000`

Checkpoint reference: `3bf83f5e`

## Test Data Guidance

- Empty lists and empty financial reports are acceptable in a freshly bootstrapped company when no real records have been entered.
- Do not create fake production data. Create only controlled UAT records needed to validate a scenario.
- Use the role access guide to choose the correct tester role.

## Scenarios

| Scenario ID | Area | Tester Role | Preconditions | Steps | Expected Result | Pass/Fail | Notes/Issues |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AUTH-001 | Login | Any assigned role | Stack is running; tester has valid credentials. | Open `/login`; submit credentials; complete company selection if shown. | User lands on `/dashboard`; session menu shows expected email, company, and role labels. |  |  |
| AUTH-002 | Multi-company selection | User with multiple active company assignments | Tester account belongs to more than one active company. | Submit credentials; choose intended company; sign in again. | Company selector appears before session creation; selected company becomes active session context. |  |  |
| AUTH-003 | Protected route redirect | Unauthenticated user | Tester is signed out. | Open `/accounting/vouchers` directly. | Browser redirects to `/login?next=...`. |  |  |
| DASH-001 | Dashboard load | Any assigned role | Tester is signed in. | Open `/dashboard`. | Dashboard loads without page-level error; company snapshot, recent activity, pending work, and quick actions render or show clear empty states. |  |  |
| DASH-002 | Dashboard period control | Any assigned role | Tester is signed in. | Change the dashboard period control. | Financial/count widgets refresh or show clear empty state. |  |  |
| DASH-003 | Role-aware dashboard visibility | Any non-admin role | Tester is signed in as a restricted role. | Review dashboard widgets and quick actions. | Only modules reachable by the role are shown. |  |  |
| ORG-001 | Org & Security route access | `company_admin` | Admin is signed in. | Open Companies, Locations, Departments, Users, and Role Assignments. | Each page loads with available list/search/pagination controls. |  |  |
| ORG-002 | Role assignment check | `company_admin` | Controlled UAT users exist or can be created. | Assign or confirm one UAT user per role. | User rows reflect expected company-scoped role assignments. |  |  |
| ORG-003 | Non-admin denial | Non-admin role | Tester is signed in. | Open `/org-security/users` directly. | Authenticated user sees forbidden state. |  |  |
| ACC-001 | Chart of accounts | `company_admin` or `company_accountant` | Tester is signed in. | Open `/accounting/chart-of-accounts`. | Account classes, groups, ledgers, and particular accounts load or show clear empty state. |  |  |
| ACC-002 | Voucher draft | `company_admin` or `company_accountant` | Valid posting accounts exist. | Open `/accounting/vouchers/new`; create a draft voucher with balanced lines. | Draft voucher is saved and appears in voucher list/detail. |  |  |
| ACC-003 | Unbalanced voucher posting | `company_admin` or `company_accountant` | Draft voucher can be edited or created. | Attempt to post an unbalanced voucher. | Posting is rejected with a clear validation error. |  |  |
| ACC-004 | Balanced voucher posting | `company_admin` or `company_accountant` | Balanced draft voucher exists. | Post the voucher; open detail page. | Status changes to `POSTED`; totals and line context remain visible. |  |  |
| FIN-001 | Trial balance | `company_admin` or `company_accountant` | Tester is signed in; posted voucher data may exist. | Open `/accounting/reports/trial-balance`; run for a date range. | Report renders posted-voucher balances or clear empty state. |  |  |
| FIN-002 | General ledger | `company_admin` or `company_accountant` | Posting account exists. | Open `/accounting/reports/general-ledger`; select posting account; run for a date range. | Opening balance, period lines, running balance, and voucher context render or clear empty state appears. |  |  |
| FIN-003 | Profit & loss | `company_admin` or `company_accountant` | Tester is signed in. | Open `/accounting/reports/profit-loss`; run for a date range. | Revenue, expense, and net result sections render from posted vouchers or clear empty state appears. |  |  |
| FIN-004 | Balance sheet | `company_admin` or `company_accountant` | Tester is signed in. | Open `/accounting/reports/balance-sheet`; run as of a selected date. | Asset, liability, equity, balance status, and any unclosed earnings adjustment render clearly. |  |  |
| FIN-005 | Draft exclusion | `company_admin` or `company_accountant` | Draft-only voucher exists. | Run financial reports before and after creating draft-only data. | Formal reports use posted vouchers only; draft-only records do not alter statements. |  |  |
| PROP-001 | Project/property routes | `company_admin` | Admin is signed in. | Open Projects, Cost Centers, Phases, Blocks, Zones, Unit Types, Unit Statuses, and Units. | Each page loads or shows clear empty state. |  |  |
| PROP-002 | Unit status catalog | `company_admin` | Admin is signed in. | Open Unit Statuses. | Fixed status catalog data is visible. |  |  |
| PROP-003 | Non-admin project/property denial | Non-admin role | Tester is signed in. | Open `/project-property/projects` directly. | Authenticated user sees forbidden state. |  |  |
| CRM-001 | CRM route access | `company_admin` or `company_sales` | Tester is signed in. | Open Customers, Leads, Bookings, Sale Contracts, Installment Schedules, and Collections. | Each page loads or shows clear empty state. |  |  |
| CRM-002 | Booking selectors | `company_admin` or `company_sales` | Minimal project/unit records exist where needed. | Open a booking form and use project/unit selectors. | Selectors load without requiring unrelated admin navigation. |  |  |
| CRM-003 | Collections accounting context | `company_admin` or `company_sales` | Voucher-backed context exists where workflow expects it. | Open Collections and create or inspect a collection. | Collection workflow surfaces required accounting context or validation. |  |  |
| CRM-004 | Sales denial outside CRM | `company_sales` | Sales user is signed in. | Open `/payroll/runs` directly. | Authenticated user sees forbidden state. |  |  |
| HR-001 | HR route access | `company_admin` or `company_hr` | Tester is signed in. | Open Employees, Attendance Devices, Device Mappings, Attendance Logs, Leave Types, and Leave Requests. | Each page loads or shows clear empty state. |  |  |
| HR-002 | HR selectors | `company_admin` or `company_hr` | Departments, locations, or users exist where needed. | Open employee or leave forms using department/location/user selectors. | Selectors load through HR-scoped references. |  |  |
| HR-003 | Leave request lifecycle | `company_admin` or `company_hr` | Employee and leave type exist. | Submit and process a leave request through available actions. | Leave request moves through available lifecycle states with clear status. |  |  |
| HR-004 | HR denial outside allowed scope | `company_hr` | HR user is signed in. | Open `/accounting/vouchers` directly. | Authenticated user sees forbidden state. |  |  |
| PAY-001 | Payroll route access | `company_admin`, `company_hr`, or `company_payroll` | Tester is signed in. | Open Salary Structures, Payroll Runs, Payroll Run Detail, and Payroll Posting. | Each page loads or shows clear empty state. |  |  |
| PAY-002 | Payroll run review | `company_admin`, `company_hr`, or `company_payroll` | Salary structure and employee payroll setup exist. | Create or inspect a payroll run and review run lines. | Run totals and line detail are visible. |  |  |
| PAY-003 | Payroll finalize/post | `company_admin`, `company_hr`, or `company_payroll` | Payroll run is ready for finalization. | Finalize a payroll run and post it. | Finalized run can be posted; linked accounting voucher appears where applicable. |  |  |
| PAY-004 | Payroll-only denial from HR | `company_payroll` | Payroll user is signed in. | Open `/hr/employees` directly. | Authenticated user sees forbidden state. |  |  |
| DOC-001 | Attachment upload/finalize | Document-authorized role | `S3_PUBLIC_ENDPOINT` is browser-resolvable. | Open Attachments; create upload intent; upload bytes directly to storage; finalize; open detail. | Attachment finalizes and detail shows filename, mime type, size, status, uploader, timestamps, checksum/object etag, and links where present. |  |  |
| DOC-002 | Attachment link | Document-authorized role | Finalized or pending attachment exists; supported entity exists. | Link attachment to a supported company-scoped entity. | Detail page shows normalized entity link; invalid or cross-company links surface backend errors. |  |  |
| DOC-003 | Attachment download access | Document-authorized role | Finalized attachment exists. | Generate download access from attachment detail. | Download URL is generated and uses browser-resolvable storage origin. |  |  |
| DOC-004 | Non-admin attachment listing scope | Non-admin document role | Tester is signed in. | Open Attachments and attempt broad browsing. | Non-admin document user must choose linked entity scope before broad metadata loading when required. |  |  |
| AUD-001 | Audit events | `company_admin` | Admin is signed in. | Open `/audit-documents/audit-events`; use filters. | Audit events list loads with compact metadata previews. |  |  |
| AUD-002 | Audit event denial | Non-admin role | Tester is signed in. | Open `/audit-documents/audit-events` directly. | Authenticated user sees forbidden state. |  |  |
| OUT-001 | Financial CSV export | `company_admin` or `company_accountant` | Tester can access financial reports. | Export CSV from trial balance, general ledger, profit & loss, and balance sheet. | CSV files download successfully. |  |  |
| OUT-002 | Voucher CSV export | `company_admin` or `company_accountant` | Voucher detail exists. | Open voucher detail and export CSV. | CSV file downloads successfully. |  |  |
| OUT-003 | Operational CSV export | Role with page access | Supported operational list page exists. | Export CSV from Units, Customers, Bookings, Collections, Employees, Leave Requests, Payroll Runs, Attachments, and Audit Events as permitted. | CSV export completes for pages the role can access. |  |  |
| OUT-004 | Browser print | `company_admin` or `company_accountant` | Tester can access financial reports or voucher detail. | Click Print on financial reports and voucher detail. | Browser print opens; shell/navigation chrome is hidden where practical; context and totals remain visible. |  |  |
| OUT-005 | Unsupported output formats absent | Any role | Tester is signed in. | Review supported output pages. | No `.xlsx` export or server-side PDF action is presented. |  |  |
| OPS-001 | PostgreSQL backup | Operator | Compose stack is running. | Run `corepack pnpm backup:db`. | PostgreSQL custom-format dump is created under `backups/postgres/`. |  |  |
| OPS-002 | Backup verification | Operator | Backup file exists. | Run `corepack pnpm verify:backup -- --file backups/postgres/<backup>.dump`. | Verification confirms file existence, non-empty size, and restore metadata. |  |  |
| OPS-003 | Restore dry-run | Operator | Backup file exists. | Run `corepack pnpm restore:db -- --file backups/postgres/<backup>.dump --dry-run`. | Restore input is validated without database mutation. |  |  |
| OPS-004 | Restore confirmation guard | Operator | Backup file exists. | Attempt restore without `--confirm-destroy-data`. | Destructive restore refuses to run. |  |  |

## Issue Handling

Record failed scenarios in `docs/uat/uat-issue-log-template.md` or a copied working issue log. Do not mark Phase 1 accepted while release-blocking failures remain unresolved.
