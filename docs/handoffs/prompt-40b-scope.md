# Prompt 40B Scope: Printable Business And Periodic Reports Rollout

Prompt 40B must apply the Prompt 40A printable report-generation foundation to the business and periodic financial reports without changing report calculations or backend contracts.

## Source Of Truth

- `AGENTS.md`
- `docs/handoffs/foundation-status.md`
- `docs/handoffs/prompt-39-status.md`
- `docs/handoffs/prompt-40-scope.md`
- `docs/handoffs/prompt-40a-status.md`
- `docs/operations/phase-1-route-inventory.md`
- `docs/release/demo-readiness-guide.md`
- `docs/operations/demo-data.md`

## Allowed Scope

- Apply the shared Prompt 40A printable report components to:
  - `/accounting/reports/business-overview`
  - `/accounting/reports/daily`
  - `/accounting/reports/weekly`
  - `/accounting/reports/monthly`
  - `/accounting/reports/yearly`
- Reuse `PrintableReportLayout`, header, footer, metadata grid, sections, summary table, data table, and notes.
- Keep screen charts/cards/filters as interactive screen-only UI.
- Add or update print-only CSS only where needed for the shared printable report structure.
- Add Playwright coverage for the rollout routes.
- Update handoff and demo docs.

## Must Not Do

- Do not add new accounting calculations.
- Do not add backend endpoints or reporting contracts.
- Do not add database schema changes or migrations.
- Do not add transactional workflows.
- Do not add fake values or hardcoded metrics.
- Do not add `.xlsx` generation.
- Do not add server-side PDF generation.
- Do not redesign all financial statement pages in this prompt.
- Do not deploy, tag, push, or change production configuration.

## Expected Result

- Business Overview, Daily, Weekly, Monthly, and Yearly reports print through the shared A4-style printable template.
- Interactive screen reports continue to render as before.
- Prompt 40C or a later approved prompt can separately handle Trial Balance, General Ledger, Profit & Loss, Balance Sheet, voucher detail, or server-side PDF if explicitly approved.

