# Prompt 47A Status: Financial Reports Sidebar Navigation Simplification

## Why This Change Was Requested

The Financial Reports section in the left sidebar showed 9 navigation items, including 4 period-specific report pages (Daily Report, Weekly Report, Monthly Report, Yearly Report). These period reports clutter the navigation and make the primary entry point (Business Overview) less prominent. The supervisor requested removing these 4 items from visible navigation while preserving all underlying route files, page components, APIs, and backend logic.

## What Was Removed from Visible Sidebar Navigation

- Daily Report (`/accounting/reports/daily`)
- Weekly Report (`/accounting/reports/weekly`)
- Monthly Report (`/accounting/reports/monthly`)
- Yearly Report (`/accounting/reports/yearly`)

These 4 entries were removed from the `navigation` array in `app-shell.tsx`. The `CalendarDays` icon import was also removed since it was only used by the Daily Report entry.

## What Was Intentionally Preserved

- Business Overview remains visible and unchanged in the sidebar
- Trial Balance, General Ledger, Profit & Loss, and Balance Sheet remain visible in the sidebar
- All underlying report route files, page components, and API endpoints remain intact and functional
- The daily/weekly/monthly/yearly report pages still exist and can be reached by direct URL navigation
- No permission, access matrix, or backend logic changes
- No other module navigation changes
- The `CalendarRange` icon import was preserved (still used by Installment Schedules and Leave Types)
- Search functionality still works — searching for "daily" or "weekly" won't find the removed entries (they're no longer in the navigation array), but the URLs still resolve

## Files Changed

- `apps/web/src/features/shell/app-shell.tsx` — removed 4 Financial Reports navigation entries and unused `CalendarDays` import

## Validation Results

| Check | Command | Result |
|---|---|---|
| Lint | `corepack pnpm lint` | 0 errors, pre-existing warnings only |
| Typecheck | `corepack pnpm typecheck` | passed for 5 projects |
| Build | `corepack pnpm build` | passed for 5 projects, all routes present |
| Diff whitespace | `git diff --check` | CRLF warnings only, no content errors |
| Docker rebuild | `docker compose up -d --build web` | passed, container healthy |

## Visual QA Result

### Dashboard at 1440px, 1366px, 1024px

1. Financial Reports section still appears in sidebar
2. Only Business Overview, Trial Balance, General Ledger, Profit & Loss, Balance Sheet are listed
3. Daily/Weekly/Monthly/Yearly Report links are no longer shown in the sidebar
4. Sidebar spacing is clean — no layout or overflow issues introduced
5. Business Overview page at `/accounting/reports/business-overview` loads correctly

Screenshots saved to `.tmp/prompt-47a/` at 1440px, 1366px, and 1024px widths.

## Readiness to Move Next into Business Overview Improvement

The sidebar navigation simplification is complete. The Financial Reports section now has only 5 items (Business Overview + the 4 canonical financial statements), making the entry point prominent and navigation cleaner. This clears the way for the next step: improving the Business Overview page itself.

## Review Links

- Dashboard: http://localhost:3000/dashboard
- Business Overview: http://localhost:3000/accounting/reports/business-overview
- Login: http://localhost:3000/login
