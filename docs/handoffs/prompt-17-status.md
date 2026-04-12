# Prompt 17 Status

## Scope Delivered

Prompt 17 delivered the production-grade frontend Payroll Core operational slice on top of the Prompt 12 shell/auth foundation, the Prompt 13 accounting UI, the Prompt 14 project/property master UI, the Prompt 15 CRM/property desk UI, and the Prompt 16 HR Core UI:

- Payroll navigation in the authenticated app shell
- salary structures UI for list, create/edit, filtering, pagination, and activate/deactivate
- payroll runs UI for list, create/edit, filtering, status visibility, and safe draft updates
- payroll run detail UI for scope summary, totals, lifecycle actions, and line editing
- payroll run lines UI for list, create/edit/remove, employee selection, and explicit amount visibility
- payroll posting UI from both payroll run detail and the dedicated posting workspace
- reusable payroll API client methods, TanStack Query hooks, shared payroll table/filter/page primitives, and disciplined form handling
- Playwright coverage for protected routing, salary structure smoke, payroll run/detail smoke, payroll line smoke, payroll posting smoke, and backend error surfacing
- handoff docs updated for Prompt 18 continuity

## Frontend Routes Added

- `/payroll/salary-structures`
- `/payroll/runs`
- `/payroll/runs/[payrollRunId]`
- `/payroll/posting`

## Frontend Infrastructure Added

- Payroll API/data layer:
  - typed payroll REST client in `apps/web/src/lib/api/payroll.ts`
  - payroll record, query, and payload types in `apps/web/src/lib/api/types.ts`
  - query keys, query hooks, mutations, and invalidation patterns in `apps/web/src/features/payroll-core/hooks.ts`
- Shared payroll UI patterns:
  - section headers, filter cards, status badges, read-only notices, relation summaries, and query-error banners in `apps/web/src/features/payroll-core/shared.tsx`
  - shared salary structure, payroll run, payroll line, and payroll posting forms in `apps/web/src/features/payroll-core/forms.tsx`
  - shared normalization, labels, pagination defaults, posting helpers, and amount preview helpers in `apps/web/src/features/payroll-core/utils.ts`
- Route and shell integration:
  - payroll route constants in `apps/web/src/lib/routes.ts`
  - payroll navigation in `apps/web/src/features/shell/app-shell.tsx`
  - `/payroll/**` route protection in `apps/web/src/proxy.ts`
  - payroll access visibility in `apps/web/src/components/providers/auth-provider.tsx`

## Payroll UX In This Phase

- Salary structures:
  - create/edit happens in a side panel with explicit code, name, description, and amount fields
  - net amount stays derived from basic, allowance, and deduction inputs
  - duplicate code and duplicate name conflicts surface directly in form-level error banners
- Payroll runs:
  - create/edit happens in a side panel with year, month, project, cost center, and description fields
  - tables keep payroll period, scope, state, totals, and posting linkage visible together
  - finalized, cancelled, and posted states are clearly labeled and protected in the UI
- Payroll run lines:
  - create/edit happens in a side panel with company-scoped employee selection and explicit amount fields
  - employee selection locks after line creation
  - tables keep basic, allowance, deduction, and net values visible together
  - duplicate employee entries and invalid amount combinations surface directly in form-level error banners
- Payroll posting:
  - posting stays explicit from payroll run detail and the dedicated posting workspace
  - the current backend contract requires caller-selected gross expense and payroll payable accounts plus a deduction liability account when deductions are present
  - posted voucher linkage becomes visible after success and reposting stays blocked in the UI

## Backend Compatibility Tweaks Made

- Added a dedicated payroll-scoped reference controller and service surface so payroll users can load selector data without going through unrelated project/property, HR, or accounting routes:
  - `GET /companies/:companyId/payroll/references/projects`
  - `GET /companies/:companyId/payroll/references/cost-centers`
  - `GET /companies/:companyId/payroll/references/employees`
  - `GET /companies/:companyId/payroll/references/particular-accounts`
