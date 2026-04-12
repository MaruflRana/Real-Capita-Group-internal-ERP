# Prompt 21 Scope

Prompt 21 should continue from the Prompt 20 frontend financial reporting baseline without reworking the locked stack, auth/session model, or the existing Prompt 12 through Prompt 20 slices.

## Current Baseline

- Prompt 12 through Prompt 18 frontend modules remain in place and verified.
- Prompt 19 provides backend reporting endpoints for:
  - `/api/v1/companies/:companyId/accounting/reports/trial-balance`
  - `/api/v1/companies/:companyId/accounting/reports/general-ledger`
  - `/api/v1/companies/:companyId/accounting/reports/profit-loss`
  - `/api/v1/companies/:companyId/accounting/reports/balance-sheet`
- Prompt 20 added frontend reporting routes for:
  - `/accounting/reports/trial-balance`
  - `/accounting/reports/general-ledger`
  - `/accounting/reports/profit-loss`
  - `/accounting/reports/balance-sheet`
- Prompt 20 added shared reporting infrastructure in:
  - `apps/web/src/features/financial-reporting/*`
  - `apps/web/src/lib/api/financial-reporting.ts`

## Must Preserve

- Prompt 12 auth/session behavior
- Prompt 13 accounting behavior
- Prompt 14 project/property behavior
- Prompt 15 CRM/property desk behavior
- Prompt 16 HR Core behavior
- Prompt 17 Payroll Core behavior
- Prompt 18 audit/document behavior
- Prompt 19 financial reporting endpoint behavior
- Prompt 20 financial reporting frontend behavior
- strict REST-only browser-to-API boundary
- `apps/web` as frontend-only
- Docker-based local runtime and the host-visible MinIO presign behavior used by Prompt 18
- canonical browser verification on `http://localhost:3000`

## Financial Reporting Rules To Preserve

- reporting endpoints remain read-only
- formal statements remain company-scoped
- `POSTED` vouchers remain the source of truth for Prompt 19 reporting
- Prompt 20 pages continue consuming the existing report contracts directly
- trial balance and general ledger filters remain limited to what the current accounting schema can support accurately
- project and cost-center filters remain out of scope until voucher postings carry real generic dimensions
- balance sheet keeps the derived `UNCLOSED_EARNINGS` adjustment until a later prompt explicitly introduces accounting closing flows
- Prompt 20’s explicit UI disclosure of the derived equity adjustment should be preserved unless a later prompt changes the accounting behavior itself

## Must Not Assume

- Do not assume Prompt 21 is automatically an export, dashboard, or closing-workflow prompt unless the next user prompt explicitly assigns that scope.
- Do not redesign the accounting posting engine or voucher schema unless a later prompt explicitly requires a minimal compatibility change.
- Do not casually redesign the Prompt 19 reporting response contracts because Prompt 20 now depends on them directly.
- Do not add Next.js server actions or backend proxy routes for reporting operations.

## Required Starting Point For Prompt 21

- Read:
  - `AGENTS.md`
  - `docs/handoffs/foundation-status.md`
  - `docs/handoffs/prompt-19-status.md`
  - `docs/handoffs/prompt-20-status.md`
  - the explicitly assigned Prompt 21 task or scope from the user
- Preserve the verified local URLs:
  - `http://localhost:3000`
  - `http://localhost:3333`
  - `http://localhost:3333/api/v1/health`
  - `http://localhost:3333/api/docs`
  - `http://localhost:9000`
  - `http://localhost:9001`

## If Prompt 21 Extends Financial Reporting

- `apps/web` must remain frontend-only
- reuse the Prompt 20 reporting infrastructure where practical instead of scattering one-off fetch logic
- keep report rendering aligned with the Prompt 19 response contracts unless the user explicitly approves backend contract changes
- preserve clear loading, empty, validation, and API-error states
- preserve explicit read-only messaging on reporting pages

## Prompt 21 Status

The repo is ready for Prompt 21, but Prompt 21's business scope must be explicitly assigned by the next user prompt.
