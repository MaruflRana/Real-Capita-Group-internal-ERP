# Prompt 24 Status

## Scope Delivered

Prompt 24 delivered Phase 1 export + print readiness only:

- added read-only CSV export for the key finance reports
- added print-friendly browser rendering for the key finance reports
- added practical voucher-detail CSV export and print-friendly rendering
- added selected operational list CSV exports where the existing data shape was already tabular and stable
- added only the minimum shared backend/frontend output helpers needed to support those surfaces
- preserved the locked stack, the strict REST-only boundary, Prompt 22 runtime rules, and Prompt 23 authorization rules

No new ERP business modules, approval engines, `.xlsx` generation, server-side PDF rendering, public sharing, notifications, or fake/demo data features were added.

## Supported Export And Print Matrix

| Area | Route / View | CSV Export | Print-Friendly Output | Notes |
| --- | --- | --- | --- | --- |
| Financial Reports | `/accounting/reports/trial-balance` | yes | yes | backend read-only CSV endpoint |
| Financial Reports | `/accounting/reports/general-ledger` | yes | yes | backend read-only CSV endpoint |
| Financial Reports | `/accounting/reports/profit-loss` | yes | yes | backend read-only CSV endpoint |
| Financial Reports | `/accounting/reports/balance-sheet` | yes | yes | backend read-only CSV endpoint |
| Accounting | `/accounting/vouchers/[voucherId]` | yes | yes | backend read-only CSV endpoint |
| Project & Property | `/project-property/units` | yes | no | frontend paginated CSV from existing list endpoint |
| CRM / Property Desk | `/crm-property-desk/customers` | yes | no | frontend paginated CSV from existing list endpoint |
| CRM / Property Desk | `/crm-property-desk/bookings` | yes | no | frontend paginated CSV from existing list endpoint |
| CRM / Property Desk | `/crm-property-desk/collections` | yes | no | frontend paginated CSV from existing list endpoint |
| HR | `/hr/employees` | yes | no | frontend paginated CSV from existing list endpoint |
| HR | `/hr/leave-requests` | yes | no | frontend paginated CSV from existing list endpoint |
| Payroll | `/payroll/runs` | yes | no | frontend paginated CSV from existing list endpoint |
| Audit & Documents | `/audit-documents/attachments` | yes | no | frontend paginated CSV from existing list endpoint |
| Audit & Documents | `/audit-documents/audit-events` | yes | no | frontend paginated CSV from existing list endpoint |

## Backend Read-Only Export Support Added

New read-only CSV endpoints:

- `GET /companies/:companyId/accounting/reports/trial-balance/export`
- `GET /companies/:companyId/accounting/reports/general-ledger/export`
- `GET /companies/:companyId/accounting/reports/profit-loss/export`
- `GET /companies/:companyId/accounting/reports/balance-sheet/export`
- `GET /companies/:companyId/accounting/vouchers/:voucherId/export`

Supporting backend helpers:

- `apps/api/src/app/common/utils/csv.util.ts`
- `apps/api/src/app/financial-reporting/financial-reporting-exports.ts`
- `apps/api/src/app/vouchers/voucher-exports.ts`

Backend implementation rules preserved:

- all export endpoints remain read-only
- all export endpoints remain company-scoped and guarded by the existing accounting/report access model
- financial export serializers reuse existing reporting/voucher query results instead of duplicating statement logic
- no fake total rows were added outside the real report contracts

## Frontend Output Infrastructure Added

- shared CSV download, file naming, paginated export, and print helpers in `apps/web/src/lib/output.ts`
- shared output action UI in `apps/web/src/components/ui/output-actions.tsx`
- print-aware shell/table styling in:
  - `apps/web/src/app/global.css`
  - `apps/web/src/features/shell/app-shell.tsx`
  - `apps/web/src/components/ui/side-panel.tsx`
  - `apps/web/src/components/ui/table.tsx`

Prompt 24 also fixed one real runtime compatibility issue:

- client-side paginated exports now use the backend list-query page-size contract limit (`100`) instead of exceeding it and failing silently on live pages

## Authorization And UX Behavior Preserved

- export actions are only visible on pages the current session can already access
- finance output remains limited to sessions with the existing accounting/report access
- dashboard, navigation, and forbidden-state behavior from Prompt 23 remain intact
- unsupported print/export actions were not added to unrelated pages
- normal on-screen UX remains intact while print media hides shell/navigation chrome where practical

## Tests Added Or Updated

- Backend:
  - `apps/api/src/app/financial-reporting/financial-reporting-exports.spec.ts`
  - `apps/api/src/app/vouchers/voucher-exports.spec.ts`
  - `apps/api/src/app/vouchers/vouchers.controller.spec.ts`
- Frontend / e2e:
  - `tests/e2e/financial-reporting.spec.ts`
  - `tests/e2e/accounting.spec.ts`
  - `tests/e2e/audit-documents.spec.ts`
  - `tests/e2e/hr-core.spec.ts`
  - `tests/e2e/authorization.spec.ts`
  - `tests/e2e/crm-property-desk.spec.ts`

Representative coverage now includes:

- finance export action visibility by access
- trial balance export and print-ready rendering
- voucher detail export and print-ready rendering
- operational CSV export flows through the shared helper
- backend authorization on the new export endpoints
- export failure surfacing for forbidden/report-error cases
- shared paginated export behavior staying within the backend page-size limit

## Verification Completed

Commands run:

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
docker compose up -d --build
corepack pnpm docker:migrate
corepack pnpm docker:bootstrap -- --company-name "Real Capita" --company-slug "real-capita" --admin-email "admin@example.com" --admin-password "change-me-secure-admin-password"
```

Additional live verification completed against the rebuilt running stack:

- `http://localhost:3333/api/v1/health`
- `http://localhost:3333/api/docs`
- browser login to `http://localhost:3000/login`
- authenticated shell landing on `http://localhost:3000/dashboard`
- finance CSV export + print-friendly rendering for:
  - trial balance
  - general ledger
  - profit & loss
  - balance sheet
- voucher detail CSV export + print-friendly rendering
- operational CSV exports completing on the running stack for:
  - units
  - customers
  - bookings
  - collections
  - employees
  - leave requests
  - payroll runs
  - attachments
  - audit events

For live finance verification, a minimal company-scoped chart-of-accounts chain and posted journal vouchers were created through the existing REST API so the report and voucher output pages could be exercised against real posted data instead of mocks.

## Docs Updated

- `README.md`
- `docs/handoffs/foundation-status.md`
- `docs/handoffs/prompt-24-status.md`
- `docs/handoffs/prompt-25-scope.md`

`docs/operations/deployment.md` was not changed because Prompt 24 did not introduce new deployment-time output infrastructure beyond the existing browser/runtime model.

## Out Of Scope And Still Not Built

- new ERP business modules
- approval workflow engines
- spreadsheet import/editing systems
- `.xlsx` generation
- server-side PDF generation/rendering
- notifications or messaging
- public sharing links
- frontend-owned business routes or server actions
- reporting logic redesigns beyond output serialization/reuse

## Prompt 25 Readiness

Prompt 24 is complete. The repo is ready for Prompt 25 as long as Prompt 25 preserves:

- the locked stack and REST-only boundary
- Prompt 22 runtime/origin/Compose rules
- Prompt 23 authorization and role-aware UX rules
- Prompt 24 read-only output behavior, supported routes, and browser-native print model unless a future prompt explicitly expands them
