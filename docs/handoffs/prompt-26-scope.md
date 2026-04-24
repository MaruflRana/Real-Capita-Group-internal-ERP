# Prompt 26 Scope

Prompt 26 must continue from the Prompt 25 backup, restore, and operations-readiness baseline.

## Must Preserve

- the locked stack:
  - Nx + pnpm
  - Next.js App Router frontend-only `apps/web`
  - NestJS REST-only `apps/api`
  - Prisma + PostgreSQL 15
  - MinIO / S3-compatible object storage
  - Playwright
  - GitHub Actions
  - Docker Compose for the single-VM target
- all Prompt 12 through Prompt 25 delivered business behavior and hardening
- strict REST-only boundary between `apps/web` and `apps/api`
- Prompt 22 runtime rules and Compose runner services
- Prompt 23 authorization and role-aware UX rules
- Prompt 24 CSV export and browser-native print rules
- Prompt 25 operations helpers:
  - `corepack pnpm backup:db`
  - `corepack pnpm verify:backup -- --file <path>`
  - `corepack pnpm restore:db -- --file <path> --dry-run`
  - `corepack pnpm restore:db -- --file <path> --confirm-destroy-data`
  - `corepack pnpm ops:env-check -- --strict`

## Must Not Regress

- backup files must remain ignored by git
- PostgreSQL restore must remain explicitly confirmed before destructive changes
- restore dry-run must remain non-mutating
- backup/restore helpers must not embed secrets
- `apps/web` must not gain backend routes or server actions for business operations
- `apps/api` must remain the backend entry point
- MinIO/S3 browser-resolvable `S3_PUBLIC_ENDPOINT` behavior must remain intact
- Docker Compose must remain the approved Phase 1 deployment baseline

## If Prompt 26 Touches Operations

- keep operations simple, auditable, and single-VM friendly
- do not require Kubernetes, paid external services, or a redesigned runtime architecture
- do not make CI destructive or slow
- do not automate restores without explicit operator confirmation
- document any new command in README, operations docs, and handoff docs

## Out Of Scope Unless Explicitly Assigned

- new ERP business modules
- new CRUD screens
- new dashboards or reports
- approval workflows
- notifications
- import systems
- public-facing features
- fake/demo ERP data
- `.xlsx` generation
- server-side PDF rendering
- automated scheduled backup infrastructure
- point-in-time recovery

## Required Starting Point For Prompt 26

Read:

- `AGENTS.md`
- `docs/handoffs/foundation-status.md`
- `docs/handoffs/prompt-24-status.md`
- `docs/handoffs/prompt-25-scope.md`
- `docs/handoffs/prompt-25-status.md`
- the explicitly assigned Prompt 26 user scope

## Prompt 26 Status

The repo is ready for Prompt 26 after Prompt 25 validation, but Prompt 26 scope must be explicitly assigned by the next user prompt.
