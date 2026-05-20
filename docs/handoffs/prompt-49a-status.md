# Prompt 49A Status: Business Overview Content/UX Audit and Redesign Blueprint

## Why Business Overview Content/UX Improvement Is Now the Next Priority

After Prompts 48B-48D-R, the Business Overview visual architecture is complete: one flagship financial trend chart (Revenue bars + Expenses bars + Net result line overlay), hierarchical KPI cards with emphasized Net P/L, a period breakdown table, and calculation notes. The page is visually clean and structurally coherent.

However, the page still reads as a raw data display rather than a management decision-support screen. An executive scanning this page sees numbers and a chart, but the page does not:

1. **Answer the core management question immediately**: "How is the business performing and what should I care about?"
2. **Interpret the result**: The Net P/L card says "9,832,000 Profit" but does not explain what drove it, whether it improved or declined vs prior periods, or whether collection efficiency is adequate
3. **Signal attention**: There is no warning when performance worsens, no highlight of collection gaps, no callout when a loss period occurs
4. **Bridge the gap between KPIs and chart**: The 6 KPI cards and the chart sit in separate sections with no narrative connection between them
5. **Make the period table feel like evidence**: The table has 10 columns but no executive-friendly ordering — financial columns (revenue, expenses, net P/L) should come before operational counts

The visual architecture work was necessary and successful. But visual cleanliness without content usefulness is still a weak page. This prompt addresses the content and UX layer.

---

## Current Page Audit Findings

### 1. Page Purpose Assessment

**What question does the page answer today?**: "What are the company's headline financial figures and how do they trend over selected periods?"

This is a data description, not a management answer. An executive does not come to this page to see "9,832,000" — they come to understand whether the business is healthy, what changed, and whether anything needs attention.

**Is the purpose clear within the first screen?**: Partially. The Net P/L primary card communicates "Profit" with a number, which is good. But the page does not explain what drives that result, how it compares, or whether it is improving.

### 2. Header and Context

**Page title**: "Business Overview Report" — adequate but generic. Could be stronger, e.g. "Business Performance" or "Financial Performance Overview."

**Read-only notice**: "Read-only business report" with "Contracted sales and collections come from CRM/property records; revenue, expenses, and profit/loss from posted accounting vouchers." — this is useful for traceability but reads as a technical disclaimer rather than a management-facing context note. It appears before the KPI cards and takes visual space that could be used for an executive insight.

**Context strip**: Contains "Report period", "Grouping", "Data source", "Result" — this is good. "Result: Profit" is the strongest element. However "Data source: CRM/property + posted vouchers" is technical jargon; most executives do not need to see this in the primary context strip.

### 3. Filters and Controls

**Period controls**: Date from/to + period type selector (Daily/Weekly/Monthly/Yearly buckets). These are functional but the default range (year start to today) and bucket (Monthly) are reasonable defaults. The "Apply filters" / "Reset" button pair is standard.

**Print/export actions**: Positioned in the page header alongside the title — good placement. No issues.

**One issue**: The read-only notice sits between the header and the filters, breaking the visual flow. It would be better as a subtle contextual note within the KPI section or as a footnote, not as a prominent banner that competes with the executive content.

### 4. KPI Summary

**Current six metrics** (in order):

| Position | Metric | Label | Current value | Issue |
|---|---|---|---|---|
| Primary (large) | Net P/L | "Net profit / loss" | 9,832,000 | Good as primary. Label is technical — "Net result" or "Business result" would be more management-friendly |
| Secondary (medium) | Voucher workload | "Voucher workload" | 21 | **Misplaced in hierarchy** — voucher count is operational volume, not a financial result. It does not belong in the primary/secondary row alongside Net P/L |
| Supporting (small) | Contracted sales | "Contracted sales" | 15,600,000 | Legitimate commercial metric. No tone indicator, no context about what "contracted" means vs "collected" |
| Supporting (small) | Collected sales | "Collected sales" | 4,340,000 | Legitimate. But the gap between contracted (15.6M) and collected (4.34M) is **critical** — only 28% of contracted sales have been collected. This is a decision-relevant signal that the page completely ignores |
| Supporting (small) | Revenue | "Revenue" | 11,580,000 | Core accounting metric. No issue with label |
| Supporting (small) | Expenses | "Expenses" | 1,748,000 | Core accounting metric. No issue with label |

**Major content weaknesses in KPI section**:

1. **Voucher workload does not belong in the primary/secondary row**: It is an operational count, not a financial result. Revenue, expenses, or collection efficiency would be more appropriate in this position.
2. **No collection efficiency signal**: The contracted-to-collected ratio (4.34M / 15.6M = 28%) is the most decision-relevant number on the page, and it is completely invisible. An executive needs to know this immediately.
3. **No expense ratio**: Expenses (1.748M) vs Revenue (11.58M) = 15% — this is excellent and worth highlighting. Currently both are flat cards with no relationship shown.
4. **profitAmount and lossAmount are available but unused**: The API returns `profitAmount` and `lossAmount` as separate fields. These could show "Profit: 9,832,000" instead of the current "Net profit/loss" label which mixes both outcomes in one name.
5. **Labels are accountant-facing, not executive-facing**: "Net profit / loss", "Contracted sales", "Collected sales", "Voucher workload" are accounting terms. "Business result", "Sales pipeline", "Collections received", "Expense ratio" would be more management-friendly.

### 5. Flagship Chart

**Current state**: One `ExecutiveTrendChartCard` titled "Financial performance" with Revenue/Expenses bars and Net result line. Description: "Revenue and expenses from posted vouchers; net result is revenue minus expenses." Insight: "Bars show revenue and expenses magnitude; the line tracks the net result trend."

**Content weaknesses**:

1. **No narrative bridge between KPIs and chart**: The KPI section shows totals for the entire period; the chart shows how those totals distribute across periods. But there is no sentence connecting them, e.g. "The 9,832,000 profit reflects strong March and April performance after an expense-only February."
2. **The insight text is chart-reading instruction, not business interpretation**: "Bars show revenue and expenses magnitude; the line tracks the net result trend." This tells the user how to read the chart, not what the chart means for the business.
3. **The description is data-source description, not business narrative**: "Revenue and expenses from posted vouchers" — an executive does not need to know this at the chart level. The KPI section or calculation notes handle data-source traceability.

### 6. Period Breakdown Table

**Current column order**: Period | Contracted sales | Collected sales | Revenue | Expenses | Net profit/loss | Vouchers | Bookings | Contracts | Collections

**Content weaknesses**:

1. **Column order prioritizes commercial before financial**: Contracted sales and collected sales come before revenue, expenses, and net P/L. For an executive, the financial result columns should be most prominent.
2. **Too many operational-count columns for an executive view**: Vouchers, Bookings, Contracts, Collections are activity counts. They belong in the table but should come after the financial columns.
3. **No total row**: The table shows per-period rows but no total row at the bottom. The totals are in the KPI section above, but having them also in the table provides an immediate "evidence check" for the reader.
4. **No highlighting of key periods**: The Feb period shows -818,000 (a loss month) and is not visually distinct. A loss period should be flagged.

### 7. Calculation Notes

**Current state**: Six assumptions in `ReportAssumptionNote` blocks:
1. "Contracted sales are summed from sale contract amounts by contract date."
2. "Collected sales are summed from collection amounts by collection date."
3. "Revenue is derived from posted voucher lines in REVENUE account classes..."
4. "Expenses are derived from posted voucher lines in EXPENSE account classes..."
5. "Net profit/loss is revenue minus expenses; loss is shown as the absolute amount..."
6. "Voucher, booking, sale contract, and collection counts are grouped..."

**Content weaknesses**:

1. **Too technical**: These read as accounting methodology, not management-facing explanation. Most executives need a brief summary ("Net result is revenue minus expenses from posted vouchers") not a full accounting derivation.
2. **Too many notes for management**: Six separate note blocks is excessive. A condensed 2-3 sentence summary would serve management readers, with the detailed accounting methodology available via a disclosure toggle or footnote.
3. **Missing key context**: No note explains the relationship between contracted vs collected sales, no note flags the unclosed-earnings context (though this is specific to balance sheet), no note explains that the report covers a selected period only (not year-to-date or fiscal year).

### 8. Missing Decision-Support Content

The page currently provides data but does not provide interpretation or decision signals. Based on available data (existing API response fields + frontend-derived calculations), the following content could be added without any backend changes:

**a. Collection efficiency callout** (frontend-derived from `collectedSalesAmount / contractedSalesAmount`):
- Currently: 4.34M / 15.6M = 28% — only 28% of contracted value has been collected. This is the most important operational signal on the page.
- Implementation: A simple ratio calculation from existing totals. No backend change needed.

