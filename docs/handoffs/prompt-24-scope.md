# Prompt 24 Scope

Prompt 24 must continue from the Prompt 23 authorization-hardening baseline.

## Must Preserve

- the locked stack:
  - Nx + pnpm
  - Next.js App Router frontend-only `apps/web`
  - NestJS REST-only `apps/api`
  - Prisma + PostgreSQL 15
  - MinIO
  - Playwright
  - GitHub Actions
  - Docker Compose
- all Prompt 12 through Prompt 23 delivered business behavior and hardening
- Prompt 22 runtime rules:
  - Compose `runner` containers for `api` and `web`
  - `ops` profile helpers for migrations and bootstrap
  - canonical local browser origin `http://localhost:3000`
  - redirect from `127.0.0.1` onto the canonical localhost origin
  - same-host browser-origin validation across `WEB_APP_URL`, `API_BASE_URL`, and `CORS_ORIGIN`
  - `corepack pnpm docker:migrate`
  - `corepack pnpm docker:bootstrap -- --company-name ...`
  - `corepack pnpm docker:smoke`
  - the current CI validation sequence including Compose runtime smoke
- Prompt 23 authorization rules:
  - the Phase 1 access matrix in `packages/config/src/access.ts`
  - explicit backend guard/decorator enforcement against company-scoped roles
  - frontend role-aware shell navigation and route/page gating
  - clear forbidden UX for authenticated but unauthorized sessions
  - dashboard/widget visibility aligned with accessible modules only

## Must Not Regress

- strict REST-only boundary between `apps/web` and `apps/api`
- frontend-only browser behavior in `apps/web`
- API ownership of auth, orchestration, and business operations
- cookie-backed browser session behavior
- multi-company login and session selection
- explicit `401`/`403` authorization behavior
- company-scoped RBAC enforcement
- hidden-forbidden navigation alignment with backend authority
- dashboard quick-action and widget gating
- MinIO browser-resolvable `S3_PUBLIC_ENDPOINT` behavior
- release-minded Docker and Compose runner behavior

## Canonical Authorization Expectations

- Phase 1 module access remains explicit and matrix-driven, not DSL-driven.
- `company_admin` keeps full Phase 1 module access.
- `company_accountant` keeps accounting + financial reports + audit/documents.
- `company_hr` keeps HR + payroll + audit/documents.
- `company_payroll` keeps payroll + audit/documents.
- `company_sales` keeps CRM/property desk + audit/documents.
- `company_member` remains dashboard-only.
- Audit events remain admin-only.

## If Prompt 24 Touches Auth, Navigation, Or Dashboard

- do not redesign the auth model into a new IAM system
- do not introduce a database-backed fine-grained permissions engine unless explicitly scoped
- do not move authorization authority into frontend-only checks
- do not reintroduce disabled nav links for forbidden modules where the current shell now hides them
- do not remove the forbidden state and fall back to generic crashes or blank pages
- do not expose dashboard links or widgets into modules the active session cannot reach

## Required Starting Point For Prompt 24

Read:

- `AGENTS.md`
- `docs/handoffs/foundation-status.md`
- `docs/handoffs/prompt-22-status.md`
- `docs/handoffs/prompt-23-status.md`
- the explicitly assigned Prompt 24 user scope

## Prompt 24 Status

The repo is ready for Prompt 24, but Prompt 24 scope must be explicitly assigned by the next user prompt.
