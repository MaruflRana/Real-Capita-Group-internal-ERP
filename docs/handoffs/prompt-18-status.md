# Prompt 18 Status

## Scope Delivered

Prompt 18 delivered the production-grade frontend Audit & Documents operational slice on top of the Prompt 12 through Prompt 17 baseline:

- Audit & Documents navigation in the authenticated app shell
- attachments list UI with company-aware filters, pagination, uploader lookup, linked-entity context, and status visibility
- attachment detail UI with metadata surface, finalize action, secure download access, normalized entity-link management, and archive actions
- secure attachment upload flow using the backend upload-intent plus direct-upload plus finalize contract
- audit events list UI with company/category/actor/target/date filters and compact metadata previews
- audit event detail UI with an operational detail panel
- reusable audit/document API client methods, TanStack Query hooks, shared forms, shared widgets, and disciplined filter/form handling
- Playwright coverage for protected routing, attachment upload/link/archive/download flows, audit list/detail flows, and backend error surfacing
- handoff docs updated for Prompt 19 continuity

## Frontend Routes Added

- `/audit-documents/attachments`
- `/audit-documents/attachments/[attachmentId]`
- `/audit-documents/audit-events`

## Frontend Infrastructure Added

- Audit/documents API/data layer:
  - typed audit/documents REST client in `apps/web/src/lib/api/audit-documents.ts`
  - audit/document record, query, and payload types in `apps/web/src/lib/api/types.ts`
  - query keys, query hooks, mutations, and invalidation patterns in `apps/web/src/features/audit-documents/hooks.ts`
- Shared audit/documents UI patterns:
  - shared section headers, filter cards, status/category badges, metadata previews, relation summaries, read-only notices, and query-error banners in `apps/web/src/features/audit-documents/shared.tsx`
  - shared upload and link forms in `apps/web/src/features/audit-documents/forms.tsx`
  - shared labels, filter options, metadata formatting, file-size formatting, and presigned-upload helper logic in `apps/web/src/features/audit-documents/utils.ts`
- Route and shell integration:
  - audit/document route constants in `apps/web/src/lib/routes.ts`
  - audit/document navigation in `apps/web/src/features/shell/app-shell.tsx`
  - `/audit-documents/**` route protection in `apps/web/src/proxy.ts`
  - document and audit access visibility in `apps/web/src/components/providers/auth-provider.tsx`
- Reusable operational widgets:
  - linked-entity attachment widget
  - secure upload action surface
  - audit event summary/detail surfaces

## Attachment UX In This Phase

- Attachments list:
  - shows original filename, mime type, size, status, uploader, linked entities, and created timestamp
  - supports filters for entity type, linked entity, uploader, mime type, upload status, and created date range
  - keeps company scope visible at the top of the workspace
- Secure upload:
  - creates attachment metadata through the NestJS API
  - uploads file bytes directly from the browser to the presigned MinIO/S3 URL returned by the backend
  - finalizes the attachment through the REST API after upload success
  - surfaces init/upload/finalize failures directly in the UI
- Attachment detail:
  - keeps status, timestamps, checksum/object etag, and active link count visible together
  - supports secure download access only for finalized attachments
  - supports normalized entity linking and link archive without a polymorphic workflow-heavy form
  - supports attachment archive while keeping metadata visible for traceability

## Audit UI In This Phase

- Audit event list:
  - supports filters for company scope, category, event type, actor, target entity type, target entity id, and created date range
  - shows actor, category, event type, target, request id, created timestamp, and compact metadata preview
- Audit event detail:
  - opens in a side panel
  - keeps payload preview compact and operational
  - avoids raw log-dump behavior

## Backend Compatibility Tweaks Made

