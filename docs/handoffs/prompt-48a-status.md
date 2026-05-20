# Prompt 48A Status: ERP-Wide Visual Analytics Audit, Redundancy Map, and Redesign Blueprint

## Why This Visual Analytics Workstream Was Opened

The supervisor paused Business Overview improvement because a more foundational issue must be addressed first. The ERP currently contains many visual representations across dashboard, financial reports, operational module pages, and Customer 360. The supervisor's concerns are:

1. Some visuals are redundant — similar charts/representations appear in multiple places.
2. Similar information is communicated repeatedly through different visual forms.
3. Prior visual work (Prompts 31–39, 46D) was technically clean but unsatisfactory in design impact.
4. The ERP needs fewer, stronger, more meaningful, more professional visuals.
5. Some visuals may be better removed or consolidated instead of merely redesigned.
6. If rebuilding from scratch is the best route, that should be considered.

The core design principle: **"Fewer visuals, stronger visuals, clearer business meaning."**

---

## A. Visual Inventory Summary

### Shared Visual Component Library

The ERP's visual system is centralized in two files:

- `apps/web/src/features/analytics/components.tsx` (~40KB) — defines all chart primitives, tone mapping, legend, empty/loading/error states, and compound card wrappers.
- `apps/web/src/features/analytics/module-panels.tsx` (~33KB) — composes module-specific analytics panels using the shared primitives.
- `apps/web/src/components/ui/erp-primitives.tsx` — defines the base `KpiCard`, `MetricCard`, `StatusChip`, `AnalyticsGrid`, `ChartCardShell`, `TableShell`, `PageSection`, `ModulePageHeader`, `ModuleSection`, `FilterCardShell`, `EmptyStateBlock`, `ReportGrid` primitives.

### Visual Primitive Types Currently Defined

| Primitive | Purpose | Lines of Code |
|---|---|---|
| `TrendBarChart` | Multi-series bar chart with time buckets | ~210 |
| `TrendChartCard` | TrendBarChart inside ChartCardShell | ~25 |
| `ComparisonBarChart` | Horizontal comparison bars with percentage-of-total | ~100 |
| `ComparisonBarChartCard` | ComparisonBarChart inside ChartCardShell | ~25 |
| `DistributionChart` | Vertical distribution bars (stacked-style) with share-of-total | ~100 |
| `DistributionBarList` | Alias for DistributionChart | 0 (alias) |
| `DistributionChartCard` | DistributionChart inside ChartCardShell | ~25 |
| `StackedStatusCard` | Alias for DistributionChartCard | 0 (alias) |
| `KpiTrendCard` | MetricCardGrid + TrendBarChart inside ChartCardShell | ~25 |
| `MiniReportTableCard` | Small table inside ChartCardShell | ~80 |
| `AnalyticsCard` | Generic wrapper = ChartCardShell | ~15 |
| `AnalyticsGrid` | ErpAnalyticsGrid wrapper with column config | ~15 |
| `MetricCardGrid` | Grid of MetricCards with auto-tone inference | ~30 |
| `ChartLegend` | Legend grid with tone markers and values | ~50 |
| `DistributionLegend` | ChartLegend wrapper | 0 (alias) |
| `ChartLoadingState` | Skeleton placeholder | ~15 |
| `ChartEmptyState` | EmptyStateBlock wrapper | ~10 |
| `ChartErrorState` | EmptyStateBlock with danger styling | ~10 |
| `AnalyticsLoadingState` | Alias for ChartLoadingState | 0 (alias) |
| `AnalyticsEmptyState` | ChartEmptyState with optional demo hint | ~10 |
| `AnalyticsIssueBanner` | Warning banner for partial failures | ~15 |
| `SampleScopeNote` | Text note about sample scope | ~10 |

Base primitives from `erp-primitives.tsx`:

| Primitive | Purpose |
|---|---|
| `KpiCard` | Single KPI value with label, helper text, optional tone |
| `MetricCard` | Single metric value with label, tone indicator |
| `StatusChip` | Compact status badge (Active/Clear/custom) |
| `ChartCardShell` | Card wrapper with title, description, insight, footer, metaLabel |
| `AnalyticsGrid` | CSS grid container for analytics card layout |
| `TableShell` | Bordered table wrapper |
| `PageSection` | Section divider with eyebrow, title, description |
| `ModulePageHeader` | Branded gradient header for module pages |
| `ModuleSection` | Branded gradient section wrapper |
| `FilterCardShell` | Branded filter card wrapper |
| `ReportGrid` | Grid for report metric cards |
| `EmptyStateBlock` | Dashed-border empty state placeholder |
| `ReportMetricCard` | KpiCard wrapper for financial reports |

### Tone System

The `CHART_TONE_STYLES` map defines 18 semantic tones (revenue, success, positive, expense, danger, negative, info, neutral, balance, warning, pending, sales, collection, property, hr, payroll, audit, documents). Each tone maps to bar color, border, soft background, text color, marker abbreviation, and primitive tone. The `DEFAULT_TONES` cycling order provides fallback when no semantic match is found.

### No Recharts or External Chart Library

The entire chart system uses **custom HTML/CSS bar chart primitives only**. There are no Recharts, D3, Chart.js, or any external chart library imports. All charts are built from div elements with Tailwind styling. This is significant: the current chart system is **entirely custom and self-contained**, meaning the shared primitives can be redesigned or rebuilt without any external dependency constraints.

---

## B. Route-by-Route Visual Map

### Dashboard (`/dashboard`) — 7 visual sections