- No Prisma schema changes were made.
- No backend payroll business-logic redesign was made.

## Files Added Or Materially Updated

- Frontend routes:
  - `apps/web/src/app/(app)/payroll/salary-structures/page.tsx`
  - `apps/web/src/app/(app)/payroll/runs/page.tsx`
  - `apps/web/src/app/(app)/payroll/runs/[payrollRunId]/page.tsx`
  - `apps/web/src/app/(app)/payroll/posting/page.tsx`
- Payroll feature slice:
  - `apps/web/src/features/payroll-core/salary-structures-page.tsx`
  - `apps/web/src/features/payroll-core/payroll-runs-page.tsx`
  - `apps/web/src/features/payroll-core/payroll-run-detail-page.tsx`
  - `apps/web/src/features/payroll-core/payroll-posting-page.tsx`
  - `apps/web/src/features/payroll-core/forms.tsx`
  - `apps/web/src/features/payroll-core/hooks.ts`
  - `apps/web/src/features/payroll-core/shared.tsx`
  - `apps/web/src/features/payroll-core/utils.ts`
- Shared frontend integration:
  - `apps/web/src/lib/api/payroll.ts`
  - `apps/web/src/lib/api/types.ts`
  - `apps/web/src/lib/routes.ts`
  - `apps/web/src/components/providers/auth-provider.tsx`
  - `apps/web/src/features/shell/app-shell.tsx`
  - `apps/web/src/proxy.ts`
- Backend compatibility surface:
  - `apps/api/src/app/payroll/payroll-references.controller.ts`
  - `apps/api/src/app/payroll/payroll-references.service.ts`
  - `apps/api/src/app/payroll/payroll.module.ts`
- Tests:
  - `tests/e2e/payroll-core.spec.ts`

## Verification Commands

```powershell
$env:NX_WORKSPACE_ROOT='C:\Users\wadud\Documents\New project'
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
docker compose up -d --build
corepack pnpm auth:bootstrap -- --company-name "Real Capita" --company-slug "real-capita" --admin-email "admin@example.com" --admin-password "change-me-secure-admin-password"
```

## Verified Runtime Behavior

- `corepack pnpm lint` passed.
- `corepack pnpm typecheck` passed.
- `corepack pnpm build` passed.
- `corepack pnpm test` passed, including the new Payroll Core Playwright coverage.
- `docker compose up -d --build` completed with healthy `postgres`, `minio`, `api`, and `web` services.
- `GET http://localhost:3333/api/v1/health` returned `200`.
- `GET http://localhost:3333/api/docs` returned `200`.
- `GET http://localhost:3000/login` returned `200`.
- Browser verification used the canonical `http://localhost:3000` origin; `http://127.0.0.1:3000` is not interchangeable for auth flows in the current local stack because the running API CORS configuration is aligned with the documented localhost origin.
- Live browser verification against `http://localhost:3000` succeeded for:
  - login plus explicit company selection for the `Real Capita` company
  - salary structures route load plus live salary structure create (`P17LIVE734426`)
  - payroll runs route load plus payroll run detail hydration against an existing draft run
  - payroll posting route load plus explicit posting of an existing finalized run, resulting in voucher reference `PAYROLL-2099-10`

## Out Of Scope And Still Not Built

- payslip PDF UI
- bank payout/export UI
- tax engine UI
- accounting report screens
- CRM/property screens beyond Prompt 15
- HR screens beyond Prompt 16
- document management screens
- fake/demo data
- Next.js backend routes or server actions for business operations

## Prompt 18 Readiness

Prompt 17 is complete. The repo now has the minimum production-grade frontend Payroll Core operational UI needed to operate the existing backend payroll module through the locked REST boundary while preserving the Prompt 12 through Prompt 16 foundations. Prompt 18 should build the next explicitly approved frontend slice without reworking auth/session, accounting, project/property, CRM/property desk, HR Core, or the new Payroll Core operational flows.
