# Prompt 12 Status

## Scope Delivered

Prompt 12 delivered the first usable internal ERP frontend on top of the existing backend:

- authenticated app shell in `apps/web`
- login/logout/session flow against the live auth API
- company-aware session handling, including multi-company login selection
- protected routing and forbidden fallback
- reusable frontend REST client + TanStack Query data layer
- Org & Security admin UI for companies, locations, departments, users, and company-scoped role assignments
- Playwright smoke coverage for auth, protection, and Org & Security interactions
- minimal backend compatibility and Docker runtime fixes required to support the frontend cleanly

## Frontend Routes Added

- `/login`
- `/dashboard`
- `/org-security/companies`
- `/org-security/locations`
- `/org-security/departments`
- `/org-security/users`
- `/org-security/role-assignments`
- `/unauthorized`

## Frontend Infrastructure Added

- App shell:
  - protected `(app)` layout
  - public `(public)` layout
  - sidebar navigation
  - top bar and session menu
  - company context display
- Auth/session:
  - `AuthProvider`
  - `AuthGuard`
  - disciplined redirect flow through `proxy.ts`
  - login form with multi-company retry path
  - logout path that clears frontend query state
- API/data layer:
  - typed `apiRequest` wrapper
  - consistent API error handling
  - auth-aware retry on `401` via refresh
  - reusable org/auth API helpers
  - shared query-string helpers
- UI/form patterns:
  - shared table, badge, empty-state, pagination, select, side-panel, state-screen primitives
  - React Hook Form + Zod validation across the Prompt 12 forms

## How Auth Works In This Phase

- Browser requests use the real NestJS auth APIs:
  - `POST /api/v1/auth/login`
  - `GET /api/v1/auth/me`
  - `POST /api/v1/auth/refresh`
  - `POST /api/v1/auth/logout`
- The backend now sets httpOnly cookies for the access and refresh tokens while still returning the token payloads.
- `apps/web/src/proxy.ts` uses those cookies to protect `/dashboard` and `/org-security/**`.
- The frontend query client includes credentials on API requests and performs a single refresh retry for eligible unauthorized responses.
- When login returns the backend multi-company error, the UI renders the available company choices and resubmits with `companyId`.

## Backend Compatibility Tweaks Made

- Added cookie-based auth compatibility to the backend auth controller:
  - cookie set/clear on login/refresh/logout
  - cookie fallback for refresh/logout
  - access-token cookie extraction for guarded requests
- Aligned `GET /api/v1/auth/me` assignment shape with the documented DTO and the login response shape.
- Added richer multi-company login error details to support the frontend company picker.
- Updated Docker runtime paths:
  - web compose/dev path now runs Next from `apps/web`
  - API compose/dev path now builds and runs the compiled Nest app inside Docker
- Expanded `.dockerignore` to ignore nested generated dependency/build folders used by the monorepo.

## Files Added Or Materially Updated

- Frontend shell and app routes:
  - `apps/web/src/app/layout.tsx`
  - `apps/web/src/app/(app)/**`
  - `apps/web/src/app/(public)/**`
  - `apps/web/src/app/unauthorized/page.tsx`
  - `apps/web/src/proxy.ts`
- Frontend providers and shared client infrastructure:
  - `apps/web/src/components/providers/**`
  - `apps/web/src/components/auth/auth-guard.tsx`
  - `apps/web/src/lib/api/**`
  - `apps/web/src/lib/forms.ts`
  - `apps/web/src/lib/format.ts`
  - `apps/web/src/lib/routes.ts`
- Frontend feature slices:
  - `apps/web/src/features/auth/**`
  - `apps/web/src/features/dashboard/**`
  - `apps/web/src/features/org-security/**`
  - `apps/web/src/features/shell/**`
- Frontend UI primitives:
  - `apps/web/src/components/ui/**`
- Minimal backend support:
  - `apps/api/src/app/auth/auth-cookie.service.ts`
  - `apps/api/src/app/auth/auth.controller.ts`
  - `apps/api/src/app/auth/auth.service.ts`
  - `apps/api/src/app/auth/strategies/access-token.strategy.ts`
  - auth DTO/constants/spec updates
- Docker/runtime:
  - `apps/api/Dockerfile`
  - `apps/web/Dockerfile`
  - `docker-compose.yml`
  - `.dockerignore`
- Tests:
  - `tests/e2e/playwright.config.ts`
  - `tests/e2e/smoke.spec.ts`

## Verification Commands

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
docker compose up -d
corepack pnpm prisma:migrate:deploy
```

## Verified Runtime Behavior

- Docker Compose services reached healthy state for `postgres`, `minio`, `api`, and `web`.
- Web shell loaded at `http://localhost:3000`.
- Swagger loaded at `http://localhost:3333/api/docs`.
- Login worked against the real backend.
- Logout returned the browser to the login flow.
- Navigating to `/dashboard` after logout redirected to `/login?next=%2Fdashboard`.
- After creating a second company for the same admin, login required explicit company selection and the UI handled it correctly.
- Real frontend CRUD verification succeeded for:
  - company creation
  - location creation
  - department creation
  - user creation
  - role assignment creation

## Out Of Scope And Still Not Built

- accounting frontend
- project/property frontend
- CRM/property desk frontend
- HR/payroll frontend
- document management frontend
- report builders/dashboards beyond the dashboard placeholder
- full frontend permission engine beyond the Prompt 12 baseline
- password reset, MFA, invites, SSO
- Next.js business-operation routes or server actions

## Prompt 13 Readiness

Prompt 12 is complete. The repo now has a stable internal-admin shell, real auth/session plumbing, reusable frontend infrastructure, and the first production-grade admin slice. Prompt 13 should build the next ERP frontend module on top of these patterns instead of reworking them.
