# Foundation Status

## Current State

- The locked stack remains intact: Nx + pnpm monorepo, Next.js App Router frontend-only web app, NestJS REST API, Prisma + PostgreSQL 15, MinIO, Playwright, GitHub Actions, Docker Compose.
- `apps/api` remains the backend source of truth through Prompt 19:
  - auth core with refresh rotation and bootstrap admin flow
  - Org & Security admin APIs
  - accounting core
  - project/property master core
  - CRM/property desk core
  - HR core
  - payroll core
  - audit trail and attachment/document infrastructure
  - financial reporting API for trial balance, general ledger, profit & loss, and balance sheet
- `apps/web` now contains the frontend slices delivered through Prompt 24:
  - Prompt 12 authenticated shell, login/logout/session UX, and Org & Security UI
  - Prompt 13 accounting chart-of-accounts and voucher UI
  - Prompt 14 project/property master UI
  - Prompt 15 CRM/property desk UI
  - Prompt 16 HR Core UI
  - Prompt 17 Payroll Core UI
  - Prompt 18 Audit & Documents UI for attachments and audit events
  - Prompt 20 Financial Reporting UI for trial balance, general ledger, profit & loss, and balance sheet
  - Prompt 24 Phase 1 export + print readiness for finance outputs and selected operational CSV exports
- Prompt 21 replaced the placeholder signed-in home with a frontend-only operational dashboard:
  - `/dashboard` remains the main signed-in landing page
  - dashboard summary, recent activity, pending-work, and quick-action widgets reuse existing REST endpoints only
  - dashboard data aggregation lives in `apps/web` and preserves the locked frontend-only browser boundary
  - no NestJS endpoint changes
  - no Prisma schema change
- Prompt 16 added one minimal backend compatibility layer for HR selector data:
  - `GET /companies/:companyId/hr/references/departments`
  - `GET /companies/:companyId/hr/references/locations`
  - `GET /companies/:companyId/hr/references/users`
  - no Prisma schema change
  - no backend HR business-logic redesign
- Prompt 17 added one minimal backend compatibility layer for payroll selector data:
  - `GET /companies/:companyId/payroll/references/projects`
  - `GET /companies/:companyId/payroll/references/cost-centers`
  - `GET /companies/:companyId/payroll/references/employees`
  - `GET /companies/:companyId/payroll/references/particular-accounts`
  - no Prisma schema change
  - no backend payroll business-logic redesign
- Prompt 18 did not redesign the backend attachment or audit modules.
- Prompt 18 added one minimal runtime compatibility fix so Docker-based browser upload/download flows receive host-resolvable MinIO presigned URLs:
  - `docker-compose.yml` now defaults `S3_PUBLIC_ENDPOINT` to `http://localhost:9000` when unset
  - `.env.example` now includes `S3_PUBLIC_ENDPOINT=http://localhost:9000`
- Prompt 19 added the backend-only financial reporting slice:
  - `GET /companies/:companyId/accounting/reports/trial-balance`
  - `GET /companies/:companyId/accounting/reports/general-ledger`
  - `GET /companies/:companyId/accounting/reports/profit-loss`
  - `GET /companies/:companyId/accounting/reports/balance-sheet`
  - raw SQL reporting queries in `apps/api/src/app/financial-reporting/financial-reporting.repository.ts`
  - no Prisma schema change
  - no accounting posting-engine redesign
- Prompt 20 added the frontend-only financial reporting slice:
  - `/accounting/reports/trial-balance`
  - `/accounting/reports/general-ledger`
  - `/accounting/reports/profit-loss`
  - `/accounting/reports/balance-sheet`
  - typed reporting REST client methods in `apps/web/src/lib/api/financial-reporting.ts`
  - shared reporting hooks, filters, hierarchy tables, and page components in `apps/web/src/features/financial-reporting`
  - no NestJS endpoint changes
  - no Prisma schema change
- Prompt 22 hardened the runtime and release-readiness path without adding new ERP business modules:
  - `docker-compose.yml` now runs the production-minded `runner` stages for `api` and `web` instead of bind-mounted dev containers
  - `docker-compose.yml` now includes `ops` profile helpers for migrations and admin bootstrap
  - `apps/api/src/app/config/env.validation.ts` now enforces same-host browser origin rules across `WEB_APP_URL`, `API_BASE_URL`, and `CORS_ORIGIN`
  - `apps/web/src/proxy.ts` now redirects non-canonical browser requests onto the configured canonical origin
  - repo-root reliability helpers now exist for runtime smoke and containerized bootstrap:
    - `corepack pnpm docker:migrate`
    - `corepack pnpm docker:bootstrap -- --company-name ...`
    - `corepack pnpm docker:smoke`
  - GitHub Actions now validates Docker Compose boot plus runtime smoke after lint, typecheck, build, and test
- Prompt 23 hardened authorization and role-aware UX without adding new ERP business modules:
  - `packages/config/src/access.ts` now defines the shared Phase 1 module access matrix
  - backend auth decorators now consume the shared matrix instead of duplicating role lists
  - backend guards now return explicit, stable `401`/`403` failures for missing auth, company scope, or role scope
  - the frontend auth provider, shell navigation, route boundary, dashboard widgets, and quick actions now consume the same matrix
  - authenticated but unauthorized route hits now render a clear forbidden state instead of leaking broken module pages
  - representative backend and frontend authorization checks now exist in API specs and Playwright e2e coverage
- Prompt 24 added Phase 1 output/export readiness without adding new ERP business modules:
  - backend read-only CSV endpoints now exist for trial balance, general ledger, profit & loss, balance sheet, and voucher detail
  - frontend report pages now support CSV export plus browser print-friendly rendering for trial balance, general ledger, profit & loss, and balance sheet
  - the voucher detail page now supports CSV export plus browser print-friendly rendering
  - selected operational list pages now support CSV export through the shared paginated export helper:
    - units
    - customers
    - bookings
    - collections
    - employees
    - leave requests
    - payroll runs
    - attachments
    - audit events
  - print styling now hides shell/navigation chrome while preserving company context, filters-as-context, and totals on supported print pages
  - no new backend write flows, no `.xlsx` generation, and no server-side PDF rendering pipeline were added
- Prompt 25 added Phase 1 backup, restore, and operations-readiness support without adding new ERP business modules:
  - `corepack pnpm backup:db` creates PostgreSQL custom-format dumps from the Compose `postgres` service
  - `corepack pnpm verify:backup -- --file <path>` checks backup existence, size, and `pg_restore --list` metadata
  - `corepack pnpm restore:db -- --file <path> --dry-run` validates restore inputs without changing data
  - `corepack pnpm restore:db -- --file <path> --confirm-destroy-data` performs the destructive Compose PostgreSQL restore path
  - backups default to `backups/postgres/<database>-YYYYMMDDTHHMMSSZ.dump`
  - `corepack pnpm ops:env-check -- --strict` warns/fails on missing or unsafe production env values
  - `docs/operations/backup-restore.md` now documents PostgreSQL backup/restore, MinIO/S3 object backup guidance, secret handling, and Phase 1 disaster-recovery expectations
  - no NestJS endpoints, Next.js routes, Prisma schema changes, or business modules were added
- Prompt 26 completed the Phase 1 release-candidate audit and UAT readiness pass without adding new ERP business modules:
  - `docs/operations/phase-1-route-inventory.md` records the Phase 1 backend module, frontend route, access-role, output-surface, and out-of-scope inventory
  - `docs/operations/phase-1-uat-checklist.md` provides practical human UAT coverage across auth, dashboard, modules, export/print, backup dry-run, and role access
  - `docs/operations/phase-1-release-checklist.md` records env setup, secrets, Docker Compose deployment, migration, bootstrap, backup, smoke, rollback, and caveats
  - tracked generated `*.tsbuildinfo` artifacts were removed and ignored
  - the Phase 1 architecture baseline was refreshed through Prompt 25 behavior
  - no NestJS endpoints, Next.js routes, Prisma schema changes, or business workflows were added
