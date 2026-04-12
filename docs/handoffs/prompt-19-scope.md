# Prompt 19 Scope

Prompt 19 should continue from the Prompt 18 frontend Audit & Documents baseline without reworking the locked stack, auth/session model, or the existing Prompt 12 through Prompt 18 frontend slices.

## Current Baseline

- Prompt 12 through Prompt 17 frontend modules remain in place and verified.
- Prompt 18 added:
  - `/audit-documents/attachments`
  - `/audit-documents/attachments/[attachmentId]`
  - `/audit-documents/audit-events`
  - reusable audit/document API hooks, forms, and widgets
  - live-verified Docker/browser upload, finalize, link, download, archive, and audit-browse behavior
- Docker runtime now depends on a browser-resolvable `S3_PUBLIC_ENDPOINT` for document presigned URLs; `docker-compose.yml` defaults this to `http://localhost:9000`.

## Must Preserve

- Prompt 12 auth/session behavior
- Prompt 13 accounting behavior
- Prompt 14 project/property behavior
- Prompt 15 CRM/property desk behavior
- Prompt 16 HR Core behavior
- Prompt 17 Payroll Core behavior
- Prompt 18 audit/document behavior
- strict REST-only browser-to-API boundary
- `apps/web` as frontend-only
- Docker-based local runtime and the host-visible MinIO presign behavior used by Prompt 18

## Must Not Assume

- Do not assume the next business module or workflow slice without explicit prompt approval.
- Do not re-scope Prompt 19 into OCR, approvals, e-signature, public sharing, report builder, or other workflow-heavy document features unless explicitly requested later.
- Do not redesign backend attachment or audit contracts unless a later prompt explicitly requires a minimal compatibility change.

## Required Starting Point For Prompt 19

- Read:
  - `AGENTS.md`
  - `docs/handoffs/foundation-status.md`
  - `docs/handoffs/prompt-18-status.md`
  - the explicitly assigned Prompt 19 task or scope from the user
- Confirm the approved scope before coding if Prompt 19 introduces a new business slice.
- Preserve the verified local URLs:
  - `http://localhost:3000`
  - `http://localhost:3333`
  - `http://localhost:3333/api/v1/health`
  - `http://localhost:3333/api/docs`
  - `http://localhost:9000`
  - `http://localhost:9001`

## Prompt 19 Status

The repo is ready for Prompt 19, but Prompt 19's business scope must be explicitly assigned by the next user prompt.
