# Prompt 40C Scope: Printable Financial Statements Rollout

Prompt 40C must apply the Prompt 40A/40B printable report-generation foundation to the formal financial statement pages without changing report calculations or backend contracts.

## Source Of Truth

- `AGENTS.md`
- `docs/handoffs/foundation-status.md`
- `docs/handoffs/prompt-40a-status.md`
- `docs/handoffs/prompt-40b-status.md`
- `docs/operations/phase-1-route-inventory.md`
- `docs/release/demo-readiness-guide.md`
- `docs/operations/demo-data.md`

## Allowed Scope

- Apply the shared printable report components to:
  - `/accounting/reports/trial-balance`
  - `/accounting/reports/general-ledger`
  - `/accounting/reports/profit-loss`
  - `/accounting/reports/balance-sheet`
- Reuse the existing printable report layout, header, footer, metadata grid, sections, summary table, data table, and notes.
- Preserve the existing interactive screen UI, filters, hierarchy tables, drilldown-style sections, and CSV exports.
- Add or update print-only CSS only where needed for the shared printable report structure.
- Add Playwright coverage for the four formal statement routes.
- Update handoff and demo docs.

## Must Not Do

- Do not add new accounting calculations.
- Do not add backend endpoints or reporting contracts.
- Do not add database schema changes or migrations.
- Do not add transactional workflows.
- Do not add fake values or hardcoded metrics.
- Do not add seed data.
- Do not add `.xlsx` generation.
- Do not add server-side PDF generation.
- Do not redesign unrelated financial report pages.
- Do not touch voucher detail unless explicitly approved.
- Do not deploy, tag, push, or change production configuration.

## Expected Result

- Trial Balance, General Ledger, Profit & Loss, and Balance Sheet print through the shared A4-style printable template.
- Interactive screen reports continue to render as before.
- Business Overview, Daily, Weekly, Monthly, and Yearly remain unchanged except for compatibility fixes required by shared printable components.
- Browser print remains the only Phase 1 print/PDF-from-browser path.
