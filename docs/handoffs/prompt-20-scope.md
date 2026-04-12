# Prompt 20 Scope

Prompt 20 should continue from the Prompt 19 backend financial reporting baseline without reworking the locked stack, auth/session model, or the existing Prompt 12 through Prompt 19 slices.

## Current Baseline

- Prompt 12 through Prompt 18 frontend modules remain in place and verified.
- Prompt 19 added backend reporting endpoints for:
  - `/api/v1/companies/:companyId/accounting/reports/trial-balance`
  - `/api/v1/companies/:companyId/accounting/reports/general-ledger`
  - `/api/v1/companies/:companyId/accounting/reports/profit-loss`
  - `/api/v1/companies/:companyId/accounting/reports/balance-sheet`
- Prompt 19 added raw SQL reporting query infrastructure in:
  - `apps/api/src/app/financial-reporting/financial-reporting.repository.ts`
- Prompt 19 did not add frontend report pages.

## Must Preserve

- Prompt 12 auth/session behavior
- Prompt 13 accounting behavior
- Prompt 14 project/property behavior
- Prompt 15 CRM/property desk behavior
- Prompt 16 HR Core behavior
- Prompt 17 Payroll Core behavior
- Prompt 18 audit/document behavior
- Prompt 19 financial reporting endpoint behavior
- strict REST-only browser-to-API boundary
- `apps/web` as frontend-only
- Docker-based local runtime and the host-visible MinIO presign behavior used by Prompt 18

## Financial Reporting Rules To Preserve

- reporting endpoints remain read-only
- formal statements remain company-scoped
- `POSTED` vouchers remain the source of truth for Prompt 19 reporting
- trial balance and general ledger filters remain limited to what the current accounting schema can support accurately
- project and cost-center filters remain out of scope until voucher postings carry real generic dimensions
- balance sheet keeps the derived `UNCLOSED_EARNINGS` adjustment until a later prompt explicitly introduces accounting closing flows
- Prompt 19 response contracts should not be redesigned casually because Prompt 20 may consume them directly

## Must Not Assume

- Do not assume Prompt 20 is automatically a frontend reporting prompt unless the next user prompt explicitly assigns that scope.
- Do not redesign the accounting posting engine or voucher schema unless a later prompt explicitly requires a minimal compatibility change.
- Do not re-scope Prompt 20 into dashboards, exports, PDFs, BI tooling, or workflow-heavy financial close features unless explicitly requested later.

## Required Starting Point For Prompt 20

- Read:
  - `AGENTS.md`
  - `docs/handoffs/foundation-status.md`
  - `docs/handoffs/prompt-19-status.md`
  - the explicitly assigned Prompt 20 task or scope from the user
- Preserve the verified local URLs:
  - `http://localhost:3000`
  - `http://localhost:3333`
  - `http://localhost:3333/api/v1/health`
  - `http://localhost:3333/api/docs`
  - `http://localhost:9000`
  - `http://localhost:9001`

## If Prompt 20 Builds Financial Reporting UI

- `apps/web` must remain frontend-only
- consume the Prompt 19 REST endpoints directly
- do not add Next.js server actions for report business operations
- keep report rendering aligned with the Prompt 19 response contracts unless the user explicitly approves backend contract changes

## Prompt 20 Status

The repo is ready for Prompt 20, but Prompt 20's business scope must be explicitly assigned by the next user prompt.
