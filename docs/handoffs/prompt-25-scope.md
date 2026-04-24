# Prompt 25 Scope

Prompt 25 must continue from the Prompt 24 export + print readiness baseline.

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
- all Prompt 12 through Prompt 24 delivered business behavior and hardening
- Prompt 22 runtime rules:
  - Compose `runner` containers for `api` and `web`
  - `ops` profile helpers for migrations and bootstrap
  - canonical local browser origin `http://localhost:3000`
  - redirect from `127.0.0.1` onto the canonical localhost origin
  - same-host browser-origin validation across `WEB_APP_URL`, `API_BASE_URL`, and `CORS_ORIGIN`
  - `corepack pnpm docker:migrate`
  - `corepack pnpm docker:bootstrap -- --company-name ...`
  - current CI validation including Compose runtime smoke
- Prompt 23 authorization rules:
  - the Phase 1 access matrix in `packages/config/src/access.ts`
  - explicit backend guard/decorator enforcement against company-scoped roles
  - frontend role-aware shell navigation and route/page gating
  - clear forbidden UX for authenticated but unauthorized sessions
  - dashboard/widget visibility aligned with accessible modules only
- Prompt 24 output rules:
  - finance report CSV export + print support on the existing four report pages
  - voucher detail CSV export + print support
  - operational CSV exports on the documented selected list pages only
  - browser-native print styling instead of a separate print app
  - stable output headers/order and company-scoped authorization

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
- Prompt 24 export visibility, print rendering, and read-only output endpoints

## If Prompt 25 Touches Export, Print, Or Reporting

- do not replace CSV with `.xlsx` generation unless explicitly scoped
- do not add a server-side PDF rendering pipeline unless explicitly scoped
- do not move report/export authority into frontend-only authorization checks
- do not add write-back actions onto the new output surfaces
- do not broaden export coverage into every page without an explicit scope and stable backend contract
- do not hide statement assumptions such as derived balance-sheet adjustments

## Required Starting Point For Prompt 25

Read:

- `AGENTS.md`
- `docs/handoffs/foundation-status.md`
- `docs/handoffs/prompt-22-status.md`
- `docs/handoffs/prompt-23-status.md`
- `docs/handoffs/prompt-24-status.md`
- the explicitly assigned Prompt 25 user scope

## Prompt 25 Status

The repo is ready for Prompt 25, but Prompt 25 scope must be explicitly assigned by the next user prompt.
