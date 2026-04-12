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
- `apps/web` now contains the frontend slices delivered through Prompt 20:
  - Prompt 12 authenticated shell, login/logout/session UX, and Org & Security UI
  - Prompt 13 accounting chart-of-accounts and voucher UI
  - Prompt 14 project/property master UI
  - Prompt 15 CRM/property desk UI
  - Prompt 16 HR Core UI
  - Prompt 17 Payroll Core UI
  - Prompt 18 Audit & Documents UI for attachments and audit events
  - Prompt 20 Financial Reporting UI for trial balance, general ledger, profit & loss, and balance sheet
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
- The repo is now ready for Prompt 21.

## Frontend Routes

- `/login`
- `/dashboard`
- `/org-security/companies`
- `/org-security/locations`
- `/org-security/departments`
- `/org-security/users`
- `/org-security/role-assignments`
- `/accounting/chart-of-accounts`
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
    ui/                   reusable shell/table/form primitives
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
    routes.ts             canonical web routes
```

## Auth And Session Rules Now In Effect

- The browser stays frontend-only. All business operations still go directly to the NestJS REST API.
- The web app uses cookie-backed auth compatibility with the existing backend token model:
  - backend still returns access/refresh tokens in the login/refresh payloads
  - backend also sets/clears `rc_access_token` and `rc_refresh_token` httpOnly cookies for browser-safe session continuity
- The frontend query layer sends credentialed requests and retries once through `POST /api/v1/auth/refresh` on eligible `401` responses.
- Protected route gating happens in `apps/web/src/proxy.ts` using the auth cookies:
  - `/dashboard`, `/org-security/**`, `/accounting/**`, `/project-property/**`, `/crm-property-desk/**`, `/hr/**`, `/payroll/**`, and `/audit-documents/**` redirect unauthenticated requests to `/login?next=...`
  - `/` redirects to `/dashboard` or `/login`
- The login UX keeps the multi-company branch exposed by the backend:
  - first login attempt may return `400` with `details.availableCompanies`
  - the UI renders a company selector
  - the second login submits the selected `companyId`

## Frontend Access Rules Now In Effect

- Org & Security navigation remains aligned with the existing Prompt 12 admin access rules.
- Financial report navigation is visible to users with backend-supported accounting access for the selected company:
  - `company_admin`
  - `company_accountant`
- CRM/property desk navigation remains aligned with the existing Prompt 15 access rules, primarily `company_admin` and `company_sales`.
- HR navigation is visible to users with backend-supported HR access for the selected company:
  - `company_admin`
  - `company_hr`
- Payroll navigation is visible to users with backend-supported payroll access for the selected company:
  - `company_admin`
  - `company_hr`
  - `company_payroll`
- Document navigation is visible to users with backend-supported document access for the selected company:
  - `company_admin`
  - `company_accountant`
  - `company_hr`
  - `company_payroll`
  - `company_sales`
- Audit event navigation is limited to:
  - `company_admin`

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

## Financial Reporting API Rules Now In Effect

- All Prompt 19 financial statements and ledger views are read-only and company-scoped.
- Formal statement data uses `POSTED` vouchers only as the accounting source of truth.
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
- Shared Prompt 20 reporting UI infrastructure includes:
  - typed reporting client methods
  - TanStack Query hooks
  - reusable report filter controls
  - reusable hierarchy tables and metric cards
  - clear loading, empty, validation, and API-error states
  - no Next.js server actions or backend proxy routes

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
- Web container startup runs Next from `apps/web` directly so App Router proxy/module resolution works reliably in the monorepo.
- Web container startup clears the contents of the mounted `apps/web/.next` cache before launching `next dev`, which prevents stale App Router route manifests from causing docker-only `404` responses on newly added routes.
- API container startup uses a deterministic `pnpm build:api && node dist/apps/api/main.js` path inside Docker Compose.
- `.dockerignore` ignores nested `node_modules`, nested `.next`, nested `.nx`, and `.pnpm-store`, which prevents broken Windows package links from polluting Docker build contexts.
- For Prompt 18 document flows, Docker runtime must provide a browser-resolvable `S3_PUBLIC_ENDPOINT`; the compose default now uses `http://localhost:9000` so direct-upload and secure-download links work from the host browser while the API keeps using `http://minio:9000` for container-to-container storage access.

## Verification Completed

```powershell
$env:NX_WORKSPACE_ROOT='C:\Users\wadud\Documents\New project'
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
docker compose up -d --build
corepack pnpm auth:bootstrap -- --company-name "Real Capita" --company-slug "real-capita" --admin-email "admin@example.com" --admin-password "change-me-secure-admin-password"
```

Live verification completed against the rebuilt running stack for:

- web root and protected-route redirect behavior
- API health and readiness
- Swagger
- browser verification on the canonical `http://localhost:3000` origin
- login and company-aware session selection
- authenticated shell rendering
- Prompt 15 CRM/property desk routes still loading
- Prompt 16 HR routes loading against the running backend
- Prompt 17 payroll routes loading against the running backend
- live audit/document browser verification in the main `Real Capita` company for:
  - protected-route redirect to login
  - login plus explicit company selection on `http://localhost:3000`
  - attachments list route load
  - secure upload intent plus direct browser upload to MinIO
  - upload finalization through the NestJS API
  - attachment detail load
  - normalized company-link creation
  - secure download URL generation and retrieval
  - attachment link archive
  - attachment archive
  - audit event list filters plus audit event detail panel
- live payroll browser verification in the main `Real Capita` company for:
  - login and explicit company selection on `http://localhost:3000`
  - salary structures route load plus live salary structure create (`P17LIVE734426`)
  - payroll runs route load plus live payroll run detail hydration against an existing draft run
  - payroll posting route load plus explicit posting of an existing finalized run, resulting in voucher reference `PAYROLL-2099-10`
- live Prompt 19 backend verification in the main `Real Capita` company for:
  - login and explicit company selection through `POST /api/v1/auth/login`
  - Swagger JSON inclusion for all four `/api/v1/companies/{companyId}/accounting/reports/*` routes
  - trial balance response over posted live data
  - general ledger response over a live posting account returned by the trial balance
  - profit & loss response over live posted data
  - balance sheet response over live posted data with `isBalanced=true`
- live Prompt 20 browser verification on the canonical `http://localhost:3000` origin in the main `Real Capita` company for:
  - login plus explicit company selection
  - financial report navigation visibility in the authenticated shell
  - trial balance page load over live posted data using a wide date range
  - general ledger page load over a live posting account returned by the trial balance (`PARAST185933`)
  - profit & loss page load over live posted data
  - balance sheet page load with `isBalanced=true` and explicit `UNCLOSED_EARNINGS` disclosure
- live Prompt 21 browser verification on the canonical `http://localhost:3000` origin in the main `Real Capita` company for:
  - login plus explicit company selection
  - dashboard route load as the main signed-in landing page
  - operational summary panels rendering from live REST-backed data
  - recent-activity widgets rendering
  - pending-work cards rendering
  - quick-action links navigating into existing module routes
  - dashboard error-state surfacing still preserving page usability

## Current Local URLs

- Web: `http://localhost:3000`
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

Backend foundations through Prompt 11 remain intact. Prompt 12 established the authenticated frontend shell and Org & Security baseline, Prompt 13 added the Accounting Core UI, Prompt 14 added the Project & Real-Estate Master UI, Prompt 15 added the frontend CRM & Property Desk operational UI, Prompt 16 added the frontend HR Core operational UI, Prompt 17 added the frontend Payroll Core operational UI, Prompt 18 added the frontend Audit & Documents operational UI, Prompt 19 added the backend financial reporting API, Prompt 20 added the frontend financial reporting UI, and Prompt 21 added the frontend operational dashboard/home experience without breaking the locked architecture. The repo is ready for Prompt 22.
