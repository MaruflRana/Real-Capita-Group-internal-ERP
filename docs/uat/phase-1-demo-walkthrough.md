# Phase 1 Demo Walkthrough

This walkthrough supports a 20 to 40 minute Real Capita supervisor or client-facing demonstration of the current Phase 1 release candidate. It is a demo guide, not a promise of additional scope.

Recommended URL: `http://localhost:3000`

Checkpoint reference: `3bf83f5e`

## Demo Preparation Checklist

Before the session:

- Confirm the stack is running from `docker compose up -d --build`.
- Confirm migrations have been applied with `corepack pnpm docker:migrate`.
- Confirm a company admin exists through `corepack pnpm docker:bootstrap -- --company-name ...`.
- Confirm `corepack pnpm docker:smoke` passes.
- Use the canonical browser origin `http://localhost:3000`.
- Confirm the demo account, password, company, and role labels are known.
- Confirm `S3_PUBLIC_ENDPOINT` is browser-resolvable before demonstrating attachments.
- Prepare a small set of controlled UAT records only if the live Docker data is too empty to show a workflow.
- Keep the route inventory open for presenter reference: `docs/operations/phase-1-route-inventory.md`.
- Keep the known limitations document open for transparent scope discussion: `docs/uat/phase-1-known-limitations.md`.

## Suggested 20 To 40 Minute Demo Path

| Time | Area | What To Show | Talking Points |
| --- | --- | --- | --- |
| 3 min | Login and session | Open `/login`, sign in, show company selection if the account has multiple active companies, land on `/dashboard`. | Phase 1 is company-scoped and role-aware. Single-company users may not see the selector. |
| 4 min | Dashboard | Show company snapshot, recent activity, pending work, quick actions, and period control. | Dashboard is frontend-only and uses existing REST endpoints; widgets follow role access. |
| 4 min | Org & Security | Show users and role assignments as admin. | Admin controls company-scoped users and roles. Non-admin users do not receive this module. |
| 5 min | Accounting | Show chart of accounts, voucher list, voucher detail, draft/posting behavior if data is available. | Accounting is the operational foundation for posted vouchers and financial reports. |
| 5 min | Financial Reports | Show trial balance, general ledger, profit & loss, and balance sheet. Export one CSV and click Print on one report. | Reports are read-only, company-scoped, and based on posted vouchers. CSV and browser print are Phase 1 output paths. |
| 4 min | Project/Property and CRM | Show project/property master routes, then customers, bookings, sale contracts, installments, and collections. | Master data supports CRM/property desk workflows. Sales users can access CRM without unrelated admin modules. |
| 4 min | HR and Payroll | Show employees, leave requests, salary structures, payroll runs, payroll detail, and payroll posting. | HR users can reach HR and payroll; payroll-only users reach payroll but not HR. |
| 4 min | Audit & Documents | Show attachment list/detail, upload/finalize/download flow if storage is ready, and audit events as admin. | Files upload directly from browser to object storage through presigned URLs; audit events are admin-only. |
| 3 min | Role-aware access | Sign in as a restricted role or open a denied route directly. | Navigation hides unavailable modules; direct unauthorized access shows a stable forbidden state. |
| 3 min | Operations and sign-off | Show backup/restore commands, UAT issue log, known limitations, and sign-off checklist. | Phase 1 handoff depends on UAT evidence, backup verification, restore dry-run, and limitation acknowledgement. |

## What To Show First

Start with the dashboard after login. It gives stakeholders the clearest first view of the company-scoped ERP surface without diving into forms immediately.

Recommended opening sequence:

1. `http://localhost:3000/login`
2. `/dashboard`
3. Session menu with active company and role labels
4. Sidebar navigation filtered by the active role

## Module Talking Points

### Org & Security

- Company admin owns company setup, locations, departments, users, and role assignments.
- Role assignments drive both navigation and direct-route access.
- Non-admin users should not see Org & Security navigation and should receive forbidden states on direct access.

