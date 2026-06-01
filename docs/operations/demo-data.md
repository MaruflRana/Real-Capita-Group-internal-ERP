# RCG Context-Aligned Realistic UAT Data

Prompt 51C replaces the previous synthetic demo/UAT seed with **realistic UAT data** — a production-mature, Bangladesh-facing, BDT-based, multi-year synthetic operating dataset that makes the ERP look like it has been actively operated for 4+ fiscal years, with zero Demo/UAT/Synthetic/Test contamination in any business-facing field.

This is realistic UAT data for demonstration and quality verification, not production evidence, and not a substitute for stakeholder-entered UAT records or sign-off.

## Canonical Seed Commands

The realistic seed commands are the primary path. Legacy `seed:demo` commands are preserved as deprecated aliases that delegate to the realistic commands with a warning.

```powershell
corepack pnpm seed:realistic:uat -- --dry-run
corepack pnpm seed:realistic:uat
corepack pnpm seed:realistic:verify
corepack pnpm seed:realistic:uat:reset -- --dry-run
corepack pnpm seed:realistic:uat:reset
```

## UAT Company

The realistic seed creates the following company workspace:

```text
Real Capita Group
real-capita-group
```

Walkthrough users are created under the corporate domain `realcapita.com.bd`:

```text
admin@realcapita.com.bd       — Md. Rafiq Hossain     (company_admin)
accountant@realcapita.com.bd  — Amina Akter           (company_accountant)
hr@realcapita.com.bd          — Suresh Chandra Das    (company_hr)
payroll@realcapita.com.bd     — Ishrat Begum          (company_payroll)
sales@realcapita.com.bd       — Tanvir Ahmed          (company_sales)
member@realcapita.com.bd      — Farah Rahman          (company_member)
```

Local UAT password: see README.md or set `UAT_PASSWORD` in `.env`

## Source Discipline

Public Real Capita Group context is used only for safe naming and master-data context:

- company/family/sister-concern labels such as Real Capita Group, RC Property Development Ltd, RC Holdings Ltd, Real Capita Trade International, RC Bay, Afseen Realty, Afseen Construction, ABD Foundation, and RESDA
- project names and public location context, including RC Maya Kanon, RC Rivery Village, RC Priyojan Grihayan Prokolpo, RC South Valley, RC Maya Kanon Eco Village, RC Bondhujon Abason / Abashon, RC Ocean Bliss, RC Daira Noor, RC Shanti Kuthir / Santi Kutir, RC Dalim Tower, RC Tulip, RC Nurjahan Kunjo, and RC Rainbow
- public block, zone, size, and unit-type patterns
- public amenities and surrounding-context labels

All private operational data remains synthetic:

- customers
- employees
- phone numbers
- emails
- contracts
- voucher amounts
- payments and collections
- payroll amounts
- attendance
- leave
- attachment metadata
- audit events

## Commands

Run the commands only when the target database is intentional and reachable.

```powershell
corepack pnpm seed:realistic:uat -- --dry-run
corepack pnpm seed:realistic:uat
corepack pnpm seed:realistic:verify
corepack pnpm seed:realistic:uat:reset -- --dry-run
corepack pnpm seed:realistic:uat:reset
```

`seed:realistic:uat` rebuilds the Real Capita Group company and reapplies the realistic UAT seed:

```text
Real Capita Group
real-capita-group
```

Walkthrough users are created under the corporate domain:

```text
admin@realcapita.com.bd
accountant@realcapita.com.bd
hr@realcapita.com.bd
payroll@realcapita.com.bd
sales@realcapita.com.bd
member@realcapita.com.bd
```

The local UAT password is:

```text
rcg-uat-2026-password
```

Do not use that password outside a controlled local/UAT environment.

## Safety Rules

- Realistic UAT data is never seeded automatically during app startup, Docker startup, migrations, or normal admin bootstrap.
- The seed runs only through `corepack pnpm seed:realistic:uat`.
- `seed:realistic:uat` refreshes the Real Capita Group company before reseeding.
- Reset runs only through `corepack pnpm seed:realistic:uat:reset`.
- Production mode is refused unless `--confirm-production-realistic-data` is provided.
- Reset is scoped to the exact company slug `real-capita-group`.
- No "Demo", "UAT", "Synthetic", "Test", "Sample", or "Mock" strings appear in any business-facing seeded field.

The reset command disables only the table-level business-rule triggers needed to delete posted realistic UAT vouchers and posted payroll lines inside the guarded Real Capita Group reset transaction. It does not disable constraints for normal app use and it does not target non-UAT companies.

## Data Coverage

