# Prompt 28 Scope

Prompt 28 must continue from the Prompt 27 Phase 1 UAT, stakeholder demo, and sign-off package.

Checkpoint reference: `3bf83f5e`

## Default Purpose

Prompt 28 should not start new feature work by default. It should be selected after stakeholders use the UAT package and decide what the release candidate needs next.

Allowed Prompt 28 directions:

- UAT bug-fix sprint for confirmed defects
- issue triage and severity/priority classification
- final release packaging after UAT acceptance
- small documentation updates required by UAT findings

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
- all Prompt 12 through Prompt 27 delivered behavior, runtime hardening, documentation, UAT package, and release-readiness checks
- Prompt 22 runtime and Compose runner-service rules
- Prompt 23 authorization and role-aware UX rules
- Prompt 24 CSV export and browser-native print rules
- Prompt 25 backup/restore safety behavior
- Prompt 26 release-candidate documentation:
  - `docs/operations/phase-1-route-inventory.md`
  - `docs/operations/phase-1-uat-checklist.md`
  - `docs/operations/phase-1-release-checklist.md`
- Prompt 27 UAT package:
  - `docs/uat/README.md`
  - `docs/uat/phase-1-feature-matrix.md`
  - `docs/uat/role-wise-uat-guide.md`
  - `docs/uat/module-wise-uat-scenarios.md`
  - `docs/uat/phase-1-demo-walkthrough.md`
  - `docs/uat/uat-issue-log-template.md`
  - `docs/uat/phase-1-signoff-checklist.md`
  - `docs/uat/phase-1-known-limitations.md`

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
- UAT docs must remain honest about known limitations and deferred scope

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

## Required Starting Point For Prompt 28

Read:

- `AGENTS.md`
- `docs/handoffs/foundation-status.md`
- `docs/handoffs/prompt-26-status.md`
- `docs/handoffs/prompt-27-scope.md`
- `docs/handoffs/prompt-27-status.md`
- `docs/handoffs/prompt-28-scope.md`
- `docs/operations/phase-1-route-inventory.md`
- `docs/operations/phase-1-uat-checklist.md`
- `docs/operations/phase-1-release-checklist.md`
- `docs/uat/README.md`
- any stakeholder UAT issue log or explicit Prompt 28 user scope

## Prompt 28 Decision Gate

Before implementing anything in Prompt 28, classify the request as one of:

- UAT defect fix
- issue triage only
- final release packaging
- documentation correction
- out-of-scope new feature request

If the request is a new feature request, confirm that it is intentionally assigned and does not violate the locked architecture.
