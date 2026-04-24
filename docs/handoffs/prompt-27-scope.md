# Prompt 27 Scope

Prompt 27 must continue from the Prompt 26 Phase 1 release-candidate audit and UAT readiness baseline.

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
- strict REST-only boundary between `apps/web` and `apps/api`
- `apps/web` as an API consumer only
- `apps/api` as the only backend entry point
- all Prompt 12 through Prompt 26 delivered business behavior, runtime hardening, documentation, and release-readiness checks
- Prompt 22 runtime and Compose runner-service rules
- Prompt 23 authorization and role-aware UX rules
- Prompt 24 CSV export and browser-native print rules
- Prompt 25 backup/restore safety behavior
- Prompt 26 release-candidate documentation:
  - `docs/operations/phase-1-route-inventory.md`
  - `docs/operations/phase-1-uat-checklist.md`
  - `docs/operations/phase-1-release-checklist.md`

## Must Not Regress

- backup files must remain ignored by git
- generated `*.tsbuildinfo` files must remain ignored by git
- PostgreSQL restore must remain explicitly confirmed before destructive changes
- restore dry-run must remain non-mutating
- backup/restore helpers must not embed secrets
- MinIO/S3 browser-resolvable `S3_PUBLIC_ENDPOINT` behavior must remain intact
- Docker Compose must remain the approved Phase 1 deployment baseline
- unauthenticated protected routes must redirect to `/login?next=...`
- authenticated unauthorized sessions must receive stable API `403` behavior and clear frontend forbidden states
- Phase 1 CSV/print output surfaces must remain read-only and role-scoped

## Out Of Scope Unless Explicitly Assigned

- new ERP business modules
- new CRUD domains
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
- Kubernetes or a redesigned runtime architecture

## Required Starting Point For Prompt 27

Read:

- `AGENTS.md`
- `docs/handoffs/foundation-status.md`
- `docs/handoffs/prompt-25-status.md`
- `docs/handoffs/prompt-26-scope.md`
- `docs/handoffs/prompt-26-status.md`
- `docs/handoffs/prompt-27-scope.md`
- the explicitly assigned Prompt 27 user scope

## Prompt 27 Status

The repo is ready for Prompt 27 after Prompt 26 validation, but Prompt 27 scope must be explicitly assigned by the next user prompt.