- Prompt 27 completed the Phase 1 UAT, stakeholder demo, and sign-off documentation package without adding new ERP business modules:
  - `docs/uat/README.md` indexes the UAT, demo, issue-log, limitation, and sign-off materials
  - `docs/uat/phase-1-feature-matrix.md` summarizes included modules, capabilities, deferred scope, roles, and verification status
  - `docs/uat/role-wise-uat-guide.md` provides role-by-role access expectations and UAT checks
  - `docs/uat/module-wise-uat-scenarios.md` provides structured scenario IDs, steps, expected results, and pass/fail placeholders
  - `docs/uat/phase-1-demo-walkthrough.md` provides a practical stakeholder demo path and presenter talking points
  - `docs/uat/uat-issue-log-template.md` provides issue capture fields, severity, priority, status, and retest tracking
  - `docs/uat/phase-1-signoff-checklist.md` records functional, role, finance, HR/payroll, CRM, document, output, backup, limitation, and acceptance sign-off
  - `docs/uat/phase-1-known-limitations.md` records known Phase 1 limitations and deferred scope from the handoff and operations docs
  - `docs/handoffs/prompt-27-status.md` and `docs/handoffs/prompt-28-scope.md` preserve handoff continuity
  - no application code, backend routes, frontend pages, Prisma schema changes, business workflows, fake/demo data, or output formats were added
- Prompt 28 completed the final Phase 1 release packaging and handoff bundle without adding new ERP business modules:
  - `docs/release/phase-1-release-notes.md` records release metadata placeholders, included modules, major capabilities, verification references, limitations, deployment requirements, UAT/sign-off status, and key links
  - `docs/release/phase-1-technical-handoff.md` records repository structure, stack, run commands, Docker Compose flow, migration/bootstrap, smoke, backup/restore, docs map, Phase 2 continuation, and caveats
  - `docs/release/operator-quick-start.md` gives operators a short start, login, dashboard/health, smoke, UAT, and backup/restore reference
  - `docs/release/demo-readiness-guide.md` records demo prep, account/company notes, recommended demo flow, outputs, non-claims, and sparse-data fallback
  - `docs/release/phase-1-artifact-inventory.md` indexes architecture, route inventory, UAT, release, deployment, backup/restore, handoff, scripts, app paths, and tests
  - `docs/release/phase-1-verification-summary.md` records Prompt 28 final verification plus prior documented Prompt 26 and Prompt 27 validation
  - `docs/handoffs/prompt-28-status.md` and `docs/handoffs/prompt-29-scope.md` preserve handoff continuity
  - no application code, backend routes, frontend pages, Prisma schema changes, business workflows, fake/demo data, dashboards, workflow engines, or output formats were added
- Prompt 29 completed the final Phase 1 deployment/tag/release handoff and verification pass without adding new ERP business modules:
  - `docs/release/phase-1-release-notes.md` now records the current release-candidate checkpoint `c04c93e5874f369b3bb47721e0c98bdcbd2b2532` and keeps stakeholder UAT/sign-off pending
  - `docs/release/phase-1-verification-summary.md` now records Prompt 29 verification evidence
  - `docs/release/phase-1-technical-handoff.md` and `docs/operations/phase-1-release-checklist.md` now include final pre-deploy command sequencing, env/secrets checks, backup, migration, smoke, rollback, HTTPS, `S3_PUBLIC_ENDPOINT`, and object-storage backup reminders
  - `docs/release/tagging-and-release.md` now records safe release-candidate and final-tag guidance
  - `docs/handoffs/prompt-29-status.md` and `docs/handoffs/prompt-30-scope.md` preserve handoff continuity
  - no application code, backend routes, frontend pages, Prisma schema changes, business workflows, fake/demo data, destructive restore, production deployment, dashboards, workflow engines, or output formats were added
- Prompt 30 was reassigned to Synthetic Demo/UAT Data Foundation and adds an explicit, resettable seed-data layer without adding new ERP business features:
  - root scripts now exist for `corepack pnpm seed:demo`, `corepack pnpm seed:demo:reset`, and `corepack pnpm seed:demo:verify`
  - synthetic data targets only the clearly named `Real Capita Demo / UAT` company with slug `real-capita-demo-uat`
  - seed coverage spans existing Phase 1 org/security, accounting, reports, project/property, CRM/property desk, HR, payroll, audit/documents, and audit event surfaces
  - reset is guarded by the synthetic company identity plus `DEMO-`, `UAT-`, and `SYNTH-DEMO-UAT` markers and refuses unmarked records
  - demo data is never wired into startup, Docker startup, migrations, or normal bootstrap
  - `docs/operations/demo-data.md`, `docs/handoffs/prompt-30-status.md`, and `docs/handoffs/prompt-31-scope.md` preserve handoff continuity
  - no frontend graphs/charts, new dashboard widgets, new modules, new CRUD screens, new reports, workflows, migrations, production deployment changes, `.xlsx`, server-side PDF, or automatic seeding were added
- Prompt 31 completed Analytics/Graphs/Status UI Enhancement without adding new ERP business modules:
  - shared frontend analytics components now support metric cards, distribution bars, compact trend bars, loading/error/empty states, and Demo/UAT guidance
  - frontend-only aggregation helpers reuse existing Phase 1 REST list and report APIs for dashboard and module analytics
  - `/dashboard` now includes role-aware operational analytics widgets for financial, accounting, property, CRM, HR, payroll, and document/audit activity where the signed-in role can access those modules
  - module pages now surface practical visual summaries across accounting, financial reports, project/property, CRM/property desk, HR, payroll, and audit/documents
  - financial report pages now visualize existing backend report totals without changing calculations, including explicit `UNCLOSED_EARNINGS` visibility on balance sheet summaries
  - sparse-data empty states point operators to explicit `corepack pnpm seed:demo` and `corepack pnpm seed:demo:verify` commands when useful
  - no backend routes, Prisma schema changes, Next.js server actions, seed-data redesign, workflow engines, import systems, `.xlsx`, server-side PDF, or production deployment changes were added
- Prompt 32 completed Professional Analytics + Periodic Business Reports without adding transactional workflows:
  - added read-only backend business overview reporting and CSV export under the existing financial-reporting API
  - added `/accounting/reports/business-overview`, `/daily`, `/weekly`, and `/monthly` frontend report pages
  - business reports expose contracted sales, collected sales, posted-voucher revenue, posted-voucher expenses, net profit/loss, voucher status counts, and booking/contract/collection counts by `day`, `week`, or `month`
  - dashboard analytics now use the business overview report for business performance and sales/collections trends
  - shared analytics/report components now use stronger responsive grids, clearer chart spacing, readable legends, and reduced small-label letter spacing
  - financial report visual summaries continue to preserve backend calculations, including plain-language `Unclosed earnings adjustment` display for `UNCLOSED_EARNINGS`
  - no Prisma schema changes, Next.js server actions, seed-data redesign, fake analytics values, CRUD modules, or write workflows were added
