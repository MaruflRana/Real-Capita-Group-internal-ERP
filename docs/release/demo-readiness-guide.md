# Demo Readiness Guide

## Pre-Demo Checklist

- Confirm the Docker Compose stack is running with `docker compose up -d --build`.
- Confirm migrations have run with `corepack pnpm docker:migrate`.
- Confirm a company admin exists through `corepack pnpm docker:bootstrap -- --company-name ...` when needed.
- Confirm `corepack pnpm docker:smoke` passes.
- For a populated supervisor demo, run `corepack pnpm seed:demo` and `corepack pnpm seed:demo:verify` against the intended local/UAT database.
- Use `corepack pnpm seed:demo` as the authoritative Demo/UAT refresh for `real-capita-demo-uat`; it now rebuilds the reserved demo company before reseeding.
- Use the browser URL `http://localhost:3000`.
- Confirm the demo account, password, company, and role labels are known.
- Confirm `S3_PUBLIC_ENDPOINT` is browser-resolvable before demonstrating attachments.
- Keep the route inventory and known limitations open for reference:
  - [../operations/phase-1-route-inventory.md](../operations/phase-1-route-inventory.md)
  - [../uat/phase-1-known-limitations.md](../uat/phase-1-known-limitations.md)

## Account And Company Selection Notes

- A user with one active company assignment signs in directly.
- A user with multiple active company assignments should see the company selector after the first sign-in attempt.
- The selected company drives the session menu, module access, dashboard visibility, and company-scoped route behavior.

## Recommended Demo Flow

1. Login and land on `/dashboard`.
2. Show the session menu and role-filtered sidebar.
3. Show dashboard summary, executive analytics, recent activity, pending work, quick actions, and period control.
4. Show Financial Reports: business overview, periodic reports including yearly, trial balance, general ledger, profit & loss, and balance sheet.
5. Export one financial report CSV and click Print Report on one supported report. Business Overview, Daily, Weekly, Monthly, Yearly, Trial Balance, General Ledger, Profit & Loss, and Balance Sheet now use the shared A4 printable report template. For General Ledger, select a posting account first.
6. Show Project & Property Master routes for projects, hierarchy masters, and units.
7. Show CRM & Property Desk routes for customers, leads, bookings, sale contracts, installments, and collections. Use `demo.sales@demo.realcapita.test`, search Collections for `DEMO-COL-2026-001`, then open the Customer Collection Receipt to show the posted-voucher acknowledgement and browser-print path.
8. Show HR routes for employees, attendance devices/logs, leave types, and leave requests.
9. Show Payroll routes for salary structures, payroll runs, run detail, and posting.
10. Show Attachments and Audit Events if storage and role context are ready.
11. As admin, show Org & Security users and role assignments under `/org-security/...`.
12. Demonstrate a denied route with a restricted role if time permits.
13. Close with known limitations, UAT issue log, and sign-off checklist.

## Modules To Show

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

## Outputs To Show

- CSV export on one financial report.
- Browser print on one financial report or voucher detail.
- Browser print on a CRM & Property Desk Customer Collection Receipt when demonstrating the customer payment acknowledgement story.
- For the receipt demo, use seeded collection `DEMO-COL-2026-001` from the Collections register and open it through `Receipt` or `Open Receipt`.
- Business Overview, Daily, Weekly, Monthly, Yearly, Trial Balance, General Ledger, Profit & Loss, and Balance Sheet now use the shared A4 printable report template.
- Prompt 40D final QA verified those 9 report routes for screen controls, CSV downloads, print media, and 1440px/1366px/1024px screen widths.
- Mention that supported operational list exports are CSV-only.

## What Not To Claim

- Do not claim stakeholder UAT is complete until sign-off records are filled.
- Do not promise `.xlsx`, server-side PDF, approval workflows, notifications, imports, public portals, automated backups, or point-in-time recovery.
- Do not imply PostgreSQL backups include MinIO/S3 object bytes.
- Do not present fake/demo ERP data as part of the product.
- Do not describe empty freshly bootstrapped lists as defects when no real records exist.
- Do not claim production readiness before real secrets, HTTPS origins, env checks, backup planning, and UAT sign-off are complete.

## Fallback Plan If Local Data Is Thin

- Keep the demo focused on route loading, role access, empty states, and output actions.
- Create only controlled UAT records needed to validate the next workflow.
- Use the route inventory to show implemented scope without inventing data.
- Defer data-heavy proof to structured UAT scenarios and issue-log evidence.
