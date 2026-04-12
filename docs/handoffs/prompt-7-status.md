# Prompt 7 Status

## Implemented

- Project & Real-Estate Master Core schema expansion on top of Prompt 6:
  - `projects`
  - `cost_centers`
  - `project_phases`
  - `blocks`
  - `zones`
  - `unit_types`
  - `unit_statuses`
  - `units`
- Backend project/property master module with company-scoped REST APIs for:
  - projects
  - cost centers
  - project phases
  - blocks
  - zones
  - unit types
  - unit statuses
  - units
- Fixed unit-status catalog strategy implemented as migration-seeded read-only master data:
  - `AVAILABLE`
  - `BOOKED`
  - `ALLOTTED`
  - `SOLD`
  - `TRANSFERRED`
  - `CANCELLED`
- Reuse of the existing Prompt 5 company-admin access baseline through `RequireCompanyAdminAccess`.
- Swagger documentation for all Prompt 7 project/property master endpoints.
- Scoped backend tests for project, cost center, hierarchy, unit type/status, and unit validation behavior.

## Database Logic Added

- Migration `20260316040000_prompt_7_project_real_estate_master_core` adds:
  - project/property master tables
  - project/location, cost-center/project, and hierarchy foreign keys
  - company-scoped and project-scoped unique indexes for code/name collisions
  - hierarchy-safe composite foreign keys for block/phase, zone/block, and unit/phase-block-zone relationships
  - fixed unit-status seed rows
- Prisma schema adjustments made for Prompt 7 compatibility:
  - `Location` now exposes `projects`
  - `Location` now has `@@unique([id, companyId])` so project location linkage stays company-safe
  - `Company` now exposes `projects`, `costCenters`, and `unitTypes`

## Validation And Access Rules Added

- All Prompt 7 routes require authentication plus company-admin access.
- No cross-company project/property data access is allowed.
- Projects require a valid company and reject location linkage outside that company.
- Cost centers reject project linkage outside the company.
- Project phases require an active project.
- Blocks reject inactive or cross-project phase linkage.
- Zones reject inactive or cross-project block linkage.
- Units require:
  - a valid project in the company
  - an active company-owned unit type
  - an active fixed unit status
  - optional phase/block/zone records from the same project hierarchy
- Units reject hierarchy mismatches such as:
  - block/phase mismatch
  - zone/block mismatch
  - zone/block/phase mismatch
- Duplicate code/name collisions are returned as explicit conflict errors in their scoped boundary.

## Endpoints Added

### Projects

- `GET /api/v1/companies/:companyId/projects`
- `GET /api/v1/companies/:companyId/projects/:projectId`
- `POST /api/v1/companies/:companyId/projects`
- `PATCH /api/v1/companies/:companyId/projects/:projectId`
- `POST /api/v1/companies/:companyId/projects/:projectId/activate`
- `POST /api/v1/companies/:companyId/projects/:projectId/deactivate`

### Cost Centers

- `GET /api/v1/companies/:companyId/cost-centers`
- `GET /api/v1/companies/:companyId/cost-centers/:costCenterId`
- `POST /api/v1/companies/:companyId/cost-centers`
- `PATCH /api/v1/companies/:companyId/cost-centers/:costCenterId`
- `POST /api/v1/companies/:companyId/cost-centers/:costCenterId/activate`
- `POST /api/v1/companies/:companyId/cost-centers/:costCenterId/deactivate`

### Project Phases

- `GET /api/v1/companies/:companyId/project-phases`
- `GET /api/v1/companies/:companyId/project-phases/:projectPhaseId`
- `POST /api/v1/companies/:companyId/project-phases`
- `PATCH /api/v1/companies/:companyId/project-phases/:projectPhaseId`
- `POST /api/v1/companies/:companyId/project-phases/:projectPhaseId/activate`
- `POST /api/v1/companies/:companyId/project-phases/:projectPhaseId/deactivate`

### Blocks