- Prompt 33 completed RCG Context-Aligned Synthetic Demo/UAT Data Upgrade without adding new ERP business features:
  - the existing `corepack pnpm seed:demo`, `corepack pnpm seed:demo:reset`, and `corepack pnpm seed:demo:verify` commands remain intact
  - the guarded synthetic company remains `Real Capita Demo / UAT` with slug `real-capita-demo-uat`
  - public Real Capita Group context is used only for company/family labels, project names, project locations, block/zone/size/type patterns, and amenities/context labels
  - customers, employees, contacts, contracts, voucher amounts, collections, payroll, attendance, leave, attachments, and audit events remain synthetic Demo/UAT records
  - project/property, CRM, accounting/reporting, HR/payroll, and audit/document seed coverage was expanded for dashboard analytics, business overview, daily/weekly/monthly reports, financial reports, and module walkthroughs
  - reset remains scoped to marked synthetic records only, and verify now checks RCG-context project coverage, block/zone/type patterns, synthetic private-data safeguards, report activity, status coverage, voucher balance, and marker cleanliness
  - no frontend dashboard features, charts, backend routes, Prisma schema changes, seed-data command changes, production auto-seeding, migrations, `.xlsx`, server-side PDF, or deployment changes were added
- Prompt 34 completed the UI/UX Audit + ERP Design System Foundation without redesigning every page:
  - global web CSS and Tailwind tokens now define a stronger ERP canvas, surface, border, text, status, and chart palette
  - shared card, button, table, badge, input, select, empty-state, and side-panel primitives now use higher contrast, tighter radii, clearer focus treatment, and admin-oriented density
  - new frontend-only ERP primitives provide PageSection, ReportSection, KPI/metric cards, StatusChip, ChartCardShell, AnalyticsGrid, ReportGrid, DataSourceNote, EmptyStateBlock, and TableShell foundations
  - shared analytics components now use professional chart-card shells, stable chart height, readable legends, stronger bar colors, clearer loading/empty/error states, and scroll only when bucket counts require it
  - representative wiring was limited to dashboard summary/section primitives, financial report section/assumption notes, and shared module analytics panels
  - no backend routes, Prisma schema changes, database migrations, seed-data changes, new frontend routes, business workflows, hardcoded chart values, `.xlsx`, server-side PDF, or production deployment changes were added
- Prompt 35 completed App Shell + Navigation + Page Layout Redesign without redesigning every chart/report/module:
  - the authenticated app shell now uses a darker ERP canvas, clear sidebar/header/content separation, a compact sticky workspace header, and a bounded centered page frame
  - sidebar navigation now has denser route grouping, stronger active/hover/focus states, `aria-current` on active routes, compact company context, smaller role badges, and mobile drawer behavior
  - shared frontend-only layout primitives now provide AppPage, ModulePageHeader, ModuleSection, and FilterCardShell for consistent page width, section spacing, filter grids, and route wrapper alignment
  - dashboard, business overview, trial balance, balance sheet, projects, customers, employees, payroll runs, and audit events were aligned to the new page-frame rhythm for verification
  - internal table horizontal scrolling remains scoped to table shells, and print behavior continues to hide shell/navigation chrome
  - no backend routes, Prisma schema changes, database migrations, seed-data changes, new frontend routes, business workflows, chart-system redesign, hardcoded values, `.xlsx`, server-side PDF, or deployment changes were added
- Prompt 36 completed Professional Chart Component System without redesigning every report/module page:
  - shared chart tokens now define semantic ERP chart colors for revenue, expense, balance, warning, sales, property, HR, payroll, audit, and document surfaces
  - shared frontend chart primitives now cover trend, comparison, distribution, stacked-status, KPI-trend, mini-table hybrid, legend, and loading/empty/error chart states
  - representative weak progress-bar-only visuals were replaced across dashboard, property/unit distribution, CRM/collections, HR/leave or attendance, payroll, audit/document, and financial-reporting surfaces
  - finance report chart primitives now support revenue-vs-expense, profit/loss, balance comparison, trial-balance debit/credit comparison, and section-total comparison over existing calculations
  - formatting helpers now cover compact/full currency, counts, percentages, date buckets, long label truncation, and readable technical labels such as `UNCLOSED_EARNINGS`
  - no backend routes, Prisma schema changes, database migrations, seed-data changes, new frontend routes, business workflows, new reporting calculations, hardcoded chart values, `.xlsx`, server-side PDF, or deployment changes were added
- Prompt 37 completed Financial Reports Redesign + Yearly Report:
  - the existing read-only business overview endpoint now supports `bucket=year` in addition to `day`, `week`, and `month`
  - `/accounting/reports/yearly` now exists beside business overview, daily, weekly, and monthly reports with CSV export and browser print support
  - financial report pages now follow a consistent finance-grade structure: report header/actions, filters, executive summary, visual analysis, detailed table, and concise calculation notes
  - trial balance, general ledger, profit & loss, and balance sheet pages were redesigned around Prompt 34 design tokens, Prompt 35 page frame, and Prompt 36 chart primitives
  - balance sheet presentation now emphasizes `Assets = Liabilities + Equity` and labels `UNCLOSED_EARNINGS` as "Unclosed earnings adjustment" in primary UI
  - validation passed: lint, typecheck, build, test, Docker rebuild, demo seed/verify, Docker smoke, and live checks for all financial report routes at 1440px, 1366px, and 1024px
  - no transactional workflows, database schema changes, migrations, seed-system changes, fake values, `.xlsx`, server-side PDF, or new non-report modules were added
- The repo is now ready for Prompt 38 as Operational Module Analytics Redesign.

## Frontend Routes

- `/login`
- `/dashboard`
- `/org-security/companies`
- `/org-security/locations`
- `/org-security/departments`
- `/org-security/users`
- `/org-security/role-assignments`
- `/accounting/chart-of-accounts`
- `/accounting/reports/business-overview`
- `/accounting/reports/daily`
- `/accounting/reports/weekly`
- `/accounting/reports/monthly`
- `/accounting/reports/yearly`
- `/accounting/reports/trial-balance`
- `/accounting/reports/general-ledger`
- `/accounting/reports/profit-loss`
- `/accounting/reports/balance-sheet`
- `/accounting/vouchers`
- `/accounting/vouchers/new`
- `/accounting/vouchers/[voucherId]`
- `/project-property/projects`
- `/project-property/cost-centers`
- `/project-property/phases`
- `/project-property/blocks`
- `/project-property/zones`
- `/project-property/unit-types`
- `/project-property/unit-statuses`
- `/project-property/units`
- `/crm-property-desk/customers`
- `/crm-property-desk/leads`
- `/crm-property-desk/bookings`
- `/crm-property-desk/sale-contracts`
- `/crm-property-desk/installment-schedules`
- `/crm-property-desk/collections`
- `/hr/employees`
- `/hr/attendance-devices`
- `/hr/device-mappings`
- `/hr/attendance-logs`
- `/hr/leave-types`
- `/hr/leave-requests`
- `/payroll/salary-structures`
- `/payroll/runs`
- `/payroll/runs/[payrollRunId]`
- `/payroll/posting`
- `/audit-documents/attachments`
- `/audit-documents/attachments/[attachmentId]`
- `/audit-documents/audit-events`
- `/unauthorized`

## Phase 1 Output Surfaces Now In Effect

- Financial Reports:
  - `/accounting/reports/business-overview`: CSV export + print-friendly output
  - `/accounting/reports/daily`: CSV export + print-friendly output
  - `/accounting/reports/weekly`: CSV export + print-friendly output
  - `/accounting/reports/monthly`: CSV export + print-friendly output
  - `/accounting/reports/trial-balance`: CSV export + print-friendly output
  - `/accounting/reports/general-ledger`: CSV export + print-friendly output
  - `/accounting/reports/profit-loss`: CSV export + print-friendly output
  - `/accounting/reports/balance-sheet`: CSV export + print-friendly output
- Accounting detail:
  - `/accounting/vouchers/[voucherId]`: CSV export + print-friendly output
- Selected operational CSV exports:
  - `/project-property/units`
  - `/crm-property-desk/customers`
  - `/crm-property-desk/bookings`
  - `/crm-property-desk/collections`
  - `/hr/employees`
  - `/hr/leave-requests`
  - `/payroll/runs`
  - `/audit-documents/attachments`
  - `/audit-documents/audit-events`
