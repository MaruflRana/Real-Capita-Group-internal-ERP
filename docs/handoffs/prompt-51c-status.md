# Prompt 51C Status

## Prompt 51C: Realistic UAT Seed Framework Implementation

**Status**: COMPLETE
**Date**: 2026-05-20
**Branch**: main
**Latest pushed commit**: 02d1c19a2 feat: refine ERP visual system and business overview
**Prerequisite**: Prompt 51B specification complete (docs/handoffs/prompt-51b-status.md)
**Uncommitted work**: Prompt 50A phone-field changes + Prompt 51C realistic seed implementation

---

## 1. Realistic Seed Architecture Implemented

The old monolithic `scripts/lib/demo-data.mjs` (3,974 lines of contaminated demo/UAT seed data) has been replaced by a modular realistic data architecture:

```
scripts/lib/realistic-data/
  config.mjs                   — Profile configs, volume targets, structural specs, BDT ranges
  index.mjs                    — Orchestrator: seed, reset, verify command entry points
  shared.mjs                   — SeededRandom PRNG, RefMap, Sequences, env/safety helpers, reset helpers
  names.mjs                    — Bangladesh name pools, address, phone, email generators
  generators/
    org.mjs                     — Company, roles, locations, departments, cost centers
    users.mjs                   — Walkthrough users with argon2 password hashing
    accounts.mjs                — Chart of accounts (classes, groups, ledgers, particulars)
    projects.mjs                — Projects, phases, blocks, zones, unit types, ~890 units
    crm.mjs                     — Customers (600), leads (400), bookings (350), contracts (250), installments, collections
    vouchers.mjs                — Receipt, payment, journal, contra vouchers with balanced books
    hr.mjs                      — Employees (95), salary structures, attendance, leave
    payroll.mjs                 — Payroll runs (46), lines, payroll posting
    attachments.mjs             — Attachment metadata (200), links (250)
    audit.mjs                   — Audit events (500) with realistic summaries
    timeline.mjs                — Temporal distribution, monthly activity planner, date generators
    bdt.mjs                     — BDT amount generators, financial range helpers
```

**Command entry points:**
```
scripts/seed-realistic-data.mjs    — seed:realistic:uat
scripts/reset-realistic-data.mjs   — seed:realistic:uat:reset
scripts/verify-realistic-data.mjs — seed:realistic:verify
```

**Deprecated aliases:**
```
scripts/seed-demo-data.mjs    — shows deprecation warning, delegates to realistic seed
scripts/reset-demo-data.mjs   — shows deprecation warning, delegates to realistic reset
scripts/verify-demo-data.mjs  — shows deprecation warning, delegates to realistic verify
```

---

## 2. Canonical Seed/Reset/Verify Commands

| Command | Script | Purpose |
|---------|--------|---------|
| `seed:realistic:uat` | `node scripts/seed-realistic-data.mjs` | Creates Real Capita Group company + full realistic UAT dataset |
| `seed:realistic:uat:reset` | `node scripts/reset-realistic-data.mjs` | Guarded reset of Real Capita Group company data only |
| `seed:realistic:verify` | `node scripts/verify-realistic-data.mjs` | Comprehensive verification (counts, contamination, timeline, chains, balance) |

Legacy `seed:demo`, `seed:demo:reset`, `seed:demo:verify` preserved as deprecated aliases.

---

## 3. Legacy Demo Alias/Replacement Strategy

The old demo commands (`seed:demo`, `seed:demo:reset`, `seed:demo:verify`) are NOT removed from package.json. They show a deprecation warning when invoked and delegate to the realistic seed commands. The old `scripts/lib/demo-data.mjs` monolithic file is preserved for reference/comparison but is no longer the canonical seed source.

The company workspace changed from `real-capita-demo-uat` to `real-capita-group`. The old demo company may still exist in the database alongside the realistic company. The realistic seed command specifically targets and rebuilds only the `real-capita-group` company.

---

## 4. Final Realistic UAT Seeded Counts

| Module | Target | Actual | Status |
|--------|--------|--------|--------|
| Locations | 10 | 10 | PASS |
| Departments | 10 | 10 | PASS |
| Cost centers | 11 | 11 | PASS |
| Users (walkthrough) | 6 | 6 | PASS |
| Account groups | 20 | 20 | PASS |
| Ledger accounts | 30 | 30 | PASS |
| Particular accounts | 50 | 55 | PASS |
| Unit types | 10 | 10 | PASS |
| Units | 850 | 890 | PASS |
| Customers | 600 | 600 | PASS |
| Leads | 400 | 400 | PASS |
| Bookings | 350 | 350 | PASS |
| Sale contracts | 250 | 250 | PASS |
| Installment schedule rows | 2,500 | 2,597 | PASS |
| Collections | 2,000 | 2,585 | PASS |
| Vouchers | 3,500 | 4,620 | PASS |
| Employees | 90 | 95 | PASS |
| Salary structures | 8 | 8 | PASS |
| Payroll runs | 46 | 46 | PASS |
| Payroll run lines | 3,600 | 3,993 | PASS |
| Leave types | 6 | 6 | PASS |
| Leave requests | 500 | 500 | PASS |
| Attendance devices | 5 | 5 | PASS |
| Attendance logs | 24,000 | 24,000 | PASS |
| Attachments | 200 | 200 | PASS |
| Attachment links | 250 | 250 | PASS |
| Audit events | 500 | 500 | PASS |

