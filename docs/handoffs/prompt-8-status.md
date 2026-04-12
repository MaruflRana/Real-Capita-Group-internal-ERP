# Prompt 8 Status

## Implemented

- CRM & Property Desk Core schema expansion on top of Prompt 7:
  - `customers`
  - `leads`
  - `bookings`
  - `sale_contracts`
  - `installment_schedules`
  - `collections`
- Backend CRM/property desk module with company-scoped REST APIs for:
  - customers
  - leads
  - bookings
  - sale contracts
  - installment schedules
  - collections
- New company-scoped `company_sales` role definition seeded into the database and included in bootstrap role guarantees.
- Reuse of the existing auth, company-assignment guard, accounting foundation, and project/property foundation without frontend or Next.js backend changes.
- Swagger documentation for all Prompt 8 CRM/property desk endpoints.
- Scoped backend tests for customer, lead, booking, sale contract, installment schedule, and collection validation behavior.

## Database Logic Added

- Migration `20260316103000_prompt_8_crm_property_desk_core` adds:
  - Prompt 8 tables and enums
  - `company_sales` role seed/upsert
  - composite company-scoped keys for new transaction tables
  - `units_id_projectId_key` and `vouchers_id_companyId_key` support indexes for safe composite foreign keys
  - `bookings_active_unit_key` partial unique index
  - positive-amount check constraints for bookings, contracts, schedules, and collections
  - `enforce_booking_creation_rules()` trigger function
  - `enforce_booking_update_rules()` trigger function
  - `enforce_sale_contract_creation_rules()` trigger function
  - `enforce_sale_contract_update_rules()` trigger function
  - `enforce_installment_schedule_mutation_rules()` trigger function
  - `enforce_collection_linkage_rules()` trigger function
- PostgreSQL now enforces Prompt 8 property-desk integrity:
  - bookings lock the target unit row and reject non-`AVAILABLE` units
  - booking creation updates the unit status to `BOOKED`
  - one active booking per unit is enforced at the database level
  - sale contracts require an active booking whose unit is currently `BOOKED`
  - sale contract creation updates the booking to `CONTRACTED` and the unit to `SOLD`
  - booking and sale contract core commercial fields are protected from unsafe mutation in this phase
  - installment schedules reject mutation or deletion after linked collections exist
  - collections require a same-company posted voucher and consistent booking/contract/schedule/customer linkage

## New Authorization Behavior

- Prompt 4 auth remains intact.
- Prompt 5 company-admin baseline remains intact.
- Prompt 6 accounting access remains intact.
- Prompt 8 adds `company_sales` as an assignable company-scoped role definition.
- Prompt 8 CRM/property desk routes allow either:
  - `company_admin`
  - `company_sales`
- Company-scoped access enforcement remains mandatory for all Prompt 8 routes.

## Endpoints Added

### Customers

- `GET /api/v1/companies/:companyId/customers`
- `GET /api/v1/companies/:companyId/customers/:customerId`
- `POST /api/v1/companies/:companyId/customers`
- `PATCH /api/v1/companies/:companyId/customers/:customerId`
- `POST /api/v1/companies/:companyId/customers/:customerId/activate`
- `POST /api/v1/companies/:companyId/customers/:customerId/deactivate`

### Leads

- `GET /api/v1/companies/:companyId/leads`
- `GET /api/v1/companies/:companyId/leads/:leadId`
- `POST /api/v1/companies/:companyId/leads`
- `PATCH /api/v1/companies/:companyId/leads/:leadId`
- `POST /api/v1/companies/:companyId/leads/:leadId/activate`
- `POST /api/v1/companies/:companyId/leads/:leadId/deactivate`

### Bookings

- `GET /api/v1/companies/:companyId/bookings`
- `GET /api/v1/companies/:companyId/bookings/:bookingId`
- `POST /api/v1/companies/:companyId/bookings`
- `PATCH /api/v1/companies/:companyId/bookings/:bookingId`

### Sale Contracts

- `GET /api/v1/companies/:companyId/sale-contracts`
- `GET /api/v1/companies/:companyId/sale-contracts/:saleContractId`
- `POST /api/v1/companies/:companyId/sale-contracts`
- `PATCH /api/v1/companies/:companyId/sale-contracts/:saleContractId`

### Installment Schedules

- `GET /api/v1/companies/:companyId/installment-schedules`
- `GET /api/v1/companies/:companyId/installment-schedules/:installmentScheduleId`
- `POST /api/v1/companies/:companyId/installment-schedules`
- `PATCH /api/v1/companies/:companyId/installment-schedules/:installmentScheduleId`
- `DELETE /api/v1/companies/:companyId/installment-schedules/:installmentScheduleId`

### Collections

- `GET /api/v1/companies/:companyId/collections`
- `GET /api/v1/companies/:companyId/collections/:collectionId`
- `POST /api/v1/companies/:companyId/collections`

## Query And Validation Notes

- Customer list supports pagination/search/sort plus active-status filtering.
- Lead list supports pagination/search/sort plus:
  - `projectId`
  - `status`
  - `isActive`
- Booking list supports pagination/search/sort plus:
  - `customerId`
  - `projectId`
  - `unitId`
  - `status`
  - `dateFrom`
  - `dateTo`
- Sale contract list supports pagination/search/sort plus:
  - `customerId`
  - `projectId`
  - `unitId`
  - `dateFrom`
  - `dateTo`
- Installment schedule list supports pagination/search/sort plus:
  - `saleContractId`
  - `dueState=due|overdue`
- Collection list supports pagination/search/sort plus:
  - `customerId`
  - `bookingId`
  - `saleContractId`
  - `installmentScheduleId`
  - `voucherId`
  - `dateFrom`
  - `dateTo`
- Customer email and phone collisions are normalized and rejected within company scope where provided.
- Lead handling remains intentionally simple with a minimal fixed status field and optional project linkage.
- Collections use explicit `voucherId` linkage only; Prompt 8 does not create or post vouchers automatically.

## Environment And Runtime Notes

- No new environment variables were added in Prompt 8.
- Docker Compose runtime behavior from Prompt 6/7 remains intact:
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
corepack pnpm auth:bootstrap -- --company-name "Real Capita" --company-slug "real-capita" --admin-email "admin@example.com" --admin-password "change-me-secure-admin-password"
docker compose up -d --build
```

Live verification completed against the running stack for:

- health
- Swagger
- auth login/me/refresh/logout
- company, role, and location list endpoints
- account class list
- account group create
- ledger account create
- particular account create
- voucher draft create, line add, and voucher posting
- project create
- unit type create
- unit-status list
- unit create/detail with Prompt 8 state transitions observed live
- customer create/list
- lead create/list
- booking create/list/detail
- sale contract create/list/detail
- installment schedule create/list
- collection create/list/detail

## Intentionally Out Of Scope

- Cancellation workflows
- Refund workflows
- Reassignment/transfer workflows
- Automatic property voucher creation from booking, contract, or schedule events
- Revenue-recognition automation
- Balance sheet / P&L / ledger reports
- Employee/attendance/payroll modules
- Frontend CRM/property screens
- Document management / legal document storage
- Fake/demo ERP data
- Next.js backend routes or server actions

## Ready State

Prompt 8 delivered the minimum production-grade backend CRM & Property Desk Core needed to manage customers, leads, bookings, sale contracts, installment schedules, and voucher-linked collections while keeping state integrity in PostgreSQL and preserving the Prompt 4-7 foundations. The repo is ready for Prompt 9.
