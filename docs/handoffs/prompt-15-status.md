# Prompt 15 Status

## Scope Delivered

Prompt 15 delivered the production-grade frontend CRM & Property Desk operational slice on top of the Prompt 12 shell/auth foundation, the Prompt 13 accounting UI, and the Prompt 14 project/property master UI:

- CRM/property desk navigation in the authenticated app shell
- customers UI for list, create/edit, filtering, search, pagination, and activate/deactivate
- leads UI for list, create/edit, filtering, search, project/status filtering, and activate/deactivate
- bookings UI for list, detail-backed safe edit, create, and linked customer/project/unit context
- sale contracts UI for list, detail-backed metadata edit, and create from an existing booking
- installment schedules UI for list, contract-context filtering, create rows, safe edit, and safe delete
- collections UI for list, detail, create, and explicit voucher/booking/contract/installment linkage
- reusable CRM/property desk API client methods, TanStack Query hooks, shared table/filter/page primitives, and disciplined form handling
- Playwright coverage for route protection, customers/leads smoke, booking flow smoke, contract creation flow smoke, installment schedule CRUD smoke, collection linkage smoke, and backend error surfacing
- handoff docs updated for Prompt 16 continuity

## Frontend Routes Added

- `/crm-property-desk/customers`
- `/crm-property-desk/leads`
- `/crm-property-desk/bookings`
- `/crm-property-desk/sale-contracts`
- `/crm-property-desk/installment-schedules`
- `/crm-property-desk/collections`

## Frontend Infrastructure Added

- CRM/property desk API/data layer:
  - typed CRM/property desk REST client in `apps/web/src/lib/api/crm-property-desk.ts`
  - CRM/property desk record, query, and payload types in `apps/web/src/lib/api/types.ts`
  - query keys, query hooks, mutations, and invalidation patterns in `apps/web/src/features/crm-property-desk/hooks.ts`
- Shared CRM/property desk UI patterns:
  - section headers, filter cards, status badges, access-required state, and query-error banners in `apps/web/src/features/crm-property-desk/shared.tsx`
  - shared customer/lead/booking/contract/schedule/collection forms and dependent-select logic in `apps/web/src/features/crm-property-desk/forms.tsx`
  - shared normalization, labels, and formatting helpers in `apps/web/src/features/crm-property-desk/utils.ts`
- Shell and route integration:
  - CRM/property desk route constants in `apps/web/src/lib/routes.ts`
  - CRM/property desk navigation in `apps/web/src/features/shell/app-shell.tsx`
  - `/crm-property-desk/**` route protection in `apps/web/src/proxy.ts`
  - CRM/property desk access visibility derived from the existing auth/session provider
- Docker/runtime compatibility:
  - mounted `apps/web/.next` cache is cleared before the dockerized `next dev` startup so newly added App Router routes do not get stuck behind stale route manifests

## Booking, Contract, Schedule, And Collection UX In This Phase

- Bookings:
  - create flow uses active customers plus CRM-scoped project/unit references
  - project and unit context is rendered directly in list rows and detail
  - existing bookings only expose safe notes updates
  - backend unit-allocation errors are surfaced directly in the panel
- Sale contracts:
  - create flow is explicitly anchored to an existing booking selector
  - customer/project/unit context is rendered directly in list rows and detail
  - backend state-machine errors are surfaced directly in the panel
- Installment schedules:
  - create flow supports multi-row entry against a selected sale contract
  - list rows show contract/customer/unit context, sequence number, due date, amount, collected amount, and balance
  - backend restrictions on edit/delete after linked collections are surfaced directly in the UI
- Collections:
  - create flow requires a posted voucher and supports optional booking, contract, and installment linkage
  - table rows and detail surfaces keep all linked commercial context visible
  - backend linkage mismatches are surfaced directly in the create panel

## Backend Compatibility Tweaks Made

- Added a dedicated CRM-scoped reference controller and service surface so `company_admin` and `company_sales` users can load selector data without going through unrelated project-property or accounting admin routes:
  - `GET /companies/:companyId/crm-property-desk/references/projects`
  - `GET /companies/:companyId/crm-property-desk/references/units`
  - `GET /companies/:companyId/crm-property-desk/references/vouchers`
- Voucher reference responses now include:
  - `lineCount`
  - `totalDebit`
  - `totalCredit`
- No Prisma schema changes were made.
- No backend CRM/property business-logic redesign was made.

## Files Added Or Materially Updated

