# Prompt 31 Status

## Scope Delivered

Prompt 31 delivered **Analytics / Graphs / Status UI Enhancement** for the existing Phase 1 ERP surface.

This phase added frontend-only visual summaries and aggregation helpers over existing NestJS REST APIs. It did not add new ERP business modules, CRUD workflows, database tables, migrations, Next.js server actions, production auto-seeding, approval engines, import systems, `.xlsx` export, or server-side PDF rendering.

## UI Coverage Added

- Dashboard:
  - role-aware operational analytics section
  - revenue vs expense summary
  - voucher status/type distribution
  - unit status cards and distribution
  - CRM funnel and collection trend
  - leave and attendance activity
  - payroll run status and payroll amount trend
  - attachment status and audit category summaries
- Accounting:
  - account-structure status cards
  - voucher status/type distribution
  - monthly debit/credit movement
- Financial reports:
  - trial balance debit/credit comparison
  - general ledger movement and line activity summaries
  - profit & loss revenue vs expense and statement status
  - balance sheet assets vs liabilities/equity comparison
  - explicit `UNCLOSED_EARNINGS` summary where returned by the backend
- Project/property:
  - unit inventory status cards
  - unit status distribution
  - units by project and unit type
- CRM/property desk:
  - lead status distribution
  - booking/contract/collection funnel
  - installment state summary
  - collection trend
- HR:
  - employee grouping by department/location
  - leave status distribution
  - attendance activity trend
- Payroll:
  - salary-structure count
  - payroll run status distribution
  - gross/deduction/net summaries and trend
- Audit/documents:
  - attachment status distribution
  - attachment linked-entity distribution
  - audit event category distribution
  - audit activity trend

## Data Sources

All analytics use existing Phase 1 REST clients from `apps/web/src/lib/api/*`, including:

- accounting lists and financial report endpoints
- project/property master lists
- CRM/property desk lists
- HR employee, attendance, and leave lists
- payroll salary-structure and payroll-run lists
- attachment metadata and audit event lists

No backend aggregation endpoint was required for Prompt 31.

## Demo/UAT Behavior

- Prompt 31 relies on Prompt 30's explicit synthetic Demo/UAT seed when reviewers need populated visuals.
- Empty analytics states remain honest and point operators to:

```powershell
corepack pnpm seed:demo
corepack pnpm seed:demo:verify
```

- When the active company slug is `real-capita-demo-uat`, analytics copy identifies the data as seeded Demo/UAT company data.
- Synthetic Demo/UAT data is not presented as real production data.

## Verification

Prompt 31 verification completed on April 26, 2026:

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
docker compose up -d --build
corepack pnpm docker:migrate
corepack pnpm seed:demo
corepack pnpm seed:demo:verify
corepack pnpm docker:smoke
```

Observed result:

- `corepack pnpm lint` passed with pre-existing warnings only.
- `corepack pnpm typecheck` passed.
- `corepack pnpm build` passed.
- `corepack pnpm test` passed: API tests passed and Playwright e2e passed.
- Docker Compose rebuilt and started successfully.
- `corepack pnpm docker:migrate` completed with no pending migrations.
- `corepack pnpm seed:demo` created/updated the `Real Capita Demo / UAT` company.
- `corepack pnpm seed:demo:verify` passed with non-zero accounting, property, CRM, HR, payroll, attachment, and audit data.
- `corepack pnpm docker:smoke` passed for web, API readiness, and Swagger.

Live browser verification was completed at `http://localhost:3000` by signing in as `demo.admin@demo.realcapita.test` with the seeded Demo/UAT company. The dashboard analytics rendered real seeded metrics for revenue/expense, voucher distribution, unit status, CRM collections, HR leave/attendance, payroll runs, and audit/document activity. Representative module analytics rendered on vouchers, units, collections, leave requests, payroll runs, audit events, and balance sheet, including explicit `UNCLOSED_EARNINGS` visibility.

## Remaining Caveats

- Some analytics use the latest list page returned by existing list APIs and clearly show sample/truncation notes where applicable.
- If future requested visuals require data not exposed by existing endpoints, the gap should be documented before adding any backend read-only aggregation endpoint.
- Stakeholder UAT and sign-off remain pending.