| Section | Visual Blocks | Business Question | Redundancy |
|---|---|---|---|
| Operational home card | KpiCard grid (current company, last login, workspace chips, period selector) | "Where am I and what can I access?" | Low — unique context |
| Health status | HealthStatusCard (API/DB/S3 status) | "Is the system operational?" | Low — unique |
| Company snapshot | 4-5 DashboardSummaryPanel cards, each with 2-4 KpiCards (financial, accounting, property/sales, people, documents) | "What are the headline numbers per module?" | **HIGH** — these KpiCards duplicate data also shown in module analytics panels below |
| Operational analytics | DashboardAnalyticsPanel = full AnalyticsGrid with TrendChartCard, TrendBarChart, MetricCardGrid, DistributionBarList for financial, accounting, property, CRM, HR, payroll, documents | "What are the trends and distributions?" | **CRITICAL** — duplicates module-level analytics in full detail |
| Recent activity | 3-4 DashboardTimelinePanel cards with timeline items | "What happened recently?" | Medium — useful context, but timeline items repeat data from list pages |
| Pending work | 5 DashboardAttentionCard cards | "What needs my attention?" | Low — unique operational focus |
| Quick actions | 8 DashboardQuickActionTile tiles | "Where should I jump?" | Low — navigation aid, not visual analytics |
| Active roles / memberships | 2 Card blocks with Badge grids | "Who am I in this company?" | Low — unique session context |

**Dashboard is the most visually dense page in the ERP.** It contains approximately 50+ distinct visual elements across 7 sections. The "Operational analytics" section alone duplicates nearly every module's analytics in miniature form.

### Business Overview (`/accounting/reports/business-overview`) — 4 visual sections

| Section | Visual Blocks | Business Question | Redundancy |
|---|---|---|---|
| Executive summary | 6 ReportMetricCards (contracted sales, collected sales, revenue, expenses, net profit/loss, voucher status) | "What are the headline financial figures?" | **HIGH** — same metrics appear in Dashboard financial summary panel and Dashboard analytics |
| Visual analysis | 2 TrendChartCards (revenue/expenses/P&L trend, sales/collections trend) + 1 DistributionChartCard (revenue vs expense) | "How do financial metrics move over time?" | **HIGH** — dashboard financial analytics show the same revenue/expenses/P&L trend; the sales/collections trend duplicates Dashboard CRM analytics |
| Detailed table | Period breakdown table | "What are the exact period figures?" | Low — unique detail |
| Assumptions/notes | DataSourceNote text | "How are these numbers derived?" | Low — unique context |

### Trial Balance (`/accounting/reports/trial-balance`) — 2 visual sections

| Section | Visual Blocks | Business Question | Redundancy |
|---|---|---|---|
| Visual summary | 1 ComparisonBarChartCard (closing debit/credit) + 1 TrendChartCard (opening/movement/closing) | "What is the debit/credit balance?" | Medium — useful for TB context, but 3-point trend bar is weak |
| Statement table | Hierarchy table with account classes/groups/ledgers/posting accounts | "What are the exact account balances?" | Low — unique detail |

### General Ledger (`/accounting/reports/general-ledger`) — 2 visual sections

| Section | Visual Blocks | Business Question | Redundancy |
|---|---|---|---|
| Visual summary | 2 TrendChartCards (ledger movement 3-point, line activity daily) | "How does this account move?" | Medium — line activity chart can be useful but 3-point movement is weak |
| Line table | Transaction lines with running balance | "What are the exact transactions?" | Low — unique detail |

### Profit & Loss (`/accounting/reports/profit-loss`) — 2 visual sections

| Section | Visual Blocks | Business Question | Redundancy |
|---|---|---|---|
| Visual summary | 1 ComparisonBarChartCard (revenue vs expense) + 1 MiniReportTableCard (net P/L + section totals) | "Is the company profitable?" | **HIGH** — revenue vs expense comparison duplicates Business Overview; section totals are visible in the hierarchy table |
| Hierarchy table | Revenue and expense sections | "What are the exact revenue and expense breakdowns?" | Low — unique detail |

### Balance Sheet (`/accounting/reports/balance-sheet`) — 2 visual sections

| Section | Visual Blocks | Business Question | Redundancy |
|---|---|---|---|
| Visual summary | 1 ComparisonBarChartCard (assets vs liabilities+equity) + 1 MiniReportTableCard (equity adjustments including UNCLOSED_EARNINGS) | "Does the balance sheet balance?" | Medium — comparison is useful but small; equity adjustments table duplicates statement table rows |
| Statement table | Assets, liabilities, equity hierarchy | "What are the exact balance positions?" | Low — unique detail |

### Customer 360 (`/crm-property-desk/customers/[customerId]`) — 3 visual sections

| Section | Visual Blocks | Business Question | Redundancy |
|---|---|---|---|
| Identity | Profile header card with company/slug | "Who is this customer?" | Low |
| Summary metrics | 6 MetricCards (bookings, contracts, scheduled installments, total collected, latest collection date, posted-voucher-backed) | "What are the customer's commercial metrics?" | Medium — useful for profile context, but some metrics (total collected) repeat CRM module analytics |
| Commercial activity | Booking, contract, installment, collection tables + timeline | "What transactions exist?" | Low — unique profile detail |

### Accounting Vouchers (`/accounting/vouchers`) — 1 visual section