**b. Expense ratio** (frontend-derived from `expenseAmount / revenueAmount`):
- Currently: 1.748M / 11.58M = 15% — expenses consume only 15% of revenue.
- Implementation: Simple ratio. No backend change needed.

**c. Net P/L interpretation sentence** (frontend-derived from totals + sign):
- "The business generated a profit of 9,832,000 over this period, with revenue of 11,580,000 against expenses of 1,748,000 (15% expense ratio). Collections stand at 28% of contracted value, indicating significant outstanding receivables."
- Implementation: String template from existing data. No backend change.

**d. Period comparison signal** (frontend-derived from bucket data):
- Compare the latest completed bucket vs the prior bucket to signal "improving" or "worsening". e.g. "April profit improved vs March."
- Implementation: Simple comparison from `report.buckets[latest]` vs `report.buckets[latest-1]`. No backend change.

**e. Loss-period flag** (frontend-derived from `netProfitLossAmount < 0` per bucket):
- Highlight any period bucket where net P/L is negative. Currently Feb shows -818,000 with no visual distinction.
- Implementation: Conditional styling per row. No backend change.

**f. profitAmount / lossAmount display** (available from API but unused):
- Instead of "Net profit / loss: 9,832,000" show "Profit: 9,832,000" (or "Loss: X" when negative). The API already returns `profitAmount` and `lossAmount` separately.
- Implementation: Use existing `totals.profitAmount` or `totals.lossAmount`. No backend change.

---

## Recommended Future Page Structure

After 49B implementation, the Business Overview page should follow this structure:

### 1. Page header + reporting context
- Title: "Business Performance" (stronger than "Business Overview Report")
- Company scope badge
- Print/export actions

### 2. Controls/filter strip
- Date range + period type selector
- Apply/Reset buttons
- (Read-only notice folded into context strip as a subtle note, not a separate banner)

### 3. Executive financial summary (primary KPI hierarchy)

**Primary row**:
- **Net result** — large emphasized card showing "Profit: 9,832,000" or "Loss: X" (using `profitAmount`/`lossAmount` fields), with brief explanation: "Revenue minus expenses from posted vouchers"

**Secondary row** (3 cards in a grid, replacing the current voucher-workload + 4 supporting metrics):

| Card | Label | Value | Why it matters |
|---|---|---|---|
| Revenue | "Revenue" | 11,580,000 | Core financial magnitude |
| Expenses | "Expenses" | 1,748,000 (15% of revenue) | Shows cost level with ratio |
| Collection progress | "Collections received" | 4,340,000 (28% of contracted) | **The critical operational signal** |

**Supporting detail row** (4 compact cards):
- Contracted sales: 15,600,000
- Expense ratio: 15% (frontend-derived)
- Voucher activity: 21 vouchers (20 posted / 1 draft)
- Period buckets: 5 periods reported

This structure gives an executive everything they need in one glance:
- Are we profitable? (primary card)
- How big is the business? (Revenue)
- How lean are we? (Expenses with ratio)
- Are we collecting what we sold? (Collection progress with ratio)
- Supporting detail available but not primary

### 4. Executive insight strip
- One sentence interpreting the overall result: "The business generated a profit of 9,832,000 over Jan–May 2026, driven by strong March and April revenue after an expense-only February. Collections stand at 28% of contracted value — 11.26M in outstanding receivables."
- Frontend-derived from existing totals + bucket pattern.
- Optional: period-change signal if last bucket differs from prior ("April result improved vs March" / "February showed a loss").

### 5. Flagship financial trend chart
- Current chart is structurally sound (Revenue/Expenses bars + Net result line)
- Content improvements:
  - Better title: "Financial performance trend" (matches section title)
  - Insight text becomes business interpretation, not chart-reading instruction
  - Description shortened or moved to chart footer

### 6. Period breakdown table
- Column reorder: Period | Revenue | Expenses | Net profit/loss | Expense ratio | Collection efficiency | Contracted sales | Collected sales | Vouchers | Bookings | Contracts | Collections
- Add a totals row at the bottom matching the KPI totals
- Flag loss periods with conditional styling (rose text/border for negative Net P/L)

### 7. Calculation notes / data scope
- Condensed to 2-3 sentences of management-facing explanation
- Detailed accounting methodology available via a collapsible disclosure or footnote
- No separate 6-block list of technical derivation notes

---

## Change Decision Table