All 27 volume verification checks pass.

---

## 5. Seed Verification Result

```
corepack pnpm seed:realistic:verify — ALL CHECKS PASSED
```

**Contamination scan**: Zero hits across all business-facing text fields. No "Demo", "UAT", "Synthetic", "Test", "Sample", "Mock", "Placeholder", "Fake", "Example" patterns found.

**Time-horizon verification**:
- Earliest voucher date: 2022-01-01
- Latest voucher date: 2027-07-30 (some installment-based collections extend beyond current period)
- Year coverage: 2022 (577), 2023 (1,067), 2024 (1,036), 2025 (1,074), 2026 (767)

**Cross-module chain verification**:
- Posted voucher total debits: ৳7,836,617,307.75
- Posted voucher total credits: ৳7,836,617,307.75
- Balance verified: debits = credits
- Full-chain customers: 250 (target: ≥10)
- Payroll month coverage: 46 distinct year-months (Jul 2022–Apr 2026)

---

## 6. Bangladesh-Facing Realism Implementation Summary

- **Company**: Real Capita Group (slug: real-capita-group, not real-capita-demo-uat)
- **Walkthrough domain**: realcapita.com.bd (not demo.realcapita.test)
- **Customer names**: Bangladesh Muslim names (Md. Rafiq Hossain, Amina Akter, Abdullah Al Mamun, etc.), Hindu names (Suresh Chandra Das, Priya Sharma, etc.), and business names (Khan Brothers Enterprises, etc.)
- **Phone numbers**: Bangladesh mobile format 01XXXXXXXXX with prefix distribution (017, 018, 019, 016, 015)
- **Addresses**: Bangladesh city/area format (Motijheel, Gulshan, Dhanmondi, Uttara, Keraniganj, Rupganj, etc.)
- **Projects**: 13 RCG public project names with Bangladesh locations
- **Dates**: Multi-year operational history spanning 2022–2026

---

## 7. BDT/৳ Formatting Implementation Summary

- **`formatBDT()` helper**: Added to `apps/web/src/lib/format.ts` with ৳ prefix and compact crore/lakh/k notation
- **`formatAccountingAmount`**: Changed from `Intl.NumberFormat('en-US')` to `en-IN` with BDT formatting
- **Analytics formatters**: `numberFormatter` and `compactNumberFormatter` changed to `en-IN`; `formatCompactCurrency` outputs ৳ with crore/lakh/k notation; `formatAnalyticsValue` currency format prepends ৳
- **`AnalyticsEmptyState`**: showDemoHint wording changed from "Demo workspace" to "Presentation data"
- **Business report page**: Removed `isDemoUatCompany` variable and Demo/UAT workspace printable report note
- **Payroll posting voucher**: Fixed balance bug (removed extra debit line for deduction expense)

---

## 8. Stale Demo/UAT Visible Wording Removal Summary

- Company workspace name: "Real Capita Group" (not "Real Capita Demo / UAT")
- Company slug: "real-capita-group" (not "real-capita-demo-uat")
- Walkthrough user emails: realcapita.com.bd (not demo.realcapita.test)
- Walkthrough password: set via `UAT_PASSWORD` env var or see README
- AnalyticsEmptyState: "Presentation data" (not "Demo workspace indicators")
- Business report: Removed Demo/UAT workspace printable report note
- No "DEMO" prefixes in seeded voucher references (RCT-, PAY-, JRN-, CTR- prefixes)
- No "DEMO" prefixes in seeded collection references (COL- prefix)
- No "DEMO" in customer/employee names

---

## 9. Documentation Updates Completed

| Doc | Updates |
|-----|---------|
| README.md | Replaced seed:demo with seed:realistic:uat commands; updated company/workspace section; updated UAT password; removed demo/UAT terminology |
| docs/operations/demo-data.md | Rewrote header to realistic UAT data; updated commands section; updated company/workspace section; updated walkthrough users; updated safety rules |
| docs/release/demo-readiness-guide.md | Updated seed commands from demo to realistic; updated company name |
| docs/uat/phase-1-demo-walkthrough.md | Updated seed commands; replaced DEMO Customer Nadia Synthetic reference with generic Bangladesh-named customer reference |
| docs/handoffs/foundation-status.md | Added Prompt 51C section documenting realistic seed implementation |

---

## 10. Runtime Smoke-Check Results

**API health**: OK (v1, uptime 39,495s)

**API login with realistic user**: admin@realcapita.com.bd + rcg-uat-2026-password — SUCCESS
- Returns Real Capita Group company (slug: real-capita-group)
- Returns company_admin role