| Section | Visual Blocks | Business Question | Redundancy |
|---|---|---|---|
| Operational analytics | AccountingAnalyticsPanel with KpiTrendCard (voucher control) + AnalyticsCard (accounting structure with MetricCardGrid + DistributionBarList) + DistributionChartCard (draft vs posted) + 2 MiniReportTableCards (attention rows, recent posting) | "What is the accounting workload?" | **HIGH** — voucher control trend duplicates Dashboard accounting analytics; draft vs posted duplicates Dashboard accounting section |

### Project/Property Units (`/project-property/units`) — 1 visual section

| Section | Visual Blocks | Business Question | Redundancy |
|---|---|---|---|
| Operational analytics | ProjectPropertyAnalyticsPanel with AnalyticsCard (inventory command center: MetricCardGrid + DistributionBarList) + AnalyticsCard (hierarchy coverage: MetricCardGrid + DistributionBarList) + 2 DistributionChartCards (units by project, units by type) + MiniReportTableCard (top project inventory) | "What is the unit inventory status?" | **HIGH** — inventory metrics and distributions duplicate Dashboard property analytics |

### CRM Customers (`/crm-property-desk/customers`) — 1 visual section

| Section | Visual Blocks | Business Question | Redundancy |
|---|---|---|---|
| Operational analytics | CrmAnalyticsPanel with AnalyticsCard (CRM pipeline: MetricCardGrid + DistributionBarList) + AnalyticsCard (booking/installment risk: 2 DistributionBarList) + KpiTrendCard (sales value and collections) + DistributionChartCard (commercial funnel) + MiniReportTableCard (customer movement) | "What is the CRM pipeline status?" | **HIGH** — commercial activity cards and collection trend duplicate Dashboard CRM analytics |

### HR Employees (`/hr/employees`) — 1 visual section

| Section | Visual Blocks | Business Question | Redundancy |
|---|---|---|---|
| Operational analytics | HrAnalyticsPanel with AnalyticsCard (people coverage: MetricCardGrid + DistributionBarList) + AnalyticsCard (location/leave: 2 DistributionBarList) + AnalyticsCard (attendance movement: DistributionBarList + TrendBarChart) + MiniReportTableCard (HR attention) | "What is the HR/attendance status?" | **HIGH** — people coverage and leave distribution duplicate Dashboard HR analytics |

### Payroll Runs (`/payroll/runs`) — 1 visual section

| Section | Visual Blocks | Business Question | Redundancy |
|---|---|---|---|
| Operational analytics | PayrollAnalyticsPanel with AnalyticsCard (payroll workload: MetricCardGrid + DistributionBarList) + AnalyticsCard (posting readiness: MetricCardGrid + DistributionBarList) + KpiTrendCard (payroll period trend) + MiniReportTableCard (recent payroll periods) | "What is the payroll processing status?" | **HIGH** — payroll workload and posting cards duplicate Dashboard payroll analytics |

### Audit/Documents (`/audit-documents/attachments`) — 1 visual section

| Section | Visual Blocks | Business Question | Redundancy |
|---|---|---|---|
| Operational analytics | AuditDocumentAnalyticsPanel with AnalyticsCard (document coverage: MetricCardGrid + DistributionBarList) + AnalyticsCard (attachment movement: DistributionBarList + TrendBarChart) + AnalyticsCard (audit activity: 2 DistributionBarList + TrendBarChart) + MiniReportTableCard (document attention) | "What is the document/audit status?" | **HIGH** — document coverage and audit distributions duplicate Dashboard documents analytics |

---

## C. Major Redundancy Findings

### Finding 1: Dashboard Duplicates Every Module's Analytics

The Dashboard "Operational analytics" section renders a full `DashboardAnalyticsPanel` containing TrendChartCard, TrendBarChart, MetricCardGrid, and DistributionBarList blocks for financial, accounting, property, CRM, HR, payroll, and documents — the exact same data served by each module's dedicated analytics panel. This means **every number and every chart appears twice**: once on the dashboard and once on the module page.

This is the single largest redundancy in the ERP. It produces approximately 40+ duplicated visual elements.

### Finding 2: Business Overview Duplicates Dashboard Financial Analytics

The Business Overview executive summary (6 ReportMetricCards) and trend charts (revenue/expenses/P&L, sales/collections) show the same financial figures that the Dashboard financial summary panel and Dashboard financial analytics already present. A user sees the same net profit/loss, revenue, expenses, and sales/collections story three times: Dashboard summary, Dashboard analytics, and Business Overview page.

### Finding 3: Financial Statement Visual Summaries Are Weak and Redundant

Trial Balance, General Ledger, Profit & Loss, and Balance Sheet each have a "Visual summary" section above the hierarchy/statement table. These summaries use:
- 3-point TrendBarCharts (opening/movement/closing) that communicate almost nothing a simple text summary couldn't
- ComparisonBarCharts (debit vs credit, revenue vs expense, assets vs liabilities) that show two bars and are visually thin
- MiniReportTableCards that duplicate rows visible in the main statement table below them

These visual summaries add visual clutter without adding meaningful insight beyond what the table and a few headline KPI values already provide.

### Finding 4: DistributionBarList Overuse

`DistributionBarList` (alias for `DistributionChart`) is the most overused visual primitive. It appears approximately 15+ times across the ERP, almost always showing simple status/category breakdowns (draft vs posted, available vs booked, leave status, payroll status, attachment status, audit category). Most of these distributions would be clearer as a simple count table or inline status badges. The bar-chart treatment adds visual weight without proportional insight gain.

### Finding 5: MetricCardGrid Inflation