| # | Current element | Current issue | Recommended action | Why it improves management usefulness | 49B or defer/reject |
|---|---|---|---|---|---|
| 1 | Page title "Business Overview Report" | Generic, describes page type not purpose | Rename to "Business Performance" | Immediately signals "this tells you how the business is doing" | 49B |
| 2 | Read-only notice as separate banner | Breaks flow between header and KPIs, reads as technical disclaimer | Fold into context strip as subtle note, reduce prominence | Keeps flow focused on executive content; traceability info still available but not competing with KPIs | 49B |
| 3 | Context strip "Data source: CRM/property + posted vouchers" | Technical jargon in primary context | Replace with "Reporting period" and "Result" only; move data source to calculation notes section | Executives need period + result; data source is reviewer context, not executive context | 49B |
| 4 | Voucher workload in primary/secondary KPI row | Operational volume, not financial result; misuses the premium card position | Move to supporting detail row; replace secondary position with Revenue card | Revenue is a financial result that directly explains Net P/L; voucher count is operational detail | 49B |
| 5 | Four flat supporting KPI cards (contracted/collected/revenue/expenses) | No hierarchy, no ratios, no relationship between metrics | Reorganize into: Secondary row (Revenue, Expenses with ratio, Collections with progress) + Supporting detail row (contracted, expense ratio, vouchers, buckets) | Creates clear financial narrative: result → drivers → operational context | 49B |
| 6 | No collection efficiency signal | Most important operational signal is completely invisible | Add "28% of contracted" or "4.34M / 15.6M collected" to collections card | An executive immediately sees the collection gap — the most actionable signal on the page | 49B |
| 7 | No expense ratio | Expenses and revenue sit as unrelated flat cards | Add "(15% of revenue)" to expenses card, add "Expense ratio: 15%" to supporting row | Shows cost efficiency in one number | 49B |
| 8 | "Net profit / loss" label | Technical accounting term, not management-friendly | Use "Net result" or "Business result" as label; display "Profit: 9,832,000" using profitAmount/lossAmount | Cleaner, more direct, separates profit from loss as distinct outcomes | 49B |
| 9 | No interpretation of Net P/L | Card shows number but does not explain what drives it | Add one-sentence insight strip between KPIs and chart | Bridges data to meaning; executive reads one sentence instead of mentally computing ratios | 49B |
| 10 | Chart insight text is chart-reading instruction | "Bars show revenue and expenses magnitude" — tells how to read chart | Replace with business interpretation: "The business achieved consistent profitability across March–April, with February recording an expense-only period before revenue recognition began" | Turns chart description from instruction to insight | 49B |
| 11 | Period table column order puts commercial before financial | Contracted/collected before revenue/expenses | Reorder: Period | Revenue | Expenses | Net P/L | Expense ratio | Collection efficiency | Contracted | Collected | Vouchers | Bookings | Contracts | Collections | Financial columns are the primary reason an executive reads this table | 49B |
| 12 | No totals row in period table | Totals only appear in KPI cards; table has no verification row | Add totals row at bottom matching KPI totals | Executive can verify totals in the same view as detail | 49B |
| 13 | No loss-period flag in table | Feb shows -818,000 with no visual distinction | Add conditional styling (rose text/border) for negative Net P/L cells | Signals attention-worthy periods immediately | 49B |
| 14 | Six technical calculation notes | Reads as accounting methodology, not management explanation | Condense to 2-3 management-facing sentences; detailed methodology in collapsible disclosure | Management reads brief explanation; accountants expand for full derivation | 49B |
| 15 | profitAmount/lossAmount API fields unused | Only netProfitLossAmount is displayed; separate fields available | Use profitAmount for profit display, lossAmount for loss display | Cleaner outcome label | 49B |

---

## Deferred Ideas