- Output format constraints:
  - CSV is the only Phase 1 export file format
  - browser print styling is the only Phase 1 print/PDF-from-browser path
  - no `.xlsx` generation
  - no server-side PDF rendering pipeline

## Phase 1 Release-Candidate Docs Now In Effect

- Route/module inventory:
  - `docs/operations/phase-1-route-inventory.md`
- UAT checklist:
  - `docs/operations/phase-1-uat-checklist.md`
- Release checklist and caveats register:
  - `docs/operations/phase-1-release-checklist.md`
- Prompt 26 handoff:
  - `docs/handoffs/prompt-26-status.md`
- Prompt 27 scope:
  - `docs/handoffs/prompt-27-scope.md`
- Prompt 27 status:
  - `docs/handoffs/prompt-27-status.md`
- Prompt 28 scope:
  - `docs/handoffs/prompt-28-scope.md`
- Prompt 28 status:
  - `docs/handoffs/prompt-28-status.md`
- Prompt 29 scope:
  - `docs/handoffs/prompt-29-scope.md`
- Prompt 29 status:
  - `docs/handoffs/prompt-29-status.md`
- Prompt 30 scope:
  - `docs/handoffs/prompt-30-scope.md`
- Prompt 30 status:
  - `docs/handoffs/prompt-30-status.md`
- Prompt 31 scope:
  - `docs/handoffs/prompt-31-scope.md`
- Prompt 31 status:
  - `docs/handoffs/prompt-31-status.md`
- Prompt 32 scope:
  - `docs/handoffs/prompt-32-scope.md`
- Prompt 32 status:
  - `docs/handoffs/prompt-32-status.md`
- Prompt 33 scope:
  - `docs/handoffs/prompt-33-scope.md`
- Prompt 33 status:
  - `docs/handoffs/prompt-33-status.md`
- Prompt 34 scope:
  - `docs/handoffs/prompt-34-scope.md`
- Prompt 34 status:
  - `docs/handoffs/prompt-34-status.md`
- Prompt 35 scope:
  - `docs/handoffs/prompt-35-scope.md`
- Prompt 35 status:
  - `docs/handoffs/prompt-35-status.md`
- Prompt 36 scope:
  - `docs/handoffs/prompt-36-scope.md`
- Prompt 36 status:
  - `docs/handoffs/prompt-36-status.md`
- Prompt 37 scope:
  - `docs/handoffs/prompt-37-scope.md`
- Prompt 37 status:
  - `docs/handoffs/prompt-37-status.md`
- Prompt 38 scope:
  - `docs/handoffs/prompt-38-scope.md`
- Synthetic demo/UAT data operations:
  - `docs/operations/demo-data.md`
- Final Phase 1 release packaging and handoff bundle:
  - `docs/release/phase-1-release-notes.md`
  - `docs/release/phase-1-technical-handoff.md`
  - `docs/release/operator-quick-start.md`
  - `docs/release/demo-readiness-guide.md`
  - `docs/release/phase-1-artifact-inventory.md`
  - `docs/release/phase-1-verification-summary.md`
  - `docs/release/tagging-and-release.md`
- UAT, demo, issue-log, limitation, and sign-off package:
  - `docs/uat/README.md`
  - `docs/uat/phase-1-feature-matrix.md`
  - `docs/uat/role-wise-uat-guide.md`
  - `docs/uat/module-wise-uat-scenarios.md`
  - `docs/uat/phase-1-demo-walkthrough.md`
  - `docs/uat/uat-issue-log-template.md`
  - `docs/uat/phase-1-signoff-checklist.md`
  - `docs/uat/phase-1-known-limitations.md`

## Frontend Structure Summary

```text
apps/web/src/
  app/
    (app)/                protected routes and app layout
      accounting/         Prompt 13 pages + Prompt 20 report pages
      audit-documents/    Prompt 18 pages
      crm-property-desk/  Prompt 15 pages
      hr/                 Prompt 16 pages
      org-security/       Prompt 12 pages
      payroll/            Prompt 17 pages
      project-property/   Prompt 14 pages
    (public)/             login layout
    unauthorized/         forbidden fallback
    proxy.ts              route protection and redirect boundary
  components/
    auth/                 auth guard
    providers/            query + auth providers
    ui/                   reusable shell/table/form primitives plus shared output actions
  features/
    accounting/           Prompt 13 accounting UI
    audit-documents/      Prompt 18 attachment/audit pages, forms, hooks, shared UI
    auth/                 login page client flow
    crm-property-desk/    Prompt 15 CRM/property desk pages, forms, hooks, shared UI
    dashboard/            Prompt 21 operational dashboard/home widgets, data hooks, and shared UI
    financial-reporting/  Prompt 20 reporting pages, filters, hooks, shared UI
    hr-core/              Prompt 16 HR Core pages, forms, hooks, shared UI
    org-security/         Prompt 12 admin screens
    payroll-core/         Prompt 17 payroll pages, forms, hooks, shared UI
    project-property/     Prompt 14 project/property master UI
    shell/                sidebar, top bar, session menu, shell layout
  lib/
    api/                  typed REST client helpers for auth, org, accounting, project, CRM, HR, payroll, and audit/documents
    forms.ts              API-form error mapping helpers
    format.ts             shared formatting helpers
    output.ts             shared CSV download, paginated export, filename, and print helpers
    routes.ts             canonical web routes
```

## Auth And Session Rules Now In Effect

- The browser stays frontend-only. All business operations still go directly to the NestJS REST API.
- The web app uses cookie-backed auth compatibility with the existing backend token model:
  - backend still returns access/refresh tokens in the login/refresh payloads
  - backend also sets/clears `rc_access_token` and `rc_refresh_token` httpOnly cookies for browser-safe session continuity
- The browser-facing origin is now explicit:
  - `http://localhost:3000` is the canonical local browser origin
  - `http://127.0.0.1:3000` redirects onto the canonical localhost origin for cookie consistency
- The backend now validates cookie-origin compatibility:
  - `WEB_APP_URL` and `API_BASE_URL` must share the same scheme and hostname
  - every `CORS_ORIGIN` entry must use the same scheme and hostname as `WEB_APP_URL`
- The frontend query layer sends credentialed requests and retries once through `POST /api/v1/auth/refresh` on eligible `401` responses.
- Protected route gating happens in `apps/web/src/proxy.ts` using the auth cookies:
  - `/dashboard`, `/org-security/**`, `/accounting/**`, `/project-property/**`, `/crm-property-desk/**`, `/hr/**`, `/payroll/**`, and `/audit-documents/**` redirect unauthenticated requests to `/login?next=...`
  - `/` redirects to `/dashboard` or `/login`
- The login UX keeps the multi-company branch exposed by the backend:
  - first login attempt may return `400` with `details.availableCompanies`
  - the UI renders a company selector
  - the second login submits the selected `companyId`

## Phase 1 Authorization Matrix Now In Effect

| Module                    | `company_admin` | `company_accountant` | `company_hr` | `company_payroll` | `company_sales` | `company_member` |
| ------------------------- | --------------- | -------------------- | ------------ | ----------------- | --------------- | ---------------- |
| Dashboard                 | yes             | yes                  | yes          | yes               | yes             | yes              |
| Org & Security            | yes             | no                   | no           | no                | no              | no               |
| Accounting                | yes             | yes                  | no           | no                | no              | no               |
| Financial Reports         | yes             | yes                  | no           | no                | no              | no               |
| Project & Property Master | yes             | no                   | no           | no                | no              | no               |
| CRM / Property Desk       | yes             | no                   | no           | no                | yes             | no               |
| HR                        | yes             | no                   | yes          | no                | no              | no               |
| Payroll                   | yes             | no                   | yes          | yes               | no              | no               |
| Audit & Documents         | yes             | yes                  | yes          | yes               | yes             | no               |
| Audit Events              | yes             | no                   | no           | no                | no              | no               |

