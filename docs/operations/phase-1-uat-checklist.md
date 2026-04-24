# Phase 1 UAT Checklist

Use this checklist against the Docker Compose release-candidate stack unless a tester is explicitly validating a direct local run.

## Preconditions

- Root `.env` exists and points to the intended test environment.
- The stack is running from `docker compose up -d --build`.
- Migrations have been applied with `corepack pnpm docker:migrate`.
- A company admin has been bootstrapped with `corepack pnpm docker:bootstrap -- --company-name ...`.
- Tester uses the canonical browser origin `http://localhost:3000`.
- Testers understand that empty lists or empty financial reports are acceptable when no real records have been entered.

## Login And Company Selection

- Open `http://localhost:3000/login`.
- Sign in with the provided company admin account.
- If the user belongs to multiple companies, confirm the company selector appears after the first sign-in attempt.
- Select the intended company and sign in again.
- Confirm the app lands on `/dashboard`.
- Open the session menu and confirm the active company, email, and role labels are correct.
- Sign out and confirm protected routes redirect back to `/login?next=...`.

## Dashboard

- Confirm `/dashboard` loads without a page-level error.
- Confirm the company snapshot, recent activity, pending work, and quick-action sections render.
- Change the dashboard period control and confirm financial/count widgets refresh or show a clear empty state.
- Confirm widgets and quick actions only appear for modules the active role can access.

## Org And Security

- As company admin, open Companies, Locations, Departments, Users, and Roles / Assignments.
- Confirm lists load with pagination/search controls where available.
- Create or identify one controlled UAT user for each role that needs access testing.
- Assign roles through the role-assignment page and confirm the user row reflects the expected role.
- Confirm non-admin roles cannot see Org & Security navigation and get a forbidden state on direct route entry.

## Accounting And Voucher Posting

- Open Chart of Accounts and confirm account classes, groups, ledgers, and particular accounts load.
- Create or identify a valid posting-account setup needed for voucher testing.
- Open Vouchers and confirm list filters/search load.
- Create a draft voucher with balanced debit and credit lines.
- Confirm an unbalanced voucher cannot be posted.
- Post a balanced voucher and confirm the status changes to `POSTED`.
- Open the voucher detail page and confirm line totals, status, and audit-friendly context are visible.

## Financial Reports

- Open Trial Balance and run it for a date range.
- Open General Ledger, select a posting account, and run it for a date range.
- Open Profit & Loss and run it for a date range.
- Open Balance Sheet and run it as of a date.
- Confirm reports use posted vouchers only; draft-only data should not change formal statements.
- Confirm empty reports show a clear empty state rather than a broken page.

## Project And Property Master

- Open Projects, Cost Centers, Phases, Blocks, Zones, Unit Types, Unit Statuses, and Units.
- Confirm admin can load each page.
- Create or identify the minimal master records needed by later CRM UAT.
- Confirm Unit Statuses are visible as fixed status catalog data.
- Confirm non-admin roles cannot access Project & Property routes.

## CRM And Property Desk

- As admin or sales, open Customers, Leads, Bookings, Sale Contracts, Installment Schedules, and Collections.
- Create or identify a customer and lead if UAT data is available.
- Confirm booking forms use project/unit selectors without requiring unrelated admin navigation.
- Confirm collections require voucher-backed accounting context where the current workflow expects it.
- Confirm sales can access CRM pages and cannot access accounting, HR, payroll, or org-security pages.

## HR

- As admin or HR, open Employees, Attendance Devices, Device Mappings, Attendance Logs, Leave Types, and Leave Requests.
- Create or identify the minimal employee and leave-type records needed for leave-request testing.
- Confirm HR selectors can load departments, locations, and users.
- Submit and process a leave request through the available lifecycle actions.
- Confirm HR can access Payroll as intended and cannot access accounting or org-security routes.

## Payroll And Payroll Posting

- As admin, HR, or payroll, open Salary Structures, Payroll Runs, Payroll Run Detail, and Payroll Posting.
- Create or identify a salary structure and employee payroll setup.
- Create a payroll run, review run lines, and confirm totals are visible.
- Finalize a payroll run only when the data is ready.
- Post a finalized payroll run and confirm the linked accounting voucher appears where applicable.
- Confirm payroll-only users can access Payroll but cannot access HR, accounting, CRM, or org-security routes.

## Audit And Documents

- Open Attachments as a document-authorized role.
- Confirm admins can browse the company attachment scope.
- Confirm non-admin document users must choose linked entity scope before broad metadata loading when required.
- Run the upload flow: create upload intent, upload directly to object storage, finalize, and open detail.
- Generate a download URL for a finalized attachment and confirm it uses the browser-resolvable `S3_PUBLIC_ENDPOINT`.
- Link an attachment to a supported entity and confirm the detail page shows the link.
- Open Audit Events as admin and confirm filters and compact metadata previews render.
- Confirm non-admin document users cannot access Audit Events.

## Export And Print

- On each financial report, click `Export CSV` and confirm a CSV file downloads.
- On each financial report, click `Print` and confirm browser print preview hides shell/navigation chrome where practical.
- On a voucher detail page, confirm CSV export and print-friendly output are available.
- On supported operational list pages, confirm CSV export completes: Units, Customers, Bookings, Collections, Employees, Leave Requests, Payroll Runs, Attachments, Audit Events.
- Confirm `.xlsx` export and server-side PDF actions are not present.

## Backup And Restore Dry-Run

- Create a PostgreSQL backup with `corepack pnpm backup:db`.
- Verify it with `corepack pnpm verify:backup -- --file backups/postgres/<backup>.dump`.
- Run a non-mutating restore check with `corepack pnpm restore:db -- --file backups/postgres/<backup>.dump --dry-run`.
- Confirm restore without `--confirm-destroy-data` refuses to run.
- Confirm object-storage backup expectations are understood and handled outside the app.

## Role-Based Access Spot Checks

- Admin: dashboard plus every Phase 1 module route should be reachable.
- Accountant: dashboard, accounting, financial reports, and attachments should be reachable; org, project/property, CRM, HR, payroll, and audit events should be forbidden.
- HR: dashboard, HR, payroll, and attachments should be reachable; accounting, org, project/property, CRM, and audit events should be forbidden.
- Payroll: dashboard, payroll, and attachments should be reachable; HR, accounting, org, project/property, CRM, and audit events should be forbidden.
- Sales: dashboard, CRM/property desk, and attachments should be reachable; accounting, org, project/property, HR, payroll, and audit events should be forbidden.
- Member: dashboard should be reachable; module navigation should be limited and direct module routes should show a forbidden state.

## Sign-Off Notes

- Record tester name, date, environment, browser, git revision, and any failed route or command.
- Do not mark UAT passed with unresolved release-blocking data corruption, auth, posting, backup, or restore-dry-run failures.
- Cosmetic issues can be logged separately if they do not block the Phase 1 release candidate.