### Accounting

- Chart of accounts and vouchers are implemented in Phase 1.
- Balanced vouchers can be posted; unbalanced posting should fail.
- Voucher detail exposes audit-friendly line totals and context.

### Financial Reports

- Trial balance, general ledger, profit & loss, and balance sheet are available.
- Formal statements use posted vouchers only.
- Balance sheet may show a derived unclosed earnings adjustment because year-end closing entries are not implemented in Phase 1.
- CSV export and browser print are available for finance outputs.

### Project & Property Master

- Admin users can maintain projects, cost centers, phases, blocks, zones, unit types, unit statuses, and units.
- Unit statuses are visible as fixed status catalog data.
- Non-admin users should be denied from project/property routes.

### CRM & Property Desk

- Admin and sales users can work with customers, leads, bookings, sale contracts, installment schedules, and collections.
- CRM selectors use scoped reference endpoints so sales users do not need unrelated admin navigation.
- Collections use voucher-backed accounting context where the workflow expects it.

### HR

- Admin and HR users can work with employees, attendance devices, mappings, logs, leave types, and leave requests.
- HR selectors use scoped references for departments, locations, and users.
- HR users are expected to access payroll in Phase 1.

### Payroll

- Admin, HR, and payroll users can access salary structures, payroll runs, run detail, and posting.
- Payroll-only users should not access HR or accounting modules directly.
- Payslip PDF and bank payout/export are not part of Phase 1.

### Audit & Documents

- Document-authorized users can use attachments.
- Admin users can browse full company attachment scope and audit events.
- Non-admin document users may need to choose linked entity scope before broad attachment metadata loading.
- Upload/download requires a browser-resolvable `S3_PUBLIC_ENDPOINT`.

### Export And Print

- CSV is the only Phase 1 structured export format.
- Browser print is the only Phase 1 print/PDF-from-browser path.
- Supported output actions follow the same role and page access rules as the underlying modules.

## What Not To Overclaim

- Do not claim production readiness before strict environment checks, real secrets, HTTPS origins, backup planning, and UAT sign-off are complete.
- Do not promise `.xlsx` export or server-side PDF generation.
- Do not promise automated scheduled backups or point-in-time recovery.
- Do not imply MinIO/S3 object bytes are backed up by PostgreSQL backup commands.
- Do not present empty freshly bootstrapped lists as a defect when no business data has been entered.
- Do not imply approval workflows, notifications, imports, public portals, or fake/demo data are part of Phase 1.

## Known Limitations To Mention Honestly

- CSV is the only structured export format.
- Browser print is the only Phase 1 print/PDF-from-browser path.
- PostgreSQL backup/restore helpers do not back up MinIO/S3 object bytes.
- Scheduled backups and point-in-time recovery are not implemented in the repo.
- Non-localhost production browser sessions require HTTPS because cookies become `Secure`.
- Swagger should not be exposed publicly in production unless intentionally enabled.
- `S3_PUBLIC_ENDPOINT` must be reachable from the browser.
- Freshly bootstrapped companies may show empty lists and reports until real UAT data is entered.

## Fallback Plan If Docker Data Is Not Ideal

If the local Docker data set is too sparse:

1. Keep the demo on route loading, role access, empty states, and output actions.
2. Create only the minimal controlled UAT records needed for the next workflow being demonstrated.
3. Be explicit that empty lists are valid before real business data entry.
4. Use the route inventory to show implemented scope without fabricating fake business data.
5. Defer data-heavy workflow proof to structured UAT scenarios and issue-log evidence.

## Demo Close

End by showing:

- `docs/uat/phase-1-signoff-checklist.md`
- `docs/uat/uat-issue-log-template.md`
- `docs/uat/phase-1-known-limitations.md`
- `docs/operations/phase-1-release-checklist.md`

Ask stakeholders to decide only after UAT results, issue severity, backup verification, restore dry-run, and limitation acknowledgement are recorded.
