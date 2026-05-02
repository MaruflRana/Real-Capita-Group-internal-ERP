# Phase 1 Route And Module Inventory

This inventory is the Prompt 26 release-candidate reference for the implemented Phase 1 surface. It is an inventory only; it does not expand scope.

## Runtime Boundaries

- Web app: `http://localhost:3000`
- API base: `http://localhost:3333/api/v1`
- Swagger: `http://localhost:3333/api/docs`
- Object storage for browser-facing presigned URLs: `S3_PUBLIC_ENDPOINT`, locally `http://localhost:9000`
- `apps/web` remains a frontend-only API consumer.
- `apps/api` remains the only backend entry point.

## Role Access Matrix

| Module                    | Admin | Accountant | HR  | Payroll | Sales | Member |
| ------------------------- | ----- | ---------- | --- | ------- | ----- | ------ |
| Dashboard                 | yes   | yes        | yes | yes     | yes   | yes    |
| Org & Security            | yes   | no         | no  | no      | no    | no     |
| Accounting                | yes   | yes        | no  | no      | no    | no     |
| Financial Reports         | yes   | yes        | no  | no      | no    | no     |
| Project & Property Master | yes   | no         | no  | no      | no    | no     |
| CRM & Property Desk       | yes   | no         | no  | no      | yes   | no     |
| HR                        | yes   | no         | yes | no      | no    | no     |
| Payroll                   | yes   | no         | yes | yes     | no    | no     |
| Audit & Documents         | yes   | yes        | yes | yes     | yes   | no     |
| Audit Events              | yes   | no         | no  | no      | no    | no     |

Role codes are `company_admin`, `company_accountant`, `company_hr`, `company_payroll`, `company_sales`, and `company_member`.

## Backend API Module Summary

All business routes below are served by NestJS under `/api/v1` and are company-scoped unless noted.

| Module                    | Main API Surface                                                                                                                                                                                                  | Notes                                                                                                             |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Auth                      | `/auth/login`, `/auth/me`, `/auth/refresh`, `/auth/logout`                                                                                                                                                        | Login supports explicit company selection when required.                                                          |
| Health                    | `/health`, `/health/ready`, `/health/dependencies`                                                                                                                                                                | Runtime and dependency probes.                                                                                    |
| Org & Security            | `/companies`, `/companies/:companyId/locations`, `/departments`, `/users`, `/users/:userId/roles`, `/roles`                                                                                                       | Admin-only company setup and role assignment.                                                                     |
| Accounting                | `/companies/:companyId/accounting/account-classes`, `/account-groups`, `/ledger-accounts`, `/particular-accounts`, `/vouchers`                                                                                    | Chart of accounts and voucher operations.                                                                         |
| Financial Reports         | `/companies/:companyId/accounting/reports/business-overview`, `/trial-balance`, `/general-ledger`, `/profit-loss`, `/balance-sheet` plus `/export` variants                                                       | Read-only posted-voucher, CRM/property business overview, periodic day/week/month/year reporting, and CSV export. |
| Project & Property Master | `/companies/:companyId/projects`, `/cost-centers`, `/project-phases`, `/blocks`, `/zones`, `/unit-types`, `/unit-statuses`, `/units`                                                                              | Admin master data.                                                                                                |
| CRM & Property Desk       | `/companies/:companyId/customers`, `/leads`, `/bookings`, `/sale-contracts`, `/installment-schedules`, `/collections`                                                                                             | Admin and sales operational flows.                                                                                |
| CRM References            | `/companies/:companyId/crm-property-desk/references/projects`, `/units`, `/vouchers`                                                                                                                              | Selector compatibility endpoints.                                                                                 |
| HR                        | `/companies/:companyId/employees`, `/attendance-devices`, `/device-users`, `/attendance-logs`, `/leave-types`, `/leave-requests`                                                                                  | Admin and HR operations.                                                                                          |
| HR References             | `/companies/:companyId/hr/references/departments`, `/locations`, `/users`                                                                                                                                         | Selector compatibility endpoints.                                                                                 |
| Payroll                   | `/companies/:companyId/salary-structures`, `/payroll-runs`, `/payroll-runs/:payrollRunId/lines`                                                                                                                   | Admin, HR, and payroll operations.                                                                                |
| Payroll References        | `/companies/:companyId/payroll/references/projects`, `/cost-centers`, `/employees`, `/particular-accounts`                                                                                                        | Selector compatibility endpoints.                                                                                 |
| Audit & Documents         | `/companies/:companyId/attachments`, `/attachments/uploads`, `/attachments/:attachmentId/finalize`, `/attachments/:attachmentId/download-access`, `/attachments/:attachmentId/links`, `/attachments/references/*` | Direct browser-to-storage upload/download through presigned URLs.                                                 |
| Audit Events              | `/companies/:companyId/audit-events`                                                                                                                                                                              | Admin-only audit trail browsing.                                                                                  |

## Frontend Route Summary

