# Phase 4: API Activity Trace

## Purpose

Phase 4 adds opt-in, metadata-only API activity to the Defense Trace overlay.
It helps a presenter explain the chain from a live UI action to the frontend API
helper, REST request path, backend ownership, and Prisma-backed data model.

The feature remains read-only. It does not change REST behavior, backend code,
database structure, or normal app behavior when trace mode is disabled.

## What Is Captured

When Defense Trace is enabled, the shared web API client emits a small browser
event for recent requests. The overlay keeps only the latest in-memory entries.

Captured fields:

- HTTP method
- Sanitized request path without host
- Query parameter keys only
- Status code when a response exists
- Duration in milliseconds
- Timestamp
- Best-effort matched trace entry id and label
- Failed-request flag

Query values are intentionally removed. For example, a request with paging and
filter values is displayed as path plus keys, not path plus submitted values.

## What Is Intentionally Not Captured

The overlay intentionally excludes:

- Request bodies
- Response bodies
- Authorization headers
- Browser session header values
- Passwords and credential strings
- Private keys
- Environment values
- Customer or company payload values
- File upload or download access details

The API activity list is not written to Git-tracked config or localStorage.

## How To Use During Defense

1. Open a route with `?trace=1` or press `Ctrl + Alt + T`.
2. Open **Recent API Activity**.
3. Trigger a page load or safe read-only action.
4. Point to the method, request path, status, duration, and matched topic.
5. Use **Backend search** to copy a repository search command for the endpoint.
6. Use **Trace command** when a request has a matched trace topic.
7. Use **Clear activity** to reset the in-memory list during a live walkthrough.

Professional explanation:

> The UI calls a typed frontend API helper. That helper sends a REST request to
> NestJS. The backend controller/service owns the business logic, and Prisma is
> used only from the backend to access PostgreSQL.

## Matching Design

Trace entries can now define optional `apiPatterns`. Patterns are relative and
portable. They match sanitized API paths by segment, including dynamic segments
such as `customers/:customerId/profile`.

Examples:

- `auth/login`
- `accounting/vouchers`
- `accounting/reports/trial-balance`
- `customers/:customerId/profile`
- `attachments/:attachmentId/download-url`
- `payroll-runs/:payrollRunId/post`

More specific patterns win over broader patterns.

## Privacy And Safety Notes

API activity is presenter-safe by design. It is a metadata trace, not a network
payload inspector. It should be used to explain request routing and ownership,
not to inspect business data.

Do not expand this feature to display request or response payloads during a
projector demo.

## Troubleshooting

If no API calls appear:

- Confirm Defense Trace is enabled.
- Refresh the page after enabling trace mode.
- Navigate to a screen that loads data from the API.
- Confirm the page uses `apiRequest` or `apiRequestText` from
  `apps/web/src/lib/api/client.ts`.
- Use the browser Network panel as a fallback to identify whether the page made
  a REST request.
- Use the fallback backend search command shown in the empty state for the
  currently selected trace topic.
