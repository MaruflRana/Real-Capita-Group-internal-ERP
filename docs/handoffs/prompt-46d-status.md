# Prompt 46D Status: Chart/Data Visualization Brand Palette

## Summary

Prompt 46D completed the third controlled Real Capita color-identity step. It builds directly on the uncommitted Prompt 46B global brand-token refresh and Prompt 46C product-surface polish, and applies a brand-aligned chart/data-visualization palette to the centralized chart token system.

The work remained frontend-only and chart-palette-only. It did not change business data, REST contracts, backend code, Prisma schema, seed data, layouts, print templates, receipt templates, or the login layout.

## Chart Palette Problem Addressed

The existing chart palette used a generic mix of blue, teal, cyan, amber, rose, indigo, magenta, and orange hues that read as a random enterprise palette rather than distinctly Real Capita. Several semantic chart tones (expense, balance, warning, collection, property) reused the same base CSS variable values as generic chart colors (chart-rose, chart-blue, chart-amber, chart-teal, chart-indigo), creating visual redundancy and undermining series differentiation.

## Palette Strategy Implemented

The chart palette now derives its core visual identity from the Real Capita brand family:

- **Brand blue family** (primary operational/action identity):
  - `--chart-blue` = `--brand-blue` (204 100% 36%) — the Real Capita primary blue, used for balance/info tones
  - `--chart-sky` = `--brand-sky` (204 67% 47%) — the logo/sky blue, used for sales tone
  - `--chart-navy` = `--brand-navy` (209 62% 24%) — deep shell/navy, used for audit tone
  - `--chart-indigo` = `--brand-indigo` (226 52% 39%) — deep secondary blue, used for collection tone
  - `--chart-documents` (204 67% 52%) — sky blue variant for information-flow surfaces
  - `--chart-payroll` (204 55% 34%) — blue family with more depth for payroll, distinguishing it from the primary blue
  - `--chart-property` (195 82% 36%) — a teal-blue bridge tone for property/inventory surfaces, maintaining visual distance from pure blue and pure green

- **Brand green family** (growth, trust, favorable outcomes):
  - `--chart-revenue` = `--brand-green` (135 82% 37%) — brand green for revenue/success/positive
  - `--chart-hr` (152 68% 32%) — a slightly shifted green variant for HR/people surfaces, maintaining visual distance from revenue green

- **Semantic preservation**:
  - `--chart-amber` (36 94% 40%) — remains amber for caution/warning/pending
  - `--chart-rose` (352 73% 40%) — remains rose for expense/danger/negative (aligned with `--status-danger`)
  - `--chart-slate` (215 20% 36%) — neutral slate for comparison/de-emphasis/other

The palette provides 15 distinguishable chart tones across the blue family (6 hues with varying lightness), green family (2 hues), semantic amber/rose (2 hues), and neutral slate (1 hue), plus a property-specific teal-blue bridge (1 hue). This preserves categorical differentiation while unifying the visual identity under the Real Capita brand.

## Files Changed

### Central chart token files (Prompt 46D core):

- `apps/web/src/app/global.css` — remapped all 17 chart CSS variables to brand-derived values; removed `--chart-teal` and added `--chart-sky`, `--chart-green`, `--chart-navy` as brand token aliases
- `apps/web/tailwind.config.ts` — refreshed chart color exposure: replaced `chart.teal` with `chart.sky`, `chart.green`, `chart.navy`
- `apps/web/src/features/analytics/components.tsx` — refined HR tone soft/text/primitiveTone from `bg-surface-muted/text-foreground/default` to `bg-status-successSoft/text-status-success/success`; refined Payroll tone from `bg-status-warningSoft/text-status-warning/warning` to `bg-status-infoSoft/text-status-info/info`; adjusted DEFAULT_TONES cycling order to lead with balance/sales before revenue/expense

### No route-specific chart refinements needed:

All chart consumers reference the central `bg-chart-*` Tailwind classes through `CHART_TONE_STYLES` and `inferChartTone`. The token-level changes propagate automatically. No individual dashboard, report, CRM, HR, payroll, or audit component required direct chart-color edits.

### Handoff files:

- `docs/handoffs/foundation-status.md` — added Prompt 46D progress entry
- `docs/handoffs/prompt-46-scope.md` — added Prompt 46D scope and completion direction
- `docs/handoffs/prompt-46d-status.md` — this status document

Prompt 46B and Prompt 46C files remain uncommitted and are still part of the supervisor review set.

## Explicit Deferrals To Prompt 46E

- No layout redesign of any chart card, bar, legend, or component structure.
- No broader route-by-route page redesign beyond chart-specific color needs.
- No print/receipt/report-template recoloring.
- No backend, API, Prisma schema, migration, seed data, auth, routing, role-access, Docker, or script changes.
- No formal claim that the palette is an official corporate standard.

## Validation Results

- `corepack pnpm typecheck`: passed for 5 projects.
- `corepack pnpm build`: passed for 5 projects, including the Next.js web build with all documented routes.
- `docker compose up -d --build`: containers built and running healthy.
- `corepack pnpm seed:demo:verify`: passed for the local Demo/UAT dataset.
- Lint was not run because the Prompt 46D changes were limited to CSS variable remapping, Tailwind config key renaming, and two targeted TSX soft/text/primitiveTone property adjustments with no new logic branches or lint-sensitive code paths.

## Visual QA

Authenticated runtime visual QA was attempted through Playwright MCP browser but the browser context could not resolve localhost or 127.0.0.1 addresses, preventing live chart inspection. The Docker stack was verified healthy with API returning 200 on the health endpoint and web redirecting correctly on the login route.

The chart palette changes are purely token-level (CSS variable value remapping and Tailwind key renames), which means they propagate through the existing `CHART_TONE_STYLES` mapping without requiring structural or layout changes. The typecheck and build passed, confirming that all Tailwind class references resolve correctly against the refreshed token names.

Recommended supervisor verification steps:

1. Start the Docker stack or dev server.
2. Sign in as `demo.admin@demo.realcapita.test` or `demo.sales@demo.realcapita.test`.
3. Review `/dashboard` chart bars, legends, and metric cards.
4. Review `/accounting/reports/business-overview` chart bars and legends.
5. Review `/crm-property-desk/customers/[customerId]` Customer 360 metrics and distributions.
6. Check that chart series are distinguishable, legends are readable, and brand alignment improves without hurting clarity.
7. Verify semantic amber/red still makes sense for warning/danger contexts.
8. Confirm no horizontal overflow or broken chart rendering at 1440px, 1366px, and 1024px.

## QA Caveat

The Playwright MCP browser context could not resolve localhost or 127.0.0.1 during this session, so live authenticated chart QA was deferred to supervisor review. All chart changes are token-level and confirmed by typecheck/build/docker runtime validation.

## Readiness

Prompt 46D is ready for Prompt 46E. Prompt 46E should focus on final QA/checkpoint preparation or any residual brand-alignment work the supervisor identifies after reviewing the uncommitted Prompt 46B + 46C + 46D changes together.