Every module analytics panel starts with a `MetricCardGrid` showing 3-4 headline numbers. Combined with Dashboard summary KpiCards and Business Overview ReportMetricCards, the same figures (draft vouchers, posted vouchers, available units, sold units, employees, pending leave, payroll runs, etc.) appear 2-3 times across different surfaces.

### Finding 6: KpiTrendCard Duplication

`KpiTrendCard` (MetricCardGrid + TrendBarChart inside ChartCardShell) is used for voucher control, sales/collections, payroll amount trend, and attendance activity. Each of these also appears in the Dashboard analytics section, creating full duplication.

### Finding 7: MiniReportTableCard Is Often Unnecessary

MiniReportTableCards (accounting attention rows, recent posting, CRM follow-up, HR attention, payroll recent periods, document attention) provide 3-5 rows of data that are immediately available in the main list/search table on the same page. They add a second visual block for data that the user can scroll to in the list below.

### Finding 8: Pages Feel Visually Overcrowded

From runtime inspection:
- Dashboard has approximately 50+ visual elements making it the densest page
- Module pages (vouchers, units, customers, employees, payroll runs, attachments) have 4-7 analytics blocks above the main content table, pushing the actual business data far down the page
- Business Overview has 6 metric cards, 3 chart cards, a period table, and assumptions notes — excessive for a single report
- Financial statements have 2 visual summary sections before the actual statement table

The pattern is consistent: analytics panels push operational tables and lists down, making the actual decision-making content harder to reach.

---

## D. Visual Classification Decisions

### Category Definitions

1. **Keep and redesign**: Answers important business question, useful, but design is weak/generic/inconsistent
2. **Merge/consolidate**: Two+ visuals answer substantially same question; data could be combined into one stronger visual
3. **Remove**: Decorative, low-value, repetitive, too shallow, or better as text/KPI/table
4. **Keep as-is**: Already appropriate and not contributing to clutter (use sparingly)
5. **Defer**: Value depends on future logic, data too limited, or page shouldn't be redesigned yet

---

## E. Detailed Visual Decision Table