The seed covers existing Phase 1 modules only:

- Org & Security: the Real Capita Group UAT company, six role users, role assignments, RCG-context office/site locations, functional departments, and sister-concern coordination labels.
- Accounting: account groups, ledgers, posting accounts, posted and draft vouchers, and all Phase 1 voucher types.
- Financial Reports: posted voucher activity across assets, liabilities, equity, revenue, and expenses.
- Project & Property Master: RCG-context project names, project locations, cost centers, phases, blocks A-H, zones B/D/N/M/E/S/ES/DV/TV, public unit-type patterns, and unit inventory across available, booked, sold, allotted, transferred, and cancelled statuses.
- CRM & Property Desk: synthetic customers, leads, bookings, sale contracts, installment schedules, and collections tied to the RCG-context projects and units.
- HR: synthetic employees, attendance devices, device mappings, attendance logs, leave types, and leave requests across lifecycle statuses.
- Payroll: synthetic salary structures, draft/finalized/posted payroll runs, payroll lines, and payroll posting through the existing database posting function.
- Audit & Documents: safe synthetic attachment metadata, attachment links, and synthetic audit events.

## Receipt Walkthrough Scenario

The authoritative seed includes management-demo-ready printable receipt paths for CRM & Property Desk.

Recommended walkthrough login:

```text
sales@realcapita.com.bd
```

Receipt walkthrough path:

1. Sign in as `sales@realcapita.com.bd` or `admin@realcapita.com.bd` using the public local/UAT password documented in README.md.
2. Open `/crm-property-desk/customers` and choose a realistic seeded customer with bookings, sale contracts, installment schedules, and collection transaction history.
3. From the profile transaction history, use `Printable Receipt`, or open `/crm-property-desk/collections` and choose a seeded collection.
4. Open `Receipt` from the collections table or `Open Receipt` from the detail side panel.
5. Use `Print Receipt` for the browser-print acknowledgement view.

## Dashboard And Report Readiness

The seeded data is intended to make existing pages operationally meaningful without adding frontend chart values, transactional workflows, seed automation, or new report endpoints.

It provides variation for:

- revenue vs expense trend
- business overview, daily, weekly, monthly, and yearly report visuals
- contracted sales vs collected sales trend
- posted-voucher revenue, expense, and profit/loss trend
- voucher status and voucher type distribution
- unit status distribution
- units by RCG-context project and unit type
- booking, contract, collection, and installment activity
- employee, attendance, and leave summaries
- payroll posted/finalized/draft summaries
- attachment and audit activity summaries
- Prompt 38 operational analytics panels for accounting operations, project/property inventory, CRM/property desk pipeline and collections, HR attendance/leave coverage, payroll posting readiness, and audit/document activity

## Analytics Demo Workflow

Prompt 31/32/38 consume the same realistic UAT company through existing REST endpoints, frontend aggregation, and the read-only business overview report endpoint. For a populated supervisor demo:

```powershell
corepack pnpm seed:realistic:uat
corepack pnpm seed:realistic:verify
```

Then sign in as a `realcapita.com.bd` walkthrough user and review `/dashboard`, `/accounting/reports/business-overview`, `/accounting/reports/daily`, `/accounting/reports/weekly`, `/accounting/reports/monthly`, `/accounting/reports/yearly`, plus representative operational pages such as vouchers, project units, CRM leads/bookings/collections, HR employees/attendance/leave, payroll runs, attachments, and audit events. Empty analytics/report states should remain honest and may point operators back to these explicit seed commands when a populated supervisor demo is relevant.

## Verification

Run:

```powershell
corepack pnpm seed:realistic:verify
```

The verify command checks:

- realistic UAT company existence
- walkthrough role access
- non-zero key module counts
- RCG-context project-name coverage
- public block, zone, and unit-type pattern coverage
- realistic UAT customer and employee safeguards
- voucher type coverage
- unit status coverage
- payroll and leave status coverage
- posted voucher balance
- accounting activity across report-relevant account classes
- reset safety and cross-module integrity

If verification fails, do not use the database for supervisor demo until the failure is addressed.

## Reset Limitations

Reset is deliberately conservative and scoped to the exact `real-capita-group` company. Use it only when the Real Capita Group UAT workspace is intended to be refreshed.

If reset refuses:

1. Review the reported unmarked record type.
2. Decide whether the data is intentional UAT evidence that should be preserved.
3. Remove data manually only if the operator is certain it is disposable local/UAT data.
4. Run `corepack pnpm seed:realistic:uat:reset -- --dry-run` again before running the actual reset.

Do not use this command to clean non-UAT company data.
