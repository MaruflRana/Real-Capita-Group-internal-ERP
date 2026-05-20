# Prompt 48B Status: Remove and Consolidate Redundant Visuals

## Why This Prompt Was Executed

Prompt 48A concluded that the ERP's visual problem is structural redundancy, not merely weak styling. The supervisor approved the audit conclusion and five locked decisions:

1. Remove/consolidate first — yes, remove redundant visuals before redesigning retained ones
2. Recharts — do NOT introduce in 48B; belongs to 48C
3. Daily/Weekly/Monthly/Yearly reports — keep route files reachable by direct URL; do not delete
4. Module analytics panels — remove completely, do not preserve as collapsible sections
5. Dashboard KPI count — target 8 core executive KPIs, not 12+

## What Redundant Visual Structures Were Removed

### D1. Dashboard — removed full duplicated analytics burden

The Dashboard was the most visually dense page in the ERP (~50+ visual elements across 7 sections). After 48B:

- **Removed**: DashboardAnalyticsPanel (entire "Operational analytics" section) — this single section duplicated every module's analytics in full detail
- **Removed**: DashboardSummaryPanel component (4-5 grouped summary panels) — replaced with a compact 8-KPI executive row
- **Removed**: Separate "Active roles" and "Company memberships" card pair — folded role badges into the operational-home context card
- **Kept**: HealthStatusCard, DashboardTimelinePanel (recent activity), DashboardAttentionCard (pending work), DashboardQuickActionTile (quick actions), operational-home context card
- **New**: "Executive KPIs" section showing 8 core metrics in a compact grid: Net profit/loss, Total assets, Draft vouchers, Posted vouchers, Available units, Active bookings, Pending leave requests, Open payroll runs

### D2. Module list pages — removed full analytics panels (28 pages)

Removed analytics panel imports and JSX blocks from every module list page:

**Accounting** (2 pages):
- `vouchers-page.tsx` — removed AccountingAnalyticsPanel
- `chart-of-accounts-page.tsx` — removed AccountingAnalyticsPanel

**Project & Property** (9 pages):
- `projects-page.tsx`, `cost-centers-page.tsx`, `phases-page.tsx`, `blocks-page.tsx`, `zones-page.tsx`, `unit-types-page.tsx`, `unit-statuses-page.tsx`, `units-page.tsx` — removed ProjectPropertyAnalyticsPanel from each

**CRM & Property Desk** (6 pages):
- `customers-page.tsx`, `leads-page.tsx`, `bookings-page.tsx`, `sale-contracts-page.tsx`, `installment-schedules-page.tsx`, `collections-page.tsx` — removed CrmAnalyticsPanel from each

**HR** (6 pages):
- `employees-page.tsx`, `attendance-devices-page.tsx`, `device-mappings-page.tsx`, `attendance-logs-page.tsx`, `leave-types-page.tsx`, `leave-requests-page.tsx` — removed HrAnalyticsPanel from each

**Payroll** (3 pages):
- `salary-structures-page.tsx`, `payroll-runs-page.tsx`, `payroll-posting-page.tsx` — removed PayrollAnalyticsPanel from each

**Audit & Documents** (2 pages):
- `attachments-page.tsx`, `audit-events-page.tsx` — removed AuditDocumentAnalyticsPanel from each

After removal, each module list page now has: header/context, filters/actions, primary operational table/list — no bulky analytics panel pushing the actual work down.

### D3. Business Overview — removed low-value distribution chart

- **Removed**: DistributionChartCard ("Operating-count mix") and its `getActivityDistribution` helper function
- **Kept**: 2 TrendChartCards (revenue/expenses/P&L trend + sales/collections trend), 6 ReportMetricCards, period detail table, assumptions/notes, filters, print/export controls
- **Import cleanup**: Removed `DistributionChartCard` from analytics/components import

### D4. Financial statement pages — removed weak visual summaries

Removed the visual summary section from each of the 4 financial statements:

- `trial-balance-page.tsx` — removed TrialBalanceVisualSummary import and "Visual analysis" section
- `general-ledger-page.tsx` — removed GeneralLedgerVisualSummary import and section
- `profit-and-loss-page.tsx` — removed ProfitAndLossVisualSummary import and section
- `balance-sheet-page.tsx` — removed BalanceSheetVisualSummary import and section

After removal, each financial statement page now has: filters, ReportMetricCards (executive summary), context strip, hierarchy/statement table (the primary value), print/export controls — no separate visual summary section.

### D5. Shared visual primitives — removed unused aliases

- **Removed**: `StackedStatusCard` alias (was `DistributionChartCard`)
- **Removed**: `DistributionLegend` implementation (was a ChartLegend wrapper)
- **Retained**: `ComparisonBarChart`, `ComparisonBarChartCard`, `MiniReportTableCard`, `KpiTrendCard` — still referenced by `module-panels.tsx` and `analytics.tsx` (dead code from page perspective but kept per instruction to leave files in place for future use)
- **Retained**: `DistributionBarList` — still referenced by `module-panels.tsx`

## What Was Consolidated

- Dashboard 4-5 grouped summary panels → single compact 8-KPI executive row
- Dashboard separate roles/memberships cards → folded into operational-home context card
- Trailing whitespace cleaned on 31 lines where analytics panels were removed

## Which Pages Became Leaner

| Page | Before 48B | After 48B |
|---|---|---|
| Dashboard | ~50+ visual elements across 7 sections | ~20 visual elements across 5 sections (KPI row + context + health + timeline + attention + actions) |
| Business Overview | 6 metrics + 3 chart cards + table + notes | 6 metrics + 2 chart cards + table + notes (distribution chart removed) |
| Trial Balance | Filters + 4 metrics + 2 visual summary cards + table | Filters + 4 metrics + table (visual summary removed) |
| General Ledger | Filters + 4 metrics + 2 visual summary cards + table | Filters + 4 metrics + table (visual summary removed) |
| Profit & Loss | Filters + 4 metrics + 2 visual summary cards + hierarchy table | Filters + 4 metrics + hierarchy table (visual summary removed) |
| Balance Sheet | Filters + 5 metrics + 2 visual summary cards + hierarchy table | Filters + 5 metrics + hierarchy table (visual summary removed) |
| All 28 module list pages | Analytics panel (4-7 blocks) above table | Filter bar + table only |

## Shared Visual Primitives Removed vs Retained

| Primitive | Status | Reason |
|---|---|---|
| StackedStatusCard | Removed (alias) | No page-level usage after cleanup |
| DistributionLegend | Removed | No page-level usage after cleanup |
| ComparisonBarChart | Retained | Still referenced by module-panels.tsx (dead code but kept per instruction) |
| ComparisonBarChartCard | Retained | Still referenced by module-panels.tsx |
| MiniReportTableCard | Retained | Still referenced by module-panels.tsx |
| KpiTrendCard | Retained | Still referenced by module-panels.tsx |
| DistributionBarList | Retained | Still referenced by module-panels.tsx |
| TrendBarChart | Retained | Still referenced by module-panels.tsx |
| TrendChartCard | Retained | Used by Business Overview |
| DistributionChartCard | Retained | No direct page usage, but still exported from components.tsx |
| DashboardSummaryPanel | Retained (unused) | Still exists in shared.tsx but no longer imported by dashboard-page.tsx |
| DashboardAnalyticsPanel | Retained (unused) | Still exists in module-panels.tsx but no longer imported by any page |

Note: `module-panels.tsx` and `financial-reporting/analytics.tsx` are now dead code (no page imports them). They remain in place per task instructions but should be cleaned up in 48C when the shared visual design system is rebuilt.

## Exact Files Changed (45 total)