| # | Visual/Page/Component | Route/Module | Business Purpose | Redundancy Issue | Decision | Rationale | Phase |
|---|---|---|---|---|---|---|---|
| 1 | Dashboard "Operational analytics" full panel | /dashboard | Executive overview of all module trends | **CRITICAL duplication** — duplicates every module's dedicated analytics panel in full detail | **Remove** | Dashboard should summarize with KPIs only, not duplicate module-level charts. Remove all TrendBarChart, DistributionBarList, MetricCardGrid blocks from Dashboard analytics. Replace with condensed summary KPIs. | 48B |
| 2 | Dashboard "Company snapshot" summary panels | /dashboard | Headline numbers per module | **HIGH duplication** — same figures appear in module analytics and Business Overview | **Merge** | Merge the 4-5 summary panels into a single compact "Key figures" row with 8-10 headline KPI values, no chart cards. This replaces both the summary panels and the analytics section. | 48B |
| 3 | Dashboard "Recent activity" timeline panels | /dashboard | Latest records per module | Low — useful operational context | **Keep redesign** | Timeline panels are useful but visually heavy. Redesign to be more compact, with fewer items and simpler layout. | 48D |
| 4 | Dashboard "Pending work" attention cards | /dashboard | Actionable work queues | Low — unique and decision-oriented | **Keep as-is** | Attention cards are one of the strongest visual elements on the dashboard. They answer a clear business question and are not duplicated elsewhere. | — |
| 5 | Dashboard "Quick actions" tiles | /dashboard | Navigation shortcuts | None — navigation aid, not analytics | **Keep as-is** | These are navigation aids, not visual analytics. Keep as-is. | — |
| 6 | Dashboard "Operational home" context card | /dashboard | Session/company context | None — unique | **Keep redesign** | Context card is useful but can be more compact. Merge company/slug/login/workspace into a tighter header. | 48D |
| 7 | Dashboard "Health status" card | /dashboard | System operational status | None — unique | **Keep as-is** | Health status is unique and decision-oriented. Keep. | — |
| 8 | Dashboard "Active roles/memberships" cards | /dashboard | Session role context | None — unique | **Merge** | Merge into a compact inline section within the context card, not a separate card pair. | 48B |
| 9 | Business Overview executive summary (6 ReportMetricCards) | /accounting/reports/business-overview | Headline financial figures | **HIGH duplication** — same metrics in Dashboard summary + Dashboard analytics | **Keep redesign** | Business Overview is the dedicated financial report; its metrics are legitimate here. But reduce from 6 cards to 4 core metrics (net P/L, revenue, expenses, collections). Remove voucher status card (belongs in accounting, not business overview). | 48D |
| 10 | Business Overview revenue/expenses/P&L trend (TrendChartCard) | /accounting/reports/business-overview | Financial performance over time | **HIGH duplication** — same trend in Dashboard analytics | **Keep redesign** | This is the primary report trend and should stay. But redesign as a single premium trend chart, not a generic TrendBarChart. | 48D |
| 11 | Business Overview sales/collections trend (TrendChartCard) | /accounting/reports/business-overview | Sales and collections movement | **HIGH duplication** — same trend in Dashboard CRM analytics | **Keep redesign** | Merge with revenue/expenses into a single comprehensive financial performance chart with 4 series, rather than two separate trend cards. | 48D |
| 12 | Business Overview revenue vs expense distribution (DistributionChartCard) | /accounting/reports/business-overview | Revenue/expense balance | **HIGH duplication** — same data in Dashboard + P&L | **Remove** | Two-bar distribution adds minimal value. The net P/L KPI card already communicates this. The detailed table provides exact figures. | 48B |
| 13 | Trial Balance visual summary (ComparisonBarChart + TrendChart) | /accounting/reports/trial-balance | Debit/credit balance overview | Medium — legitimate TB context, but visually weak | **Merge** | Replace 2 chart cards with a compact inline "Opening / Movement / Closing" summary row (3 KPI values) + a single clean comparison bar. Remove the 3-point TrendBarChart (opening/movement/closing is 3 bars — nearly meaningless as a trend). | 48B |
| 14 | General Ledger visual summary (2 TrendCharts) | /accounting/reports/general-ledger | Ledger movement overview | Medium — legitimate context | **Merge** | Replace with a compact "Opening balance / Period movement / Closing balance" KPI row + keep only the daily line activity chart (the useful one). Remove the 3-point movement chart. | 48B |
| 15 | P&L revenue vs expense ComparisonBarChart | /accounting/reports/profit-loss | Revenue/expense comparison | **HIGH** — duplicates Business Overview trend + Dashboard | **Remove** | Revenue and expense totals are already in the KPI cards and the hierarchy table. A two-bar comparison adds no decision value. | 48B |
| 16 | P&L statement status MiniReportTableCard | /accounting/reports/profit-loss | Net P/L and section totals | Medium — section totals visible in hierarchy table | **Remove** | The hierarchy table already shows every section total. The MiniReportTableCard duplicates visible data. Replace with a single net P/L KPI callout. | 48B |
| 17 | Balance Sheet comparison (assets vs liabilities+equity) | /accounting/reports/balance-sheet | Balance check | Medium — useful but thin | **Keep redesign** | The balance comparison is legitimate for BS. Redesign as a single premium comparison, not a generic ComparisonBarChart. | 48D |
| 18 | Balance Sheet equity adjustments MiniReportTableCard | /accounting/reports/balance-sheet | UNCLOSED_EARNINGS visibility | Medium — important adjustment | **Keep redesign** | Unclosed earnings visibility is important. But redesign as an explicit inline callout within the statement, not a separate card. | 48D |
| 19 | Accounting vouchers analytics (KpiTrendCard + AnalyticsCard + DistributionChart + 2 MiniReports) | /accounting/vouchers | Voucher workload and control | **HIGH** — duplicates Dashboard accounting section | **Remove entire panel** | Voucher list page should show a compact filter bar + the voucher table. Remove all 5 analytics blocks. The dashboard will provide headline voucher counts. The table provides detail. | 48B |
| 20 | Project/Property analytics (2 AnalyticsCards + 2 DistributionCharts + MiniReport) | /project-property/units | Unit inventory status | **HIGH** — duplicates Dashboard property section | **Remove entire panel** | Units page should show filters + table. Dashboard provides inventory KPIs. The table provides detail. | 48B |
| 21 | CRM analytics (2 AnalyticsCards + KpiTrend + DistributionChart + MiniReport) | /crm-property-desk/customers | CRM pipeline status | **HIGH** — duplicates Dashboard CRM section | **Remove entire panel** | Customers page should show filters + table + search. Dashboard provides commercial KPIs. | 48B |
| 22 | HR analytics (3 AnalyticsCards + MiniReport) | /hr/employees | HR/attendance/leave status | **HIGH** — duplicates Dashboard HR section | **Remove entire panel** | Employees page should show filters + table. Dashboard provides people KPIs. | 48B |
| 23 | Payroll analytics (2 AnalyticsCards + KpiTrend + MiniReport) | /payroll/runs | Payroll processing status | **HIGH** — duplicates Dashboard payroll section | **Remove entire panel** | Payroll runs page should show filters + table. Dashboard provides payroll KPIs. | 48B |
| 24 | Audit/Documents analytics (3 AnalyticsCards + MiniReport) | /audit-documents/attachments | Document/audit coverage | **HIGH** — duplicates Dashboard documents section | **Remove entire panel** | Attachments page should show filters + table. Dashboard provides document KPIs. | 48B |
| 25 | Customer 360 identity card | /crm-property-desk/customers/[id] | Customer identity | None — unique | **Keep redesign** | Profile identity is legitimate. Redesign for premium feel. | 48D |
| 26 | Customer 360 summary metrics (6 MetricCards) | /crm-property-desk/customers/[id] | Customer commercial metrics | Medium — some overlap with CRM analytics | **Keep redesign** | These are profile-specific metrics and are legitimate on a detail page. Reduce to 4-5 most meaningful metrics. Remove posted-voucher-backed (too technical for customer profile). | 48D |
| 27 | Customer 360 commercial activity tables | /crm-property-desk/customers/[id] | Transaction history | None — unique profile detail | **Keep redesign** | Tables are the core value of Customer 360. Keep but redesign for premium readability. | 48D |
| 28 | Customer 360 timeline | /crm-property-desk/customers/[id] | Customer activity timeline | Medium — overlaps with recent activity panels | **Keep redesign** | Timeline provides customer-specific context. Keep but simplify. | 48D |
| 29 | DistributionBarList (as a reusable primitive) | Multiple pages | Category/status distribution | **Overused** — 15+ instances, most showing simple 2-4 category splits | **Redesign primitive** | Replace with a simpler inline distribution visualization (compact bars with labels, not full card shells). Most instances will be removed in 48B. The remaining few should use a redesigned primitive. | 48C |
| 30 | TrendBarChart (as a reusable primitive) | Multiple pages | Time-series trend | Overused and visually generic | **Redesign primitive** | Current TrendBarChart is a custom HTML bar chart with minimal visual impact. Redesign as a proper premium chart primitive (consider adding Recharts or building a stronger custom implementation). | 48C |
| 31 | ComparisonBarChart (as a reusable primitive) | Financial reports | Two-value comparison | Nearly always shows just 2 bars | **Remove primitive** | Two-bar comparisons are better as KPI cards with delta indicators. Eliminate this primitive. Remaining comparisons (BS assets vs liabilities) use a redesigned premium comparison. | 48C |
| 32 | KpiCard/MetricCard primitives | Multiple pages | Single value display | Moderate overuse | **Redesign primitive** | Current cards are adequate but generic. Redesign for stronger premium feel with better typography, layout, and tone indicators. | 48C |
| 33 | MiniReportTableCard primitive | Multiple pages | Small attention/follow-up table | Duplicates main table data | **Remove primitive** | All instances are being removed in 48B (module analytics panels). No remaining legitimate use case. | 48C |
| 34 | KpiTrendCard primitive | Dashboard + module pages | KPI values + trend | **HIGH** — duplicated everywhere | **Remove primitive** | After removing module analytics panels, no remaining legitimate use for KpiTrendCard (metrics + trend combo). Dashboard will use separate KPIs. Business Overview will use a single redesigned trend chart. | 48C |
| 35 | ChartCardShell primitive | All chart cards | Card wrapper | Used excessively — every chart is wrapped | **Redesign primitive** | Redesign for premium chart card feel: cleaner borders, better header hierarchy, more restrained decoration. | 48C |
| 36 | AnalyticsGrid primitive | All analytics sections | Grid layout container | Used for all analytics panels | **Keep redesign** | Grid layout is fine but should use more restrained column configuration after panels are simplified. | 48C |
| 37 | StackedStatusCard primitive | Alias for DistributionChartCard | Status breakdown | Never meaningfully distinct from DistributionChartCard | **Remove alias** | No unique use. Merge into the redesigned distribution primitive. | 48C |
| 38 | DistributionLegend primitive | Alias for ChartLegend | Legend grid | Never meaningfully distinct | **Remove alias** | Merge into ChartLegend. | 48C |
| 39 | Daily/Weekly/Monthly/Yearly report analytics | /accounting/reports/daily etc. | Periodic business breakdowns | Same data as Business Overview with different grouping | **Defer** | These pages are no longer in navigation (47A). They still work by direct URL but are not primary surfaces. Defer any visual work until they are either consolidated into Business Overview or explicitly removed. | — |
| 40 | Printable report templates | Print media | A4 print/PDF output | None — unique output surface | **Keep as-is** | Printable templates are a separate output surface. They should not be affected by the visual reduction. | — |

