# Prompt 11 Status

## Implemented

- Prompt 11 added the backend Audit Trail + Attachments / Document Infrastructure API on top of the Prompt 10 payroll foundation.
- Prisma schema expansion added:
  - `attachments`
  - `attachment_links`
  - `audit_events`
  - supporting enums for attachment status/entity type and audit category/entity type
- Backend attachment module with company-scoped REST APIs for:
  - upload intent creation
  - upload finalization
  - attachment detail and list
  - normalized entity linking
  - link archive
  - attachment archive
  - secure download URL generation
- Backend audit module with company-scoped REST APIs for:
  - audit event list with filtering/pagination
  - audit event detail
- Explicit audit instrumentation added to existing flows for:
  - auth login/refresh/logout success
  - company mutations
  - location mutations
  - department mutations
  - user mutations
  - role assignment add/remove
  - voucher posting
  - booking creation
  - sale-contract creation
  - payroll posting
  - attachment upload/link/archive actions
- Swagger documentation for all Prompt 11 attachment and audit endpoints.
- Scoped backend tests for attachment/link validation and audit service querying plus updates to existing affected specs.

## Database Logic Added

- Migration `20260316223000_prompt_11_audit_attachments` adds:
  - Prompt 11 attachment and audit enums
  - `attachments`
  - `attachment_links`
  - `audit_events`
  - company-scoped foreign keys and supporting list/filter indexes
  - uploader/archive actor foreign keys for attachments
  - creator/remover actor foreign keys for attachment links
  - actor foreign key for audit events
- `attachments` remain metadata-only and store:
  - `companyId`
  - `storageBucket`
  - `storageKey`
  - `originalFileName`
  - `mimeType`
  - `sizeBytes`
  - optional `checksumSha256`
  - optional `objectEtag`
  - `uploadedById`
  - status/timestamps for upload completion and archive
- `attachment_links` keep one normalized attachment-to-entity record per entity reference.
- `audit_events` remain append-oriented and store actor/company/target/request metadata without storing secrets or raw tokens.
- The Prompt 11 migration was captured as a concrete SQL migration after `prisma migrate dev` detected prior local migration drift and requested a destructive reset. The resulting SQL migration applies cleanly with `prisma migrate deploy` and avoids resetting the existing local database.

## New Authorization Behavior

- Prompt 4 auth remains intact.
- Prompt 5 company-admin baseline remains intact.
- Prompt 6 accounting access remains intact.
- Prompt 8 `company_sales` access remains intact.
- Prompt 9 `company_hr` access remains intact.
- Prompt 10 `company_payroll` access remains intact.
- Prompt 11 attachment routes require authenticated company-scoped access and then apply entity-type role validation:
  - `COMPANY`, `USER`: `company_admin`
  - `EMPLOYEE`, `PAYROLL_RUN`: `company_admin`, `company_hr`, `company_payroll`
  - `PROJECT`, `UNIT`, `CUSTOMER`, `BOOKING`, `SALE_CONTRACT`: `company_admin`, `company_sales`
  - `VOUCHER`: `company_admin`, `company_accountant`
- Prompt 11 audit read routes require `company_admin`.
- Cross-company document and audit access remains blocked.

## Endpoints Added

### Attachments

- `GET /api/v1/companies/:companyId/attachments`
- `POST /api/v1/companies/:companyId/attachments/uploads`
- `POST /api/v1/companies/:companyId/attachments/:attachmentId/finalize`
- `GET /api/v1/companies/:companyId/attachments/:attachmentId`
- `POST /api/v1/companies/:companyId/attachments/:attachmentId/links`
- `POST /api/v1/companies/:companyId/attachments/:attachmentId/links/:attachmentLinkId/archive`
- `POST /api/v1/companies/:companyId/attachments/:attachmentId/archive`
- `POST /api/v1/companies/:companyId/attachments/:attachmentId/download-url`

### Audit Events

- `GET /api/v1/companies/:companyId/audit-events`
- `GET /api/v1/companies/:companyId/audit-events/:auditEventId`

## Query And Validation Notes

- Attachment list supports pagination/sort plus filters for:
  - `status`
  - `entityType`
  - `entityId`
  - `mimeType`
  - `uploadedByUserId`