- No new NestJS controllers, services, DTOs, or Prisma changes were required for Prompt 18.
- One minimal Docker/runtime compatibility fix was required so browser-driven direct-upload and secure-download URLs work from the host machine:
  - `docker-compose.yml` now defaults `S3_PUBLIC_ENDPOINT` to `http://localhost:9000` when unset
  - `.env.example` now includes `S3_PUBLIC_ENDPOINT=http://localhost:9000`

## Files Added Or Materially Updated

- Frontend routes:
  - `apps/web/src/app/(app)/audit-documents/attachments/page.tsx`
  - `apps/web/src/app/(app)/audit-documents/attachments/[attachmentId]/page.tsx`
  - `apps/web/src/app/(app)/audit-documents/audit-events/page.tsx`
- Audit/document feature slice:
  - `apps/web/src/features/audit-documents/attachments-page.tsx`
  - `apps/web/src/features/audit-documents/attachment-detail-page.tsx`
  - `apps/web/src/features/audit-documents/audit-events-page.tsx`
  - `apps/web/src/features/audit-documents/forms.tsx`
  - `apps/web/src/features/audit-documents/hooks.ts`
  - `apps/web/src/features/audit-documents/shared.tsx`
  - `apps/web/src/features/audit-documents/utils.ts`
- Shared frontend integration:
  - `apps/web/src/lib/api/audit-documents.ts`
  - `apps/web/src/lib/api/types.ts`
  - `apps/web/src/lib/routes.ts`
  - `apps/web/src/components/providers/auth-provider.tsx`
  - `apps/web/src/features/shell/app-shell.tsx`
  - `apps/web/src/proxy.ts`
- Runtime/config docs:
  - `docker-compose.yml`
  - `.env.example`
  - `README.md`
  - `docs/handoffs/foundation-status.md`
  - `docs/handoffs/prompt-18-status.md`
  - `docs/handoffs/prompt-19-scope.md`
- Tests:
  - `tests/e2e/audit-documents.spec.ts`

## Verification Commands

```powershell
$env:NX_WORKSPACE_ROOT='C:\Users\wadud\Documents\New project'
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
docker compose up -d --build
corepack pnpm auth:bootstrap -- --company-name "Real Capita" --company-slug "real-capita" --admin-email "admin@example.com" --admin-password "change-me-secure-admin-password"
```

## Verified Runtime Behavior

- `corepack pnpm lint` passed.
- `corepack pnpm typecheck` passed.
- `corepack pnpm build` passed.
- `corepack pnpm test` passed, including the new Audit & Documents Playwright coverage.
- `docker compose up -d --build` completed with healthy `postgres`, `minio`, `api`, and `web` services.
- `GET http://localhost:3333/api/v1/health` returned `200`.
- `GET http://localhost:3333/api/v1/health/ready` returned `200`.
- `GET http://localhost:3333/api/docs` returned `200`.
- `GET http://localhost:3000/login` returned `200`.
- Browser verification used the canonical `http://localhost:3000` origin.
- Live browser verification against the running Docker stack succeeded for:
  - protected-route redirect to `/login?next=%2Faudit-documents%2Fattachments`
  - login plus explicit `Real Capita` company selection
  - attachments route load
  - secure upload intent plus direct browser upload to MinIO
  - attachment upload finalization through the NestJS API
  - attachment link creation against the company entity reference model
  - secure download URL generation and retrieval
  - attachment link archive
  - attachment archive
  - audit event filter usage plus audit event detail panel

## Out Of Scope And Still Not Built

- OCR/text extraction UI
- virus scanning UI
- approval workflow UI
- e-signature flows
- public sharing flows
- report builder or dashboards
- payslip PDF UI
- bank payout/export UI
- fake/demo data
- Next.js backend routes or server actions for business operations

## Prompt 19 Readiness

Prompt 18 is complete. The repo now has the minimum production-grade frontend Audit & Documents operational UI needed to operate the existing backend attachment and audit modules through the locked REST boundary while preserving Prompt 12 through Prompt 17 behavior. The repo is ready for Prompt 19.
