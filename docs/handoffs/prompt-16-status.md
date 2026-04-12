# Prompt 16 Status

## Scope Delivered

Prompt 16 delivered the production-grade frontend HR Core operational slice on top of the Prompt 12 shell/auth foundation, the Prompt 13 accounting UI, the Prompt 14 project/property master UI, and the Prompt 15 CRM/property desk UI:

- HR navigation in the authenticated app shell
- employees UI for list, create/edit, filtering, pagination, linked references, and activate/deactivate
- attendance devices UI for list, create/edit, filtering, and activate/deactivate
- device mappings UI for list, create/edit, filtering, and activate/deactivate
- attendance logs UI for list, filters, detail, manual entry, and bulk ingest
- leave types UI for list, create/edit, filtering, and activate/deactivate
- leave requests UI for list, detail, create, safe draft edits, and submit/approve/reject/cancel actions
- reusable HR API client methods, TanStack Query hooks, shared table/filter/page primitives, and disciplined form handling
- Playwright coverage for protected routing, employee smoke, device mapping smoke, attendance log filtering smoke, leave request lifecycle smoke, and backend error surfacing
- handoff docs updated for Prompt 17 continuity

## Frontend Routes Added

- `/hr/employees`
- `/hr/attendance-devices`
- `/hr/device-mappings`
- `/hr/attendance-logs`
- `/hr/leave-types`
- `/hr/leave-requests`

## Frontend Infrastructure Added

- HR API/data layer:
  - typed HR REST client in `apps/web/src/lib/api/hr-core.ts`
  - HR record, query, and payload types in `apps/web/src/lib/api/types.ts`
  - query keys, query hooks, mutations, and invalidation patterns in `apps/web/src/features/hr-core/hooks.ts`
- Shared HR UI patterns:
  - section headers, filter cards, status badges, read-only notices, relation summaries, and query-error banners in `apps/web/src/features/hr-core/shared.tsx`
  - shared employee/device/mapping/log/leave forms and dependent-select logic in `apps/web/src/features/hr-core/forms.tsx`
  - shared normalization, labels, pagination defaults, and formatting helpers in `apps/web/src/features/hr-core/utils.ts`
- Route and shell integration:
  - HR route constants in `apps/web/src/lib/routes.ts`
  - HR navigation in `apps/web/src/features/shell/app-shell.tsx`
  - `/hr/**` route protection in `apps/web/src/proxy.ts`
  - HR access visibility in `apps/web/src/components/providers/auth-provider.tsx`

## HR UX In This Phase

- Employees:
  - create/edit happens in a side panel with department, location, linked user, and manager selectors
  - tables keep employee code, name, department, location, linked user, manager, and active state visible
  - backend hierarchy and company-mismatch errors surface directly in form-level error banners
- Attendance devices:
  - create/edit happens in a side panel with visible location context
  - tables keep device code, name, location, description, and active state visible
  - duplicate code conflicts surface directly in form-level error banners
- Device mappings:
  - create/edit happens in a side panel with safe dependent employee and device selectors
  - tables keep employee, device, device employee code, location, and active state visible together
  - duplicate or ambiguous mapping conflicts surface directly in form-level error banners
- Attendance logs:
  - list supports employee, device, location, direction, and date filtering
  - manual entry and bulk ingest both stay scoped to existing active device mappings
  - detail view keeps employee, device, location, mapping code, direction, and external log ID visible together
- Leave types:
  - create/edit happens in a side panel with clear code/name/description validation
  - list keeps code, name, description, and active state visible
  - duplicate code or name conflicts surface directly in form-level error banners
- Leave requests:
  - create and safe draft edit use employee, leave type, and date-range inputs with context summaries
  - detail view keeps employee, department, location, leave type, date range, status, reason, and decision note visible
  - draft requests can be updated and submitted
  - submitted requests can be approved, rejected, or cancelled
  - approved, rejected, and cancelled requests are protected read-only in this phase

## Backend Compatibility Tweaks Made

