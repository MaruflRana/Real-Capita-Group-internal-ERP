# Prompt 30 Scope

Prompt 30 must continue from the Prompt 29 final Phase 1 deployment/tag/release handoff package.

## Default Purpose

Prompt 30 is reserved for one of three directions:

- UAT blocker fix sprint, if stakeholder UAT produces confirmed issues.
- Production deployment assistance, if the team is ready to deploy the Phase 1 release candidate.
- Phase 2 roadmap, if Phase 1 is accepted and the team explicitly starts planning next scope.

Prompt 30 should not start new feature work by default.

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
- Prompt 22 runtime and Compose runner-service rules
- Prompt 23 authorization and role-aware UX rules
- Prompt 24 CSV export and browser-native print rules
- Prompt 25 backup/restore safety behavior
- Prompt 27 UAT package and sign-off rules
- Prompt 28 release handoff bundle
- Prompt 29 verification, deployment handoff, and tagging guidance

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
- UAT and release docs must remain honest about known limitations and deferred scope
- stakeholder UAT/sign-off must not be marked complete without actual signed evidence

## Allowed Prompt 30 Directions

If stakeholder UAT produces issues:

- classify each issue by severity and priority
- fix confirmed defects only
- update UAT issue status and retest notes
- run focused tests plus required verification

If production deployment assistance is requested:

- execute or guide the documented deployment checklist
- confirm target `.env` and secrets are ready for strict validation
- run backup, migration, smoke, and restore dry-run checks as requested
- record deployment evidence honestly
- do not run destructive restore or production deployment actions without explicit operator intent

If Phase 2 roadmap is requested:

- review Phase 1 sign-off, deferred scope, and known limitations first
- identify candidate Phase 2 work without implementing it by default
- confirm any new feature request is intentionally assigned and preserves the locked architecture

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
- Kubernetes or redesigned runtime architecture

## Required Starting Point For Prompt 30

Read:

- `AGENTS.md`
- `docs/handoffs/foundation-status.md`
- `docs/handoffs/prompt-29-status.md`
- `docs/handoffs/prompt-30-scope.md`
- `docs/release/phase-1-release-notes.md`
- `docs/release/phase-1-technical-handoff.md`
- `docs/release/phase-1-verification-summary.md`
- `docs/release/tagging-and-release.md`
- `docs/operations/phase-1-release-checklist.md`
- `docs/operations/deployment.md`
- `docs/operations/backup-restore.md`
- `docs/uat/README.md`
- any stakeholder UAT issue log, sign-off record, deployment target details, or explicit Prompt 30 user scope

## Prompt 30 Decision Gate

Before implementing anything in Prompt 30, classify the request as one of:

- UAT defect fix
- issue triage only
- production deployment assistance
- Phase 2 roadmap/planning
- documentation correction
- out-of-scope new feature request

If the request is a new feature request, confirm that it is intentionally assigned and does not violate the locked architecture.
