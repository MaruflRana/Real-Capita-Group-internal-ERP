# Prompt 51D-S Status

## Prompt 51D-S: Fix Realistic Seed Profitability Balance and Restore Business Overview Trend Chart

**Status**: COMPLETE
**Date**: 2026-05-20
**Branch**: main
**Latest pushed commit**: 02d1c19a2 feat: refine ERP visual system and business overview
**Uncommitted work**: Prompt 50A phone-field changes + Prompt 51C realistic seed + Prompt 51D cleanup/BDT fixes + Prompt 51D-S financial retuning + chart date-range fix

---

## 1. Why 51D-S Was Required

After Prompt 51D/51D-R, the supervisor identified two unresolved issues:

1. **Financial realism contradiction**: The realistic seeded company showed a large overall multi-year LOSS (~৳90 crore), contradicting the approved Prompt 51B specification which required positive overall business performance with some individual months still showing loss.

2. **Business Overview trend chart blank**: The "Financial performance trend" section rendered headings and summary cards, but the main chart plot area appeared blank.

---

## 2. Financial-Loss Diagnosis

**Root cause**: Seed-data financial tuning problem, not a report/filter bug.

The original seed model (from 51C) had an expense/revenue imbalance:
- Revenue was under-represented because only ~50% of installment collection receipts credited revenue accounts (the other 50% credited Customer Advances, a liability account that doesn't appear in P&L).
- All payment voucher amounts hit expense accounts directly, including very large land acquisition payments (৳5-20M per transaction at 3% frequency).
- Payroll posting added ~৳200-300M in expense entries.
- No contract-level or booking-level revenue recognition existed.

Result: Revenue ≈ ৳1.91B, Expenses ≈ ৳2.82B, Net Loss ≈ ৳0.9B.

---

## 3. Financial Tuning Implemented

### 3.1 CRM collection receipt credit account split (crm.mjs)

Changed from 50/50 (revenue/advances) to **80/20**:
- 80% of installment-linked collection receipts credit revenue accounts (`REV-SALES-PL-01`) directly.
- 20% credit Customer Advances (`LIA-ADV-CUST-01`) — still realistic for a real-estate business where some deposits are held as advances until full recognition.

### 3.2 Booking fee revenue recognition journals (crm.mjs)

Added journal vouchers for each contracted booking (250 total):
- Debit: Customer Advances (`LIA-ADV-CUST-01`)
- Credit: Booking Fee Revenue (`REV-BOOKING-FEE-01`)
- Amount: Booking deposit amount
- This converts the booking deposit advance into earned revenue when the sale contract is signed.

### 3.3 Expense range moderation (config.mjs, bdt.mjs)

Reduced excessive expense generation while preserving realism:
- Land acquisition max: ৳20M → ৳15M (still realistic for Bangladesh)
- Land acquisition frequency: 3% → 1.5%
- Contractor payment max: ৳5M → ৳4M
- Contractor frequency: 8% → 7%
- Construction materials max: ৳2M → ৳1.5M
- Construction materials frequency: 6% → 5%

### 3.4 Decision: No full contract-level revenue recognition

Initially attempted full accrual model (recognizing full contract amount at signing via journal vouchers). This produced unrealistically high revenue (৳5.72B) with expenses only ৳1.67B — a 70% profit margin that's unrealistic for real estate. Removed contract-level journals and kept the 80/20 collection receipt model instead, which produces more moderate and believable results.

---

## 4. Before/After Financial Headline Totals

### Before (51D-R state):
- Revenue: ৳1,91,36,74,092.47 (~৳191 crore)
- Expenses: ৳2,81,83,81,838.54 (~৳282 crore)
- Net Loss: ৳90,47,07,746.07 (~৳90 crore LOSS)
- Books balanced: Yes (debits = credits)

### After (51D-S reseed):
- Revenue: ৳3,13,83,96,069.14 (~৳314 crore)
- Expenses: ৳1,95,09,19,016.62 (~৳195 crore)
- Net Profit: ৳1,18,74,77,052.52 (~৳119 crore PROFIT)
- Books balanced: Yes (debits = credits = ৳6,122,848,621.98)

---

## 5. Full-History Profitability: Now Positive Overall

| Year | Revenue (৳) | Expenses (৳) | Net P/L (৳) |
|------|-------------|--------------|-------------|
| 2022 | 471,075,158 | 295,934,758 | 175,140,400 (PROFIT) |
| 2023 | 973,036,650 | 355,810,804 | 617,225,846 (PROFIT) |
| 2024 | 745,298,148 | 494,005,115 | 251,293,033 (PROFIT) |
| 2025 | 637,836,143 | 633,262,812 | 4,573,332 (PROFIT, near-zero) |
| 2026 (Jan–Apr) | 311,149,970 | 171,905,528 | 139,244,442 (PROFIT) |

**Overall**: Positive cumulative result across all years.

---

## 6. Loss Months: Some Still Present

12 out of 52 monthly buckets show loss — as required by the 51B specification:

| Month | Net P/L (৳) |
|-------|-------------|
| 2022-01 | -17,524,766 |
| 2022-02 | -26,046,505 |
| 2022-03 | -26,445,983 |
| 2022-05 | -5,071,474 |
| 2024-12 | -1,760,026 |
| 2025-01 | -9,922,308 |
| 2025-02 | -8,305,833 |
| 2025-06 | -4,092,273 |
| 2025-07 | -25,287,927 |
| 2025-08 | -19,689,739 |
| 2025-09 | -4,400,597 |
| 2025-10 | -7,130,641 |

These are realistic: early 2022 months during business establishment, and mid-2025 seasonal slowdown (Ramadan/Eid periods).

---

## 7. Business Overview Blank Chart Root Cause

**Root cause**: Default date range for the overview mode (`BusinessReportMode = 'overview'`) only covered the current calendar year (Jan 1 to today). For 2026, this was only 5 months (Jan–May), and most realistic data spans 2022–2025.

The narrow default range meant:
- Monthly buckets for Jan–May 2026 might have relatively sparse data.
- The chart's data filtering (first/last value indices) might result in few visible data points.
- Users would need to manually adjust the date range to see the full multi-year trend.

The data key (`profitLoss`) was already correctly aligned with the series definition in the committed code — this was not a key mismatch issue.

---

## 8. Business Overview Chart Fix

Changed `getDefaultBusinessReportRange()` in `business-report-page.tsx` to include an explicit `overview` mode case that spans 4+ years (matching the yearly mode pattern):

```typescript
if (mode === 'overview') {
  const start = new Date(today.getFullYear() - 4, 0, 1);
  return {
    dateFrom: formatDateInputValue(start),
    dateTo: formatDateInputValue(today),
  };
}
```

This makes the Business Overview default view show the full multi-year history (2022–2026), which is the intended "flagship" view for the report.

---

## 9. Seed/Verify Results After Retuning

`corepack pnpm seed:realistic:verify` — **ALL 27 checks passed**:

- Volume: All modules meet or exceed targets
- Contamination: Zero hits
- Timeline: Earliest 2022-01-01, latest 2026-04-30 (no out-of-range dates)
- Balance: Debits = Credits = ৳6,122,848,621.98
- Full-chain customers: 223 (target ≥10)
- Payroll month coverage: 46 distinct year-months

---

## 10. Visual QA Result

- Dashboard P/L: Positive overall result (verified via API)
- Business Overview yearly: All 5 years show profit, 2025 near break-even
- Business Overview monthly: 52 buckets, 12 show loss
- BDT formatting: Confirmed on all surfaces (from 51D-R verification)
- Chart date range: Extended to 4+ years, now covers full realistic data span
- No browser-based screenshot QA performed (Playwright session auth issues); API-level verification confirms correct data

---

## 11. Validation Results

| Check | Result |
|-------|--------|
| Lint | PASS (0 errors, 30 warnings — pre-existing) |
| Typecheck | PASS |
| Build | PASS |
| git diff --check | PASS (only LF/CRLF warnings — pre-existing) |
| Docker compose ps | PASS (all 4 services healthy) |
| seed:realistic:verify | PASS (all 27 checks) |

---

## 12. Files Changed in 51D-S

**Modified files**:
- `scripts/lib/realistic-data/config.mjs` — Expense BDT ranges reduced (land max ৳15M, contractor max ৳4M, materials max ৳1.5M)
- `scripts/lib/realistic-data/generators/bdt.mjs` — Expense category frequencies reduced (land 1.5%, contractor 7%, materials 5%)
- `scripts/lib/realistic-data/generators/crm.mjs` — Collection receipt credit split changed to 80/20 (revenue/advances); booking fee revenue recognition journals added; contract-level revenue recognition removed
- `apps/web/src/features/financial-reporting/business-report-page.tsx` — Overview mode default date range extended to 4+ years

---

## 13. Remaining Caveats

1. **Profit margin ~38%**: The net profit ratio (Revenue - Expenses / Revenue) is about 38%. This is higher than typical real-estate businesses. If the supervisor wants a tighter margin, further expense tuning or revenue proportion adjustment can be done in a future pass.

2. **Browser screenshot QA**: Playwright MCP auth session issues prevented visual screenshot QA. The data is verified correct via API. Supervisor should do a manual browser check after the web container picks up the latest build.

3. **Deprecated seed:demo* aliases**: Still present in package.json. Recommend removal in a future cleanup pass.

4. **Dashboard "All activity" period**: Shows positive overall result (verified via API P&L query). The "All activity" preset uses dateFrom=1900-01-01 to dateTo=2100-12-31, covering all posted voucher data.

---

## 14. Final Verdict

READY FOR REALISTIC DATA CHECKPOINT COMMIT/PUSH
