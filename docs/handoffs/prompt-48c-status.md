# Prompt 48C Status: Rebuild Retained Visual System and Remove Dead Analytics Infrastructure

## Why This Work Was Needed After 48B

Prompt 48B removed the structural redundancy (module analytics panels, dashboard analytics, financial statement visual summaries, Business Overview distribution chart, and obsolete aliases). However, the 48B audit identified significant dead or stale analytics infrastructure still present in the codebase, and the retained visual system still used custom HTML/CSS bar chart primitives that produced thin, generic, visually weak results unsuitable for executive-facing ERP visuals.

Prompt 48C addresses two goals:
1. Remove confirmed dead analytics infrastructure left behind after 48B.
2. Rebuild the retained shared visual system so remaining visuals become more professional, more decision-oriented, and better suited for later page-level redesign in 48D.

## 1. Dead Analytics Infrastructure Removed

### Entire files deleted (3 files):
- `apps/web/src/features/analytics/module-panels.tsx` (~874 lines) — no page imports after 48B; contained all module analytics panel definitions (Dashboard, Accounting, Project/Property, CRM, HR, Payroll, Audit/Documents)
- `apps/web/src/features/financial-reporting/analytics.tsx` (~288 lines) — no page imports after 48B; contained TrialBalanceVisualSummary, GeneralLedgerVisualSummary, ProfitAndLossVisualSummary, BalanceSheetVisualSummary
- `apps/web/src/features/analytics/hooks.ts` (~169 lines) — only imported by module-panels.tsx (now deleted); contained useDashboardAnalytics, useAccountingAnalytics, useProjectPropertyAnalytics, useCrmAnalytics, useHrAnalytics, usePayrollAnalytics, useAuditDocumentAnalytics

### Dead exports removed from `components.tsx` (6 components):
- `ComparisonBarChart` — only used within deleted files
- `ComparisonBarChartCard` — only used within deleted files
- `MiniReportTableCard` — only used within deleted files
- `KpiTrendCard` — only used within deleted files
- `DistributionBarList` (alias for DistributionChart) — only used within deleted files
- `DistributionChartCard` — only used within deleted files

### Dead component removed from dashboard `shared.tsx`:
- `DashboardSummaryPanel` — defined but no longer imported by dashboard-page.tsx after 48B

### Dead helper removed from `components.tsx`:
- `getPositiveItems` — previously used by ComparisonBarChart and DistributionChart, now unused

### Files and infrastructure intentionally kept:
- `apps/web/src/lib/api/analytics.ts` — still exports type definitions used by components.tsx and could be useful for future data retrieval
- `apps/web/src/components/ui/erp-primitives.tsx` — retained KpiCard, MetricCard, StatusChip, ChartCardShell, AnalyticsGrid, TableShell, PageSection, ModulePageHeader, ModuleSection, FilterCardShell, EmptyStateBlock, DataSourceNote, ReportGrid
- `apps/web/src/features/dashboard/dashboard-page.tsx` — retained 8-KPI executive row, context card, health status, timeline, attention cards, quick actions

## 2. Previously Questionable Primitives — Removal vs Retention Decisions

| Primitive | 48B Status | 48C Decision | Reason |
|---|---|---|---|
| ComparisonBarChart | Retained (referenced by module-panels) | **Removed** | No page-level usage after deleting module-panels and analytics.tsx |
| ComparisonBarChartCard | Retained (referenced by analytics.tsx) | **Removed** | Same as ComparisonBarChart |
| MiniReportTableCard | Retained (referenced by module-panels) | **Removed** | No page-level usage after deleting module-panels |
| KpiTrendCard | Retained (referenced by module-panels) | **Removed** | No page-level usage after deleting module-panels |
| DistributionBarList | Retained (alias) | **Removed** | Only used in module-panels (deleted) |
| DistributionChartCard | Retained (referenced by module-panels) | **Removed** | Only used in module-panels (deleted) |
| DashboardSummaryPanel | Retained (defined in shared.tsx) | **Removed** | Not imported by dashboard-page.tsx |
| TrendBarChart | Retained (used by TrendChartCard) | **Replaced** | Replaced by Recharts-based ExecutiveTrendChart |
| TrendChartCard | Retained (used by Business Overview) | **Replaced** | Replaced by Recharts-based ExecutiveTrendChartCard |

## 3. Recharts Decision and Rationale

**Recharts was introduced.**

Rationale:
- The current custom HTML/CSS TrendBarChart produced visually thin, generic bar charts with minimal visual impact. It relied on div elements styled with Tailwind, offering no tooltips, no responsive container, no grid/axis lines, and no animation.
- The retained Business Overview trend visuals are executive-facing and must look professional and decision-oriented. The custom bar system could not achieve this quality level.
- Recharts provides: proper BarChart/LineChart/AreaChart rendering, ResponsiveContainer, CartesianGrid, XAxis/YAxis with readable tick labels, Tooltip with styled formatting, responsive sizing, animation, and professional-grade chart quality.
- The supervisor approved considering Recharts, and the default expectation was that a proper charting library is likely the better path.
- Recharts is introduced deliberately and minimally for retained high-value trend chart types only. It is not used on module list pages (which have no analytics panels after 48B), nor on the dashboard KPI row (which uses simple cards).

## 4. New Retained Shared Visual System

### Core chart primitives (Recharts-based):
- `ExecutiveTrendChart` — multi-series bar chart using Recharts BarChart with ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, and styled series colors from the simplified tone system
- `ExecutiveTrendChartCard` — ExecutiveTrendChart inside ChartCardShell, providing title, description, insight, footer, and metaLabel context

