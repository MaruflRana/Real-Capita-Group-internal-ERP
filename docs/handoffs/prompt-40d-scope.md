# Prompt 40D Scope: Final Print/Export QA And Git Checkpoint

Prompt 40D must perform the final print/export quality pass and prepare a safe Git checkpoint after Prompts 40A, 40B, and 40C. It must not expand ERP scope.

## Source Of Truth

- `AGENTS.md`
- `docs/handoffs/foundation-status.md`
- `docs/handoffs/prompt-40a-status.md`
- `docs/handoffs/prompt-40b-status.md`
- `docs/handoffs/prompt-40c-status.md`
- `docs/operations/phase-1-route-inventory.md`
- `docs/release/demo-readiness-guide.md`
- `docs/operations/demo-data.md`

## Allowed Scope

- Final QA for printable reports and CSV export controls across:
  - Business Overview
  - Daily
  - Weekly
  - Monthly
  - Yearly
  - Trial Balance
  - General Ledger
  - Profit & Loss
  - Balance Sheet
  - voucher detail only as an existing regression surface, not a redesign target
- Verify print-media behavior:
  - shell/header/sidebar hidden
  - export/print controls hidden
  - printable header/meta/footer visible
  - summary and relevant table visible
  - screen charts/cards/analytics hidden
  - no obvious clipping, oversized cards, or broken empty states
- Verify CSV export controls remain available where the route inventory says they are available.
- Add or adjust narrowly scoped e2e assertions if QA finds a gap.
- Update handoff/release docs for final print/export readiness.
- Prepare a Git checkpoint if requested or approved in the prompt.

## Must Not Do

- Do not add accounting calculations.
- Do not add backend endpoints or reporting contracts.
- Do not add database schema changes or migrations.
- Do not add transactional workflows.
- Do not add fake values or hardcoded metrics.
- Do not add seed data.
- Do not add `.xlsx` generation.
- Do not add server-side PDF generation.
- Do not redesign report screen UI.
- Do not redesign operational modules.
- Do not deploy, tag, push, or change production configuration unless explicitly requested.

## Expected Result

- All Phase 1 financial report print/export surfaces have final QA evidence.
- Prompt 40A/40B/40C printable report work remains intact.
- Any final fixes are small compatibility fixes only.
- Handoff docs clearly state the final print/export status and any caveats.
- The repo is ready for a safe Git checkpoint after validation.