---

## F. Recommendation: Remove/Consolidate First, Then Redesign

**Yes, remove/consolidate first is the recommended approach.**

### Why

1. **The redundancy problem is structural, not visual.** The ERP's visual clutter comes from duplicating data across pages, not from poorly designed individual charts. Redesigning duplicated charts would produce better-looking duplicates — still cluttered, still redundant.

2. **Removing redundancy first creates space for redesign.** After removing 7 full module analytics panels from module pages and the full analytics section from the dashboard, the remaining surfaces (dashboard KPIs, Business Overview, financial statements, Customer 360) will have much more visual breathing room. Redesigning into that space produces a stronger result than redesigning into clutter.

3. **The "remove first" approach is lower risk.** Removing analytics panels from module list pages is safe — those pages still have their primary value (the data table/list). Removing dashboard analytics is safe — the dashboard still has KPIs, timeline, attention cards, quick actions, and context. No business workflow depends on the duplicated analytics panels.

4. **Redesign after removal focuses effort on high-value surfaces.** With 7 module analytics panels removed, the redesign effort can focus on making the remaining surfaces (dashboard, Business Overview, financial statements, Customer 360) truly premium instead of spreading effort across 15+ surfaces.

5. **The module analytics panels were never the primary value.** Users come to voucher pages to manage vouchers, to units pages to manage units, to customer pages to manage customers. The analytics panels above the tables were always secondary. Removing them returns module pages to their core purpose: operational data management with clear filters and tables.

---

## G. Proposed Future Visual Architecture

### I1. Visual Hierarchy

The future ERP should have exactly these visual types:

| Visual Type | Purpose | Where It Belongs |
|---|---|---|
| **Executive KPI row** | 8-12 headline numbers in a compact grid | Dashboard only |
| **Premium trend chart** | Time-series with 2-4 series, clear legend, readable labels | Business Overview, Balance Sheet |
| **Premium comparison** | Two-value comparison with visual balance indicator | Balance Sheet only |
| **Inline distribution summary** | Compact bar with label/value/share, not full card | Dashboard KPI expandables (future) |
| **Attention queue cards** | Actionable work items with count and status | Dashboard |
| **Data tables** | The primary information surface on every page | All module pages |
| **Profile metric row** | 4-5 key metrics for a single entity | Customer 360 |
| **Profile timeline** | Compact activity timeline for a single entity | Customer 360 |
| **Printable report template** | A4 print/PDF output | Financial reports, receipts |

### I2. Placement Rules

1. **Dashboard** gets: executive KPI row, attention queue cards, quick actions, timeline (compact), health status, context header. **No full module analytics.** Dashboard summarizes; it does not duplicate.