## Frontend Access Rules Now In Effect

- The web shell now hides module navigation entries the active company session cannot reach.
- Protected app routes still redirect unauthenticated sessions to `/login`.
- Authenticated sessions that lack access now receive a clear forbidden state in-shell instead of a broken module page.
- Dashboard summary panels, recent-activity panels, pending-work cards, and quick actions now render only when the current role set can reach the underlying module.
- The frontend still does not own security; the NestJS API remains authoritative for route and company-scope enforcement.

## Audit & Documents UI Rules Now In Effect

- Attachments list:
  - company-aware list, search, pagination, and filters for entity type, linked entity, uploader, mime type, upload status, and created date range
  - company admins can browse the full company attachment scope
  - non-admin document-access sessions must choose a linked entity scope before loading attachment metadata
- Attachment detail:
  - shows filename, mime type, size, status, uploader, timestamps, checksum/object etag, and normalized entity links
  - supports finalize when the attachment is still pending upload
  - supports secure download access generation only for finalized attachments
  - supports link archive and attachment archive actions with backend error surfacing
- Secure upload flow:
  - starts by creating attachment metadata through `POST /companies/:companyId/attachments/uploads`
  - uploads bytes directly from the browser to the presigned storage URL returned by the API
  - finalizes through `POST /companies/:companyId/attachments/:attachmentId/finalize`
  - does not proxy file bytes through Next.js
- Attachment linking:
  - uses normalized attachment links through `POST /companies/:companyId/attachments/:attachmentId/links`
  - resolves supported entity types and company-scoped entity references from backend selector endpoints
  - surfaces invalid or cross-company link failures directly in the UI
- Audit events:
  - company-aware list, search, pagination, and filters for category, event type, actor, target entity type, target entity id, and created date range
  - detail panels show compact metadata previews only and avoid raw payload dumping

## Backend Compatibility Tweaks

- Prompt 15 added CRM-scoped reference endpoints so CRM/property desk selectors can fetch project, unit, and posted-voucher data without depending on unrelated admin/accounting route permissions:
  - `GET /companies/:companyId/crm-property-desk/references/projects`
  - `GET /companies/:companyId/crm-property-desk/references/units`
  - `GET /companies/:companyId/crm-property-desk/references/vouchers`
- Prompt 16 added HR-scoped reference endpoints so HR selectors can fetch department, location, and user data without depending on unrelated Org & Security admin route permissions:
  - `GET /companies/:companyId/hr/references/departments`
  - `GET /companies/:companyId/hr/references/locations`
  - `GET /companies/:companyId/hr/references/users`
- Prompt 17 added payroll-scoped reference endpoints so payroll selectors can fetch project, cost center, employee, and posting-account data without depending on unrelated project/property, HR, or accounting route permissions:
  - `GET /companies/:companyId/payroll/references/projects`
  - `GET /companies/:companyId/payroll/references/cost-centers`
  - `GET /companies/:companyId/payroll/references/employees`
  - `GET /companies/:companyId/payroll/references/particular-accounts`
- Prompt 18 added no new NestJS endpoints or Prisma changes.
- Prompt 18 updated Docker runtime configuration so host-browser presigned upload/download URLs use a public MinIO origin instead of the internal `minio` container hostname:
  - `S3_PUBLIC_ENDPOINT` defaults to `http://localhost:9000` in `docker-compose.yml`
  - `.env.example` declares the same default explicitly
- Prompt 19 added no Prisma schema or environment changes.
- Prompt 19 added one minimal test-runner reliability fix so `corepack pnpm test` does not fail on a stale Next build lock after prior builds:
  - `tests/e2e/playwright.config.ts` removes `apps/web/.next/lock` before the Playwright web-server build step
- Prompt 20 added no NestJS endpoints, Prisma changes, or environment changes.
- Prompt 20 added one frontend-only table primitive typing fix so report tables can use real table-cell semantics such as `colSpan`.
- Prompt 21 added no NestJS endpoints, Prisma changes, or environment changes.
- Prompt 22 added no new business endpoints or Prisma schema changes.
- Prompt 22 added release-readiness compatibility changes only:
  - `apps/api/Dockerfile` now ships the built API output and installed dependencies without runtime `pnpm install`
  - `apps/web/Dockerfile` now runs the standalone Next.js runner as the non-root `node` user
  - `docker-compose.yml` now starts `api` and `web` from runner images with health-based dependencies instead of dev mounts and polling flags
  - `docker-compose.yml` now exposes `api-migrate` and `api-bootstrap` under the `ops` profile
  - `tests/e2e/playwright.config.ts` and `scripts/start-playwright-web.mjs` now boot the standalone Next build in a way that matches the runner image and avoids stale `.next` state
  - `.github/workflows/ci.yml` now boots Compose and runs runtime smoke after repo tests
- Prompt 23 added no new ERP business endpoints or Prisma schema changes.
- Prompt 23 now centralizes module-level authorization expectations in `packages/config/src/access.ts` so backend and frontend access behavior share the same Phase 1 source of truth.
- Prompt 23 now keeps using the existing `auth/me` company-scoped roles payload for frontend access decisions; no new permissions service or policy-management UI was introduced.
- Prompt 24 added only read-only output endpoints and frontend output helpers:
  - `GET /companies/:companyId/accounting/reports/trial-balance/export`
  - `GET /companies/:companyId/accounting/reports/general-ledger/export`
  - `GET /companies/:companyId/accounting/reports/profit-loss/export`
  - `GET /companies/:companyId/accounting/reports/balance-sheet/export`
  - `GET /companies/:companyId/accounting/vouchers/:voucherId/export`
  - shared frontend CSV helpers live in `apps/web/src/lib/output.ts`
  - shared frontend output action UI lives in `apps/web/src/components/ui/output-actions.tsx`
  - print support stays browser-native and frontend-only; no server-side PDF service was added
- Prompt 25 added only operations helpers and documentation:
  - `scripts/backup-postgres.mjs`
  - `scripts/restore-postgres.mjs`
  - `scripts/verify-postgres-backup.mjs`
  - `scripts/check-env-safety.mjs`
  - `scripts/lib/ops.mjs`
  - `backups/` is ignored so local database dumps are not committed
  - CI now validates the helper help paths and `.env.example` placeholder-safe env check
  - no backend REST routes, frontend routes, Prisma schema changes, or business workflows were added
- Prompt 26 added only release-candidate documentation and generated-file hygiene:
  - `docs/operations/phase-1-route-inventory.md`
  - `docs/operations/phase-1-uat-checklist.md`
  - `docs/operations/phase-1-release-checklist.md`
  - `docs/handoffs/prompt-26-status.md`
  - `docs/handoffs/prompt-27-scope.md`
  - `*.tsbuildinfo` is ignored and previously tracked build-info files were removed
  - no backend REST routes, frontend routes, Prisma schema changes, or business workflows were added
- Prompt 27 added only UAT, demo, issue-log, limitation, sign-off, and handoff documentation:
  - `docs/uat/README.md`
  - `docs/uat/phase-1-feature-matrix.md`
  - `docs/uat/role-wise-uat-guide.md`
  - `docs/uat/module-wise-uat-scenarios.md`
  - `docs/uat/phase-1-demo-walkthrough.md`
  - `docs/uat/uat-issue-log-template.md`
  - `docs/uat/phase-1-signoff-checklist.md`
  - `docs/uat/phase-1-known-limitations.md`
  - `docs/handoffs/prompt-27-status.md`
  - `docs/handoffs/prompt-28-scope.md`
  - no backend REST routes, frontend routes, Prisma schema changes, business workflows, fake/demo data, dashboards, workflow engines, or output formats were added