- `GET /api/v1/companies/:companyId/blocks`
- `GET /api/v1/companies/:companyId/blocks/:blockId`
- `POST /api/v1/companies/:companyId/blocks`
- `PATCH /api/v1/companies/:companyId/blocks/:blockId`
- `POST /api/v1/companies/:companyId/blocks/:blockId/activate`
- `POST /api/v1/companies/:companyId/blocks/:blockId/deactivate`

### Zones

- `GET /api/v1/companies/:companyId/zones`
- `GET /api/v1/companies/:companyId/zones/:zoneId`
- `POST /api/v1/companies/:companyId/zones`
- `PATCH /api/v1/companies/:companyId/zones/:zoneId`
- `POST /api/v1/companies/:companyId/zones/:zoneId/activate`
- `POST /api/v1/companies/:companyId/zones/:zoneId/deactivate`

### Unit Types

- `GET /api/v1/companies/:companyId/unit-types`
- `GET /api/v1/companies/:companyId/unit-types/:unitTypeId`
- `POST /api/v1/companies/:companyId/unit-types`
- `PATCH /api/v1/companies/:companyId/unit-types/:unitTypeId`
- `POST /api/v1/companies/:companyId/unit-types/:unitTypeId/activate`
- `POST /api/v1/companies/:companyId/unit-types/:unitTypeId/deactivate`

### Unit Statuses

- `GET /api/v1/companies/:companyId/unit-statuses`

### Units

- `GET /api/v1/companies/:companyId/units`
- `GET /api/v1/companies/:companyId/units/:unitId`
- `POST /api/v1/companies/:companyId/units`
- `PATCH /api/v1/companies/:companyId/units/:unitId`
- `POST /api/v1/companies/:companyId/units/:unitId/activate`
- `POST /api/v1/companies/:companyId/units/:unitId/deactivate`

## Query And Validation Notes

- Prompt 7 list endpoints reuse the shared pagination/search/sort baseline where practical.
- Project, cost-center, hierarchy-master, and unit-type lists support active-state filtering plus code/name search.
- Hierarchy-master lists support project filtering.
- Unit list supports:
  - `projectId`
  - `phaseId`
  - `blockId`
  - `zoneId`
  - `unitTypeId`
  - `unitStatusId`
  - `isActive`
  - text search
- Unit statuses are exposed read-only and ordered for safe catalog use.

## Environment And Runtime Notes

- No new environment variables were added in Prompt 7.
- Docker Compose API startup still regenerates the Prisma client before the API dev target runs.
- Prompt 7 adds `nx reset` before `api:dev:development` in both `apps/api/Dockerfile` and `docker-compose.yml` to clear stale container-local Nx state that was leaving the API container unhealthy.

## Verification Commands

```powershell
corepack pnpm prisma:format
corepack pnpm prisma:generate
corepack pnpm prisma:migrate:deploy
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
corepack pnpm auth:bootstrap -- --company-name "Real Capita" --company-slug "real-capita" --admin-email "admin@example.com" --admin-password "change-me-secure-admin-password"
docker compose up -d --build
```

Live verification completed against the running stack for:

- health
- Swagger
- auth login/me/refresh/logout
- company/location/department/user/role-assignment flows
- account class/group/ledger/particular/voucher flows
- project create/list/detail/update/activate/deactivate
- cost center create/list/detail/update/activate/deactivate
- project phase create/list/detail/update/activate/deactivate
- block create/list/detail/update/activate/deactivate
- zone create/list/detail/update/activate/deactivate
- unit type create/list/detail/update/activate/deactivate
- unit-status list
- unit create/list/detail/update/activate/deactivate
- unit filtering by project/type/status and text search
- hierarchy mismatch rejection for invalid unit linkage

## Intentionally Out Of Scope

- Bookings
- Sale contracts
- Installment schedules
- Collections
- Voucher automation from property flows
- Financial reports
- CRM/sales workflows
- Employee/attendance/payroll modules
- Frontend project/property screens
- Fake/demo ERP data
- Next.js backend routes or server actions

## Ready State

Prompt 7 delivered the minimum production-grade backend Project & Real-Estate Master Core needed to manage projects, cost centers, hierarchy masters, fixed unit statuses, and units without drifting into sales or accounting automation. The repo is ready for Prompt 8.
