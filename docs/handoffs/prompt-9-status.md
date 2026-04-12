# Prompt 9 Status

## Implemented

- HR Core schema expansion on top of Prompt 8:
  - `employees`
  - `attendance_devices`
  - `device_users`
  - `attendance_logs`
  - `leave_types`
  - `leave_requests`
- Backend HR module with company-scoped REST APIs for:
  - employees
  - attendance devices
  - device-user mappings
  - attendance logs
  - leave types
  - leave requests
- New company-scoped `company_hr` role definition seeded into the database and included in bootstrap role guarantees.
- Reuse of the existing auth, company-assignment guard, Org & Security admin foundation, accounting foundation, project/property foundation, and CRM/property desk foundation without frontend or Next.js backend changes.
- Swagger documentation for all Prompt 9 HR endpoints.
- Scoped backend tests for employee, attendance device, device-user mapping, attendance log, leave type, and leave request validation behavior.

## Database Logic Added

- Migration `20260316143000_prompt_9_hr_core` adds:
  - Prompt 9 HR tables and enums
  - `company_hr` role seed/upsert
  - composite company-scoped keys for employees, attendance devices, device users, attendance logs, leave types, and leave requests
  - `departments_id_companyId_key` to support company-safe employee/department linkage
  - partial unique indexes for active device-user mappings by employee/device and by attendance-device/device-employee-code
  - employee self-manager protection check constraint
  - leave-request date-range check constraint
  - leave-request overlap exclusion constraint for submitted/approved requests
  - `enforce_employee_user_company_consistency()` trigger function
  - `enforce_leave_request_update_rules()` trigger function
- PostgreSQL now enforces Prompt 9 HR integrity:
  - employee department and location must belong to the same company
  - attendance-device location must belong to the same company
  - device-user employee/device relationships must stay in the same company
  - leave-request employee/leave-type relationships must stay in the same company
  - employees cannot reference themselves as managers
  - linked employee users must already have active company access in the same company
  - only one active device-user mapping can exist per employee/device pair
  - only one active device-user mapping can exist per device employee code on a given attendance device
  - leave requests require `startDate <= endDate`
  - submitted/approved leave requests cannot overlap for the same employee
  - submitted leave requests only allow approve/reject/cancel actions
  - approved/rejected/cancelled leave requests cannot be mutated

## New Authorization Behavior

- Prompt 4 auth remains intact.
- Prompt 5 company-admin baseline remains intact.
- Prompt 6 accounting access remains intact.
- Prompt 8 `company_sales` access remains intact.
- Prompt 9 adds `company_hr` as an assignable company-scoped role definition.
- Prompt 9 HR routes allow either:
  - `company_admin`
  - `company_hr`
- Company-scoped access enforcement remains mandatory for all Prompt 9 routes.

## Endpoints Added

### Employees

- `GET /api/v1/companies/:companyId/employees`
- `GET /api/v1/companies/:companyId/employees/:employeeId`
- `POST /api/v1/companies/:companyId/employees`
- `PATCH /api/v1/companies/:companyId/employees/:employeeId`
- `POST /api/v1/companies/:companyId/employees/:employeeId/activate`
- `POST /api/v1/companies/:companyId/employees/:employeeId/deactivate`

### Attendance Devices

- `GET /api/v1/companies/:companyId/attendance-devices`
- `GET /api/v1/companies/:companyId/attendance-devices/:attendanceDeviceId`
- `POST /api/v1/companies/:companyId/attendance-devices`
- `PATCH /api/v1/companies/:companyId/attendance-devices/:attendanceDeviceId`
- `POST /api/v1/companies/:companyId/attendance-devices/:attendanceDeviceId/activate`
- `POST /api/v1/companies/:companyId/attendance-devices/:attendanceDeviceId/deactivate`

### Device User Mappings

- `GET /api/v1/companies/:companyId/device-users`
- `GET /api/v1/companies/:companyId/device-users/:deviceUserId`
- `POST /api/v1/companies/:companyId/device-users`
- `PATCH /api/v1/companies/:companyId/device-users/:deviceUserId`
- `POST /api/v1/companies/:companyId/device-users/:deviceUserId/activate`
- `POST /api/v1/companies/:companyId/device-users/:deviceUserId/deactivate`

### Attendance Logs

- `GET /api/v1/companies/:companyId/attendance-logs`
- `GET /api/v1/companies/:companyId/attendance-logs/:attendanceLogId`
- `POST /api/v1/companies/:companyId/attendance-logs`
- `POST /api/v1/companies/:companyId/attendance-logs/bulk`