- Prompt 28 added only final release packaging, verification summary, and handoff documentation:
  - `docs/release/phase-1-release-notes.md`
  - `docs/release/phase-1-technical-handoff.md`
  - `docs/release/operator-quick-start.md`
  - `docs/release/demo-readiness-guide.md`
  - `docs/release/phase-1-artifact-inventory.md`
  - `docs/release/phase-1-verification-summary.md`
  - `docs/handoffs/prompt-28-status.md`
  - `docs/handoffs/prompt-29-scope.md`
  - no backend REST routes, frontend routes, Prisma schema changes, business workflows, fake/demo data, dashboards, workflow engines, or output formats were added

## Financial Reporting API Rules Now In Effect

- All Prompt 19 financial statements and ledger views are read-only and company-scoped.
- Formal statement data uses `POSTED` vouchers only as the accounting source of truth.
- Business overview reporting supports:
  - `GET /companies/:companyId/accounting/reports/business-overview`
  - `GET /companies/:companyId/accounting/reports/business-overview/export`
  - `dateFrom`
  - `dateTo`
  - optional `bucket=day|week|month|year`
  - contracted sales from sale contracts by contract date
  - collected sales from collections by collection date
  - revenue and expenses from posted voucher lines only
  - net profit/loss as revenue minus expenses
- Trial balance supports:
  - `dateFrom`
  - `dateTo`
  - optional `voucherType`
  - optional `ledgerAccountId`
  - optional `particularAccountId`
- General ledger supports:
  - required `particularAccountId`
  - `dateFrom`
  - `dateTo`
  - optional `voucherType`
  - opening balance before period start
  - period lines with running balance
  - voucher traceability through `voucherId` and `voucherReference`
- Profit & loss derives from the live `REVENUE` and `EXPENSE` chart hierarchy for the requested date range.
- Balance sheet derives from the live `ASSET`, `LIABILITY`, and `EQUITY` hierarchy as of the requested date.
- Because Prompt 6 did not implement year-end closing entries, the balance sheet now includes a derived equity adjustment for unclosed earnings so the statement balances without mutating accounting data.
- Project and cost-center filters are intentionally not exposed in Prompt 19 because posted voucher lines do not carry generic project/cost-center dimensions in the current accounting schema.

## Financial Reporting UI Rules Now In Effect

- The authenticated shell now includes a dedicated `Financial Reports` navigation section with:
  - `Business Overview`
  - `Daily Report`
  - `Weekly Report`
  - `Monthly Report`
  - `Yearly Report`
  - `Trial Balance`
  - `General Ledger`
  - `Profit & Loss`
  - `Balance Sheet`
- All Prompt 20 report pages are frontend-only and consume the Prompt 19 REST endpoints directly from `apps/web`.
- Trial balance page:
  - company-aware date-range filters plus optional voucher-type filter
  - renders opening, movement, and closing debit/credit amounts from the live API
  - keeps the backend hierarchy readable across account class, group, ledger, and posting-account levels
- General ledger page:
  - company-aware posting-account search/select powered by live accounting particular-account data
  - date-range filters plus optional voucher-type filter
  - renders opening balance, period lines, running balance, voucher reference/ID context, and backend validation errors
- Profit & loss page:
  - company-aware date-range filters
  - renders live grouped revenue and expense sections exactly from the backend response contract
  - emphasizes total revenue, total expense, and net profit/loss without adding fake templates
- Balance sheet page:
  - company-aware as-of-date filter
  - renders grouped assets, liabilities, and equity sections from the backend response contract
  - surfaces the backend balance state clearly
  - presents the derived `UNCLOSED_EARNINGS` adjustment explicitly in a dedicated equity-adjustments section instead of hiding it
- Business overview, daily, weekly, monthly, and yearly report pages:
  - company-aware date-range filters plus supported `day`, `week`, `month`, or `year` grouping
  - render contracted sales and collected sales separately from CRM/property data
  - render revenue, expenses, and net profit/loss from posted accounting vouchers only
  - provide executive summary cards, trend charts, operating-count mix, detailed period table, CSV export, print context, and backend calculation assumptions
- Shared Prompt 20 reporting UI infrastructure includes:
  - typed reporting client methods
  - TanStack Query hooks
  - reusable report filter controls
  - reusable hierarchy tables and metric cards
  - clear loading, empty, validation, and API-error states
  - no Next.js server actions or backend proxy routes

## Phase 1 Export And Print Rules Now In Effect

- Supported finance report outputs:
  - business overview: CSV export + browser print-friendly rendering
  - daily report: CSV export + browser print-friendly rendering
  - weekly report: CSV export + browser print-friendly rendering
  - monthly report: CSV export + browser print-friendly rendering
  - yearly report: CSV export + browser print-friendly rendering
  - trial balance: CSV export + browser print-friendly rendering
  - general ledger: CSV export + browser print-friendly rendering
  - profit & loss: CSV export + browser print-friendly rendering
  - balance sheet: CSV export + browser print-friendly rendering
- Supported accounting detail output:
  - voucher detail: CSV export + browser print-friendly rendering
- Supported operational CSV exports:
  - units
  - customers
  - bookings
  - collections
  - employees
  - leave requests
  - payroll runs
  - attachments
  - audit events
- Output behavior constraints:
  - all output actions remain read-only
  - export access follows the same module and role visibility rules as page access
  - browser print hides shell/navigation chrome where practical and preserves company context, report context, and totals
  - CSV headers and column order are now stable for the supported Phase 1 output surfaces
  - client-side paginated exports now stay within the backend list-query page-size contract

## Dashboard & Home UI Rules Now In Effect

- `/dashboard` remains the authenticated landing page for signed-in users.
- The dashboard stays frontend-only and aggregates real backend data by reusing existing REST clients in `apps/web/src/lib/api/dashboard.ts`.
- Dashboard period control is intentionally simple:
  - preset-based
  - defaults to `All activity`
  - financial metrics and recent-count widgets follow the selected reporting window
  - recent activity panels always show the latest available records
- Dashboard summary panels now surface a practical subset of real metrics only:
  - financial summary from Prompt 19 reporting endpoints
  - accounting voucher backlog from the voucher list endpoint
  - project/property inventory counts from unit-status and unit list endpoints
  - CRM booking / contract / collection counts from existing CRM list endpoints
  - HR / payroll workload counts from employee, leave-request, and payroll-run endpoints
  - document / audit counts from attachment and audit-event list endpoints
- Dashboard recent-activity panels now surface live records from existing modules only:
  - recent vouchers
  - recent commercial activity across bookings, sale contracts, and collections
  - recent people operations across leave requests and payroll runs
  - recent document activity across attachments and audit events
- Dashboard pending-work cards now surface only cleanly derived current-state items:
  - draft vouchers
  - available units
  - submitted leave requests
  - finalized payroll runs awaiting posting
  - attachments pending finalize
- Dashboard quick actions use existing routes only and do not create fake create flows or unbuilt destinations.
- Dashboard section failures are surfaced explicitly in the UI without collapsing the entire page.

## Docker Runtime Notes

- Docker Compose remains the canonical local runtime.
- `docker compose up -d --build` now starts release-minded runner containers for `api` and `web`.
- The Compose runtime no longer depends on in-container `pnpm install`, bind-mounted app source, or mounted `.next` artifacts for normal Phase 1 use.
- `api` waits on healthy `postgres` and `minio`; `web` waits on a healthy `api`.
- Compose healthchecks now target:
  - `http://127.0.0.1:3333/api/v1/health/ready` inside the API container
  - `http://127.0.0.1:3000` inside the web container