2. **Business Overview** gets: executive summary (4 KPIs), one premium financial performance trend chart, period detail table, assumptions. **No separate sales/collections trend card. No distribution card.** Business Overview tells the financial story; it does not repeat dashboard numbers.

3. **Financial statements** (TB, GL, P&L, BS) get: compact inline KPI summary (not full chart cards), the hierarchy/statement table (the primary value), print template. **No separate visual summary section.** The table is the report; inline KPIs provide quick orientation.

4. **Module list pages** (vouchers, units, customers, employees, payroll, attachments, audit) get: filter bar + data table. **No analytics panels.** The table and filters are the page's purpose. Dashboard provides KPIs; the table provides detail.

5. **Customer 360** gets: identity header, 4-5 profile metrics, commercial activity tables, compact timeline. **No funnel charts or distribution bars.** Profile metrics are entity-specific; they do not duplicate module analytics.

### I3. Anti-Redundancy Rules

1. A visual should not reappear across pages unless the business context genuinely differs (e.g., dashboard summary vs. report detail is a different context; dashboard trend vs. module trend is the same context — remove the module one).

2. Dashboard should summarize, not duplicate report-page detail. Dashboard shows KPIs; Business Overview shows the trend chart and table.

3. Detail pages should not duplicate dashboard storytelling. Module list pages show tables; they do not need analytics panels above the tables.

4. A chart should answer one clear business question. If the question is "what are the headline numbers?", a KPI row answers it better than a chart. If the question is "how does this trend over time?", a trend chart answers it. Never use both for the same question on the same page.

5. Two-bar comparisons (debit vs credit, revenue vs expense, assets vs liabilities) are almost always better as KPI cards with a delta indicator, unless the comparison needs visual weight for stakeholder presentation (Balance Sheet assets vs liabilities is the only legitimate case).

6. Distribution breakdowns of 2-4 categories are better as inline badges or a count table, not as bar charts inside card shells.

### I4. Design Principles for Later Redesign

1. Fewer but stronger visuals — every retained chart must answer a clear, distinct business question that a KPI or table cannot answer as well.

2. Clear purpose per chart — if you cannot articulate the business decision a chart supports, remove it.

3. Real Capita brand alignment — use the established blue/green/sky/navy brand palette with restraint. Charts should feel premium, not decorative.

4. Premium but not decorative — no gradient headers on chart cards, no overuse of soft brand surfaces, no visual padding. Charts should earn their space with data insight.

5. Readable legends, labels, tooltips — every chart element should be immediately readable without hover. Legends should show series name + total value.

6. Restrained color usage — use semantic tones only where meaning matters (revenue=green, expense=rose, balance=blue). Default series should use the brand blue family with varying lightness, not a rainbow of 12 tones.

7. Meaningful chart choice for each data type — trend over time = line/area chart (not bar), comparison of 2 values = KPI with delta (not 2-bar chart), distribution of 3+ categories = compact inline bars or table, not full card-shell chart.

8. Consider introducing Recharts or a proper charting library for the retained trend and comparison charts — the current custom HTML bar system produces visually thin results that lack the polish of professional chart libraries.

---

## H. Recommended Prompt 48B–48E Sequence

### Prompt 48B — Remove and Consolidate Redundant Visuals

**Scope**: Remove 7 full module analytics panels from module list pages + remove dashboard full analytics section + remove 5 financial-statement visual summary components that duplicate table data + merge dashboard summary panels into a compact KPI row.

**Specific removals**:
- Remove `AccountingAnalyticsPanel` from vouchers page
- Remove `ProjectPropertyAnalyticsPanel` from units page
- Remove `CrmAnalyticsPanel` from customers page
- Remove `HrAnalyticsPanel` from employees page
- Remove `PayrollAnalyticsPanel` from payroll runs page
- Remove `AuditDocumentAnalyticsPanel` from attachments page
- Remove `DashboardAnalyticsPanel` from dashboard
- Remove P&L ComparisonBarChartCard (revenue vs expense)
- Remove P&L MiniReportTableCard (statement status)
- Remove Business Overview DistributionChartCard (revenue vs expense)
- Replace TB 2-card visual summary with inline KPI row
- Replace GL 2-card visual summary with inline KPI row + keep only daily line activity chart
- Merge Dashboard summary panels into compact KPI row
- Merge Dashboard active roles/memberships into context card

**Preserve**: Dashboard attention cards, quick actions, timeline (compact), health status. Business Overview KPIs and trend charts. Financial statement tables. Customer 360 profile. Print templates. All backend/API/routes/auth/schema.

**Estimated change**: ~15 files modified, removing approximately 800+ lines of analytics panel code and imports from module pages. Simplifying dashboard from 7 sections to 5. This is the most impactful single step.

### Prompt 48C — Rebuild Shared Visual Analytics Design System

**Scope**: Redesign the retained shared chart primitives for premium quality.

**Specific redesigns**:
- Redesign `TrendBarChart` → premium trend chart (consider Recharts `BarChart` or `AreaChart` for better visual impact, or rebuild custom with stronger rendering)
- Redesign `KpiCard` and `MetricCard` → premium single-value cards with better typography, tone indicators, layout
- Redesign `ChartCardShell` → cleaner, less decorative card wrapper
- Redesign `AnalyticsGrid` → simpler grid with fewer columns after panel reduction
- Remove `ComparisonBarChart` primitive (no remaining legitimate use after 48B)
- Remove `MiniReportTableCard` primitive (no remaining use)
- Remove `KpiTrendCard` primitive (no remaining use)
- Remove `StackedStatusCard` alias
- Remove `DistributionLegend` alias
- Redesign `DistributionBarList` → simpler inline distribution primitive for potential future use
- Redesign `ChartLegend` → cleaner, more readable legend
- Clean up tone system: reduce from 18 tones to ~8 core tones (revenue, expense, balance, warning, danger, sales, collection, neutral)
- Consider: if introducing Recharts, add proper tooltip support, responsive resizing, and line/area chart variants

