# Prompt 5 Status

## Implemented

- Org & Security Core schema expansion on top of Prompt 4:
  - optional `users.firstName`
  - optional `users.lastName`
  - `locations`
  - `departments`
- Backend admin modules for:
  - companies
  - locations
  - departments
  - users
  - roles
  - role assignments
- Company administration API with:
  - visible company listing for authenticated admins
  - company detail
  - company creation with automatic `company_admin` assignment for the caller on the new company
  - basic company metadata update
  - company activate/deactivate flows
- Company-scoped location and department admin APIs with:
  - create
  - list
  - detail
  - update
  - activate/deactivate
  - duplicate code/name conflict handling per company
- Admin-facing company user management with:
  - list
  - detail
  - create
  - basic non-sensitive profile update
  - company-scoped activate/deactivate behavior implemented by toggling all `user_roles` in the target company
- Company-scoped role assignment layer with:
  - available role listing
  - list user role assignments
  - assign/reactivate role
  - unassign/deactivate role
  - user list filtering by company role
- Shared pagination/search/sort query baseline for admin list endpoints.
- Swagger documentation for all Prompt 5 endpoints.
- Scoped backend tests for the new admin modules and the new company assignment guard.

## New Authorization Behavior

- Prompt 4 auth remains intact.
- A new DB-backed company assignment guard now enforces target-company admin access for company-scoped admin routes.
- Company routes allow inactive-company access for already assigned admins so a deactivated company can be reactivated.
- Company user activate/deactivate is intentionally company-scoped in Prompt 5:
  - it toggles all `user_roles` for that user in the target company
  - it does not globally disable the user identity across unrelated companies

## Prisma Migration Added

- `20260316003410_prompt_5_org_security_core`

Migration contents:

- add nullable `firstName` to `users`
- add nullable `lastName` to `users`
- create `locations`
- create `departments`
- add company-scoped unique constraints for location and department `code`
- add company-scoped unique constraints for location and department `name`
- add company/activity indexes for location and department list behavior

## Endpoints Added

### Companies

- `GET /api/v1/companies`
- `GET /api/v1/companies/:companyId`
- `POST /api/v1/companies`
- `PATCH /api/v1/companies/:companyId`
- `POST /api/v1/companies/:companyId/activate`
- `POST /api/v1/companies/:companyId/deactivate`

### Locations

- `GET /api/v1/companies/:companyId/locations`
- `GET /api/v1/companies/:companyId/locations/:locationId`
- `POST /api/v1/companies/:companyId/locations`
- `PATCH /api/v1/companies/:companyId/locations/:locationId`
- `POST /api/v1/companies/:companyId/locations/:locationId/activate`
- `POST /api/v1/companies/:companyId/locations/:locationId/deactivate`

### Departments

- `GET /api/v1/companies/:companyId/departments`
- `GET /api/v1/companies/:companyId/departments/:departmentId`
- `POST /api/v1/companies/:companyId/departments`
- `PATCH /api/v1/companies/:companyId/departments/:departmentId`
- `POST /api/v1/companies/:companyId/departments/:departmentId/activate`
- `POST /api/v1/companies/:companyId/departments/:departmentId/deactivate`

### Users

- `GET /api/v1/companies/:companyId/users`
- `GET /api/v1/companies/:companyId/users/:userId`
- `POST /api/v1/companies/:companyId/users`
- `PATCH /api/v1/companies/:companyId/users/:userId`
- `POST /api/v1/companies/:companyId/users/:userId/activate`
- `POST /api/v1/companies/:companyId/users/:userId/deactivate`

### Roles And Role Assignments

- `GET /api/v1/roles`
- `GET /api/v1/companies/:companyId/users/:userId/roles`
- `POST /api/v1/companies/:companyId/users/:userId/roles`
- `DELETE /api/v1/companies/:companyId/users/:userId/roles/:roleCode`

## Environment And Runtime Notes

- No new environment variables were added in Prompt 5.
- Docker Compose API startup now runs `prisma generate` before `nx dev api`.
- `apps/api/Dockerfile` now also runs `prisma generate` before the production API build stage.
- This change is required because the canonical Compose setup mounts a persistent `node_modules` volume, which would otherwise keep a stale generated Prisma client after schema changes.

## Bootstrap And Admin Implications

- Prompt 4 bootstrap remains the only first-run admin creation path.
- Company creation in Prompt 5 is admin-safe and compatible with Prompt 4:
  - it requires authenticated admin access
  - it automatically attaches the calling user as `company_admin` in the newly created company
- If a user has multiple active company assignments, login still requires explicit `companyId`.

## Verification Commands

```powershell
corepack pnpm prisma:format
corepack pnpm prisma:generate
corepack pnpm prisma:migrate:dev --name prompt_5_org_security_core
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
docker compose up -d postgres minio
docker compose up -d --build api web
corepack pnpm auth:bootstrap -- --company-name "Real Capita" --company-slug "real-capita" --admin-email "admin@example.com" --admin-password "change-me-secure-admin-password"
```

Live verification completed against the running stack for:

- health
- Swagger
- auth login/me/refresh/logout
- company create/list/detail/update/activate/deactivate
- location create/list/detail/update/activate/deactivate
- department create/list/detail/update/activate/deactivate
- user create/list/detail/update/activate/deactivate
- role list
- role assignment list/assign/remove

## Intentionally Out Of Scope

- Accounting
- Payroll
- CRM/property desk
- Project catalog
- Employee, attendance, or HR domain modules
- Fine-grained permission matrix tables
- Frontend management screens
- Next.js backend routes or server actions
- Password reset, invites, MFA, SSO, email verification
- Full global identity governance beyond this company-admin slice

## Ready State

Prompt 5 delivered the minimum production-grade backend Org & Security Core Admin API required to manage companies, locations, departments, users, and company-scoped role assignments. The repo is ready for Prompt 6.