Modified application files (45):
- `apps/web/src/app/global.css` (pre-existing 46B-46I brand changes)
- `apps/web/src/components/ui/erp-primitives.tsx` (pre-existing 46F changes)
- `apps/web/src/features/analytics/components.tsx` (48B: removed StackedStatusCard alias + DistributionLegend)
- `apps/web/src/features/accounting/chart-of-accounts-page.tsx` (48B: removed AccountingAnalyticsPanel)
- `apps/web/src/features/accounting/vouchers-page.tsx` (48B: removed AccountingAnalyticsPanel)
- `apps/web/src/features/audit-documents/attachments-page.tsx` (48B: removed AuditDocumentAnalyticsPanel)
- `apps/web/src/features/audit-documents/audit-events-page.tsx` (48B: removed AuditDocumentAnalyticsPanel)
- `apps/web/src/features/crm-property-desk/bookings-page.tsx` (48B: removed CrmAnalyticsPanel)
- `apps/web/src/features/crm-property-desk/collections-page.tsx` (48B: removed CrmAnalyticsPanel)
- `apps/web/src/features/crm-property-desk/customer-profile-page.tsx` (pre-existing 46C+46F changes)
- `apps/web/src/features/crm-property-desk/customers-page.tsx` (48B: removed CrmAnalyticsPanel)
- `apps/web/src/features/crm-property-desk/installment-schedules-page.tsx` (48B: removed CrmAnalyticsPanel)
- `apps/web/src/features/crm-property-desk/leads-page.tsx` (48B: removed CrmAnalyticsPanel)
- `apps/web/src/features/crm-property-desk/sale-contracts-page.tsx` (48B: removed CrmAnalyticsPanel)
- `apps/web/src/features/crm-property-desk/shared.tsx` (pre-existing 46C+46F changes)
- `apps/web/src/features/dashboard/dashboard-page.tsx` (48B: major restructure — removed analytics section, replaced summary panels with KPI row, merged roles/memberships)
- `apps/web/src/features/dashboard/health-status-card.tsx` (pre-existing 46C+46F changes)
- `apps/web/src/features/dashboard/shared.tsx` (pre-existing 46C+46F changes)
- `apps/web/src/features/financial-reporting/balance-sheet-page.tsx` (48B: removed BalanceSheetVisualSummary)
- `apps/web/src/features/financial-reporting/business-report-page.tsx` (48B: removed DistributionChartCard + getActivityDistribution)
- `apps/web/src/features/financial-reporting/general-ledger-page.tsx` (48B: removed GeneralLedgerVisualSummary)
- `apps/web/src/features/financial-reporting/profit-and-loss-page.tsx` (48B: removed ProfitAndLossVisualSummary)
- `apps/web/src/features/financial-reporting/shared.tsx` (pre-existing 46C+46F changes)
- `apps/web/src/features/financial-reporting/trial-balance-page.tsx` (48B: removed TrialBalanceVisualSummary)
- `apps/web/src/features/hr-core/attendance-devices-page.tsx` (48B: removed HrAnalyticsPanel)
- `apps/web/src/features/hr-core/attendance-logs-page.tsx` (48B: removed HrAnalyticsPanel)
- `apps/web/src/features/hr-core/device-mappings-page.tsx` (48B: removed HrAnalyticsPanel)
- `apps/web/src/features/hr-core/employees-page.tsx` (48B: removed HrAnalyticsPanel)
- `apps/web/src/features/hr-core/leave-requests-page.tsx` (48B: removed HrAnalyticsPanel)
- `apps/web/src/features/hr-core/leave-types-page.tsx` (48B: removed HrAnalyticsPanel)
- `apps/web/src/features/payroll-core/payroll-posting-page.tsx` (48B: removed PayrollAnalyticsPanel)
- `apps/web/src/features/payroll-core/payroll-runs-page.tsx` (48B: removed PayrollAnalyticsPanel)
- `apps/web/src/features/payroll-core/salary-structures-page.tsx` (48B: removed PayrollAnalyticsPanel)
- `apps/web/src/features/project-property/blocks-page.tsx` (48B: removed ProjectPropertyAnalyticsPanel)
- `apps/web/src/features/project-property/cost-centers-page.tsx` (48B: removed ProjectPropertyAnalyticsPanel)
- `apps/web/src/features/project-property/phases-page.tsx` (48B: removed ProjectPropertyAnalyticsPanel)
- `apps/web/src/features/project-property/projects-page.tsx` (48B: removed ProjectPropertyAnalyticsPanel)
- `apps/web/src/features/project-property/shared.tsx` (pre-existing 46C changes)
- `apps/web/src/features/project-property/unit-statuses-page.tsx` (48B: removed ProjectPropertyAnalyticsPanel)
- `apps/web/src/features/project-property/unit-types-page.tsx` (48B: removed ProjectPropertyAnalyticsPanel)
- `apps/web/src/features/project-property/units-page.tsx` (48B: removed ProjectPropertyAnalyticsPanel)
- `apps/web/src/features/project-property/zones-page.tsx` (48B: removed ProjectPropertyAnalyticsPanel)
- `apps/web/src/features/shell/app-shell.tsx` (pre-existing 46B-46I + 47A changes)
- `apps/web/tailwind.config.ts` (pre-existing 46B-46I changes)
- `docs/handoffs/foundation-status.md` (pre-existing cumulative updates)

