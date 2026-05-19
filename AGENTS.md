# Real Capita ERP — Agent Operating Guide

## 1. Project Identity and Locked Architecture

- **Project**: Real Capita Group internal ERP, production-minded Nx + pnpm monorepo.
- **apps/web**: Next.js App Router, frontend-only API consumer. No server actions for business operations.
- **apps/api**: NestJS REST API, sole backend source of truth for all business endpoints and orchestration.
- **Database**: Prisma + PostgreSQL 15. Prisma for CRUD, migrations, and generated types. Raw SQL only for complex reporting queries and transaction-enforcement flows already justified by the design.
- **Storage**: MinIO for S3-compatible object storage in local development; browser-to-storage presigned upload/download flows, never proxied through Next.js.
- **Deployment**: Docker Compose for a single-VM baseline. Runner-style app containers, health checks, and repo-root maintenance commands.
- **Testing**: Playwright e2e + NestJS backend unit/integration tests. GitHub Actions CI validates lint, typecheck, build, tests, and Docker Compose boot plus runtime smoke.
- **Canonical Dockerfiles**: `apps/api/Dockerfile` and `apps/web/Dockerfile` only.
- **Canonical orchestration**: `docker-compose.yml` only.
- **Compose services**: `web`, `api`, `postgres`, `minio`.

## 2. Non-Negotiable Architecture Rules

- Keep a strict REST-only boundary between `apps/web` and `apps/api`. No Next.js server actions or API routes for business operations.
- NestJS owns all REST endpoints and business-operation orchestration.
- No unnecessary Prisma schema changes or migrations. Schema changes must be explicitly scoped and approved.
- No fake, demo, or placeholder ERP values unless explicitly working on documented demo-data flows under `docs/operations/demo-data.md`.
- Preserve current module boundaries across apps and packages. Do not cross-wire unrelated domain concerns.
- Preserve existing ERP workflows, access models, and endpoint contracts. Do not redesign them without explicit scope approval.
- `apps/web` is an API consumer only. `apps/api` is the only backend entry point.

## 3. Current Project State

- The repository checkpoint is beyond **Prompt 45**.
- Recent completed milestones include:
  - Prompt 42: Customer 360 Profile + Transaction History.
  - Prompt 43: Real Capita login branding and visual polish.
  - Prompt 44: cross-machine live-demo workflow plus update/start/stop scripts.
  - Prompt 45: refreshed README and runbook.
- Active continuation scope must always be read from the latest `docs/handoffs/` scope/status files.
- Do not treat Prompt 46 work as checkpointed until git history confirms it; Prompt 46B/46C may be present as active uncommitted work.
- Do not invent next-feature scope. Read the latest handoff scope/status docs for continuation guidance.

## 4. Canonical Documentation Reading Order

New agents should read docs in this order before making changes:

1. **AGENTS.md** — this file; operating guide and architecture rules.
2. **docs/handoffs/foundation-status.md** — cumulative project state, route inventory, authorization matrix, and implementation history.
3. **Latest prompt scope/status docs** — e.g. `docs/handoffs/prompt-42-scope.md`, `docs/handoffs/prompt-42b-status.md`, `docs/handoffs/prompt-42c-status.md` for the active continuation scope.
4. **docs/operations/demo-data.md** — when demo/UAT seed data matters for testing or verification.
5. **docs/operations/phase-1-route-inventory.md** — when routes, modules, or access-role surfaces matter.
6. **docs/release/demo-readiness-guide.md** and **docs/uat/phase-1-demo-walkthrough.md** — when preparing demos or stakeholder-facing flows.
7. **docs/architecture/phase-1-architecture-baseline.md** — when architectural context or use-case/ERD reference is needed.

## 5. Implementation Discipline

- Read relevant docs first. Understand the existing module surface, access rules, and contracts before writing code.
- Make only scoped changes. Do not expand beyond the approved prompt scope.
- Preserve verified commands (`corepack pnpm docker:migrate`, `docker:bootstrap`, `docker:smoke`, `seed:demo`, `seed:demo:verify`, `backup:db`, `ops:env-check`, etc.) and the established architecture.
- Update the relevant handoff status doc when a prompt is completed.
- Never stage unsafe or generated files (see Git/checkpoint discipline below) unless explicitly requested.

