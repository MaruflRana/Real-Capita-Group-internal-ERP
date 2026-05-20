# Prompt 48D-R Status: Finalize Business Overview Flagship Financial Trend Visual

## Why 48D-R Was Needed After 48D

Prompt 48D improved the Business Overview page hierarchy and layout, including merging two trend cards into one `ExecutiveTrendChartCard`. However, the merged chart still carried 5 series (revenue, expenses, net P/L, contracted sales, collected sales), mixing two different data sources and two different business questions into one visual. This contradicted the approved 48A architecture:

> "Business Overview = core KPIs + one premium financial performance trend chart + period table + assumptions."

The 5-series mix created semantic confusion — posted accounting voucher data alongside CRM/property commercial data in the same bar chart — and visual overload (5 bars per period bucket). Prompt 48D-R completes that blueprint by reducing the flagship chart to 3 core financial series and upgrading the chart rendering to support a clear bar+line composition.

## What Business Overview Chart Arrangement Existed Before 48D-R

Before 48D-R, the "Performance trend" section contained one `ExecutiveTrendChartCard` with 5 series:

| Series | Data source | Chart rendering | Business question |
|---|---|---|---|
| Revenue | Posted vouchers (accounting) | Bar | "How does posted revenue move?" |
| Expenses | Posted vouchers (accounting) | Bar | "How do posted expenses move?" |
| Net result | Posted vouchers (accounting) | Bar | "What is the period bottom line?" |
| Contracted sales | CRM/property records | Bar | "How do contracted sales move?" |
| Collected sales | CRM/property records | Bar | "How do collected sales move?" |

Problems:
- Two different data sources (posted vouchers vs CRM/property) mixed in one chart, creating semantic confusion
- 5 bars per period bucket made the chart visually crowded
- Contracted and collected sales were already visible in the supporting KPI cards above, creating redundancy
- Net P/L was a bar that sat alongside revenue and expenses, making it harder to visually track the bottom-line trend

## Whether Visuals Were Merged, Replaced, or Reduced

**Reduced and upgraded** — the chart was not merged (48D already merged two cards into one), but 48D-R:

1. **Reduced** from 5 series to 3 core financial series: Revenue, Expenses, Net result
2. **Removed** contracted sales and collected sales from the chart (they remain in the KPI cards above)
3. **Upgraded** the chart rendering from `BarChart` to `ComposedChart` so Net result renders as a line overlay instead of a third bar

## The Final Flagship Chart Decision and Why It Was Chosen

### Final composition: 3-series bar+line chart

| Series | Data source | Chart rendering | Tone | Why |
|---|---|---|---|---|
| Revenue | Posted vouchers | Bar | revenue (green) | Core financial magnitude |
| Expenses | Posted vouchers | Bar | expense (rose) | Core financial magnitude |
| Net result | Posted vouchers | Line overlay | balance (blue) | Bottom-line trend — clearly distinct from bars |

### Why this was chosen

1. **One clear story**: "Revenue minus expenses equals the net result" — the chart tells exactly one business story, not two mixed stories
2. **Bar+line separation**: Net P/L as a line overlay makes the trend immediately readable — above zero = profit, below zero = loss. Bars show magnitude; the line shows the bottom-line trajectory
3. **No CRM mixing**: Contracted and collected sales belong to CRM/property records, not posted accounting vouchers. Mixing them in the same chart created semantic confusion (different data sources, different source dates, different business meaning)
4. **No redundancy**: Contracted and collected sales are already in the supporting KPI cards. Putting them also in the chart duplicated information
5. **Executive clarity**: An executive can scan the chart in under 5 seconds and understand: "Revenue bars are tall, expense bars are short, the net result line is above zero — we're profitable"

### What was removed from the chart

- Contracted sales series (CRM/property data) — already visible in KPI cards
- Collected sales series (CRM/property data) — already visible in KPI cards

### What was preserved

- All 6 KPI metrics remain in the executive summary section
- Revenue, expenses, and net P/L totals remain in the chart legend
- Period breakdown table retains all columns including contracted sales, collected sales, bookings, contracts, collections
- Calculation notes remain intact
- Printable report template remains intact
- Export/print actions remain intact

## Exact Files Changed (2 files)

### Modified (2 Prompt 48D-R-specific files):

- `apps/web/src/features/analytics/components.tsx` — replaced `BarChart` import with `ComposedChart` + `Line`; added `ChartSeriesType` ('bar' | 'line') to `ChartSeries` type; updated `ExecutiveTrendChart` to render bar and line series separately using `ComposedChart`; removed unused `maxValue` variable; changed empty-state detection from `maxValue <= 0` to `hasAnyValue` check (so line-only charts also render correctly)
- `apps/web/src/features/financial-reporting/business-report-page.tsx` — reduced `getPerformanceTrend` from 5 values to 3 (removed contractedSales, collectedSales); changed series from 5 to 3 with explicit `type` property ('bar' for revenue/expenses, 'line' for profitLoss); updated section title from "Financial performance and commercial activity" to "Financial performance"; updated section description and insight text to focus on the P/L story; updated chart description and insight text

### Net diff for 48D-R specifically: approximately 30 insertions, 40 deletions

## Validation Results

| Check | Command | Result |
|---|---|---|
| Lint | `corepack pnpm lint` | Passed — 0 errors, pre-existing warnings only |
| Typecheck | `corepack pnpm typecheck` | Passed for 5 projects |
| Build | `corepack pnpm build` | Passed for 5 projects, all routes present |
| Diff whitespace | `git diff --check` | Passed — CRLF warnings only, no content errors |
| Docker rebuild | `docker compose up -d --build --force-recreate web` | Passed, all 4 services healthy |

## Visual QA Routes and Results

| Route | Width | Result |
|---|---|---|
| `/accounting/reports/business-overview` | 1440px | NO_OVERFLOW, flagship chart shows Revenue bar + Expenses bar + Net result line, 3 legend items, executive summary intact |
| `/accounting/reports/business-overview` | 1366px | NO_OVERFLOW, chart renders cleanly |
| `/accounting/reports/business-overview` | 1024px | NO_OVERFLOW, chart renders cleanly |
| `/dashboard` | 1440px | NO_OVERFLOW, unaffected by 48D-R changes |

Screenshots saved to `.tmp/prompt-48d-r-review/`.

## What Remains for Broader Business Overview Improvement After 48D-R

The Business Overview visual architecture now fully matches the approved 48A blueprint:

1. Executive KPI summary (6 metrics with primary Net P/L hierarchy)
2. One flagship financial performance trend chart (Revenue + Expenses bars, Net result line overlay)
3. Period breakdown table (detailed evidence layer)
4. Calculation notes (data-source boundaries)

No further Business Overview visual changes are needed. The page is architecturally complete per the 48A/48D/48D-R scope. Future work may address:
- Business Overview UX/content improvements beyond the visual layer (e.g., narrative context, interactive drill-down)
- 48E final QA and checkpoint across all affected routes
- Rebalancing the chart rendering if executive feedback prefers area charts or other Recharts variants

## No Commit or Push

No staging, commits, or pushes were performed. All Prompt 48D-R changes remain visible in the dirty worktree for supervisor review alongside the cumulative 46B–48D changes.