Net diff: 435 insertions, 768 deletions (333 lines net reduction)

## Validation Results

| Check | Command | Result |
|---|---|---|
| Lint | `corepack pnpm lint` | Passed — 0 errors, pre-existing warnings only |
| Typecheck | `corepack pnpm typecheck` | Passed for 5 projects |
| Build | `corepack pnpm build` | Passed for 5 projects, all routes preserved |
| Diff whitespace | `git diff --check` | Passed — 0 trailing whitespace warnings after cleanup |
| Docker rebuild | `docker compose up -d --build --force-recreate web` | Passed, all 4 services healthy |

## Runtime Visual QA Coverage

Screenshots saved to `.tmp/prompt-48b-review/`:

| Route | 1440px | 1366px | 1024px |
|---|---|---|---|
| Dashboard | screenshot captured | screenshot captured | screenshot captured |
| Business Overview | screenshot captured | — | — |
| Vouchers (representative module page) | screenshot captured | — | — |
| Trial Balance | screenshot captured | — | — |
| Profit & Loss | screenshot captured | — | — |

Visual QA observations:
- Dashboard is materially less overloaded — no analytics section, compact KPI row instead of grouped summary panels
- Module list pages (vouchers) no longer show bulky analytics panels above core tables
- Business Overview retains essential purpose but distribution chart removed
- Financial statement pages focus on statement/table — visual summary sections removed
- No route breaks detected
- No dead spaces from removed panels
- No overflow or responsive regression at 1440px, 1366px, or 1024px

## What Remains for Prompt 48C

Prompt 48C should rebuild the shared visual analytics design system:

1. Redesign retained chart primitives (TrendBarChart, KpiCard, MetricCard, ChartCardShell) for premium quality — possibly introducing Recharts
2. Remove dead-code primitives: ComparisonBarChart, ComparisonBarChartCard, MiniReportTableCard, KpiTrendCard (no page imports after 48B)
3. Remove or refactor dead-code files: module-panels.tsx, financial-reporting/analytics.tsx (no page imports after 48B)
4. Simplify tone system from 18 tones to ~8 core tones
5. Consider line/area chart variants (Recharts or custom) for Business Overview trend
6. Redesign DistributionBarList for future compact distribution use

## Supervisor Judgment Calls or Caveats

1. `module-panels.tsx` and `financial-reporting/analytics.tsx` are now dead code but remain in the repository. They should be cleaned up in 48C.
2. `DashboardSummaryPanel` still exists in `shared.tsx` but is no longer imported by `dashboard-page.tsx`. It may be removed in 48D.
3. The Dashboard KPI section uses data from the same `summaryQuery` but presents it as a flat grid rather than grouped panels. The layout is functional but not visually final — redesign belongs to 48D.
4. The two TrendChartCards on Business Overview were kept per the scope (merge into one belongs to 48D).
5. Daily/Weekly/Monthly/Yearly report pages are intact and reachable by direct URL (not deleted per supervisor decision).
6. CRLF/LF line-ending warnings are cosmetic and do not affect behavior.

## No Commit or Push

No staging, commits, or pushes were performed. All changes remain visible in the dirty worktree for supervisor review.