## 6. Verification Expectations

- Prefer targeted/focused tests first (e.g. single service spec or single Playwright spec relevant to the change).
- Then run the full validation suite when the change scope requires it: `corepack pnpm lint`, `typecheck`, `build`, `test`.
- For Docker-based changes, rebuild and smoke: `docker compose up -d --build`, `corepack pnpm seed:demo`, `seed:demo:verify`, `corepack pnpm docker:smoke`.
- For UI changes, verify at 1440px, 1366px, and 1024px widths as established by recent prompt QA practice.
- Preserve the repository's established validation style documented in recent status files.

## 7. Git and Checkpoint Discipline

- Respect the project's safe checkpoint flow: stage only intentional, reviewed changes; commit with descriptive messages; verify before push.
- Never stage or commit these paths unless explicitly requested:
  - `.env` and local env overrides
  - `.env.tunnel-backup` and `.env.tunnel-backup-*`
  - `Caddyfile.tunnel`
  - `backups/` and `*.dump` files
  - `node_modules/`, `dist/`, `.next/`
  - `test-results/`, `playwright-report/`
  - `.playwright-mcp/`, `.live-demo/`
  - `*.tsbuildinfo`
- Update the handoff docs (`docs/handoffs/`) as part of the checkpoint when completing a prompt.

## 8. Repository-Local Droid Skills

- Repository-local Droid skills live under `.factory/skills/<skill-name>/SKILL.md`.
- These skills supplement `AGENTS.md` and the existing `docs/handoffs/` continuity system; they do not replace the Markdown handoff memory.
- Keep Droid skill edits scoped to agent-infrastructure tasks unless explicitly requested.
- When switching between Codex App and Droid CLI implementation lanes, follow `docs/operations/agent-handoff-protocol.md`; it defines lane-switching discipline and does not replace this guide or `docs/handoffs/`.

## Verified Local URLs

- Web: `http://localhost:3000` (canonical browser origin; `127.0.0.1:3000` redirects here)
- API: `http://localhost:3333`
- API health: `http://localhost:3333/api/v1/health`
- API readiness: `http://localhost:3333/api/v1/health/ready`
- Swagger: `http://localhost:3333/api/docs`
- PostgreSQL: `localhost:5432`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`

## Key Commands Quick Reference

| Purpose | Command |
|---|---|
| Install deps | `corepack pnpm install` |
| Dev both apps | `corepack pnpm dev` |
| Dev web only | `corepack pnpm dev:web` |
| Dev api only | `corepack pnpm dev:api` |
| Lint | `corepack pnpm lint` |
| Typecheck | `corepack pnpm typecheck` |
| Build | `corepack pnpm build` |
| All tests | `corepack pnpm test` |
| Full verify | `corepack pnpm verify` |
| Docker full stack | `docker compose up -d --build` |
| Docker infra only | `corepack pnpm docker:infra` |
| Docker migrate | `corepack pnpm docker:migrate` |
| Docker bootstrap | `corepack pnpm docker:bootstrap -- --company-name ... --admin-email ... --admin-password ...` |
| Docker smoke | `corepack pnpm docker:smoke` |
| Seed demo data | `corepack pnpm seed:demo` |
| Verify demo data | `corepack pnpm seed:demo:verify` |
| Reset demo data | `corepack pnpm seed:demo:reset` |
| Backup DB | `corepack pnpm backup:db` |
| Verify backup | `corepack pnpm verify:backup -- --file <path>` |
| Restore DB (dry-run) | `corepack pnpm restore:db -- --file <path> --dry-run` |
| Env safety check | `corepack pnpm ops:env-check -- --strict` |
| Prisma generate | `corepack pnpm prisma:generate` |
| Prisma migrate deploy | `corepack pnpm prisma:migrate:deploy` |