- The canonical containerized maintenance helpers are:
  - `corepack pnpm docker:migrate`
  - `corepack pnpm docker:bootstrap -- --company-name ...`
- The canonical Phase 1 backup/restore helpers are:
  - `corepack pnpm backup:db`
  - `corepack pnpm verify:backup -- --file backups/postgres/<backup>.dump`
  - `corepack pnpm restore:db -- --file backups/postgres/<backup>.dump --dry-run`
  - `corepack pnpm restore:db -- --file backups/postgres/<backup>.dump --confirm-destroy-data`
  - `corepack pnpm ops:env-check -- --strict`
- The canonical Phase 1 release-candidate references are:
  - `docs/operations/phase-1-route-inventory.md`
  - `docs/operations/phase-1-uat-checklist.md`
  - `docs/operations/phase-1-release-checklist.md`
- Playwright now assembles the standalone Next.js output plus `.next/static` and `public` assets before starting the local verification server, which keeps e2e behavior aligned with the runner image.
- For Prompt 18 document flows, Docker runtime must provide a browser-resolvable `S3_PUBLIC_ENDPOINT`; local Compose uses `http://localhost:9000` while the API keeps using `http://minio:9000` for container-to-container storage access.
- In non-localhost production, browser auth now requires HTTPS because the cookies become `Secure` in `NODE_ENV=production`.

## Verification Completed

```powershell
$env:NX_WORKSPACE_ROOT='C:\Users\wadud\Documents\New project'
corepack pnpm prisma:generate
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
docker compose up -d --build
corepack pnpm docker:migrate
corepack pnpm docker:bootstrap -- --company-name "Real Capita" --company-slug "real-capita" --admin-email "admin@example.com" --admin-password "change-me-secure-admin-password"
corepack pnpm docker:smoke
corepack pnpm backup:db
corepack pnpm verify:backup -- --file backups/postgres/real_capita_erp-20260424T083915Z.dump
corepack pnpm restore:db -- --file backups/postgres/real_capita_erp-20260424T083915Z.dump --dry-run
corepack pnpm ops:smoke
```

Prompt 26 release-candidate verification completed with:

```powershell
corepack pnpm verify
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
docker compose up -d --build
corepack pnpm docker:migrate
corepack pnpm docker:bootstrap -- --company-name "Real Capita" --company-slug "real-capita" --admin-email "admin@example.com" --admin-password "change-me-secure-admin-password"
corepack pnpm docker:smoke
corepack pnpm ops:smoke
corepack pnpm backup:db
corepack pnpm verify:backup -- --file backups/postgres/real_capita_erp-20260424T090724Z.dump
corepack pnpm restore:db -- --file backups/postgres/real_capita_erp-20260424T090724Z.dump --dry-run
corepack pnpm ops:env-check -- --env-file .env.example --allow-placeholders
docker compose ps
```

Live verification completed against the rebuilt running stack for:

- web root and protected-route redirect behavior
- `http://127.0.0.1:3000/dashboard` redirecting to `http://localhost:3000/dashboard`
- API health and readiness
- Swagger
- browser verification on the canonical `http://localhost:3000` origin
- login and company-aware session selection
- authenticated shell rendering
- Prompt 13 accounting route load against the running Compose stack
- Prompt 15 CRM/property desk routes still loading
- Prompt 16 HR routes loading against the running backend
- Prompt 17 payroll routes loading against the running backend
- Prompt 18 audit/document routes loading against the running backend
- Prompt 21 dashboard route loading as the main signed-in landing page on the Compose stack
- Prompt 23 role-aware shell navigation and forbidden-state behavior through Playwright coverage
- Prompt 24 finance output routes exporting CSV and rendering print-friendly output:
  - trial balance
  - general ledger
  - profit & loss
  - balance sheet
- Prompt 24 voucher detail exporting CSV and rendering print-friendly output
- Prompt 24 operational CSV exports completing on the running stack for:
  - units
  - customers
  - bookings
  - collections
  - employees
  - leave requests
  - payroll runs
  - attachments
  - audit events
- cookie-backed browser login into the running `/dashboard` page after container bootstrap
- containerized migration helper completing cleanly against the running Compose database
- containerized bootstrap helper completing cleanly against the running Compose database
- Prompt 25 PostgreSQL backup creation against the running Compose database
- Prompt 25 backup verification confirming a non-empty dump and `pg_restore --list` metadata
- Prompt 25 restore dry-run completing without database mutation
- Prompt 25 restore refusal behavior without `--confirm-destroy-data`
- API health, Swagger, and web root returning HTTP `200` after the Prompt 25 Compose rebuild
  - Prompt 26 live release-candidate smoke against the rebuilt Docker stack:
  - API liveness, readiness, and Swagger returned HTTP `200`
  - browser admin login reached `/dashboard`
  - representative module pages loaded for accounting, financial reports, project/property, CRM/property desk, HR, payroll, audit/documents, and org/security
  - trial balance CSV export completed
  - trial balance print action invoked browser print
  - controlled UAT-only role users verified representative admin, accountant, HR, payroll, sales, and member access behavior
  - the live admin data set had one active company assignment, so the multi-company selector branch did not appear live; existing Playwright coverage and UAT guidance cover the selector branch when a multi-company user exists

Prompt 28 release-packaging verification completed with:

```powershell
corepack pnpm verify
git status --short
Get-ChildItem -File -LiteralPath docs/release
```

Observed result on April 28, 2026:

- `corepack pnpm verify` passed.
- lint completed with pre-existing warnings only.
- typecheck passed.
- build passed.
- API tests passed: 154.
- Playwright e2e tests passed: 45.
- final release docs are visible under `docs/release`.
- local markdown links in the new release and handoff docs resolved.
- no destructive restore was run.

Prompt 29 deployment/tag handoff verification completed with:

```powershell
git status --short
corepack pnpm verify
docker compose up -d --build
corepack pnpm docker:migrate
corepack pnpm docker:smoke
corepack pnpm backup:db
corepack pnpm verify:backup -- --file backups/postgres/real_capita_erp-20260425T142454Z.dump
corepack pnpm restore:db -- --file backups/postgres/real_capita_erp-20260425T142454Z.dump --dry-run
```

Observed result:

- initial `git status --short` was clean.
- `HEAD` matched `c04c93e5874f369b3bb47721e0c98bdcbd2b2532`.
- `corepack pnpm verify` passed.
- lint completed with pre-existing warnings only.
- typecheck passed.
- build passed.
- API tests passed: 154.
- Playwright e2e tests passed: 45.
- Docker Compose rebuilt and started the release-minded stack.
- `corepack pnpm docker:migrate` completed with no pending migrations.
- `corepack pnpm docker:smoke` passed.
- backup `backups/postgres/real_capita_erp-20260425T142454Z.dump` was created and verified.
- restore dry-run completed without database mutation.
- no destructive restore was run.
- no production deployment or release tag was created.
- final post-documentation `corepack pnpm verify` also passed.

Prompt 31 analytics verification completed with:

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

- lint passed with pre-existing warnings only.
- typecheck passed.
- build passed.
- API and Playwright tests passed.
- Docker Compose rebuilt and started successfully.
- `corepack pnpm docker:migrate` completed with no pending migrations.
- `corepack pnpm seed:demo` and `corepack pnpm seed:demo:verify` completed successfully for `Real Capita Demo / UAT`.
- `corepack pnpm docker:smoke` passed for web, API readiness, and Swagger.
- Live browser verification confirmed seeded Demo/UAT analytics on `/dashboard` plus representative accounting, financial reporting, property, CRM, HR, payroll, and audit/document pages.

