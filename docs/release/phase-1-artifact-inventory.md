# Phase 1 Artifact And Document Inventory

This inventory points handoff owners to the files that define the current Phase 1 release candidate. It does not expand product scope.

## Architecture And Scope Baseline

- Agent rules: `AGENTS.md`
- Architecture baseline: [../architecture/phase-1-architecture-baseline.md](../architecture/phase-1-architecture-baseline.md)
- Foundation status: [../handoffs/foundation-status.md](../handoffs/foundation-status.md)
- Prompt 27 status: [../handoffs/prompt-27-status.md](../handoffs/prompt-27-status.md)
- Prompt 28 scope: [../handoffs/prompt-28-scope.md](../handoffs/prompt-28-scope.md)
- Prompt 28 status: [../handoffs/prompt-28-status.md](../handoffs/prompt-28-status.md)
- Prompt 29 scope: [../handoffs/prompt-29-scope.md](../handoffs/prompt-29-scope.md)
- Prompt 29 status: [../handoffs/prompt-29-status.md](../handoffs/prompt-29-status.md)
- Prompt 30 scope: [../handoffs/prompt-30-scope.md](../handoffs/prompt-30-scope.md)

## Release Package

- Release notes: [phase-1-release-notes.md](phase-1-release-notes.md)
- Technical handoff: [phase-1-technical-handoff.md](phase-1-technical-handoff.md)
- Operator quick start: [operator-quick-start.md](operator-quick-start.md)
- Demo readiness guide: [demo-readiness-guide.md](demo-readiness-guide.md)
- Artifact inventory: [phase-1-artifact-inventory.md](phase-1-artifact-inventory.md)
- Verification summary: [phase-1-verification-summary.md](phase-1-verification-summary.md)
- Tagging and release guidance: [tagging-and-release.md](tagging-and-release.md)

## Operations Documents

- Deployment guide: [../operations/deployment.md](../operations/deployment.md)
- Release checklist: [../operations/phase-1-release-checklist.md](../operations/phase-1-release-checklist.md)
- Route inventory: [../operations/phase-1-route-inventory.md](../operations/phase-1-route-inventory.md)
- Operations UAT checklist: [../operations/phase-1-uat-checklist.md](../operations/phase-1-uat-checklist.md)
- Backup/restore runbook: [../operations/backup-restore.md](../operations/backup-restore.md)

## UAT Package

- UAT index: [../uat/README.md](../uat/README.md)
- Feature matrix: [../uat/phase-1-feature-matrix.md](../uat/phase-1-feature-matrix.md)
- Role-wise UAT guide: [../uat/role-wise-uat-guide.md](../uat/role-wise-uat-guide.md)
- Module-wise UAT scenarios: [../uat/module-wise-uat-scenarios.md](../uat/module-wise-uat-scenarios.md)
- Demo walkthrough: [../uat/phase-1-demo-walkthrough.md](../uat/phase-1-demo-walkthrough.md)
- UAT issue log template: [../uat/uat-issue-log-template.md](../uat/uat-issue-log-template.md)
- Sign-off checklist: [../uat/phase-1-signoff-checklist.md](../uat/phase-1-signoff-checklist.md)
- Known limitations: [../uat/phase-1-known-limitations.md](../uat/phase-1-known-limitations.md)

## Key Runtime Files

- Docker Compose: `docker-compose.yml`
- API Dockerfile: `apps/api/Dockerfile`
- Web Dockerfile: `apps/web/Dockerfile`
- Root package scripts: `package.json`
- Root env template: `.env.example`
- Prisma schema: `prisma/schema.prisma`
- Shared access matrix: `packages/config/src/access.ts`
- Web route definitions: `apps/web/src/lib/routes.ts`
- Web proxy/route guard: `apps/web/src/proxy.ts`

## Key App Paths

- API application source: `apps/api/src/app`
- Web application routes: `apps/web/src/app`
- Web API clients: `apps/web/src/lib/api`
- Web feature modules: `apps/web/src/features`
- Shared web output helpers: `apps/web/src/lib/output.ts`
- Shared output action UI: `apps/web/src/components/ui/output-actions.tsx`

## Key Scripts

- Docker bootstrap wrapper: `scripts/docker-bootstrap.mjs`
- Runtime smoke: `scripts/wait-for-stack.mjs`
- PostgreSQL backup: `scripts/backup-postgres.mjs`
- PostgreSQL backup verification: `scripts/verify-postgres-backup.mjs`
- PostgreSQL restore: `scripts/restore-postgres.mjs`
- Env safety check: `scripts/check-env-safety.mjs`
- Playwright web runner helper: `scripts/start-playwright-web.mjs`
- Ops script helpers: `scripts/lib/ops.mjs`

## Test Locations

- Playwright config: `tests/e2e/playwright.config.ts`
- Smoke e2e: `tests/e2e/smoke.spec.ts`
- Authorization e2e: `tests/e2e/authorization.spec.ts`
- Dashboard e2e: `tests/e2e/dashboard.spec.ts`
- Accounting e2e: `tests/e2e/accounting.spec.ts`
- Financial reporting e2e: `tests/e2e/financial-reporting.spec.ts`
- Project/property e2e: `tests/e2e/project-property.spec.ts`
- CRM/property desk e2e: `tests/e2e/crm-property-desk.spec.ts`
- HR core e2e: `tests/e2e/hr-core.spec.ts`
- Payroll core e2e: `tests/e2e/payroll-core.spec.ts`
- Audit/documents e2e: `tests/e2e/audit-documents.spec.ts`
