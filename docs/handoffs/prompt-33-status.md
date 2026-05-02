# Prompt 33 Status

## Scope Delivered

Prompt 33 delivered **RCG Context-Aligned Synthetic Demo/UAT Data Upgrade**.

This prompt refined the existing Prompt 30 synthetic demo/UAT seed so supervisor demos, dashboard analytics, reports, and module walkthroughs use public Real Capita Group naming context while keeping all private operational records synthetic.

Prompt 33 did not add ERP modules, transactional workflows, CRUD domains, frontend dashboard features, charts, database tables, Prisma migrations, production auto-seeding, `.xlsx` export, server-side PDF rendering, or production deployment changes.

## Public Context Usage

Public Real Capita Group context is used only for safe company/project/location/master-data labels:

- Real Capita Group and sister/family labels such as RC Property Development Ltd, RC Holdings Ltd, Real Capita Trade International, RC Bay, Afseen Realty, Afseen Construction, ABD Foundation, and RESDA
- RCG-context project names and public location notes
- public block, zone, size, and unit-type patterns
- public amenities and surrounding-context labels

All customers, employees, contacts, contracts, voucher amounts, collections, payroll, attendance, leave, attachments, and audit activity remain synthetic Demo/UAT records.

## Seed Coverage

- Org & Security now includes RCG-context office/site locations, functional departments, and sister-concern coordination labels under the guarded synthetic company.
- Project/property master data now includes RCG-context projects, cost centers, phases, blocks A-H, zones B/D/N/M/E/S/ES/DV/TV, public unit-type patterns, Ocean Bliss suite-style types, and units across Phase 1 statuses.
- CRM/property desk data now ties synthetic leads, customers, bookings, sale contracts, installment schedules, and collections to the RCG-context projects and units.
- Accounting data now provides posted vouchers for property sales, collections, site operations, admin/legal expenses, payroll, assets, liabilities, equity, revenue, and expenses.
- HR/payroll data now uses synthetic staff across Accounts & Finance, Sales & CRM, Project Operations, HR & Admin, IT, Legal & Documentation, and Payroll Operations.
- Audit/document demo data now uses safe synthetic filenames such as booking forms, allotment notes, payroll support, collection receipts, and unit handover checklists.

## Safety Preserved

- Commands remain:
  - `corepack pnpm seed:demo`
  - `corepack pnpm seed:demo:reset`
  - `corepack pnpm seed:demo:verify`
- No demo seed runs from app startup, Docker startup, migrations, or normal bootstrap.
- Reset remains scoped to `Real Capita Demo / UAT` with slug `real-capita-demo-uat`.
- Reset marker checks continue to require `DEMO-`, `UAT-`, `SYNTH-DEMO-UAT`, synthetic storage keys, or demo-user auth context.
- Verify now also checks RCG-context project coverage, public block/zone/unit-type patterns, synthetic customer safeguards, and synthetic employee safeguards.

## Verification

Prompt 33 verification should be run with:

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
docker compose up -d --build
corepack pnpm docker:migrate
corepack pnpm seed:demo:reset
corepack pnpm seed:demo
corepack pnpm seed:demo:verify
corepack pnpm docker:smoke
```

Observed result on April 28, 2026:

- `corepack pnpm lint` passed with pre-existing warnings only.
- `corepack pnpm typecheck` passed.
- `corepack pnpm build` passed.
- `corepack pnpm test` passed: 160 API tests and 52 Playwright e2e tests.
- Docker Compose rebuilt and started successfully.
- `corepack pnpm docker:migrate` completed with no pending migrations.
- `corepack pnpm seed:demo:reset` completed and removed only guarded Demo/UAT records.
- `corepack pnpm seed:demo` completed with RCG-context synthetic coverage: 13 projects, 28 units, 8 customers, 9 leads, 7 bookings, 5 sale contracts, 20 installment schedules, 6 collections, 21 vouchers, 12 employees, 144 attendance logs, 3 payroll runs, 5 attachments, and 8 seeded audit events.
- `corepack pnpm seed:demo:verify` passed, including RCG project coverage, block A-H coverage, zone B/D/N/M/E/S/ES/DV/TV coverage, unit-type coverage, synthetic customer/employee safeguards, voucher balance, report activity, and reset marker cleanliness.
- `corepack pnpm docker:smoke` passed for web, API readiness, and Swagger.
- Authenticated live browser verification passed for 16 Phase 1 routes, including dashboard, business overview, daily/weekly/monthly reports, project/property master, CRM bookings/contracts/collections, profit & loss, balance sheet, HR employees, payroll runs, attachments, and audit events.

## Remaining Caveats

- Public RCG facts are not treated as private operational data.
- Contracted sales and collections remain synthetic CRM/property records.
- Financial reports remain driven by posted vouchers only.
- Stakeholder UAT and supervisor sign-off remain separate from synthetic seed verification.
