# Phase 1 Release Notes

## Release Metadata

| Field | Value |
| --- | --- |
| Release name | Real Capita ERP Phase 1 Release Candidate |
| Version / tag | `<release-version-or-tag>` |
| Release date | `2026-04-25` release-candidate deployment/UAT handoff date; production acceptance pending |
| Final git revision | `c04c93e5874f369b3bb47721e0c98bdcbd2b2532` |
| Prompt 27 checkpoint reference | `3bf83f5e` |
| Prompt 29 verification checkpoint | `c04c93e5874f369b3bb47721e0c98bdcbd2b2532` |
| Release status | Release candidate; technically verified for deployment/UAT handoff; stakeholder UAT and sign-off still required. |

## System Purpose

Real Capita ERP Phase 1 is an internal, company-scoped ERP release candidate for core operational administration, accounting, property, CRM, HR, payroll, audit/document, dashboard, output, and operator-run backup/restore workflows.

The release remains within the locked architecture: Next.js frontend-only web app, NestJS REST API, Prisma with PostgreSQL 15, MinIO/S3-compatible storage, Playwright verification, GitHub Actions CI, and Docker Compose for the single-VM deployment baseline.

## Included Modules

- Dashboard
- Org & Security
- Accounting
- Financial Reports
- Project & Property Master
- CRM & Property Desk
- HR
- Payroll
- Audit & Documents
- Audit Events
- CSV export and browser print surfaces documented for Phase 1
- PostgreSQL backup, backup verification, restore dry-run, destructive restore guard, and environment-safety helpers

## Major Capabilities

- Cookie-backed login, logout, refresh-token rotation, and explicit company selection when a user has multiple active company assignments.
- Role-aware module access for `company_admin`, `company_accountant`, `company_hr`, `company_payroll`, `company_sales`, and `company_member`.
- Company-scoped admin setup for companies, locations, departments, users, and role assignments.
- Chart of accounts and voucher draft/detail/posting flow, including rejection of unbalanced posting.
- Read-only financial statements from posted vouchers: trial balance, general ledger, profit & loss, and balance sheet.
- Project/property master data, CRM/property desk flows, HR operations, payroll runs and posting, attachments, and audit events as listed in the route inventory.
- Direct browser-to-storage attachment upload/download through presigned URLs and `S3_PUBLIC_ENDPOINT`.
- CSV export for supported financial, voucher-detail, and selected operational list surfaces.
- Browser-native print-friendly output for financial reports and voucher detail.
- Docker Compose runner-service deployment baseline with migration, bootstrap, smoke, backup, verify-backup, restore dry-run, and env-safety commands.

## Verification Summary

Prompt 26 release-candidate verification recorded:

- `corepack pnpm verify` passed.
- `corepack pnpm lint` passed with pre-existing warnings only.
- `corepack pnpm typecheck` passed.
- `corepack pnpm build` passed.
- `corepack pnpm test` passed with API tests: 154 and Playwright e2e tests: 45.
- Docker Compose runtime smoke passed for web, API readiness, and Swagger.
- PostgreSQL backup was created and verified.
- Restore dry-run completed without database mutation.
- Representative role-access spot checks passed.

Prompt 27 verification recorded:

- `corepack pnpm verify` passed.
- API tests passed: 154.
- Playwright e2e tests passed: 45.

Prompt 28 final verification is recorded in [phase-1-verification-summary.md](phase-1-verification-summary.md).

Prompt 29 deployment/tag handoff verification recorded:

- Starting `git status --short` was clean.
- `HEAD` matched `c04c93e5874f369b3bb47721e0c98bdcbd2b2532`.
- `corepack pnpm verify` passed with pre-existing lint warnings only.
- `docker compose up -d --build` rebuilt and started the release-minded runner services.
- `corepack pnpm docker:migrate` found no pending migrations.
- `corepack pnpm docker:smoke` passed for web, API readiness, and Swagger.
- PostgreSQL backup `backups/postgres/real_capita_erp-20260425T142454Z.dump` was created and verified.
- Restore dry-run completed without database mutation.
- No destructive restore was run.
- Final post-documentation `corepack pnpm verify` also passed.

## Known Limitations

- Stakeholder UAT has not yet been executed or signed off.
- CSV is the only Phase 1 structured export format.
- Browser print is the only Phase 1 print/PDF-from-browser path.
- No `.xlsx` generation or server-side PDF rendering exists in Phase 1.
- No automated scheduled backup service or point-in-time recovery exists in this repo.
- PostgreSQL backup helpers do not back up MinIO/S3 object bytes.
- Production browser sessions outside localhost require HTTPS because auth cookies become `Secure`.
- Real release use requires real secrets, strict env validation, and browser-resolvable `S3_PUBLIC_ENDPOINT`.
- Swagger should not be publicly exposed in production unless intentionally enabled.
- Freshly bootstrapped companies may show empty lists and reports until real UAT data exists.
- The live company-selection branch appears only for users with multiple active company assignments.

## Deployment Requirements

- Docker Compose remains the approved Phase 1 local and single-VM deployment baseline.
- Required services: `web`, `api`, `postgres`, and `minio`.
- Use real production secrets before any production handoff.
- Set production browser origins to HTTPS outside localhost.
- Keep `WEB_APP_URL`, `API_BASE_URL`, and `CORS_ORIGIN` scheme/host compatible.
- Set `S3_PUBLIC_ENDPOINT` to a browser-resolvable storage origin.
- Run `corepack pnpm ops:env-check -- --strict` before production use.
- Create and verify a PostgreSQL backup before release work.
- Back up object storage on the same operational cadence as PostgreSQL.

## UAT And Sign-Off Status

- UAT package is ready.
- Stakeholder UAT execution is pending.
- Sign-off checklist is ready but not completed.
- Do not mark Phase 1 accepted while release-blocking issues remain in authentication, company selection, role access, voucher posting, financial statement correctness, backup verification, restore dry-run, attachment upload/download, or data integrity.

## Key Documents

- [Technical handoff](phase-1-technical-handoff.md)
- [Operator quick start](operator-quick-start.md)
- [Demo readiness guide](demo-readiness-guide.md)
- [Artifact inventory](phase-1-artifact-inventory.md)
- [Verification summary](phase-1-verification-summary.md)
- [Tagging and release guidance](tagging-and-release.md)
- [Route inventory](../operations/phase-1-route-inventory.md)
- [Release checklist](../operations/phase-1-release-checklist.md)
- [Deployment guide](../operations/deployment.md)
- [Backup/restore runbook](../operations/backup-restore.md)
- [UAT package](../uat/README.md)
- [Known limitations](../uat/phase-1-known-limitations.md)
- [Sign-off checklist](../uat/phase-1-signoff-checklist.md)