| Idea | Why deferred |
|---|---|
| Period-over-period percentage change (e.g. "Revenue +15% vs prior period") | Requires comparing two separate API calls with different date ranges. Frontend-only but needs careful date arithmetic. Worth doing but higher complexity than 49B scope allows. |
| Year-to-date vs selected-period comparison | Same issue — requires either a second API call or backend support for comparative data. Backend change needed for best UX. |
| Interactive chart drill-down (click a bar to see that period's detail) | Requires significant frontend state management. Chart interaction is a separate UX investment. |
| Cash-flow view (collected sales minus expenses = net cash position) | This is a different financial concept than net P/L. Would require a new backend calculation or at least a new frontend interpretation layer. Product decision needed. |
| "What changed" summary (compare current vs prior period with delta indicators) | Requires either a second API call for prior period or backend comparative endpoint. Both are beyond 49B scope. |
| Outstanding receivables amount (contracted minus collected) | Derivable from existing data (15.6M - 4.34M = 11.26M) but adding a new KPI for this needs product approval. Could be added in 49B as a supporting detail card if supervisor approves. |

---

## Rejected Ideas

| Idea | Why rejected |
|---|---|
| Adding Recharts AreaChart for revenue trend | The current bar+line composition is already executive-grade and visually effective. An area chart would look different but not necessarily better for this data. The visual architecture is finalized per 48D-R. |
| Adding a second chart for sales/collections | Directly contradicts the 48A-approved "one flagship chart" architecture. Contracted/collected data is in KPI cards. |
| Adding monthly/quarterly comparison tabs | Too much UI complexity for a single report page. The period type selector already handles this. |
| Adding a narrative paragraph that changes per period | Over-engineering. A static insight strip based on totals is sufficient for management usefulness. |

---

## Prompt 49B Implementation Plan

### Files to modify

1. `apps/web/src/features/financial-reporting/business-report-page.tsx` — primary implementation file

### Specific changes (ordered by execution sequence)

**1. Rename page title**
- `MODE_CONFIG.overview.title` from "Business Overview Report" to "Business Performance"
- `MODE_CONFIG.overview.description` from accountant-facing text to management-facing: "Company financial performance over the selected reporting period."

**2. Fold read-only notice into context strip**
- Remove `FinancialReportingReadOnlyNotice` as a separate banner
- Add its essential content ("Data from posted vouchers and CRM/property records") as a context strip item, using shorter wording: "Sources: posted vouchers + CRM/property records"

**3. Reorganize KPI section**
- Primary row: Net result card using `profitAmount` or `lossAmount` for display; label "Business result" instead of "Net profit / loss"
- Secondary row: 3 cards — Revenue, Expenses (with expense ratio), Collections received (with collection progress)
- Supporting detail row: 4 compact cards — Contracted sales, Expense ratio, Voucher activity, Period count
- Remove voucher workload from primary/secondary position

**4. Add executive insight strip**
- One sentence between KPI section and chart, derived from totals and bucket pattern
- Frontend-only template string, no backend data needed
- e.g. "The business generated a profit of {profitAmount} over {periodLabel}, with {expenseRatio}% expense ratio and {collectionProgress}% of contracted sales collected."

**5. Improve chart content text**
- Title: "Financial performance trend" (matches section title)
- Insight: business interpretation instead of chart-reading instruction
- Description: shorter, less technical

**6. Reorder period table columns**
- Move financial columns first: Revenue, Expenses, Net P/L
- Add derived columns: Expense ratio (%), Collection efficiency (%)
- Move operational counts last: Contracted, Collected, Vouchers, Bookings, Contracts, Collections
- Add totals row at bottom

**7. Add loss-period flag**
- Conditional styling on Net P/L cells when value < 0: rose text color, rose border on row

**8. Condense calculation notes**
- 2-3 management-facing sentences in primary view
- Detailed methodology in collapsible `<details>` disclosure element
- No separate 6-block list

### No changes to these files

- `apps/web/src/features/analytics/components.tsx` — chart primitives are finalized
- `apps/web/src/components/ui/erp-primitives.tsx` — primitives are finalized
- `apps/web/src/features/dashboard/` — dashboard is not touched
- Any other page files
- Any backend/API/schema files

### Estimated scope

~1 file modified (business-report-page.tsx), ~150-200 lines changed. All frontend-only, all using existing API response data.

---

## Supervisor Decisions Needed

1. **Page title**: "Business Performance" or keep "Business Overview Report"? The former is management-facing, the latter is accountant-facing. Recommend "Business Performance."

2. **Voucher workload card**: Move from primary/secondary position to supporting detail, or remove entirely? The voucher count is operational context, not financial result. Recommend moving to supporting detail row.

3. **Collection efficiency card**: Add as a secondary KPI with percentage, or leave as flat amount? Recommend adding percentage ("28% of contracted") because it is the most actionable signal.

4. **Should outstanding receivables amount (contracted minus collected) be added as a supporting KPI?** It is derivable from existing data (15.6M - 4.34M = 11.26M). This would add one more metric to the supporting row. Recommend yes, as "Outstanding receivables" in the supporting detail row.

5. **Calculation notes**: Condensed to 2-3 sentences with collapsible detail, or keep current 6-block format? Recommend condensed with collapsible disclosure.

---

## No Commit or Push

No staging, commits, or pushes were performed. All analysis is documentation only.