Prompt 32 Professional Analytics + Periodic Business Reports verification was re-run on April 27, 2026 with:

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
- `corepack pnpm test` passed: 160 API tests and 52 Playwright e2e tests passed.
- Docker Compose rebuilt and started successfully.
- `corepack pnpm docker:migrate` completed with no pending migrations.
- `corepack pnpm seed:demo` and `corepack pnpm seed:demo:verify` completed successfully for `Real Capita Demo / UAT`.
- `corepack pnpm docker:smoke` passed for web, API readiness, and Swagger.
- Live browser verification confirmed the dashboard analytics, business overview report, daily report, weekly report, monthly report, profit & loss report, balance sheet equity/unclosed-earnings reporting, CRM collections charts, payroll charts, and audit/document analytics at 1440px, 1366px, and 1024px widths without global horizontal overflow, clipped numbers, or vertical word wrapping.

Prompt 33 RCG Context-Aligned Synthetic Demo/UAT Data Upgrade verification should be run with:

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

Observed result:

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

Prompt 34 UI/UX Audit + ERP Design System Foundation verification was run on April 30, 2026 with:

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
docker compose up -d --build
corepack pnpm seed:demo
corepack pnpm seed:demo:verify
corepack pnpm docker:smoke
```

Observed result:

- `corepack pnpm lint` passed with pre-existing warnings only.
- `corepack pnpm typecheck` passed.
- `corepack pnpm build` passed.
- `corepack pnpm test` passed: 160 API tests and 52 Playwright e2e tests.
- Docker Compose rebuilt and started successfully.
- `corepack pnpm seed:demo` and `corepack pnpm seed:demo:verify` completed successfully for `Real Capita Demo / UAT`.
- `corepack pnpm docker:smoke` passed for web, API readiness, and Swagger.
- Authenticated visual spot-check passed for dashboard, business overview, balance sheet, CRM bookings, and HR employees with no global horizontal overflow.

Prompt 35 App Shell + Navigation + Page Layout Redesign verification was run on April 30, 2026 with:

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
docker compose up -d --build
corepack pnpm seed:demo
corepack pnpm seed:demo:verify
corepack pnpm docker:smoke
```

Observed result:

- `corepack pnpm lint` passed with pre-existing warnings only.
- `corepack pnpm typecheck` passed.
- `corepack pnpm build` passed.
- `corepack pnpm test` passed: 160 API tests and 52 Playwright e2e tests.
- `docker compose up -d --build` completed successfully after a transient stale app-container conflict from an earlier timed-out build resolved through a clean rerun; the rebuilt `api` and `web` containers started healthy.
- `corepack pnpm seed:demo` completed for `Real Capita Demo / UAT`.
- `corepack pnpm seed:demo:verify` passed, including RCG context coverage, synthetic safeguards, status coverage, voucher balance, and report readiness checks.
- `corepack pnpm docker:smoke` passed for web, API readiness, and Swagger.
- Authenticated live width verification passed at 1440px, 1366px, and 1024px for `/dashboard`, `/accounting/reports/business-overview`, `/accounting/reports/trial-balance`, `/accounting/reports/balance-sheet`, `/project-property/projects`, `/crm-property-desk/customers`, `/hr/employees`, `/payroll/runs`, and `/audit-documents/audit-events`.
- The live width check found no global horizontal overflow, no sidebar/content overlap, no vertical nav-label wrapping, exactly one active nav item per route, and a compact workspace header on each checked route.
- Visual check screenshots were written under `test-results/prompt-35-visual-check`.

Prompt 36 Professional Chart Component System verification was run on May 1, 2026 with:

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
docker compose up -d --build
corepack pnpm seed:demo
corepack pnpm seed:demo:verify
corepack pnpm docker:smoke
```

Observed result:

- `corepack pnpm lint` passed with pre-existing warnings only.
- `corepack pnpm typecheck` passed.
- `corepack pnpm build` passed.
- `corepack pnpm test` passed: 160 API tests and 52 Playwright e2e tests.
- `docker compose up -d --build` completed successfully, and the rebuilt `api` and `web` containers started healthy.
- `corepack pnpm seed:demo` completed for `Real Capita Demo / UAT`.
- `corepack pnpm seed:demo:verify` passed, including RCG context coverage, synthetic safeguards, status coverage, voucher balance, and report readiness checks.
- `corepack pnpm docker:smoke` passed for web, API readiness, and Swagger.
- Authenticated live chart verification passed at 1440px, 1366px, and 1024px for `/dashboard`, `/accounting/reports/business-overview`, `/accounting/reports/balance-sheet`, `/project-property/projects`, `/crm-property-desk/collections`, `/hr/employees`, `/payroll/runs`, and `/audit-documents/audit-events`.
- The live chart check found no global horizontal overflow, no clipped numeric values, and visible chart or chart-state roles on every checked route.

## Current Local URLs

- Web: `http://localhost:3000`
- Canonical local browser origin: `http://localhost:3000`
- Non-canonical local browser origin: `http://127.0.0.1:3000` redirects to the canonical localhost origin
- API: `http://localhost:3333`
- API auth login: `http://localhost:3333/api/v1/auth/login`
- API current user: `http://localhost:3333/api/v1/auth/me`
- Swagger: `http://localhost:3333/api/docs`
- API liveness: `http://localhost:3333/api/v1/health`
- API readiness: `http://localhost:3333/api/v1/health/ready`
- PostgreSQL: `localhost:5432`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`

## Final Status

Backend foundations through Prompt 11 remain intact. Prompt 12 established the authenticated frontend shell and Org & Security baseline, Prompt 13 added the Accounting Core UI, Prompt 14 added the Project & Real-Estate Master UI, Prompt 15 added the frontend CRM & Property Desk operational UI, Prompt 16 added the frontend HR Core operational UI, Prompt 17 added the frontend Payroll Core operational UI, Prompt 18 added the frontend Audit & Documents operational UI, Prompt 19 added the backend financial reporting API, Prompt 20 added the frontend financial reporting UI, Prompt 21 added the frontend operational dashboard/home experience, Prompt 22 hardened runtime, origin, Docker Compose, CI, and deployment reliability, Prompt 23 hardened backend authorization consistency plus role-aware frontend navigation, route gating, forbidden UX, and dashboard visibility, Prompt 24 added Phase 1 export + print readiness, Prompt 25 added Phase 1 PostgreSQL backup/restore plus operations-readiness runbooks, Prompt 26 completed the Phase 1 release-candidate audit plus UAT/release documentation, Prompt 27 added the Phase 1 UAT, stakeholder demo, issue-log, known-limitations, sign-off, and handoff documentation package, Prompt 28 added the final Phase 1 release packaging and handoff bundle, Prompt 29 completed final deployment/tag/release handoff verification and documentation, Prompt 30 added the explicit synthetic demo/UAT seed, reset, and verify foundation, Prompt 31 added frontend-only analytics, graphs, and status summaries over existing REST data without breaking the locked architecture or adding new business workflows, Prompt 32 added professional analytics plus daily/weekly/monthly business reporting over existing posted accounting and CRM/property data without adding transactional workflows, Prompt 33 upgraded the existing seed into RCG context-aligned synthetic demo/UAT data while preserving the locked architecture and synthetic-only safeguards, Prompt 34 added the frontend-only ERP design-system foundation for stronger visual contrast, typography, cards, tables, analytics shells, and report primitives without redesigning every page, Prompt 35 completed the frontend-only app shell, navigation, page-frame, and responsive layout redesign while preserving existing REST boundaries, role-aware access, CSV export, and print behavior, Prompt 36 completed the frontend-only professional chart component system plus representative chart replacements over existing REST data and calculations, and Prompt 37 completed the finance-grade Financial Reports Redesign plus the missing yearly report over the existing read-only reporting boundary. The repo is ready for Prompt 38 as Operational Module Analytics Redesign.