### Leave Types

- `GET /api/v1/companies/:companyId/leave-types`
- `GET /api/v1/companies/:companyId/leave-types/:leaveTypeId`
- `POST /api/v1/companies/:companyId/leave-types`
- `PATCH /api/v1/companies/:companyId/leave-types/:leaveTypeId`
- `POST /api/v1/companies/:companyId/leave-types/:leaveTypeId/activate`
- `POST /api/v1/companies/:companyId/leave-types/:leaveTypeId/deactivate`

### Leave Requests

- `GET /api/v1/companies/:companyId/leave-requests`
- `GET /api/v1/companies/:companyId/leave-requests/:leaveRequestId`
- `POST /api/v1/companies/:companyId/leave-requests`
- `PATCH /api/v1/companies/:companyId/leave-requests/:leaveRequestId`
- `POST /api/v1/companies/:companyId/leave-requests/:leaveRequestId/submit`
- `POST /api/v1/companies/:companyId/leave-requests/:leaveRequestId/approve`
- `POST /api/v1/companies/:companyId/leave-requests/:leaveRequestId/reject`
- `POST /api/v1/companies/:companyId/leave-requests/:leaveRequestId/cancel`

## Query And Validation Notes

- Employee list supports pagination/search/sort plus:
  - `departmentId`
  - `locationId`
  - `managerEmployeeId`
  - `isActive`
- Attendance-device list supports pagination/search/sort plus:
  - `locationId`
  - `isActive`
- Device-user list supports pagination/search/sort plus:
  - `employeeId`
  - `attendanceDeviceId`
  - `locationId`
  - `isActive`
- Attendance-log list supports pagination/search/sort plus:
  - `employeeId`
  - `attendanceDeviceId`
  - `deviceUserId`
  - `locationId`
  - `direction`
  - `dateFrom`
  - `dateTo`
- Leave-type list supports pagination/search/sort plus `isActive`.
- Leave-request list supports pagination/search/sort plus:
  - `employeeId`
  - `leaveTypeId`
  - `departmentId`
  - `locationId`
  - `status`
  - `dateFrom`
  - `dateTo`
- Employee codes are normalized and rejected on duplicate within company scope.
- Attendance-device codes are normalized and rejected on duplicate within company scope.
- Device-user mappings require active same-company employee/device linkage and reject ambiguous duplicate mappings.
- Attendance logs support single-create plus bulk-ingest with sensible duplicate skipping via database uniqueness.
- Leave requests are created as drafts, can be updated only while draft, and then transition through a minimal submit/approve/reject/cancel lifecycle.

## Environment And Runtime Notes

- No new environment variables were added in Prompt 9.
- Docker Compose runtime behavior from Prompt 7/8 remains intact:
  - Prisma client regeneration still happens before API container startup
  - direct `api:dev:development` compose startup path is preserved
  - the Nx-state reset required for API container health remains preserved

## Verification Commands

```powershell
corepack pnpm prisma:format
corepack pnpm prisma:generate
corepack pnpm prisma:migrate:deploy
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
docker compose up -d --build
```

Live verification completed against the running stack for:

- health
- Swagger
- auth login/me/refresh/logout
- company list
- role list including `company_hr`
- location create/list
- department create/list
- account-class list
- unit-status list
- customer list
- employee create/detail/update/activate/deactivate/list
- attendance-device create/detail/update/activate/deactivate/list
- device-user create/detail/update/activate/deactivate/list
- attendance-log single-create, bulk-ingest, detail, and list
- leave-type create/detail/update/activate/deactivate/list
- leave-request create/update/submit/approve/reject/cancel/list
- overlapping leave-request submission rejection

## Intentionally Out Of Scope

- Payroll runs
- Payroll run lines
- Payroll-to-accounting voucher posting
- Compensation automation
- Expense claims
- Performance management
- Recruitment/onboarding workflows
- Document uploads/storage flows
- Shift, roster, overtime, or attendance-processing engines
- Frontend HR screens
- Fake/demo ERP data
- Next.js backend routes or server actions

## Ready State

Prompt 9 delivered the minimum production-grade backend HR Core needed to manage employees, attendance devices, device-user mappings, attendance logs, leave types, and leave requests while preserving company-safe ownership rules in PostgreSQL and keeping payroll automation out of scope. The repo is ready for Prompt 10.
