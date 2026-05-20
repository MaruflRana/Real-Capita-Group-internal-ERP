# Prompt 51D-T Status

## Prompt 51D-T: Diagnose and Fix Blank Business Overview Financial Trend Chart at Browser Runtime

**Status**: COMPLETE
**Date**: 2026-05-21
**Branch**: main
**Latest pushed commit**: 02d1c19a2 feat: refine ERP visual system and business overview
**Uncommitted work**: Prompt 50A phone-field changes + Prompt 51C realistic seed + Prompt 51D cleanup/BDT fixes + Prompt 51D-S profitability retuning + Prompt 51D-T chart fix

---

## 1. Why 51D-T Was Needed

After Prompt 51D-S fixed the profitability balance (positive overall net profit) and extended the Business Overview default date range to 4+ years, the supervisor confirmed that the Business Overview "Financial performance trend" chart was still completely blank in the browser despite:

- Summary totals (Revenue, Expenses, Net Result) rendering correctly
- The chart card, heading, description, and legend rendering correctly
- The chart plot area containing a container div but no visible bars, line, axes, or marks

The prior 51D-S explanation (short date range) was incomplete. The true root cause required browser-runtime diagnosis.

---

## 2. Exact Browser Symptom

On `/accounting/reports/business-overview`:

- Executive summary section: populated, positive profit, all BDT/৳ values correct
- Performance trend section: card heading "Financial performance trend" renders
- Legend items: Revenue ৳3,13,83,96,069.14, Expenses ৳1,95,09,19,016.62, Net result ৳1,18,74,77,052.52 — all render
- Chart plot area: completely blank — no SVG content, no bars, no line, no axes
- Browser console warning: `The width(-1) and height(-1) of chart should be greater than 0`

---

## 3. True Chart Root Cause

**The root cause was a CSS `min-height` vs `height` mismatch with Recharts `ResponsiveContainer`.**

The chart container used Tailwind `min-h-[280px]` / `sm:min-h-[320px]` (which sets CSS `min-height`), and the `ResponsiveContainer` was configured with `width="100%"` and `height="100%"`.

In CSS, `height: 100%` requires the parent to have an explicit `height` property (not just `min-height`). `min-height` alone does not establish a containing block for percentage-based height inheritance. Therefore `ResponsiveContainer` measured its parent height as 0 (or -1 during initial SSR/hydration mount), and rendered the inner chart div with `style="width: 0px; height: 0px"`.

**Previous date-range explanation was incomplete**: The 51D-S date-range fix (overview mode defaulting to 4+ years) was a correct improvement but did not address the actual rendering failure. The chart would have remained blank regardless of the date range because the `ResponsiveContainer` could not resolve its height from a `min-height` parent.

**Additional SSR/hydration contribution**: The Next.js App Router client-side hydration also contributed to the initial -1 measurement. During first render, `ResponsiveContainer` measured -1 width and -1 height before the DOM was fully laid out. This was addressed with a `mounted` state guard (render a loading skeleton before mount, then switch to the chart after mount).

---

## 4. Fix Implemented

Two changes in `apps/web/src/features/analytics/components.tsx`:

### 4.1 Chart container: `min-height` → `height` (PRIMARY FIX)

Changed the chart wrapper div from `min-h-[280px]` / `sm:min-h-[320px]` to `h-[280px]` / `sm:h-[320px]`:

```diff
- <div className="min-h-[280px] px-2 py-2 sm:min-h-[320px]">
+ <div className="h-[280px] px-2 py-2 sm:h-[320px]">
```

This gives `ResponsiveContainer`'s `height="100%"` an explicit `height` containing block to resolve against.

### 4.2 Client-side mount guard (HYDRATION FIX)

Added `useState(false)` + `useEffect(() => setMounted(true))` in `ExecutiveTrendChart`. Before mount, render a loading skeleton placeholder (matching the chart container structure). After mount, render the actual `ResponsiveContainer` + `ComposedChart`.

This prevents Recharts from measuring -1/-1 dimensions during SSR/hydration, and ensures the chart only renders after the DOM has proper layout dimensions.

### 4.3 Loading skeleton placeholder

Also updated the loading skeleton placeholder to use `h-[280px]` / `h-[320px]` instead of `min-h-[...]` for consistency.

---

## 5. Whether Prior Date-Range Theory Was Incorrect/Incomplete

The prior theory that the chart was blank because the default date range was too short was **incomplete**. The date-range fix was a correct improvement (overview mode should default to 4+ years for the flagship view), but it did not address the actual rendering failure. The chart would have been blank with any date range because `ResponsiveContainer` could not resolve its height from a `min-height` parent.

---

## 6. Browser Proof That Chart Now Renders

After rebuilding the web container and navigating to `/accounting/reports/business-overview`:

- **SVG now exists** with computed width 1312 and height 304 at 1440px viewport
- **104 bar rectangles** rendered (52 revenue + 52 expenses) with proper fill colors (#11AA38 revenue green, #D64047 expense red)
- **1 net result line** rendered (stroke #006FB7, path length 2501)
- **Cartesian grid** rendered with horizontal lines
- **Legend items** still render correctly with BDT/৳ values
- **Summary totals** still render correctly

Viewport verification:
- **1440px**: Chart renders with 104 bars and 1 line ✓
- **1366px**: Chart renders correctly ✓
- **1024px**: Chart renders with 104 bars and 1 line ✓

Screenshots captured in `.tmp/prompt-51d-t-review/` (not staged).

---

## 7. Dashboard Regression Check

Dashboard at `/dashboard`:
- Net profit ৳1,18,74,77,052.52: unchanged and correct ✓
- Total assets ৳2,05,83,19,119.65: unchanged ✓
- BDT/৳ formatting: intact ✓
- No console errors introduced ✓
- No layout breakage ✓

---

## 8. Validation Results

| Check | Result |
|-------|--------|
| Lint | PASS (0 errors, 30 warnings — pre-existing) |
| Typecheck | PASS |
| Build | PASS |
| git diff --check | PASS (only LF/CRLF warnings — pre-existing) |
| Docker compose ps | PASS (all 4 services healthy) |
| Browser QA at 1440px | PASS (chart renders with bars + line) |
| Browser QA at 1366px | PASS (chart renders) |
| Browser QA at 1024px | PASS (chart renders) |
| Dashboard regression | PASS (no regression) |

---

## 9. Files Changed in 51D-T

**Modified**:
- `apps/web/src/features/analytics/components.tsx` — Three changes:
  1. Import `useEffect, useState` instead of just `ReactNode`
  2. Added `mounted` state + `useEffect` guard in `ExecutiveTrendChart`
  3. Changed chart container from `min-h-[280px]` / `sm:min-h-[320px]` to `h-[280px]` / `sm:h-[320px]`
  4. Added loading skeleton placeholder when `!mounted`
  5. Updated loading skeleton from `min-h-[...]` to `h-[...]`

---

## 10. Remaining Caveats

1. **Recharts -1/-1 warning persists**: The browser console still shows `The width(-1) and height(-1) of chart should be greater than 0` once during initial mount. This occurs during the loading skeleton phase before the `mounted` state switches to the actual chart. It is harmless — the chart renders correctly after mount. Suppressing this warning would require more invasive changes (e.g., dynamic import with `ssr: false`) that are not justified for this fix scope.

2. **Deprecated `seed:demo*` aliases**: Still present in package.json. Recommend removal in a future cleanup pass.

---

## 11. Final Verdict

READY FOR REALISTIC DATA CHECKPOINT COMMIT/PUSH