### Retained utility/surface primitives (unchanged from pre-48C):
- `AnalyticsCard` — wrapper around ChartCardShell
- `AnalyticsGrid` — wrapper around ErpAnalyticsGrid with column config
- `ChartLoadingState` / `AnalyticsLoadingState` — skeleton placeholder
- `ChartEmptyState` / `AnalyticsEmptyState` — empty data state
- `ChartErrorState` — error state
- `AnalyticsIssueBanner` — partial-data warning banner
- `ChartLegend` — legend grid with tone markers and values
- `MetricCardGrid` — grid of MetricCards with auto-tone inference
- `SampleScopeNote` — data scope description

### Retained formatting helpers:
- `formatCount`, `formatCompactCurrency`, `formatPercentValue`, `formatTechnicalLabel`, `formatDateBucketLabel`, `formatAnalyticsValue`, `formatAnalyticsFullValue`

### Simplified tone system:
Reduced from 18 tones to 8 core tones:
- `revenue` (green, success semantics)
- `expense` (rose, danger semantics)
- `balance` (blue, info semantics)
- `warning` (amber, caution semantics)
- `sales` (sky, sales identity)
- `collection` (indigo, collection identity)
- `info` (blue, informational)
- `neutral` (slate, de-emphasis)

Removed tones (mapped to nearest surviving tone):
- `success` → `revenue`
- `positive` → `revenue`
- `danger` → `expense`
- `negative` → `expense`
- `pending` → `warning`
- `property` → `neutral`
- `hr` → `neutral`
- `payroll` → `warning`
- `audit` → `neutral`
- `documents` → `info`

Each tone now includes a `color` property for Recharts bar fill, enabling direct color mapping in chart rendering.

## 5. Route/Component Compatibility Updates

### Business Overview (only active page using trend charts):
- `apps/web/src/features/financial-reporting/business-report-page.tsx` — import changed from `TrendChartCard` to `ExecutiveTrendChartCard`; both `<TrendChartCard>` instances replaced with `<ExecutiveTrendChartCard>`

### No other pages needed updates:
- Dashboard does not use analytics chart components (it uses inline KPI cards)
- Module list pages have no analytics panels after 48B
- Financial statement pages have no visual summary sections after 48B
- Customer 360 does not import from analytics/components

## 6. Files Changed

### Deleted (3 files):
- `apps/web/src/features/analytics/module-panels.tsx`
- `apps/web/src/features/analytics/hooks.ts`
- `apps/web/src/features/financial-reporting/analytics.tsx`

### Modified (48C-specific changes):
- `apps/web/src/features/analytics/components.tsx` — major rebuild: removed 6 dead exports, replaced TrendBarChart/TrendChartCard with Recharts-based ExecutiveTrendChart/ExecutiveTrendChartCard, simplified tone system from 18 to 8 tones, added `color` property to tone styles, removed unused helpers
- `apps/web/src/features/financial-reporting/business-report-page.tsx` — switched from TrendChartCard to ExecutiveTrendChartCard
- `apps/web/src/features/dashboard/shared.tsx` — removed DashboardSummaryPanel and unused KpiCard import

### Modified (cumulative 46B–48C, also includes pre-existing 48B changes):
Full modified file list includes 48 tracked files plus `pnpm-lock.yaml` reflecting the Recharts addition.

### Net diff: 885 insertions, 2910 deletions (2,025-line net reduction)

## 7. Dependency/Package Changes

- `apps/web/package.json` — added `recharts` dependency
- `pnpm-lock.yaml` — updated lockfile with Recharts and its subdependencies

## 8. Validation Results

| Check | Command | Result |
|---|---|---|
| Lint | `corepack pnpm lint` | Passed — 0 errors, pre-existing warnings only |
| Typecheck | `corepack pnpm typecheck` | Passed for 5 projects |
| Build | `corepack pnpm build` | Passed for 5 projects, all routes present |
| Diff whitespace | `git diff --check` | Passed — CRLF warnings only, no content errors |
| Docker runtime | `docker compose ps` | All 4 services healthy |

## 9. Visual QA Routes and Results

| Route | Width | Result |
|---|---|---|
| `/dashboard` | 1440px | Clean — 8-KPI row, context, health, timeline, attention, actions. No analytics panel. No overflow. |
| `/dashboard` | 1024px | Clean — responsive, no overflow. |
| `/accounting/reports/business-overview` | 1440px | Executive summary + 2 Recharts trend charts + period table + assumptions. Charts render with proper bars, grid, axis labels, and tooltips. |
| `/accounting/reports/business-overview` | 1366px | Clean — no overflow. |
| `/accounting/reports/trial-balance` | 1440px | Clean — no visual summary remnants, filters + metrics + table intact. |
| `/accounting/vouchers` | 1440px | Clean — no analytics panel, header + filters + table only. |

Screenshots saved to `.tmp/prompt-48c-review/`.

## 10. What Remains for Prompt 48D

Prompt 48D should redesign retained high-value page visuals using the new shared foundation:

1. **Dashboard** — redesign compact KPI row presentation, timeline, attention cards, context header composition
2. **Business Overview** — merge the two trend cards into one premium financial performance chart, redesign period table presentation
3. **Financial statements** — add inline KPI summaries for TB, GL, P&L, BS where previously removed visual summaries were; redesign BS comparison; redesign UNCLOSED_EARNINGS callout
4. **Customer 360** — redesign identity header, profile metrics, commercial tables, timeline

The retained shared visual foundation (ExecutiveTrendChart/ExecutiveTrendChartCard, ChartLegend, MetricCardGrid, tone system, formatting helpers) is now ready for route-level composition in 48D.

## No Commit or Push

No staging, commits, or pushes were performed. All Prompt 48C changes remain visible in the dirty worktree for supervisor review alongside the cumulative 46B–48B changes.