- Frontend routes:
  - `apps/web/src/app/(app)/crm-property-desk/customers/page.tsx`
  - `apps/web/src/app/(app)/crm-property-desk/leads/page.tsx`
  - `apps/web/src/app/(app)/crm-property-desk/bookings/page.tsx`
  - `apps/web/src/app/(app)/crm-property-desk/sale-contracts/page.tsx`
  - `apps/web/src/app/(app)/crm-property-desk/installment-schedules/page.tsx`
  - `apps/web/src/app/(app)/crm-property-desk/collections/page.tsx`
- CRM/property desk feature slice:
  - `apps/web/src/features/crm-property-desk/customers-page.tsx`
  - `apps/web/src/features/crm-property-desk/leads-page.tsx`
  - `apps/web/src/features/crm-property-desk/bookings-page.tsx`
  - `apps/web/src/features/crm-property-desk/sale-contracts-page.tsx`
  - `apps/web/src/features/crm-property-desk/installment-schedules-page.tsx`
  - `apps/web/src/features/crm-property-desk/collections-page.tsx`
  - `apps/web/src/features/crm-property-desk/forms.tsx`
  - `apps/web/src/features/crm-property-desk/hooks.ts`
  - `apps/web/src/features/crm-property-desk/shared.tsx`
  - `apps/web/src/features/crm-property-desk/utils.ts`
- Shared frontend integration:
  - `apps/web/src/lib/api/crm-property-desk.ts`
  - `apps/web/src/lib/api/types.ts`
  - `apps/web/src/lib/routes.ts`
  - `apps/web/src/components/providers/auth-provider.tsx`
  - `apps/web/src/features/shell/app-shell.tsx`
  - `apps/web/src/proxy.ts`
- Docker/runtime:
  - `apps/web/Dockerfile`
  - `docker-compose.yml`
- Backend compatibility surface:
  - `apps/api/src/app/crm-property-desk/crm-property-desk-references.controller.ts`
  - `apps/api/src/app/crm-property-desk/crm-property-desk-reference.service.ts`
  - `apps/api/src/app/crm-property-desk/crm-property-desk.module.ts`
- Tests:
  - `tests/e2e/crm-property-desk.spec.ts`

## Verification Commands

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
docker compose up -d --build
corepack pnpm auth:bootstrap -- --company-name "Real Capita" --company-slug "real-capita" --admin-email "admin@example.com" --admin-password "change-me-secure-admin-password"
```

## Verified Runtime Behavior

- `corepack pnpm lint` passed with existing non-blocking warnings.
- `corepack pnpm typecheck` passed.
- `corepack pnpm build` passed.
- `corepack pnpm test` passed, including the new CRM/property desk Playwright coverage.
- `docker compose up -d --build` completed with healthy `postgres`, `minio`, `api`, and `web` services.
- After the final Prompt 15 docker runtime fix, the rebuilt `web` container served the authenticated CRM/property desk routes correctly again instead of returning stale-cache `404` responses.
- `GET http://localhost:3333/api/v1/health` returned `200`.
- `GET http://localhost:3333/api/v1/health/ready` returned `200`.
- `GET http://localhost:3333/api/docs` returned `200`.
- `GET http://localhost:3000` returned `307` to `/login` for an unauthenticated browser.
- Live browser verification against `http://localhost:3000` succeeded for:
  - login and explicit company selection with the existing auth/session flow
  - CRM/property desk navigation visibility in the authenticated shell
  - live customers page and create panel
  - live leads page and create panel with hydrated project selectors
  - live bookings page, create panel, and detail panel with hydrated customer/project selectors
  - live sale contracts page and create panel
  - live installment schedules page and create panel with hydrated sale-contract selectors
  - live collections page, create panel, and detail panel with hydrated posted-voucher selectors
- Additional live API verification against the selected `Real Capita` company confirmed:
  - 3 active unit references were available, but 0 were in `AVAILABLE` status
  - 1 booking existed, but 0 bookings were eligible for new contract creation
  - 1 sale contract, 2 installment schedules, and 1 collection already existed
- Because the live company had no allocatable units and no contract-eligible active bookings at verification time, live booking-create and live contract-create submissions were blocked by real business prerequisites, not by Prompt 15 frontend wiring.

## Out Of Scope And Still Not Built

- refund workflows
- cancellation workflows
- transfer workflows
- accounting report screens
- HR/payroll screens
- document management screens
- dashboard analytics beyond small placeholders
- fake/demo data
- Next.js backend routes or server actions for business operations

## Prompt 16 Readiness

Prompt 15 is complete. The repo now has the minimum production-grade frontend CRM & Property Desk operational UI needed to operate the existing backend core through the locked REST boundary. Prompt 16 should build the next explicitly approved frontend slice without reworking auth/session, accounting, project/property masters, or the Prompt 15 operational flows.
