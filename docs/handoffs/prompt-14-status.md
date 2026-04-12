# Prompt 14 Status

## Scope Delivered

Prompt 14 delivered the production-grade Project & Real-Estate Master frontend on top of the Prompt 12 shell/auth foundation and the Prompt 13 accounting frontend:

- project/property navigation in the authenticated app shell
- projects UI for list, create/edit, filtering, and activate/deactivate
- cost centers UI for list, create/edit, filtering, and activate/deactivate
- hierarchy master UI for phases, blocks, and zones
- unit types UI for list, create/edit, and activate/deactivate
- unit statuses UI as a read-only controlled catalog
- units UI for list, detail-backed edit, create, filtering, hierarchy context, and activate/deactivate
- reusable project/property API client methods, TanStack Query hooks, shared page primitives, and disciplined form handling
- Playwright coverage for route protection, project/property page smoke, read-only unit-status behavior, and unit create/edit/filter flow
- handoff docs updated for Prompt 15 continuity

## Frontend Routes Added

- `/project-property/projects`
- `/project-property/cost-centers`
- `/project-property/phases`
- `/project-property/blocks`
- `/project-property/zones`
- `/project-property/unit-types`
- `/project-property/unit-statuses`
- `/project-property/units`

## Frontend Infrastructure Added

- Project/property API/data layer:
  - typed project/property REST client in `apps/web/src/lib/api/project-property.ts`
  - project/property record, query, and payload types in `apps/web/src/lib/api/types.ts`
  - query-string reuse through the existing frontend API client foundation
  - TanStack Query hooks and invalidation patterns in `apps/web/src/features/project-property/hooks.ts`
- Shared project/property UI patterns:
  - page headers, sections, status badges, hierarchy badges, read-only notices, and query-error banners in `apps/web/src/features/project-property/shared.tsx`
  - reusable project/property forms and dependent-select logic in `apps/web/src/features/project-property/forms.tsx`
  - shared normalization and label helpers in `apps/web/src/features/project-property/utils.ts`
- Auth and shell integration:
  - project/property route constants in `apps/web/src/lib/routes.ts`
  - project/property navigation in `apps/web/src/features/shell/app-shell.tsx`
  - `/project-property/**` route protection in `apps/web/src/proxy.ts`
  - project/property visibility derived from the existing auth/session provider

## Hierarchy And Unit UX In This Phase

- Projects remain the top-level anchor.
- Cost centers can stay company-level or link to a project.
- Phases sit under projects.
- Blocks sit under projects and may optionally link to a phase.
- Zones sit under projects and may optionally link to a block.
- Unit forms guide parent-child choices by narrowing phase, block, and zone options from the selected project context.
- Unit rows render hierarchy context directly so users can see where each unit belongs without opening detail first.
- Unit statuses are surfaced as fixed backend-controlled master data, not editable UI.

## Backend Compatibility Tweaks Made

- None.
- Prompt 14 used the existing project/property backend APIs as-is. No backend project/property logic, DTOs, controller contracts, or Prisma schema files were changed.

## Files Added Or Materially Updated

- Frontend routes:
  - `apps/web/src/app/(app)/project-property/projects/page.tsx`
  - `apps/web/src/app/(app)/project-property/cost-centers/page.tsx`
  - `apps/web/src/app/(app)/project-property/phases/page.tsx`
  - `apps/web/src/app/(app)/project-property/blocks/page.tsx`
  - `apps/web/src/app/(app)/project-property/zones/page.tsx`
  - `apps/web/src/app/(app)/project-property/unit-types/page.tsx`
  - `apps/web/src/app/(app)/project-property/unit-statuses/page.tsx`
  - `apps/web/src/app/(app)/project-property/units/page.tsx`
- Project/property feature slice:
  - `apps/web/src/features/project-property/projects-page.tsx`
  - `apps/web/src/features/project-property/cost-centers-page.tsx`
  - `apps/web/src/features/project-property/phases-page.tsx`
  - `apps/web/src/features/project-property/blocks-page.tsx`
  - `apps/web/src/features/project-property/zones-page.tsx`
  - `apps/web/src/features/project-property/unit-types-page.tsx`
  - `apps/web/src/features/project-property/unit-statuses-page.tsx`
  - `apps/web/src/features/project-property/units-page.tsx`
  - `apps/web/src/features/project-property/forms.tsx`
  - `apps/web/src/features/project-property/hooks.ts`
  - `apps/web/src/features/project-property/shared.tsx`
  - `apps/web/src/features/project-property/utils.ts`
- Shared frontend infrastructure:
  - `apps/web/src/lib/api/project-property.ts`
  - `apps/web/src/lib/api/types.ts`
  - `apps/web/src/lib/routes.ts`
  - `apps/web/src/components/providers/auth-provider.tsx`
  - `apps/web/src/features/shell/app-shell.tsx`
  - `apps/web/src/proxy.ts`
- Tests:
  - `tests/e2e/project-property.spec.ts`

## Verification Commands

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
docker compose up -d --build
corepack pnpm prisma:migrate:deploy
corepack pnpm auth:bootstrap -- --company-name "Real Capita" --company-slug "real-capita" --admin-email "admin@example.com" --admin-password "change-me-secure-admin-password"
```

## Verified Runtime Behavior

- `corepack pnpm lint` passed with existing non-blocking warnings.
- `corepack pnpm typecheck` passed.
- `corepack pnpm build` passed.
- `corepack pnpm test` passed, including the new project/property Playwright coverage.
- `docker compose up -d --build` completed with healthy `postgres`, `minio`, `api`, and `web` services.
- `GET http://localhost:3333/api/v1/health` returned `200`.
- `GET http://localhost:3333/api/docs` returned `200`.
- `GET http://localhost:3000` returned `307` to `/login` for an unauthenticated browser.
- Live browser verification against `http://localhost:3000` succeeded for:
  - login and explicit company selection with the existing auth/session flow
  - project/property navigation visibility in the authenticated shell
  - live project creation
  - live cost-center creation
  - live phase creation
  - live block creation
  - live zone creation
  - live unit-type creation
  - live read-only unit-status rendering
  - live unit create, edit, and filter flow using the created hierarchy

## Out Of Scope And Still Not Built

- booking screens
- sale contract screens
- installment collection screens
- accounting report screens
- HR/payroll screens
- document management screens
- fake/demo data
- Next.js backend routes or server actions for business operations

## Prompt 15 Readiness

Prompt 14 is complete. The repo now has the minimum production-grade Project & Real-Estate Master frontend needed to operate the existing backend core through the locked REST boundary. Prompt 15 should build the next frontend business slice on top of these patterns without reworking auth/session, accounting, or project/property master behavior.