| Module                    | Routes                                                                                                                                                     | Expected Access                                           |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Public                    | `/login`                                                                                                                                                   | Unauthenticated users.                                    |
| Dashboard                 | `/dashboard`                                                                                                                                               | All company roles.                                        |
| Org & Security            | `/org-security/companies`, `/locations`, `/departments`, `/users`, `/role-assignments`                                                                     | Admin.                                                    |
| Accounting                | `/accounting/chart-of-accounts`, `/accounting/vouchers`, `/accounting/vouchers/new`, `/accounting/vouchers/[voucherId]`                                    | Admin, accountant.                                        |
| Financial Reports         | `/accounting/reports/business-overview`, `/daily`, `/weekly`, `/monthly`, `/yearly`, `/trial-balance`, `/general-ledger`, `/profit-loss`, `/balance-sheet` | Admin, accountant.                                        |
| Project & Property Master | `/project-property/projects`, `/cost-centers`, `/phases`, `/blocks`, `/zones`, `/unit-types`, `/unit-statuses`, `/units`                                   | Admin.                                                    |
| CRM & Property Desk       | `/crm-property-desk/customers`, `/leads`, `/bookings`, `/sale-contracts`, `/installment-schedules`, `/collections`                                         | Admin, sales.                                             |
| HR                        | `/hr/employees`, `/attendance-devices`, `/device-mappings`, `/attendance-logs`, `/leave-types`, `/leave-requests`                                          | Admin, HR.                                                |
| Payroll                   | `/payroll/salary-structures`, `/payroll/runs`, `/payroll/runs/[payrollRunId]`, `/payroll/posting`                                                          | Admin, HR, payroll.                                       |
| Audit & Documents         | `/audit-documents/attachments`, `/audit-documents/attachments/[attachmentId]`                                                                              | Admin, accountant, HR, payroll, sales.                    |
| Audit Events              | `/audit-documents/audit-events`                                                                                                                            | Admin.                                                    |
| Forbidden Help            | `/unauthorized`                                                                                                                                            | Authenticated or redirected users needing access context. |

Protected routes redirect unauthenticated sessions to `/login?next=...`. Authenticated sessions without the required company role render the in-shell forbidden state.

## Output Surfaces

| Route                                   | CSV Export | Print-Friendly |
| --------------------------------------- | ---------- | -------------- |
| `/accounting/reports/business-overview` | yes        | yes            |
| `/accounting/reports/daily`             | yes        | yes            |
| `/accounting/reports/weekly`            | yes        | yes            |
| `/accounting/reports/monthly`           | yes        | yes            |
| `/accounting/reports/yearly`            | yes        | yes            |
| `/accounting/reports/trial-balance`     | yes        | yes            |
| `/accounting/reports/general-ledger`    | yes        | yes            |
| `/accounting/reports/profit-loss`       | yes        | yes            |
| `/accounting/reports/balance-sheet`     | yes        | yes            |
| `/accounting/vouchers/[voucherId]`      | yes        | yes            |
| `/project-property/units`               | yes        | no             |
| `/crm-property-desk/customers`          | yes        | no             |
| `/crm-property-desk/bookings`           | yes        | no             |
| `/crm-property-desk/collections`        | yes        | no             |
| `/hr/employees`                         | yes        | no             |
| `/hr/leave-requests`                    | yes        | no             |
| `/payroll/runs`                         | yes        | no             |
| `/audit-documents/attachments`          | yes        | no             |
| `/audit-documents/audit-events`         | yes        | no             |

CSV is the only Phase 1 export file format. Browser print is the only Phase 1 print/PDF-from-browser path.

## Operational Analytics Surfaces

Prompt 38 upgraded the read-only operational analytics panels on non-financial module pages. These panels remain frontend-only aggregations over existing REST list/report data and do not add transactions, schema, seeds, or backend report contracts.

| Module                    | Analytics Coverage                                                                                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accounting                | Chart of accounts and vouchers show voucher control, draft/posted mix, voucher type mix, debit/credit movement, recent posting activity, and attention rows.     |
| Project & Property Master | Projects, hierarchy masters, unit types/statuses, and units show inventory status, project hierarchy coverage, units by project/type, and top inventory rows.    |
| CRM & Property Desk       | Customers, leads, bookings, sale contracts, installment schedules, and collections show pipeline, booking/installment risk, sales value, collections, and follow-up rows. |
| HR                        | Employees, attendance devices/mappings/logs, leave types, and leave requests show people coverage, department/location spread, attendance movement, leave mix, and attention rows. |
| Payroll                   | Salary structures, payroll runs, and payroll posting show workload, posting readiness, gross/deduction/net trends, scope mix, and recent payroll periods.          |
| Audit & Documents         | Attachments and audit events show document coverage, attachment movement, audit category/type distribution, and document attention rows.                           |
| Dashboard                 | `/dashboard` keeps an executive roll-up and surfaces selected operational summaries without duplicating every module metric.                                      |

## Intentionally Out Of Scope

- New ERP business modules or CRUD domains
- Public-facing portals
- Approval workflow engines
- Notifications or messaging
- Import systems
- Fake real-company data; controlled synthetic demo/UAT seed data is documented separately in `docs/operations/demo-data.md`
- `.xlsx` generation
- Server-side PDF rendering
- Automated scheduled backup infrastructure
- Point-in-time recovery
- Kubernetes or a redesigned runtime architecture
