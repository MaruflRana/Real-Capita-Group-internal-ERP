# Prompt 48D Status: Redesign Retained High-Value Visual Pages

## Why This Work Followed 48B and 48C

Prompt 48B removed structural redundancy (module analytics panels, dashboard analytics grid, financial statement visual summaries, Business Overview distribution chart). Prompt 48C rebuilt the retained visual foundation (Recharts-based ExecutiveTrendChart/ExecutiveTrendChartCard, simplified 8-tone system, deleted dead analytics infrastructure). The 48B+48C state was lean and clean but still felt like "leftover after cleanup" rather than deliberately designed. Prompt 48D takes the retained important visual pages and makes them feel intentionally designed, premium, executive-friendly, and aligned with the Real Capita brand redesign established in Prompt 46.

## Dashboard Redesign Decisions

### E1. Executive KPI section — primary/secondary hierarchy

Before 48D, all 8 KPI cards used a flat uniform grid (`grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))]`) with identical styling. Every KPI looked the same regardless of importance.

After 48D:
- **Net profit/loss** receives a large emphasized card (`rounded-xl border-2` with gradient background, `text-2xl font-bold`, and a prominent "Profit"/"Loss" badge with period context). This is the most important executive KPI — it tells the business result in one glance.
- **Total assets** receives a secondary emphasized card alongside Net P/L in a `lg:grid-cols-[1.4fr_0.6fr]` layout.
- **6 operational KPIs** (draft vouchers, posted vouchers, available units, active bookings, pending leave requests, open payroll runs) sit in a compact grid below the financial section, using smaller `rounded-lg border p-3.5` cards.
- Financial and operational KPIs are visually separated by layout grouping rather than just a flat row.

This creates a clear visual hierarchy: financial result is primary, operational counts are secondary. An executive can scan "9,832,000 Profit" in under 2 seconds before moving to operational details.

### E2. Operational home card — compact streamlined context

Before 48D, the operational home card contained 5 verbose sub-blocks: company/slug, last login, accessible workspaces (with full badge list), dashboard period selector (with long explanatory text), and active roles (with badge list and verbose membership notes).

After 48D:
- Company name and slug are in the card header (not a separate sub-block).
- Roles are in the header alongside the company context (not a separate card).
- The content area uses a 3-column compact layout: reporting period selector, last login, and workspace count ("10 modules available" instead of listing every badge).
- The period explanatory text is shortened from "Financial metrics and recent-count widgets follow [period]. Recent activity panels always show the latest available records." to "KPIs follow [period]. Recent activity always shows latest records."
- The workspace badges list is only shown on small screens (sm:hidden/flex toggle).

The card is now significantly more compact, removing approximately 80 lines of verbose sub-blocks while preserving all functional data.

### E3. Section title/eyebrow improvements

- "Recent Activity" → "Activity" / "Latest records" → "Recent records"
- "Needs Attention" → "Attention" / "Pending work" (kept)
- "Quick Actions" → "Navigation" / "Jump to work" → "Quick actions"
- Gap between attention and actions: `gap-6` → `gap-5`

This creates a tighter rhythm without the verbose multi-word eyebrows.

### E4. Removed clutter has not returned

The dashboard retains only:
- Operational home (compact)
- Health status
- Executive KPIs (hierarchical)
- Recent records (timeline panels)
- Pending work (attention cards)
- Quick actions (navigation tiles)

No analytics grid, no module analytics panels, no full trend charts. The dashboard power is clarity and priority, not quantity.

## Business Overview Redesign Decisions

### F1. Executive summary — primary/secondary KPI hierarchy

Before 48D, all 6 ReportMetricCards were visually equal in a flat `ReportMetricGrid`. Net P/L, revenue, expenses, contracted sales, collected sales, and voucher workload all looked the same size.

After 48D:
- **Net profit/loss** receives a large emphasized card (`rounded-xl border-2` with conditional profit/loss gradient background, `text-2xl font-bold`, "Profit"/"Loss" badge, and a brief explanation "Revenue minus expenses from posted vouchers").
- **Voucher workload** receives a secondary card alongside Net P/L in a `lg:grid-cols-[1.4fr_0.6fr]` layout, keeping the voucher count accessible as a supporting operational signal.
- **4 supporting financial metrics** (contracted sales, collected sales, revenue, expenses) sit in a compact `ReportMetricGrid` below the primary section, using standard KpiCard sizing.

The Net P/L card tells the business result in one glance. The supporting metrics explain what drives it. The voucher workload shows operational volume.

### F2. Section title and description improvements

- "Visual analysis" → "Performance trends" with description: "Financial performance and sales activity trends over the selected period. Charts reveal movement patterns that summary figures alone cannot show."
- "Detailed period table" → "Period breakdown" with description: "Detailed period-by-period figures that support the executive summary and trend charts above."
- "Assumptions and calculation notes" → "Calculation notes" with description: "Calculation rules and data-source boundaries so reviewers can trace what each figure means."
- "Company-scoped business reporting" (read-only notice) → "Read-only business report" with shorter description.

The page flow now reads as a coherent financial narrative: filters → context → primary result → supporting metrics → trend charts → period detail → calculation notes.

### F3. All data and calculations preserved