**Estimated change**: `components.tsx` rebuilt from ~40KB to ~15KB. `erp-primitives.tsx` chart-related primitives redesigned. `tailwind.config.ts` chart tokens simplified.

### Prompt 48D — Redesign Retained High-Value Visuals by Priority

**Scope**: Redesign the specific page-level visuals that remain after 48B removal and 48C primitive redesign.

**Priority order**:
1. **Dashboard** — redesign compact KPI row, timeline, attention cards, context header, quick actions
2. **Business Overview** — redesign executive summary (4 KPIs), merge 2 trend cards into 1 premium financial performance chart, redesign period table presentation
3. **Financial statements** — redesign inline KPI summaries for TB, GL, P&L, BS; redesign BS comparison; redesign UNCLOSED_EARNINGS callout in BS
4. **Customer 360** — redesign identity header, 4-5 profile metrics, commercial tables, timeline

**Estimated change**: ~10-12 files modified, applying the redesigned primitives from 48C to the remaining page surfaces.

### Prompt 48E — Final QA and Checkpoint

**Scope**: Full validation of the visual reduction and redesign across all affected routes.

**Checks**:
- lint, typecheck, build, test
- Docker rebuild, seed:demo:verify, docker:smoke
- Visual QA at 1440px, 1366px, 1024px for dashboard, Business Overview, TB, GL, P&L, BS, Customer 360, and representative module list pages
- Verify no horizontal overflow, no broken charts, no missing data, no regression in print/receipt templates
- Verify module list pages load correctly without analytics panels
- Verify dashboard loads correctly with compact KPI row instead of full analytics
- Update handoff docs

---

## I. Supervisor Decisions Needed

1. **Should Recharts (or another charting library) be introduced?** The current custom HTML bar system produces thin, visually weak charts. Introducing Recharts would enable line charts, area charts, proper tooltips, responsive sizing, and professional-grade rendering. However, it adds an external dependency. The supervisor should decide whether the visual quality improvement outweighs the dependency cost.

2. **Should the 4 removed periodic report pages (daily/weekly/monthly/yearly) be fully deleted or kept as reachable-by-URL?** They were removed from navigation in 47A but still exist as functional routes. If they are never used again, their route files and page components could be deleted entirely in 48B to reduce codebase complexity.

3. **Should module analytics panels be completely removed, or should some be retained as optional/collapsible sections?** The audit recommends complete removal, but the supervisor may prefer a collapsible "Analytics" toggle above the table. This would retain the data while reducing visual density.

4. **How many KPI values should the dashboard show?** The audit proposes 8-12 headline KPIs in a compact row. The supervisor should confirm whether this is sufficient or whether some additional context is needed.

---

## J. Blockers or Contradictions

No blockers found. The dirty worktree is preserved (46B-46I + 47A changes remain intact). Docker services are healthy. The prompt-48-scope.md is already present and aligned with this audit direction. No code edits were made during 48A.

---

## K. Verification of 48A Process

- All source-of-truth documents were read before analysis
- Git status, branch, and Docker health confirmed (main branch, all services healthy)
- Full visual inventory was built from codebase search (components.tsx, module-panels.tsx, erp-primitives.tsx, dashboard-page.tsx, shared.tsx, analytics.tsx, customer-profile-page.tsx, business-report-page.tsx)
- Runtime visual inspection was performed via agent-browser for Dashboard, Business Overview, Accounting Vouchers, Project/Property Units, CRM Customers, Customer 360, and Balance Sheet at 1440px width
- No application code was edited
- No CSS was modified
- No visuals were removed
- No commits, pushes, or staging were performed
- Only documentation output was produced (this status file)

---

## L. Runtime Visual Inspection Summary

Screenshots saved to `.tmp/p48a-`:
- `dashboard-full.png` — confirms 7 visual sections with approximately 50+ visual elements
- `dashboard-annotated.png` — confirms 89 interactive elements including full analytics grid
- `business-overview-full.png` — confirms 6 metric cards, 3 chart cards, table, and notes
- `accounting-vouchers.png` — confirms full analytics panel pushing table content far down
- `property-units.png` — confirms full analytics panel above units table
- `crm-customers.png` — confirms full CRM analytics panel above customer table
- `customer-360.png` — confirms 6 metric cards, commercial tables, and timeline
- `balance-sheet.png` — confirms comparison chart + mini table + statement table

Visual density assessment from inspection:
- Dashboard: **overcrowded** — 7 distinct sections, too many chart blocks, analytics section alone occupies 40%+ of page height
- Module list pages: **pushed down** — analytics panels above tables make the primary content hard to reach without scrolling
- Business Overview: **excessive** — 6 metrics + 3 charts + table + notes for one report
- Financial statements: **acceptable but redundant** — visual summaries add little beyond KPIs and tables
- Customer 360: **reasonable but could be tighter** — profile metrics and tables are legitimate but could be more compact

---

## M. Final Verdict

READY TO APPROVE VISUAL REDUCTION BLUEPRINT
