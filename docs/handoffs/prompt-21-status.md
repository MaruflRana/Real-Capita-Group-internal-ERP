# Prompt 21 Status

## Scope Delivered

Prompt 21 delivered the minimum production-grade frontend Operational Dashboard + Home UI on top of the Prompt 20 baseline:

- replaced the placeholder authenticated home with a real operational dashboard under `apps/web`
- added a dashboard-specific frontend aggregation layer that reuses existing REST endpoints
- added summary panels, recent-activity panels, pending-work cards, and quick actions
- kept the browser frontend-only and preserved the existing auth/session boundary
- added Playwright coverage for dashboard rendering, navigation, and error surfacing
- updated handoff docs for Prompt 22 continuity

## Frontend Route Updated

- `/dashboard`

Prompt 21 did not add a new route. It upgraded the existing signed-in landing page into a real operational home.

## Frontend Files Added Or Updated

### Dashboard Page

- `apps/web/src/features/dashboard/dashboard-page.tsx`

### Dashboard Data Layer

- `apps/web/src/lib/api/dashboard.ts`
- `apps/web/src/features/dashboard/hooks.ts`
- `apps/web/src/features/dashboard/utils.ts`

### Dashboard Shared UI

- `apps/web/src/features/dashboard/shared.tsx`
- `apps/web/src/features/dashboard/health-status-card.tsx`

### Tests

- `tests/e2e/dashboard.spec.ts`
- `tests/e2e/smoke.spec.ts`

## Dashboard Behavior In This Phase

### Dashboard Shell Integration

- `/dashboard` remains the main signed-in landing page
- the active company remains visible at the top of the page
- the dashboard fits inside the existing authenticated shell without changing the auth/session model
- route protection remains unchanged

### Company Context And Period Control

- the active company name and slug are visible on the dashboard
- active workspace access is visible from the current role set
- the dashboard uses a simple preset-based period control:
  - `All activity`
  - `Last 30 days`
  - `Last 90 days`
  - `Year to date`
- financial metrics and recent-count widgets follow the selected period
- recent-activity panels intentionally show the latest available records rather than hiding older real data behind the period filter

### Summary Panels Added

Prompt 21 chose a compact grouped layout instead of flooding the page with one KPI card per field.

#### Financial Summary

Source:

- `GET /companies/:companyId/accounting/reports/profit-loss`
- `GET /companies/:companyId/accounting/reports/balance-sheet`
- `GET /companies/:companyId/accounting/reports/trial-balance`

Metrics shown:

- net profit / loss
- total assets
- total liabilities and equity
- trial-balance closing debit / credit

#### Accounting Operations

Source:

- `GET /companies/:companyId/accounting/vouchers`

Metrics shown:

- draft vouchers count
- posted vouchers count

#### Property And Sales

Source:

- `GET /companies/:companyId/unit-statuses`
- `GET /companies/:companyId/units`
- `GET /companies/:companyId/bookings`
- `GET /companies/:companyId/sale-contracts`
- `GET /companies/:companyId/collections`

Metrics shown:

- total units
- available units
- booked units
- sold units
- active bookings
- sale contracts
- recent collections count

#### People Operations

Source:

- `GET /companies/:companyId/employees`
- `GET /companies/:companyId/leave-requests`
- `GET /companies/:companyId/payroll-runs`

Metrics shown:

- employee count
- pending leave requests count
- open payroll run count (`DRAFT` + `FINALIZED`)

#### Documents And Audit

Source:

- `GET /companies/:companyId/attachments`
- `GET /companies/:companyId/audit-events`

Metrics shown:

- recent attachment count
- recent audit event count

### Recent Activity Panels Added

Prompt 21 kept recent activity practical and cross-module rather than trying to show every list independently.

#### Recent Vouchers

Source:

- `GET /companies/:companyId/accounting/vouchers`

Shows:

- latest voucher reference/description
- voucher status
- debit total
- line count

#### Recent Commercial Activity

Source:

- `GET /companies/:companyId/bookings`
- `GET /companies/:companyId/sale-contracts`
- `GET /companies/:companyId/collections`

Shows a merged recent timeline of:

- bookings
- sale contracts
- collections

#### Recent People Operations

Source:

- `GET /companies/:companyId/leave-requests`
- `GET /companies/:companyId/payroll-runs`

Shows a merged recent timeline of:

- leave requests
- payroll runs

#### Recent Document Activity

Source:

- `GET /companies/:companyId/attachments`
- `GET /companies/:companyId/audit-events`

Shows a merged recent timeline of:

- attachments
- audit events

### Pending / Needs-Attention Cards Added

Prompt 21 only surfaced current-state items that can be derived cleanly from existing data:

- draft vouchers awaiting posting
- available units ready for booking
- submitted leave requests awaiting review
- finalized payroll runs awaiting posting
- attachments awaiting finalize

### Quick Actions Added

Quick actions use existing routes only:

- new voucher
- chart of accounts
- units master
- new booking
- employees
- payroll runs
- financial reports
- documents
- audit events

Prompt 21 did not add fake shortcut destinations or unbuilt create routes.

## Backend Compatibility Tweaks Made

- No NestJS endpoint changes were required.
- No Prisma schema changes were required.
- No environment-variable or Docker Compose changes were required.
- The dashboard reuses existing list and reporting endpoints only.

## Tests Added Or Updated

- `tests/e2e/dashboard.spec.ts`
- `tests/e2e/smoke.spec.ts`

Coverage includes:

- protected-route behavior for `/dashboard`
- authenticated landing on the operational dashboard after login
- dashboard summary rendering smoke coverage
- recent-activity and pending-work widget smoke coverage
- quick-action navigation into an existing module route
- dashboard section-level error surfacing when summary data fails

## Verification Commands

```powershell
$env:NX_WORKSPACE_ROOT='C:\Users\wadud\Documents\New project'
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
docker compose up -d --build
```

## Verified Runtime Behavior

- `corepack pnpm lint` passed.
- `corepack pnpm typecheck` passed.
- `corepack pnpm build` passed.
- `corepack pnpm test` passed.
- `docker compose up -d --build` completed with healthy `postgres`, `minio`, `api`, and `web` services.
- `GET http://localhost:3000` returned `200`.
- `GET http://localhost:3333/api/v1/health` returned `200`.
- `GET http://localhost:3333/api/docs` returned `200`.
- live login/browser verification succeeded on the canonical `http://localhost:3000` origin with `admin@example.com` plus explicit company selection for the main `Real Capita` company.
- live Prompt 21 browser verification succeeded in the main `Real Capita` company for:
  - dashboard load as the signed-in landing page
  - company context visibility
  - summary panel rendering from real backend data
  - recent-activity panel rendering
  - pending-work card rendering
  - quick-action navigation into existing module routes
  - dashboard error-state surfacing without collapsing the whole page

## Runtime Note

- Live browser verification should use the canonical `http://localhost:3000` origin. Using `http://127.0.0.1:3000` is not equivalent for this stack because the browser client targets `http://localhost:3333` for API requests, which creates a cross-origin mismatch.

## Out Of Scope And Still Not Built

- dashboard exports
- print workflows
- approval engines
- notifications
- messaging/chat
- public-facing pages
- fake/demo dashboard data
- backend analytics infrastructure
- new business-operation modules
- Next.js backend routes or server actions for dashboard business operations

## Prompt 22 Readiness

Prompt 21 is complete. The repo now has a real frontend operational dashboard/home experience on top of the existing backend and frontend slices, while preserving the locked stack, the strict REST boundary, and the Prompt 12 through Prompt 20 behavior. The repo is ready for Prompt 22.
