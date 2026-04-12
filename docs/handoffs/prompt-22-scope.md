# Prompt 22 Scope

Prompt 22 should continue from the Prompt 21 operational dashboard/home baseline without reworking the locked stack, auth/session model, or the existing Prompt 12 through Prompt 21 slices.

## Current Baseline

- Prompt 12 through Prompt 18 frontend modules remain in place and verified.
- Prompt 19 provides backend reporting endpoints for:
  - `/api/v1/companies/:companyId/accounting/reports/trial-balance`
  - `/api/v1/companies/:companyId/accounting/reports/general-ledger`
  - `/api/v1/companies/:companyId/accounting/reports/profit-loss`
  - `/api/v1/companies/:companyId/accounting/reports/balance-sheet`
- Prompt 20 provides the frontend financial reporting routes and shared reporting infrastructure.
- Prompt 21 upgraded `/dashboard` into a real operational home using frontend-only aggregation in:
  - `apps/web/src/lib/api/dashboard.ts`
  - `apps/web/src/features/dashboard/*`

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
- Prompt 21 dashboard/home behavior
- strict REST-only browser-to-API boundary
- `apps/web` as frontend-only
- Docker-based local runtime and the host-visible MinIO presign behavior used by Prompt 18
- canonical browser verification on `http://localhost:3000`

## Dashboard Rules To Preserve

- `/dashboard` remains the main signed-in landing page unless a later prompt explicitly changes that behavior
- dashboard aggregation remains frontend-only unless a later prompt explicitly approves a minimal read-only backend endpoint
- Prompt 21 summary panels keep using real backend data only
- Prompt 21 recent-activity panels keep using real backend data only
- Prompt 21 pending-work cards keep using only cleanly derived current-state data
- quick actions keep using existing routes only
- section-level dashboard failures must continue surfacing clearly without collapsing the entire page
- the prompt-21 period control stays intentionally simple unless a later prompt explicitly asks for deeper filtering

## Must Not Assume

- Do not assume Prompt 22 is automatically a dashboard analytics expansion, export prompt, approval prompt, or notification prompt unless the next user prompt explicitly assigns that scope.
- Do not redesign the accounting posting engine, voucher schema, or Prompt 19 reporting contracts casually.
- Do not redesign the Prompt 21 dashboard into a BI/report-builder product without explicit scope.
- Do not add Next.js server actions or backend proxy routes for dashboard or reporting operations.

## Required Starting Point For Prompt 22

- Read:
  - `AGENTS.md`
  - `docs/handoffs/foundation-status.md`
  - `docs/handoffs/prompt-20-status.md`
  - `docs/handoffs/prompt-21-status.md`
  - the explicitly assigned Prompt 22 task or scope from the user
- Preserve the verified local URLs:
  - `http://localhost:3000`
  - `http://localhost:3333`
  - `http://localhost:3333/api/v1/health`
  - `http://localhost:3333/api/docs`
  - `http://localhost:9000`
  - `http://localhost:9001`

## If Prompt 22 Extends Dashboard Or Home

- `apps/web` must remain frontend-only
- reuse the Prompt 21 dashboard data layer and shared dashboard UI where practical instead of scattering one-off fetch logic
- keep new dashboard metrics and widgets grounded in existing real endpoints unless the user explicitly approves minimal read-only backend additions
- preserve strong loading, empty, and error states
- preserve company-aware context visibility
- avoid fake/demo operational data

## Prompt 22 Status

The repo is ready for Prompt 22, but Prompt 22's business scope must be explicitly assigned by the next user prompt.
