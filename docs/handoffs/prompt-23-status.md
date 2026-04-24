# Prompt 23 Status

## Scope Delivered

Prompt 23 delivered authorization hardening and role-aware UX only:

- centralized the Phase 1 role-to-module access matrix
- hardened backend route protection against the shared matrix
- kept company-scoped access enforcement explicit
- hardened frontend navigation, page access, forbidden UX, and dashboard visibility
- added representative backend and frontend authorization tests
- preserved the locked stack, the REST-only boundary, and all existing business modules

No new ERP business modules, CRUD domains, approval engines, exports, notifications, or public-facing features were added.

## Phase 1 Access Matrix

| Module | `company_admin` | `company_accountant` | `company_hr` | `company_payroll` | `company_sales` | `company_member` |
| --- | --- | --- | --- | --- | --- | --- |
| Dashboard | yes | yes | yes | yes | yes | yes |
| Org & Security | yes | no | no | no | no | no |
| Accounting | yes | yes | no | no | no | no |
| Financial Reports | yes | yes | no | no | no | no |
| Project & Property Master | yes | no | no | no | no | no |
| CRM / Property Desk | yes | no | no | no | yes | no |
| HR | yes | no | yes | no | no | no |
| Payroll | yes | no | yes | yes | no | no |
| Audit & Documents | yes | yes | yes | yes | yes | no |
| Audit Events | yes | no | no | no | no | no |

Source of truth:

- `packages/config/src/access.ts`

## Backend Authorization Hardening Added

- Backend access decorators now consume the shared Phase 1 matrix instead of duplicating role lists.
- `RolesGuard` now throws an explicit `401` for missing authentication and an explicit `403` for missing role scope.
- `CompanyAssignmentGuard` now throws an explicit `401` for missing authentication, an explicit `403` for missing company access, and an explicit `403` for missing company-scoped role scope.
- Representative controller metadata checks now assert the documented Phase 1 matrix for:
  - org & security
  - accounting
  - financial reports
  - project/property master
  - CRM/property desk
  - HR
  - payroll
  - audit/documents
  - audit events
- Representative matrix checks now pin expected role access for:
  - admin
  - accountant
  - HR
  - payroll
  - sales
  - member

## Frontend Access And Navigation Hardening Added

- `apps/web` now computes access from the shared matrix instead of hardcoded booleans only.
- Shell navigation now hides inaccessible module sections and links instead of rendering disabled links for routes the session cannot use.
- Route-level access now renders a clear forbidden state inside the authenticated shell for signed-in but unauthorized users.
- The forbidden state distinguishes permission denial from missing authentication and shows:
  - the blocked module
  - allowed roles
  - active roles
  - a dashboard return action
  - access-help navigation
- The public `/unauthorized` page now explains the difference between missing session and missing permissions more clearly.
- Dashboard quick actions, summary panels, recent-activity panels, pending-work cards, and workspace badges now stay aligned with the same access matrix.
- Role labels shown in the shell, dashboard, and forbidden state now use readable labels instead of raw role codes.

## Minimal Compatibility Work Added

- No new permissions service, admin policy UI, or database-backed fine-grained permission system was introduced.
- The existing company-scoped `auth/me` role payload remains the frontend input; the shared matrix derives module access from those existing role codes.

## Tests Added Or Updated

- Backend:
  - `apps/api/src/app/auth/guards/company-assignment.guard.spec.ts`
  - `apps/api/src/app/auth/guards/roles.guard.spec.ts`
  - `apps/api/src/app/auth/phase1-access-matrix.spec.ts`
- Frontend:
  - `tests/e2e/authorization.spec.ts`
  - `tests/e2e/dashboard.spec.ts`

Representative checks now cover:

- admin can reach all intended Phase 1 modules
- accountant can reach accounting + reports + documents but not HR or org-security
- HR can reach HR + payroll but not accounting
- payroll cannot reach org-security
- sales can reach CRM + documents but not payroll
- member stays dashboard-only
- unauthenticated protected-route redirect still works
- multi-company login/session selection still works through existing smoke coverage

## Verification Completed

```powershell
corepack pnpm prisma:generate
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
docker compose up -d --build
corepack pnpm docker:migrate
corepack pnpm docker:bootstrap -- --company-name "Real Capita" --company-slug "real-capita" --admin-email "admin@example.com" --admin-password "change-me-secure-admin-password"
corepack pnpm docker:smoke
```

Additional live verification completed against the running stack for:

- `http://localhost:3333/api/v1/health`
- `http://localhost:3333/api/docs`
- API login plus authenticated `auth/me`
- real browser login to `http://localhost:3000/login`
- authenticated shell landing on `http://localhost:3000/dashboard`

## Docs Updated

- `README.md`
- `docs/operations/deployment.md`
- `docs/handoffs/foundation-status.md`
- `docs/handoffs/prompt-23-status.md`
- `docs/handoffs/prompt-24-scope.md`

## Out Of Scope And Still Not Built

- new ERP business modules
- approval workflow engines
- exports / print systems
- notifications / messaging
- public-facing features
- fake/demo data
- a new IAM design or fine-grained permission DSL
- a permissions-management admin UI

## Prompt 24 Readiness

Prompt 23 is complete. The repo is ready for Prompt 24 as long as Prompt 24 preserves:

- the shared Phase 1 access matrix
- explicit backend company-scoped authorization enforcement
- role-aware shell navigation and forbidden UX
- dashboard/widget gating against accessible modules only
- the Prompt 22 runtime, Compose, origin, and cookie/session rules
