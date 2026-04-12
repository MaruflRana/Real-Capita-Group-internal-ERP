# Prompt 18 Scope

Prompt 18 should continue from the Prompt 17 frontend Payroll Core baseline without reworking the locked stack, auth/session model, or the existing Prompt 12 through Prompt 17 frontend slices.

## Goal

Build the production-grade frontend attachment/document management and audit-trail operational slice on top of the existing backend attachment and audit APIs.

## Approved Scope

- attachments list UI
- attachment detail UI
- attachment upload intent and finalize flow UI
- attachment entity-link management UI
- attachment archive and secure download access UI
- audit events list UI
- audit event detail UI

## Allowed

- add document/audit navigation and protected routes in `apps/web`
- build frontend pages, filters, detail surfaces, and disciplined form flows against the existing attachment and audit REST APIs
- reuse the Prompt 12 through Prompt 17 auth, shell, API client, query, and form foundations
- add tests for route protection, upload/link/archive error surfacing, secure-download access flow wiring, and audit list/detail workflows
- make only minimal backend compatibility tweaks if an existing attachment or audit workflow needs a small response-shape, metadata, or selector-data fix for a production-grade frontend
- update handoff docs after completion

## Must Preserve

- Prompt 12 auth/session behavior
- Prompt 13 accounting chart-of-accounts and voucher flows
- Prompt 14 project/property master behavior
- Prompt 15 CRM/property desk behavior
- Prompt 16 HR Core behavior
- Prompt 17 Payroll Core behavior
- strict REST-only browser-to-API boundary
- `apps/web` as frontend-only

## Must Not Touch

- payslip PDF generation
- bank payout/export flows
- accounting report screens
- CRM/property exception workflows unless a later prompt explicitly asks for them
- payroll business rules or posting behavior
- HR business rules or attendance/leave automation
- fake/demo data
- backend attachment or audit redesign unless a minimal compatibility fix is strictly necessary
- Next.js backend routes or server actions for business operations

## Architectural Rules

- keep `apps/web` frontend-only
- keep the strict REST boundary
- use the NestJS API for all attachment and audit operations
- preserve the existing company-scoped role model
- keep direct-upload flows aligned with the current backend upload-intent plus finalize contract
- do not invent audit event types, attachment entity types, or archive rules that are not already present in the backend
- prefer reusable operational table/detail/form/query patterns over one-off page logic

## Delivery Notes For Prompt 18

- Start by inspecting the existing attachment and audit backend endpoints plus the Prompt 12 through Prompt 17 frontend infrastructure.
- Reuse the current attachment upload-intent/finalize/download model exactly and do not replace it with Next.js upload handlers.
- Confirm which supported entity types can receive attachment links before building link-management UX.
- Respect the existing access rules:
  - attachment/document endpoints use the backend document-access role model
  - audit event endpoints are company-admin only
- Keep verification grounded in real backend responses and preserve the existing Docker-based runtime path.

## Done When

- approved document/audit routes exist in the protected shell
- attachment list/detail/upload/link/archive/download flows work against real backend endpoints
- audit event list/detail flows work against real backend endpoints
- Prompt 17 payroll routes still work without regression
- lint, typecheck, build, test, and Docker verification pass again
- handoff docs reflect the actual Prompt 18 end state
