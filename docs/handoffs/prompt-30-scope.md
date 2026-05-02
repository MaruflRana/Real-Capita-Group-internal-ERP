# Prompt 30 Scope

Prompt 30 was reassigned by supervisor requirement to **Synthetic Demo/UAT Data Foundation**.

## Purpose

Build a safe, explicit, resettable seed-data foundation so supervisors can review Phase 1 with meaningful synthetic demo/UAT records across the existing ERP modules.

This is a controlled seed-data phase. It is not a new business-feature phase, dashboard phase, analytics phase, or chart UI phase.

## Must Preserve

- locked stack:
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

## Allowed Work

- explicit synthetic demo/UAT seed scripts
- explicit synthetic demo/UAT reset scripts
- seed helpers/factories
- package scripts for seeding, resetting, and verifying demo data
- small backend-safe support only if strictly needed for reliable seeding
- documentation for safe demo seed usage
- handoff docs

## Must Not Build

- frontend graphs/charts
- dashboard widgets
- new ERP business modules
- new CRUD screens
- new reports beyond data needed to populate existing reports
- new workflows
- fake real customer data presented as actual company data
- automatic seeding during app startup
- automatic seeding during migrations
- production deployment changes
- `.xlsx` generation
- server-side PDF rendering
- scheduled backup infrastructure
- Kubernetes or runtime redesign

## Data Safety Rules

- Call the data synthetic demo/UAT data.
- Do not call it real data.
- Do not use real NIDs, real phone numbers, real bank accounts, or real personal records.
- Do not auto-seed demo data in production, migrations, Docker startup, or normal bootstrap.
- Demo seed must run only through an explicit command.
- Demo reset must delete only guarded synthetic demo/UAT data.
- Use obvious prefixes/markers such as `DEMO-`, `UAT-`, or `SYNTH-DEMO-UAT`.
- Do not delete or overwrite existing real/user-created data.
- If reset cannot distinguish demo data from non-demo data, it must refuse and document the limitation.
- Keep generated data internally consistent enough to drive dashboard/report/chart work later.

## Target Strategy

Preferred target is a clearly named synthetic company:

```text
Real Capita Demo / UAT
real-capita-demo-uat
```

The seed must create or ensure demo users and company role assignments sufficient to view the seeded data.

## Required Commands

- `corepack pnpm seed:demo`
- `corepack pnpm seed:demo:reset`
- `corepack pnpm seed:demo:verify`

## Handoff Requirement

Create/update:

- `docs/operations/demo-data.md`
- `docs/handoffs/foundation-status.md`
- `docs/handoffs/prompt-30-status.md`
- `docs/handoffs/prompt-31-scope.md`

Prompt 31 should be **Analytics/Graphs/Status UI Enhancement** using seeded synthetic demo/UAT data and existing backend endpoints.
