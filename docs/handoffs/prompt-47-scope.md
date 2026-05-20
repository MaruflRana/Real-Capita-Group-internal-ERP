# Prompt 47 Scope: Financial Reports Navigation Simplification + Business Overview Improvement

## Background

The Financial Reports section in the sidebar currently shows 9 navigation items, including 4 period-specific report pages (Daily, Weekly, Monthly, Yearly) that are rarely used and clutter the navigation. The supervisor requested simplifying the visible sidebar so that the primary entry point (Business Overview) is prominent and the period-specific reports are removed from navigation visibility.

## Prompt 47A: Sidebar Navigation Cleanup

### Goal

Remove Daily Report, Weekly Report, Monthly Report, and Yearly Report from the visible left sidebar navigation under the "Financial Reports" section. Keep Business Overview, Trial Balance, General Ledger, Profit & Loss, and Balance Sheet visible.

### Scope

- Remove 4 navigation entries from the `navigation` array in `app-shell.tsx`
- Remove unused `CalendarDays` icon import
- Do NOT delete underlying report route files, page components, APIs, or backend logic
- Do NOT change Business Overview functionality yet
- Do NOT change permissions, navigation behavior for other modules, reporting APIs, or dashboard logic

### Allowed files

- `apps/web/src/features/shell/app-shell.tsx`

### Forbidden scope

- Route files for daily/weekly/monthly/yearly reports (must remain functional)
- API endpoints or backend logic
- Business Overview page or its functionality
- Permission or access matrix changes
- Other module navigation changes