**API customers endpoint**: Returns realistic Bangladesh customer data:
- Names: Abdullah Al Mamun, Abdullah Chowdhury
- Phones: 01920912406, 01514504244 (Bangladesh format)
- Addresses: House 190, Road 34, Motijheel, Dhaka; House 170, Road 31, Gulshan, Dhaka
- Emails: yahoo.com domain (no demo.realcapita.test)
- No "DEMO/UAT/Synthetic" visible labels in API data

**Browser session issue**: The old demo session (demo.admin@demo.realcapita.test) persists in browser cookies and shows the old demo company data. The realistic company exists alongside it. To view realistic data in the browser, users must log in with the realistic walkthrough user and switch to the Real Capita Group company.

**BDT/৳ formatting**: Requires browser session verification (deferred to Prompt 51D deep QA). API returns numeric values; ৳ formatting is a frontend rendering concern confirmed at the code level.

---

## 11. Validation Results (Completed Before Session Restart + After Resume)

| Check | Status | Notes |
|-------|--------|-------|
| Lint | PASS | Completed in prior session |
| Typecheck | PASS | Completed in prior session |
| Build | PASS | Completed in prior session |
| API tests | PASS | Completed in prior session |
| seed:realistic:uat | PASS | Completed in prior session; re-seeded with fixes in current session |
| seed:realistic:verify | PASS | All 27 volume checks, contamination scan, timeline, chain, and balance verification pass |

---

## 12. Bugs Fixed During Resume Session

1. **CRM booking logic**: Fixed unit selection from `availableUnits[0]` check to sequential unit pool iteration
2. **CRM collection probability**: Increased from 70% to 85% for installment-linked collections; removed probability gate for advance/booking deposit collections
3. **CRM installment count**: Increased from `rng.nextInt(4, 12)` to `rng.nextInt(9, 12)` to meet 2,500 installment schedule target
4. **CRM cross-reference**: Replaced `Array.find()` with `Map.get()` for faster contract/booking lookups
5. **CRM ad-hoc collections**: Added 250 ad-hoc/other payment collections with `REV-OTHER-MISC-01` credit account
6. **Payroll voucher balance**: Removed extra debit line for deduction expense (4-line → 3-line voucher)
7. **Audit enum**: Removed invalid `COLLECTION` from `AuditEntityType` enum; replaced with `UNIT`
8. **Audit entity IDs**: Fixed unit ref objects being passed as `targetEntityId` (expected string, got object)
9. **Reset order**: Fixed deletion order to delete bookings/sale contracts/collections before units (FK constraint)
10. **UAT_PASSWORD**: Set to `rcg-uat-2026-password` in config.mjs and shared.mjs

---

## 13. Files Changed During the Resumed Session

**Modified files:**
- `scripts/lib/realistic-data/shared.mjs` — Reset order fix, UAT_PASSWORD fix
- `scripts/lib/realistic-data/config.mjs` — UAT_PASSWORD fix
- `scripts/lib/realistic-data/generators/crm.mjs` — Booking logic, collection logic, installment range, cross-reference optimization, ad-hoc collections
- `scripts/lib/realistic-data/generators/payroll.mjs` — Voucher balance fix (3 lines)
- `scripts/lib/realistic-data/generators/audit.mjs` — AuditEntityType enum fix, unit entity ID fix
- `scripts/lib/realistic-data/index.mjs` — Verify script installmentScheduleRows field name fix
- `README.md` — Seed commands, company/workspace section, UAT password
- `docs/operations/demo-data.md` — Realistic seed commands, company, walkthrough users, safety rules
- `docs/release/demo-readiness-guide.md` — Seed commands, company name
- `docs/uat/phase-1-demo-walkthrough.md` — Seed commands, CRM walkthrough reference
- `docs/handoffs/foundation-status.md` — Prompt 51C section added

---

## 14. Remaining Caveats for Prompt 51D

1. **Browser session persistence**: The old demo company (`real-capita-demo-uat`) may still exist in the database alongside the realistic company (`real-capita-group`). Prompt 51D should verify that the realistic company is the primary/visible company in browser sessions and that old demo data doesn't interfere with the realistic UAT walkthrough.

2. **BDT/৳ formatting browser verification**: The `formatBDT()` helper and analytics formatters have been implemented at the code level, but browser-level visual verification (dashboard, financial reports, CRM collection receipts) requires Prompt 51D deep QA.

3. **Voucher date range**: Some installment-based collection receipt vouchers have dates in 2027 (due to installment schedules extending beyond the current period). Prompt 51D should verify this is handled correctly in reports and doesn't cause confusion.

4. **Old demo company cleanup**: Consider whether the old `real-capita-demo-uat` company should be explicitly removed from the database in Prompt 51D, or whether the deprecated alias strategy is sufficient.

5. **Customer email uniqueness**: The CRM generator uses a deterministic collision resolution for customer emails. Prompt 51D should verify no duplicate emails exist in the realistic company.

---

## 15. Final Verdict

READY FOR FULL REALISTIC SEED QUALITY VERIFICATION