- Added a dedicated HR-scoped reference controller and service surface so `company_admin` and `company_hr` users can load selector data without going through unrelated Org & Security admin routes:
  - `GET /companies/:companyId/hr/references/departments`
  - `GET /companies/:companyId/hr/references/locations`
  - `GET /companies/:companyId/hr/references/users`
- No Prisma schema changes were made.
- No backend HR business-logic redesign was made.

## Files Added Or Materially Updated

- Frontend routes:
  - `apps/web/src/app/(app)/hr/employees/page.tsx`
  - `apps/web/src/app/(app)/hr/attendance-devices/page.tsx`
  - `apps/web/src/app/(app)/hr/device-mappings/page.tsx`
  - `apps/web/src/app/(app)/hr/attendance-logs/page.tsx`
  - `apps/web/src/app/(app)/hr/leave-types/page.tsx`
  - `apps/web/src/app/(app)/hr/leave-requests/page.tsx`
- HR feature slice:
  - `apps/web/src/features/hr-core/employees-page.tsx`
  - `apps/web/src/features/hr-core/attendance-devices-page.tsx`
  - `apps/web/src/features/hr-core/device-mappings-page.tsx`
  - `apps/web/src/features/hr-core/attendance-logs-page.tsx`
  - `apps/web/src/features/hr-core/leave-types-page.tsx`
  - `apps/web/src/features/hr-core/leave-requests-page.tsx`
  - `apps/web/src/features/hr-core/forms.tsx`
  - `apps/web/src/features/hr-core/hooks.ts`
  - `apps/web/src/features/hr-core/shared.tsx`
  - `apps/web/src/features/hr-core/utils.ts`
- Shared frontend integration:
  - `apps/web/src/lib/api/hr-core.ts`
  - `apps/web/src/lib/api/types.ts`
  - `apps/web/src/lib/routes.ts`
  - `apps/web/src/components/providers/auth-provider.tsx`
  - `apps/web/src/features/shell/app-shell.tsx`
  - `apps/web/src/proxy.ts`
- Backend compatibility surface:
  - `apps/api/src/app/hr/hr-references.controller.ts`
  - `apps/api/src/app/hr/hr-references.service.ts`
  - `apps/api/src/app/hr/hr.module.ts`
- Tests:
  - `tests/e2e/hr-core.spec.ts`
  - `apps/api/src/app/auth/auth.service.spec.ts` for date-stable refresh-token test fixtures required by the repo-wide validation suite

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
- `corepack pnpm test` passed, including the new HR Core Playwright coverage.
- `docker compose up -d --build` completed with healthy `postgres`, `minio`, `api`, and `web` services.
- `GET http://localhost:3333/api/v1/health` returned `200`.
- `GET http://localhost:3333/api/v1/health/ready` returned `200`.
- `GET http://localhost:3333/api/docs` returned `200`.
- `GET http://localhost:3000/hr/employees` returned `307` to `/login?next=%2Fhr%2Femployees` for an unauthenticated browser.
- Live browser verification against `http://localhost:3000` succeeded for:
  - login and explicit company selection with the existing auth/session flow
  - HR navigation visibility in the authenticated shell
  - all six HR routes loading against the running backend
  - employees, attendance devices, device mappings, attendance logs, leave types, and leave requests create surfaces opening with hydrated live selectors
  - attendance log detail and leave request detail surfaces opening against real backend records in the main company
- Additional isolated live verification against the dedicated company `Real Capita UI Verify 20260317011357` succeeded for:
  - employee create
  - attendance device create
  - device mapping create
  - attendance log manual create
  - leave type create
  - leave request create
  - leave request submit

## Out Of Scope And Still Not Built

- payroll run UI
- payroll posting UI
- payslip or bank export UI
- accounting report screens
- CRM/property screens beyond Prompt 15
- document management screens
- fake/demo data
- Next.js backend routes or server actions for business operations

## Prompt 17 Readiness

Prompt 16 is complete. The repo now has the minimum production-grade frontend HR Core operational UI needed to operate the existing backend HR module through the locked REST boundary while preserving the Prompt 12 through Prompt 15 foundations. Prompt 17 should build the next explicitly approved frontend slice without reworking auth/session, accounting, CRM/property desk, or the new HR Core operational flows.
