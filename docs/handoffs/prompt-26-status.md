# Prompt 26 Status

## Scope Delivered

Prompt 26 completed the Phase 1 release-candidate audit and UAT readiness pass.

This phase added release-readiness documentation, verified the current ERP surface, and fixed generated-file hygiene only. It did not add ERP business modules, CRUD domains, dashboards, workflow engines, export formats, backup infrastructure, fake/demo data, public pages, Next.js backend routes, or server actions.

## Audit Completed

The audit covered:

- locked stack and REST-only boundary
- Docker Compose runner-service baseline
- CI command drift
- local URL consistency
- frontend route inventory from the Next build output and `apps/web/src/app`
- backend API module inventory from NestJS controllers
- protected-route handling in `apps/web/src/proxy.ts`
- role-aware navigation and route-boundary behavior
- shared Phase 1 access matrix in `packages/config/src/access.ts`
- Prompt 25 backup/restore helper behavior
- operations docs, handoff docs, and architecture docs
- generated-file and backup ignore rules

## Fixes Made

- Added `*.tsbuildinfo` to `.gitignore` and `.prettierignore`.
- Removed tracked TypeScript build-info artifacts:
  - `apps/web/tsconfig.tsbuildinfo`
  - `packages/config/tsconfig.tsbuildinfo`
  - `packages/types/tsconfig.tsbuildinfo`
  - `packages/ui/tsconfig.tsbuildinfo`
- Updated the Phase 1 architecture baseline so it includes Prompt 24 CSV/browser-print output support and Prompt 25 backup/restore operations.
- Updated README and deployment/backup docs with release-candidate documentation links.

## Release Candidate Docs Added

- Route and module inventory: `docs/operations/phase-1-route-inventory.md`
- Human UAT checklist: `docs/operations/phase-1-uat-checklist.md`
- Release checklist and caveats register: `docs/operations/phase-1-release-checklist.md`
- Prompt 27 scope handoff: `docs/handoffs/prompt-27-scope.md`

## Verification Completed

Repo validation:

```powershell
corepack pnpm verify
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
corepack pnpm ops:env-check -- --env-file .env.example --allow-placeholders
```

Observed results:

- `corepack pnpm verify` passed.
- `corepack pnpm lint` passed with pre-existing warnings only.
- `corepack pnpm typecheck` passed.
- `corepack pnpm build` passed.
- `corepack pnpm test` passed:
  - API tests: 154 passed
  - Playwright e2e tests: 45 passed
- `.env.example` passed placeholder-safe env validation.

Runtime validation:

```powershell
docker compose up -d --build
corepack pnpm docker:migrate
corepack pnpm docker:bootstrap -- --company-name "Real Capita" --company-slug "real-capita" --admin-email "admin@example.com" --admin-password "change-me-secure-admin-password"
corepack pnpm docker:smoke
corepack pnpm ops:smoke
corepack pnpm backup:db
corepack pnpm verify:backup -- --file backups/postgres/real_capita_erp-20260424T090724Z.dump
corepack pnpm restore:db -- --file backups/postgres/real_capita_erp-20260424T090724Z.dump --dry-run
docker compose ps
```

Observed results:

- Docker Compose rebuilt `api` and `web` runner images and started `postgres`, `minio`, `api`, and `web`.
- `corepack pnpm docker:migrate` found no pending migrations.
- `corepack pnpm docker:bootstrap` completed idempotently against the existing admin/company.
- Runtime smoke passed for web, API readiness, and Swagger.
- Backup created `backups/postgres/real_capita_erp-20260424T090724Z.dump`.
- Backup verification confirmed a `203.8 KiB` file and `428` restore metadata entries.
- Restore dry-run completed without database mutation.
- Compose services were healthy after validation.

## Live Release-Candidate Smoke

Live smoke against the running Docker stack verified:

- API liveness: `http://localhost:3333/api/v1/health`
- API readiness: `http://localhost:3333/api/v1/health/ready`
- Swagger: `http://localhost:3333/api/docs`
- browser login on `http://localhost:3000/login`
- dashboard load
- representative module pages:
  - `/accounting/vouchers`
  - `/accounting/reports/trial-balance`
  - `/project-property/projects`
  - `/crm-property-desk/customers`
  - `/hr/employees`
  - `/payroll/runs`
  - `/audit-documents/attachments`
  - `/org-security/users`
- trial balance CSV export
- trial balance print action invoking `window.print`

The live admin account currently has one active company assignment, so the company-selection branch did not appear in this Docker data set. Existing Playwright coverage still verifies the multi-company selector branch, and the UAT checklist now calls out how to verify it with a controlled multi-company user.

## Role-Access Spot Check

Controlled UAT-only access-test identities were created in the running local Docker database:

- `uat-accountant@example.com` with `company_accountant`
- `uat-hr@example.com` with `company_hr`
- `uat-payroll@example.com` with `company_payroll`
- `uat-sales@example.com` with `company_sales`
- `uat-member@example.com` with `company_member`

Representative API and frontend checks passed:

- admin reached all sampled modules
- accountant reached accounting/reports and was forbidden from HR
- HR reached HR and payroll and was forbidden from accounting
- payroll reached payroll and was forbidden from HR
- sales reached CRM/property desk and was forbidden from payroll
- member reached dashboard and was forbidden from org-security

## Known Remaining Caveats

- `pnpm lint` passes with pre-existing warnings in Org/Security frontend files, API files, and e2e specs.
- Non-localhost production browser sessions require HTTPS because auth cookies become `Secure`.
- `S3_PUBLIC_ENDPOINT` must remain browser-resolvable for attachment upload/download flows.
- PostgreSQL backup/restore does not back up MinIO/S3 object bytes.
- No automated scheduled backup service or point-in-time recovery exists in this repo.
- CSV is the only Phase 1 structured export format.
- Browser print is the only Phase 1 print/PDF-from-browser path; no server-side PDF rendering exists.
- Freshly bootstrapped companies may show empty lists/reports until real UAT data is entered.

## Files Added

- `docs/operations/phase-1-route-inventory.md`
- `docs/operations/phase-1-uat-checklist.md`
- `docs/operations/phase-1-release-checklist.md`
- `docs/handoffs/prompt-26-status.md`
- `docs/handoffs/prompt-27-scope.md`

## Files Updated

- `.gitignore`
- `.dockerignore`
- `.prettierignore`
- `README.md`
- `docs/architecture/phase-1-architecture-baseline.md`
- `docs/operations/deployment.md`
- `docs/operations/backup-restore.md`
- `docs/handoffs/foundation-status.md`

`AGENTS.md` was not changed because no durable architecture rule changed.

## Out Of Scope And Still Not Built

- new ERP business modules
- new CRUD domains
- new dashboards or reports
- workflow engines
- new export formats
- new backup infrastructure
- fake/demo ERP data
- public-facing pages
- Next.js backend routes
- Next.js server actions
- `.xlsx` generation
- server-side PDF rendering
- scheduled backup infrastructure
- point-in-time recovery

## Prompt 27 Readiness

Prompt 26 is complete. The repo is ready for Prompt 27 as long as Prompt 27 preserves the locked stack, strict REST-only boundary, Prompt 22 runtime rules, Prompt 23 authorization rules, Prompt 24 output rules, Prompt 25 backup/restore safety behavior, and Prompt 26 release-candidate documentation baseline.
