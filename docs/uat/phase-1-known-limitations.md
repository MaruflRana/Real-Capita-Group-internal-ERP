# Phase 1 Known Limitations And Deferred Scope

This document records known Phase 1 release-candidate limitations from the handoff and operations docs. It should be reviewed before stakeholder sign-off.

Checkpoint reference: `3bf83f5e`

## Output Limitations

- CSV is the only Phase 1 structured export file format.
- Browser print is the only Phase 1 print/PDF-from-browser path.
- No `.xlsx` generation exists in Phase 1.
- No server-side PDF rendering pipeline exists in Phase 1.
- Supported print-friendly output is limited to financial reports and voucher detail.
- Supported operational output is CSV export only on the listed Phase 1 list pages.

## Backup And Recovery Limitations

- PostgreSQL backup helpers create database dumps only.
- PostgreSQL restore is destructive when run for real and requires explicit `--confirm-destroy-data`.
- Restore dry-run validates restore inputs without mutating data.
- MinIO/S3 object bytes are not backed up by the PostgreSQL backup helpers.
- MinIO/S3 object backup is operator-managed outside the app.
- No automated scheduled backup service exists in this repo.
- No point-in-time recovery exists in this repo.
- Operators must define backup schedule, retention, off-VM copy, and restore drills outside this repo.

## Environment And Runtime Limitations

- Docker Compose is the approved Phase 1 local and single-VM deployment baseline.
- Kubernetes and redesigned runtime architecture are out of scope.
- Non-localhost production browser sessions require HTTPS because auth cookies become `Secure`.
- Production use requires real secrets and strict environment validation.
- `WEB_APP_URL`, `API_BASE_URL`, and `CORS_ORIGIN` must stay scheme/host compatible for browser auth.
- `S3_PUBLIC_ENDPOINT` must be browser-resolvable for attachment upload/download flows.
- Swagger should not be exposed publicly in production unless intentionally enabled.
- Local Docker and Windows file locks can leave stale `.next` or build artifacts after interrupted runs; generated artifacts remain ignored.

## Data And UAT Limitations

- Freshly bootstrapped companies may show empty lists and reports until real UAT data is entered.
- Empty operational pages and empty financial reports are valid when no relevant records exist.
- The live company-selection login branch appears only for users with multiple active company assignments.
- The Prompt 26 live admin data set had one active company assignment, so company selection did not appear in that live smoke; existing Playwright coverage and UAT guidance cover the branch when a multi-company user exists.
- UAT should create only controlled records needed for validation; fake/demo ERP data is not part of Phase 1.

## Module And Workflow Deferred Scope

- No new ERP business modules or CRUD domains beyond the implemented Phase 1 route inventory.
- No public-facing portals.
- No approval workflow engines.
- No notifications or messaging.
- No import systems.
- No fake/demo ERP data.
- No broader permissions service or policy-management UI.
- No password reset, MFA, invite, SSO, or broader org-management flows.
- No OCR/text extraction, virus scanning, e-signature, public-sharing document flows, or document analytics.
- No report builder or dashboard-heavy analytics.
- No payslip PDF, bank payout/export, or broader payroll reporting workflows.
- No project/cost-center filters in financial reporting where posted voucher lines do not carry generic project/cost-center dimensions in the current accounting schema.
- No year-end closing entries; balance sheet includes a derived equity adjustment for unclosed earnings without mutating accounting data.

## Release Acceptance Note

These limitations do not automatically block Phase 1 handoff if stakeholders acknowledge them and no release-blocking UAT issues remain. They must not be represented as delivered capabilities during demos or sign-off.
