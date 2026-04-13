# Prompt 23 Scope

Prompt 23 must continue from the Prompt 22 release-readiness baseline.

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
- all Prompt 12 through Prompt 21 business behavior
- Prompt 22 runtime hardening:
  - Compose `runner` containers for `api` and `web`
  - `ops` profile helpers for migrations and bootstrap
  - canonical local browser origin `http://localhost:3000`
  - redirect from `127.0.0.1` onto the canonical localhost origin
  - same-host browser-origin rules across `WEB_APP_URL`, `API_BASE_URL`, and `CORS_ORIGIN`
  - `corepack pnpm docker:migrate`
  - `corepack pnpm docker:bootstrap -- --company-name ...`
  - `corepack pnpm docker:smoke`
  - the current CI validation sequence including Compose runtime smoke

## Must Not Regress

- strict REST-only boundary between `apps/web` and `apps/api`
- frontend-only browser behavior in `apps/web`
- API ownership of auth, orchestration, and business operations
- cookie-backed browser session behavior
- multi-company login and session selection
- MinIO browser-resolvable `S3_PUBLIC_ENDPOINT` behavior
- release-minded Docker and Compose runner behavior

## Canonical Runtime Expectations

- local browser verification uses `http://localhost:3000`
- API health uses `http://localhost:3333/api/v1/health`
- API readiness uses `http://localhost:3333/api/v1/health/ready`
- Swagger uses `http://localhost:3333/api/docs`
- MinIO API uses `http://localhost:9000`
- MinIO Console uses `http://localhost:9001`

## If Prompt 23 Touches Runtime Or Deployment

- do not reintroduce bind-mounted dev container behavior as the canonical Compose path
- do not reintroduce host/container `.next` or build-artifact coupling
- do not weaken origin validation just to support mixed hosts
- do not remove the HTTPS requirement for non-localhost production browser sessions
- do not break the repo-root migration, bootstrap, or runtime smoke commands

## Required Starting Point For Prompt 23

Read:

- `AGENTS.md`
- `docs/handoffs/foundation-status.md`
- `docs/handoffs/prompt-21-status.md`
- `docs/handoffs/prompt-22-status.md`
- the explicitly assigned Prompt 23 user scope

## Prompt 23 Status

The repo is ready for Prompt 23, but Prompt 23 scope must be explicitly assigned by the next user prompt.