- Non-admin attachment listing requires explicit entity scoping.
- Audit-event list supports pagination/sort plus filters for:
  - `category`
  - `eventType`
  - `actorUserId`
  - `targetEntityType`
  - `targetEntityId`
  - `dateFrom`
  - `dateTo`
  - `requestId`
- Invalid entity references, cross-company link attempts, invalid date ranges, and unsafe attachment state transitions return explicit structured API errors.

## Attachment Upload / Download Behavior In This Phase

- Prompt 11 uses a two-step direct-upload flow:
  1. `POST .../attachments/uploads` creates attachment metadata in `PENDING_UPLOAD` state and returns a short-lived presigned `PUT` URL.
  2. The client uploads the object directly to MinIO/S3-compatible storage.
  3. `POST .../attachments/:attachmentId/finalize` validates the uploaded object in storage and transitions the attachment to `AVAILABLE`.
- Secure download uses `POST .../attachments/:attachmentId/download-url` to return a short-lived presigned read URL.
- API storage validation continues to use `S3_ENDPOINT`.
- Host-facing presigned URLs now use `S3_PUBLIC_ENDPOINT` when it is defined, which is required for Dockerized local development because the API container reaches MinIO at `http://minio:9000` while operators reach it at `http://localhost:9000`.
- Attachments are archived softly. Prompt 11 does not hard-delete objects or metadata.

## Audit Coverage In This Phase

- Prompt 11 writes audit events with explicit service-layer calls and keeps the behavior understandable and testable.
- Event types added in this phase:
  - `auth.login.succeeded`
  - `auth.session.refreshed`
  - `auth.session.logged_out`
  - `admin.company.created`
  - `admin.company.updated`
  - `admin.company.activated`
  - `admin.company.deactivated`
  - `admin.location.created`
  - `admin.location.updated`
  - `admin.location.activated`
  - `admin.location.deactivated`
  - `admin.department.created`
  - `admin.department.updated`
  - `admin.department.activated`
  - `admin.department.deactivated`
  - `admin.user.created`
  - `admin.user.updated`
  - `admin.user.access_activated`
  - `admin.user.access_deactivated`
  - `admin.user_role.assigned`
  - `admin.user_role.removed`
  - `accounting.voucher.posted`
  - `crm.booking.created`
  - `crm.sale_contract.created`
  - `payroll.run.posted`
  - `attachment.upload.initiated`
  - `attachment.upload.finalized`
  - `attachment.link.created`
  - `attachment.link.removed`
  - `attachment.archived`

## Environment And Runtime Notes

- Prompt 11 adds one new environment variable:
  - `S3_PUBLIC_ENDPOINT`
- Docker Compose development startup now runs:
  - `CI=true pnpm install --frozen-lockfile`
  - before Prisma generate / Nx API dev startup
  - before Next.js web startup
- This keeps the named workspace `node_modules` volume aligned with lockfile changes and avoids stale dependency failures after package additions.
- Docker Compose API and web healthcheck start periods were increased to tolerate cold-start install + build time.

## Verification Commands

```powershell
corepack pnpm prisma:format
corepack pnpm prisma:generate
corepack pnpm prisma:migrate:deploy
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test:api
corepack pnpm test
docker compose up -d --build
```

Live verification completed against the running stack for:

- health
- Swagger
- auth login/me
- company-scoped admin mutation via location create
- attachment upload intent
- direct object upload to MinIO through a presigned URL
- attachment finalize
- attachment link create
- attachment list/detail
- attachment download URL generation and content retrieval
- audit-event list/detail filtering by request ID
- cross-company attachment read rejection
- cross-company audit read rejection
- web shell availability

Live verification created local bootstrap companies `prompt-eleven-alpha` and `prompt-eleven-beta` plus company-scoped test records used for location, attachment, and audit checks.

## Intentionally Out Of Scope

- Frontend document screens
- OCR or text extraction
- Virus scanning
- Approval or review workflow engines
- Versioned document workflow
- E-signature flows
- Public sharing
- Report generation
- Hard-delete file lifecycle
- File proxying through the API for large objects
- Fake/demo ERP data
- Next.js backend routes or server actions

## Ready State

Prompt 11 delivered the minimum production-grade backend Audit Trail + Attachments / Document Infrastructure API needed for metadata-only documents, secure direct upload/download preparation, normalized entity links, explicit audit logging, and operator/admin retrieval while preserving the Prompt 4-10 foundations. The repo is ready for Prompt 12.