All 6 original metrics are retained:
- Net profit/loss (now primary, emphasized)
- Contracted sales (supporting)
- Collected sales (supporting)
- Revenue (supporting)
- Expenses (supporting)
- Voucher workload (secondary, alongside Net P/L)

No data was removed. No calculations were changed. The visual hierarchy is purely compositional.

### F4. Print/export behavior preserved

The printable report template, CSV export, and browser print behavior remain intact. The screen-only redesign does not affect print-only output.

## Customer 360 Consistency Decision

After 48C, the Customer 360 retained metric/timeline surfaces were largely consistent with the new visual system. The metrics use `ReportGrid` + `MetricCard` with the simplified tone system (info for counts, success for collection values). This is appropriate for an entity-specific profile page — it should feel balanced, not prioritized like a financial dashboard.

Minor polish applied:
- "Customer Records Summary" → "Customer records summary" (lowercase convention)
- "Scheduled installment amount" tone changed from implicit `default` to explicit `tone="default"` for clarity
- "Posted voucher-backed collected" → "Posted-voucher confirmed" with helper "Voucher-confirmed portion of total collections." — the previous label was too technical for a management-facing profile; the new label is clearer while the helper explains the technical definition.

No structural changes, no chart additions, no workflow modifications, no data logic changes.

## Shared Visual-System Refinements

No new shared primitives were created. The redesign uses composition:
- Primary KPI card styling is inline (larger card, stronger border, gradient background, bold typography, contextual badges)
- Secondary KPI card uses existing `ReportMetricCard` → `KpiCard` with `tone="default"`
- Supporting metrics use existing `ReportMetricCard` → `KpiCard` with semantic tones
- Context strip uses existing `FinancialReportContextStrip`

The retained visual system from 48C (ExecutiveTrendChart/ExecutiveTrendChartCard, ChartLegend, MetricCardGrid, tone system, formatting helpers) is sufficient for page-level redesign through composition rather than new primitive types.

## Exact Files Changed (3 files)

### Modified (3 Prompt 48D-specific files):

- `apps/web/src/features/dashboard/dashboard-page.tsx` — major redesign: KPI section with primary/secondary hierarchy, compact operational home card, streamlined context layout, concise section titles
- `apps/web/src/features/financial-reporting/business-report-page.tsx` — redesigned executive summary with primary Net P/L + voucher workload + supporting metrics, improved section titles/descriptions, concise read-only notice
- `apps/web/src/features/crm-property-desk/customer-profile-page.tsx` — minor consistency polish: clearer label for posted-voucher metric, explicit tone assignments, lowercase section title convention

### Net diff: 331 insertions, 491 deletions (160-line net reduction)

## Validation Results

| Check | Command | Result |
|---|---|---|
| Lint | `corepack pnpm lint` | passed — 0 errors, pre-existing warnings only |
| Typecheck | `corepack pnpm typecheck` | passed for 5 projects |
| Build | `corepack pnpm build` | passed for 5 projects, all routes present |
| Diff whitespace | `git diff --check` | passed — CRLF warnings only, no content errors |
| Docker rebuild | `docker compose up -d --force-recreate web` | passed, all 4 services healthy |

## Visual QA Routes and Viewport Coverage

| Route | 1440px | 1366px | 1024px | Result |
|---|---|---|---|---|
| `/dashboard` | captured | captured | captured | NO_OVERFLOW, Net P/L primary card visible, operational KPIs below, compact context card |
| `/accounting/reports/business-overview` | captured | captured | captured | NO_OVERFLOW, Net P/L emphasized card visible, supporting metrics below, trend charts intact |
| `/accounting/reports/trial-balance` | captured | — | — | NO_OVERFLOW, no visual summary remnants, filters + metrics + table intact |
| `/crm-property-desk/customers/[customerId]` | captured | — | — | NO_OVERFLOW, "Posted-voucher confirmed" label visible, metrics consistent |

Screenshots saved to `.tmp/prompt-48d-review/`.

## What Remains for Prompt 48E Final QA and Checkpoint Preparation

1. Full runtime QA: lint, typecheck, build, test, seed:demo:verify, docker:smoke
2. Responsive QA verification at all three widths for all affected routes
3. Verify no chart rendering issues on Business Overview Recharts charts
4. Verify no table regression on Business Overview period breakdown table
5. Verify no import/runtime errors across all affected pages
6. Verify removed visual summaries remain absent on financial statements
7. Verify Customer 360 metrics render correctly with updated labels
8. Update foundation-status.md with Prompt 48D completion entry
9. Prepare for final checkpoint

## Caveats and Supervisor Review Points

1. The Net P/L emphasized card uses inline styling (not a new shared primitive) because it is composition-specific to executive dashboard/report pages. If future pages also need an emphasized primary KPI, the pattern should be extracted into a shared primitive.
2. The operational home card is more compact but does not list all workspace badges on desktop (only "10 modules available"). Full badge list is available on small screens. This is a deliberate information hierarchy choice.
3. No backend, API, Prisma schema, migration, seed, auth, routing, or workflow changes were made.
4. No staging, commits, or pushes were performed. All Prompt 48D changes remain visible in the dirty worktree for supervisor review alongside the cumulative 46B–48C changes.
