# Prompt 51A Status

## Prompt 51A: Current Demo Seed Audit and Realistic Dataset Replacement Blueprint

**Status**: COMPLETE (audit/planning only — no code edits, seed changes, data deletion, staging, commit, or push)
**Date**: 2026-05-20
**Branch**: main
**Commit**: 02d1c19a2 (latest pushed)
**Uncommitted work**: Prompt 50A phone-field changes preserved in dirty worktree

---

## 1. Why Current Demo Data Is Unsatisfactory

The supervisor identified that the current seeded dataset visually feels like demo/test data. The audit confirms this is a systemic problem, not a surface-level issue:

- **Every visible business-facing record** contains "DEMO", "SYNTH", "UAT", or "Synthetic" in its name, code, reference, description, email, phone, or address.
- The company itself is named "Real Capita Demo / UAT" — this label appears in the session menu, sidebar, report headers, and print outputs.
- All 6 user accounts have names like "DEMO Admin Synthetic" — visible in audit events, voucher created-by attribution, and receipt metadata.
- All customer names are "DEMO Customer Nadia Synthetic" etc. — visible in CRM lists, Customer 360, receipts, and collection records.
- All employee names are "DEMO Employee Amina Finance" etc. — visible in HR lists and payroll runs.
- The dataset has **no multi-year history** — all transactions are dated January–April 2026 only.
- Record counts are **too small** to support realistic dashboards, reports, pagination, or Client 360 depth.
- Financial amounts lack any BDT/৳ currency context in the UI.
- Phone numbers are "SYNTH-PHONE-0101" instead of realistic Bangladesh phone patterns.
- Customer addresses are "SYNTHETIC DEMO/UAT ADDRESS ONLY" — completely hollow.

This is not a patch-level problem. The contamination is pervasive across every seeded module.

---

## 2. Current Seed Architecture Audit

### D1. Seed entry points

- `scripts/seed-demo-data.mjs` — thin wrapper importing `runSeedDemoCommand` from lib
- `scripts/reset-demo-data.mjs` — thin wrapper importing `runResetDemoCommand` from lib
- `scripts/verify-demo-data.mjs` — thin wrapper importing `runVerifyDemoCommand` from lib
- `scripts/lib/demo-data.mjs` — single monolithic 3974-line file containing ALL seed logic, reset logic, verify logic, constants, helpers, and safety checks
- `scripts/lib/ops.mjs` — shared ops helpers (env loading, arg forwarding, workspace root)
- `package.json` scripts: `seed:demo`, `seed:demo:reset`, `seed:demo:verify`
- Documentation: `docs/operations/demo-data.md`, `docs/release/demo-readiness-guide.md`, `docs/uat/phase-1-demo-walkthrough.md`

### D2. Current seed workflow

1. `corepack pnpm seed:demo` runs `runSeedDemoCommand`.
2. It loads env files, asserts DATABASE_URL and production guards.
3. It **forces a full reset** of the reserved demo company first (`resetDemoData({ force: true })`).
4. Reset deletes ALL seeded data from the company, including the company itself, then deletes orphaned demo users.
5. Reset disables trigger constraints on voucher_lines, vouchers, and payroll_run_lines to permit deletion of posted records.
6. After reset, `seedDemoData` runs inside a Prisma transaction (120s timeout):
   - Upserts role definitions (company_admin, company_accountant, company_hr, company_payroll, company_member, company_sales)
   - Upserts the demo company (Real Capita Demo / UAT / real-capita-demo-uat)
   - Creates 6 demo users with argon2-hashed password
   - Seeds org structure (8 locations, 8 departments)
   - Seeds accounting (6 account groups, 14 ledgers, 16 particular accounts, 14+ vouchers)
   - Seeds project/property (13 projects, 11 cost centers, 14 phases, 17 blocks, 16 zones, 9 unit types, 28 units)
   - Seeds CRM (8 customers, 9 leads, 7 bookings, 5 sale contracts, 20 installment schedules, 6 collections)
   - Seeds HR (12 employees, 3 attendance devices, 12 device users, 5 leave types, 7 leave requests, 144 attendance logs)
   - Seeds payroll (5 salary structures, 3 payroll runs, 36 payroll lines)
   - Seeds attachments and audit events (5 attachments, 8 audit events)
7. `seed:demo:verify` checks company existence, module counts against minimum thresholds, RCG project/unit-type/block/zone coverage, customer/employee synthetic-data safeguards, voucher balance, unit-status/payroll/leave coverage, and reset marker cleanliness.
8. The workflow is **deterministic** (same data each run), **idempotent** (upsert-based), and **cleanly rebuildable** (forced reset before seed).

### D3. Current seeded module coverage

| Module | Current Seeded Count | Current Quality |
|--------|---------------------|-----------------|
| Companies | 1 | Named "Real Capita Demo / UAT" |
| Users + roles | 6 | Named "DEMO Admin Synthetic" etc. |
| Locations | 8 | Coded "DEMO-DHK", "DEMO-SITE" etc. |
| Departments | 8 | Coded "DEMO-FIN", "DEMO-SALES" etc. |
| Account groups | 6 | Named "DEMO RCG Current Assets" etc. |
| Ledger accounts | 14 | Named "DEMO Bank and Cash" etc. |
| Particular accounts | 16 | Named "DEMO Main Operating Bank" etc. |
| Vouchers | 21 (20 posted, 1 draft) | References "DEMO-JRN-2026-001" etc. |
| Projects | 13 | Good RCG naming (RC Maya Kanon etc.) but codes "DEMO-RC-MAYA" |
| Cost centers | 11 | Coded "DEMO-RCG-CORP" etc. |
| Phases | 14 | Coded "DEMO-MAYA-P1" etc. |
| Blocks | 17 | Good naming (Block A-H) but coded "DEMO-MAYA-BLOCK-A" |
| Zones | 16 | Good naming (Zone B, D, N, M, E, S, ES, DV, TV) but coded "DEMO-ZONE-B" |
| Unit types | 9 | Good naming (Residential, Commercial, etc.) but coded "DEMO-RESIDENTIAL" |
| Units | 28 | Coded "DEMO-MAYA-A-B-2P5-001" etc. |
| Customers | 8 | Named "DEMO Customer Nadia Synthetic" |
| Leads | 9 | Named "DEMO Lead RC Maya Kanon Website Inquiry" |
| Bookings | 7 | Minimal variety |
| Sale contracts | 5 | Minimal variety |
| Installment schedules | 20 | Only 5 contracts × 4 installments |
| Collections | 6 | Minimal variety |
| Employees | 12 | Named "DEMO Employee Amina Finance" etc. |
| Attendance devices | 3 | Named "DEMO HQ Attendance Device" etc. |
| Device users | 12 | Coded "DEMO-DEV-001" etc. |
| Attendance logs | 144 | Only 6 dates × 12 employees × 2 directions |
| Leave types | 5 | Named "DEMO Annual Leave" etc. |
| Leave requests | 7 | Minimal variety |
| Salary structures | 5 | Named "DEMO Executive Salary Structure" etc. |
| Payroll runs | 3 (1 posted, 1 finalized, 1 draft) | Minimal variety |
| Payroll run lines | 36 | Only 3 runs × 12 employees |
| Attachments | 5 | Named "DEMO-RC-Maya-Kanon-booking-form.pdf" etc. |
| Attachment links | 5 | Minimal |
| Audit events | 87 (8 seeded + 79 auth login events) | Minimal seeded variety |

---

## 3. Current Demo-Contamination Findings

### E1. Visible naming contamination

Every single business-facing seeded record contains obvious placeholder markers:

**Company-level:**
- Company name: "Real Capita Demo / UAT"
- Company slug: "real-capita-demo-uat"

**User-level:**
- All 6 users: firstName="DEMO [Role]", lastName="Synthetic"
- All emails: demo.admin@demo.realcapita.test etc.
- Password: "change-me-demo-uat-password"

**Org structure:**
- All 8 location codes start with "DEMO-"
- All 8 location names start with "DEMO "
- All 8 department codes start with "DEMO-"
- All 8 department names contain "DEMO" or "synthetic"

**Accounting:**
- All 6 account group codes start with "DEMO-"
- All 6 account group names start with "DEMO RCG"
- All 14 ledger codes start with "DEMO-"
- All 14 ledger names start with "DEMO"
- All 16 particular account codes start with "DEMO-"
- All 16 particular account names start with "DEMO"
- All voucher references start with "DEMO-" (DEMO-JRN-2026-001, DEMO-PAY-2026-001, etc.)
- All voucher descriptions contain "synthetic", "RCG context", or "demo/UAT"
- Every description field has the "SYNTH-DEMO-UAT: " marker prefix

**Property/Project:**
- All 13 project codes start with "DEMO-RC-" (but project names are good: RC Maya Kanon, etc.)
- All 11 cost center codes start with "DEMO-"
- All 14 phase codes start with "DEMO-"
- All 17 block codes start with "DEMO-"
- All 16 zone codes start with "DEMO-"
- All 9 unit type codes start with "DEMO-"
- All 28 unit codes start with "DEMO-"
- All project/phase/block/zone/unit descriptions contain marker prefix

**CRM:**
- All 8 customer names: "DEMO Customer [Name] Synthetic"
- All customer emails: demo.customer01@example.test
- All customer phones: SYNTH-PHONE-0101 etc.
- All customer addresses: "SYNTHETIC DEMO/UAT ADDRESS ONLY"
- All 9 lead names: "DEMO Lead RC [Project] [Source]"
- All lead phones: SYNTH-LEAD-PHONE-01 etc.

**HR/Payroll:**
- All 12 employee codes: DEMO-EMP-001 etc.
- All 12 employee names: "DEMO Employee [Name] [Dept]" 
- All 3 device codes/names: "DEMO-ATT-HQ-01" etc.
- All device user codes: "DEMO-DEV-001" etc.
- All 5 leave type codes/names: "DEMO-ANNUAL" / "DEMO Annual Leave" etc.
- All 5 salary structure codes/names: "DEMO-SAL-EXEC" / "DEMO Executive Salary Structure" etc.

**Attachments/Audit:**
- All 5 attachment filenames: "DEMO-RC-Maya-Kanon-booking-form.pdf" etc.
- All 5 checksum/etag values: "DEMO-CHECKSUM-mayaBookingForm" etc.
- All 8 seeded audit request IDs: "DEMO-AUDIT-ADMIN-001" etc.

**UI-side contamination:**
- `business-report-page.tsx` checks `userCompanySlug === 'real-capita-demo-uat'` and shows "The active company is a controlled Demo/UAT workspace" banner
- Analytics components show "Demo workspace indicators" hints
- Session menu and sidebar show "Real Capita Demo / UAT" company label
- Receipt prints show demo company name in headers

**Contamination scope**: 100% of business-facing seeded records are contaminated. There is no realistic-looking data anywhere in the current seed.

### E2. Volume inadequacy

Current counts are far too small for a convincing operational impression:

| Module | Current | Minimum for believable system | Gap |
|--------|---------|-------------------------------|-----|
| Units | 28 | 200-500+ | ~7-18x needed |
| Customers | 8 | 50-100+ | ~6-12x needed |
| Leads | 9 | 30-60+ | ~3-7x needed |
| Bookings | 7 | 40-80+ | ~6-11x needed |
| Sale contracts | 5 | 30-60+ | ~6-12x needed |
| Collections | 6 | 50-100+ | ~8-17x needed |
| Employees | 12 | 30-50+ | ~3-4x needed |
| Vouchers | 21 | 200-500+ (multi-year) | ~10-24x needed |
| Payroll runs | 3 | 24-48 (monthly across years) | ~8-16x needed |
| Leave requests | 7 | 50-100+ | ~7-14x needed |
| Audit events | 8 seeded | 200-500+ | ~25-63x needed |
| Attachments | 5 | 30-50+ | ~6-10x needed |
| Attendance logs | 144 | 1000-3000+ | ~7-21x needed |

The current volume cannot support meaningful dashboard analytics, realistic pagination/filter testing, Business Overview trend charts, or Customer 360 depth.

### E3. Cross-module coherence gaps

The basic operational chain exists (customer -> booking -> contract -> installment -> collection -> voucher -> receipt), but it is **shallow and narrow**:

- Only 5 sale contracts connect the full chain.
- Only 6 collections exist, with 1 receipt walkthrough (DEMO-COL-2026-001).
- Many units have no booking, contract, or customer connection.
- Employees have minimal payroll and leave history.
- No expense-type voucher chains show vendor payment, utility payment, or supplier relationships.
- No diverse collection scenarios (partial payments, overdue installments, multiple payment methods).
- Customer 360 profiles are thin — only "DEMO Customer Nadia Synthetic" has a meaningful timeline.

### E4. Time-horizon realism gaps

All seeded transactions are dated **January–April 2026 only**. This is a 4-month window that makes the ERP look like it was deployed yesterday. There is:

- No prior-year accounting history (FY2022, FY2023, FY2024, FY2025)
- No historical booking/collection trends
- No prior payroll runs beyond one posted February 2026 run
- No multi-year employee lifecycle (joinings, promotions, departures)
- No seasonal or annual business patterns
- Business Overview reports will show only a few months of data with no meaningful year-over-year comparison
- Trial balance, general ledger, P&L, and balance sheet will have trivial history

### E5. Currency/geography realism gaps

**Currency:**
- The frontend uses `Intl.NumberFormat('en-US')` for all financial formatting — no BDT locale, no ৳ symbol
- `formatAccountingAmount` in `apps/web/src/lib/format.ts` formats numbers as bare decimals (e.g., "25,000,000.00") with no currency symbol or unit
- Analytics currency formatting uses the same `en-US` locale without BDT/৳
- Voucher amounts in seed data are raw numbers with no currency context
- The seed script does not embed any currency symbol or BDT metadata

**Geography:**
- All addresses are "SYNTHETIC DEMO/UAT ADDRESS ONLY" — no real Bangladesh area/street references
- Location names use "DEMO" prefix instead of realistic Dhaka/Keraniganj/Khulna area names
- Phone numbers use "SYNTH-PHONE-0101" instead of +880 patterns
- Customer and employee locations are coded references, not readable Bangladesh addresses

---

## 4. Current Module Coverage, Scale, and Historical-Depth Gaps

Verified counts from `seed:demo:verify` (with 1 non-synthetic customer causing verify failure):

| Category | Count | Assessment |
|----------|-------|------------|
| Company | 1 | Named with "Demo / UAT" |
| User roles | 6 | All named "DEMO [Role] Synthetic" |
| Locations | 8 | All prefixed "DEMO" |
| Departments | 8 | All prefixed "DEMO" |
| Account groups | 6 | All prefixed "DEMO RCG" |
| Ledger accounts | 14 | All prefixed "DEMO" |
| Particular accounts | 16 | All prefixed "DEMO" |
| Vouchers | 21 | All refs prefixed "DEMO-" |
| Posted vouchers | 20 | All Jan-Apr 2026 only |
| Draft vouchers | 1 | Trivial |
| Projects | 13 | Good RCG names, bad codes |
| Cost centers | 11 | All prefixed "DEMO" |
| Phases | 14 | All prefixed "DEMO" |
| Blocks | 17 | Good names, bad codes |
| Zones | 16 | Good names, bad codes |
| Unit types | 9 | Good names, bad codes |
| Units | 28 | Good names, bad codes; too few |
| Customers | 8 | All "DEMO Customer" named |
| Leads | 9 | All "DEMO Lead" named |
| Bookings | 7 | Too few |
| Sale contracts | 5 | Too few |
| Installment schedules | 20 | Too few |
| Collections | 6 | Too few |
| Employees | 12 | All "DEMO Employee" named |
| Attendance devices | 3 | All prefixed "DEMO" |
| Device users | 12 | All prefixed "DEMO" |
| Attendance logs | 144 | Too narrow (6 dates only) |
| Leave types | 5 | All prefixed "DEMO" |
| Leave requests | 7 | Too few |
| Salary structures | 5 | All prefixed "DEMO" |
| Payroll runs | 3 | Only 3 months |
| Payroll run lines | 36 | Too few |
| Attachments | 5 | All prefixed "DEMO" |
| Attachment links | 5 | Too few |
| Audit events | 87 | Mostly auth login events |

**Financial totals (posted vouchers):**
- REVENUE credit: ৳11,580,000 (4 months only)
- EXPENSE debit: ৳1,748,000
- ASSET debit: ৳46,320,000 / credit: ৳10,230,000
- LIABILITY debit: ৳1,225,000 / credit: ৳2,483,000
- EQUITY credit: ৳25,000,000

These totals are trivially small for a multi-year real-estate business and span only a few months.

---

## 5. Real Capita Public-Source Grounding Findings

### Company context (from rcgcbd.com)

- **Founded**: Journey began in 2011 (rebranded from Luxury Properties Limited)
- **Active since**: RC Property Development Ltd & RC Holdings Ltd as sister concerns since 2017
- **Sister concerns**: RC Property Development Ltd, RC Holdings Ltd, Real Capita Trade International, RC Bay, Afseen Realty, Afseen Construction, ABD Foundation, RESDA
- **Operating areas**: Dhaka, Keraniganj, Rupganj/Narayanganj, Savar, Khulna, Kuakata, Azimpur, Munshiganj
- **Public phone**: +88-02-9898707, 8833232
- **Public email**: info@rcgcbd.com
- **Office address**: Dhaka (exact street not prominently listed on website)

### Project portfolio (from rcgcbd.com and project pages)

| Project | Location | Notes |
|---------|----------|-------|
| RC Maya Kanon | Abdullahpur, Keraniganj, Dhaka | 9 acres; near RAJUK Jhilmil & Dhaka-Mawa 300ft Highway; flagship residential project |
| RC Rivery Village | Rupganj, Narayanganj | Adjacent Purbachal 3 No. Sector; near Purbachal Express Highway |
| RC Priyojan Grihayan Prokolpo | Abdullahpur, Keraniganj | Share ownership model |
| RC South Valley | Sreenagar, Munshiganj / Abdullahpur | Public references vary between locations — note inconsistency |
| RC Maya Kanon Eco Village | Keraniganj area | Eco/sustainable residential |
| RC Bondhujon Abashon / Abashon | Keraniganj, Rupganj | Group-buy land ownership model |
| RC Ocean Bliss | Kuakata, Patuakhali | Hotel/suite tourism project |
| RC Daira Noor | Azimpur, Dhaka | Apartment project |
| RC Shanti Kuthir / Santi Kutir | Khulna | Apartment project (public location references vary) |
| RC Dalim Tower | Khulna | Tower project |
| RC Tulip | Badda/Gulshan area, Dhaka | Apartment project |
| RC Nurjahan Kunjo | Savar, Dhaka | Apartment project |
| RC Rainbow | Sonadanga R/A, Khulna | Apartment project |

### Size/type patterns from website enquiry form

- **Sizes (Katha)**: 2.5, 3, 5, 10
- **Blocks**: A, B, C, D, E, F, G, H
- **Zones**: B, D, N, M, E, S, ES, DV, TV
- **Types**: Commercial, Residential, Share Ownership, Duplex, Triplex
- **Ocean Bliss types**: Standard Deluxe, Deluxe Suite, Executive Suite, President Suite

### Amenities (from website project pages)

RC Maya Kanon: School/College/University, Playgrounds/Parks/Amusement/Water park, Surveillance/CCTV, Mosque/Eid gah, Medical College/Clinic/Hospital, Bank/Insurance, 24×7 Security, Shopping Complex, Community Center/Convention Center, Filling Station, Trade Center, Swimming Pool, Gymnasium, Hotel, Graveyard, Telephone, Police Station, Post Office, Sewerage, Fire Service

RC Rivery Village: School/College/University, Playgrounds/Parks, Surveillance, Graveyard, Medical/Clinic/Hospital, Bank/Insurance, 24×7 Security, Shopping Complex, Community Center, Hotel, Swimming Pool, Gymnasium, Mosque/Eid gah, Telephone, Police Station, Post Office, CCTV Zone, Sewerage, LPG Plant/Power station/Water treatment, Fire Service

### Website inconsistencies noted

1. RC South Valley location varies between Sreenagar/Munshiganj and Abdullahpur/Keraniganj across different pages
2. RC Shanti Kuthir / Santi Kutir location references vary
3. Some project pages on the main site show placeholder-like naming (e.g., "Purbachol Sopnil City" listed with "Miami, USA" and "Los Angeles, USA" on the projects page — clearly placeholder/unfinished content)
4. The website enquiry form uses English labels and Bangladesh-specific size/type/block/zone filters

These inconsistencies should not be blindly copied. The synthetic dataset should use the consistent RCG naming already established (RC Maya Kanon at Keraniganj, RC Rivery Village at Rupganj, etc.) and fill gaps with high-quality generated synthetic data.

---

## 6. Bangladesh-Facing and BDT-Specific Requirements Confirmed

### Bangladesh naming
- Muslim names: Abdullah, Amina, Bilal, Farah, Ishrat, Jamil, Kamal, Nadia, Omar, Ruhan, Samira, Tanvir, etc.
- Hindu names: Gita, Suresh, Priya, Rajesh, Ananya, etc.
- Mixed naming conventions appropriate for a Dhaka-based real-estate workforce
- Full names should include father's/husband's name patterns common in Bangladesh (e.g., "Nadia Akter", "Md. Abdullah Hossain", "Suresh Chandra Das")

### Bangladesh addresses
- Dhaka: Gulshan, Badda, Dhanmondi, Uttara, Bashundhara, Azimpur, Motijheel, Tejgaon
- Keraniganj: Abdullahpur, Kadomtoly
- Narayanganj/Rupganj: Purbachal area
- Savar, Khulna (Sonadanga), Kuakata, Munshiganj (Sreenagar)
- Format: Area, City, Division pattern (e.g., "House 12, Road 7, Block C, Uttara, Dhaka")

### Bangladesh phone conventions
- Mobile: +880 17XX-XXXXXX, +880 18XX-XXXXXX, +880 19XX-XXXXXX patterns
- Landline: +880 2-XXXXXXX patterns
- Common format: 01XXX-XXXXXX (local) or +880 1XXX-XXXXXX (international)

### BDT/৳ currency
- All monetary values in seed data represent BDT
- UI must present values with ৳ symbol or "BDT" label
- Current `Intl.NumberFormat('en-US')` usage must be changed to `Intl.NumberFormat('en-BD')` or custom ৳-prefixed formatting
- Seed data amounts should reflect realistic Bangladesh real-estate pricing (katha prices in ৳lakhs/crores range)

### Bangladesh real-estate terminology
- Katha (standard land measurement unit)
- Bigha (larger land measurement)
- Share ownership / group-buy models
- Allotment, handover, possession
- Booking, contract, installment
- RAJUK (capital development authority references)
- Purbachal, Jhilmil (government housing scheme references)

---

## 7. Replace-vs-Patch Recommendation

**RECOMMENDATION: REPLACE FROM SCRATCH**

Evidence basis:

1. **100% contamination**: Every business-facing seeded record contains "DEMO", "SYNTH", "UAT", or "Synthetic" markers. Patching would require renaming every entity code, name, description, reference, email, phone, and address across ~3974 lines of code. This is essentially a rewrite anyway.

2. **Volume scale mismatch**: Current counts (8 customers, 28 units, 21 vouchers) vs needed counts (50-100+ customers, 200-500+ units, 200-500+ vouchers) require a fundamentally different data generation approach. The current hardcoded-constant approach cannot scale to the needed volume.

3. **Architecture unsuitable**: The current monolithic single-file approach with hardcoded arrays and upsert-per-record patterns will not scale to generating 500+ units, 100+ vouchers, and multi-year transaction history. A parameterized, modular, generation-based architecture is needed.

4. **Time-horizon gap**: Adding 3-4 years of historical data to the current structure would require hundreds of new voucher specs, payroll run specs, and collection specs — impossible to hand-code realistically.

5. **Currency infrastructure missing**: The UI needs BDT/৳ integration, which the current seed and frontend do not support at all.

6. **Technical scaffolding worth preserving**: The reset/verify safety framework, Prisma transaction approach, env-file loading, arg parsing, and production-guard mechanism are well-designed and should be retained. The seed content itself should be replaced.

**Hybrid approach**: Preserve the technical scaffolding (reset/verify safety framework, env loading, arg parsing, production guards, Docker runtime integration, Prisma transaction pattern). Replace all seed content (company name, user names, entity data, codes, references, descriptions) with a new realistic dataset generation system.

---

## 8. Future Seed Architecture Recommendation

### Dual-profile system

The supervisor favors two profiles:
- `seed:realistic:uat` — realistic UAT-quality dataset for client demos and supervisor walkthroughs
- `seed:realistic:stress` — larger stress/performance-oriented dataset for pagination, filter, and load testing

**Recommendation**: Confirm this dual-profile approach. Implementation order:
1. First build `seed:realistic:uat` (Prompt 51C) — this is the priority dataset that must look operationally real
2. Then optionally build `seed:realistic:stress` (Prompt 51E) — scale-up for performance testing after UAT quality is validated

The existing `seed:demo`, `seed:demo:reset`, `seed:demo:verify` commands should be retained during transition and eventually redirect to the new realistic profile. For now, both old and new commands should coexist so the supervisor can test the new data before removing the old.

### Architecture design principles for the new seed system

- **Deterministic**: Same inputs produce same outputs every run
- **Resettable**: Clean full reset before seeding, same safety guards
- **Idempotent**: Upsert-based where appropriate, rebuild-first pattern
- **Modular**: Separate generation modules per domain (org, accounting, property, CRM, HR, payroll, audit) instead of one monolithic file
- **Parameterized**: Configurable profile (UAT vs stress), year range, volume targets
- **Cross-module coherent**: Entity relationships form complete operational chains
- **Multi-year history**: Data spans 3-4+ years with realistic temporal patterns
- **BDT-based**: All amounts in BDT context, ৳ symbol in UI
- **Bangladesh-facing**: Realistic BD names, addresses, phones, terminology
- **Report-friendly**: Sufficient volume and variety for meaningful dashboard and financial report visuals
- **Client-demo friendly**: Looks like a real operating business, not a demo
- **Free from visible demo/test wording**: No "Demo", "Test", "Sample", "Mock", "Seed", "UAT" in any business-facing record

### Seed data generation approach

Replace hardcoded arrays with a generation-based approach:
- Define entity specifications with ranges and rules (not individual constant arrays)
- Use deterministic pseudo-random generation seeded from a fixed seed value for reproducibility
- Generate temporal distributions (monthly payroll, quarterly collections, annual patterns)
- Build cross-module references programmatically (customer -> booking -> contract -> installment -> collection chains)
- Create realistic name pools for Bangladesh Muslim/Hindu naming patterns
- Create realistic address templates for Bangladesh city/area patterns
- Create realistic phone number patterns for Bangladesh conventions

---

## 9. Strict Acceptance Criteria for the Future Dataset Rebuild

### Naming contamination
1. No seeded business-facing record (company name, user name, location name, department name, account name, voucher description/reference, project description, customer name/phone/address/email, employee name/code, lead name, collection reference, payroll description, attachment filename, audit event metadata, salary structure name, leave type name, unit code/name, cost center name, phase name, block name, zone name, unit type name, device name/code) shall contain "Demo", "DEMO", "Test", "TEST", "Sample", "SAMPLE", "Mock", "MOCK", "Seed", "SEED", "UAT", "Synthetic", "SYNTH", "Example", or "EXAMPLE" as a visible substring in the business-facing display field.
2. Internal technical markers for reset safety may exist in description/notes fields that are not displayed on business-facing surfaces, but they must not be visible to clients browsing the UI.

### Currency
3. All monetary seed values must be interpretable as BDT.
4. The frontend must display ৳ or "BDT" as the currency symbol/label for financial amounts (voucher amounts, report totals, booking amounts, contract amounts, collection amounts, payroll amounts, salary structures, installment amounts).
5. `Intl.NumberFormat` usage for currency must use a Bangladesh-compatible locale or a custom ৳-prefix formatter.

### Multi-year history
6. The UAT dataset must span at least FY2022 through FY2026 (approximately 4+ fiscal years of activity).
7. Posted vouchers must exist in each fiscal year with meaningful revenue, expense, and balance activity.
8. Payroll runs must exist for at least 24+ monthly periods across the year range.
9. Customer booking and collection activity must show temporal patterns across multiple years.

### Report and dashboard realism
10. Business Overview must show meaningful non-trivial variation across daily, weekly, monthly, and yearly buckets.
11. Trial balance must have non-trivial balances across ASSET, LIABILITY, EQUITY, REVENUE, and EXPENSE classes in multiple periods.
12. P&L must show realistic multi-year profit/loss patterns.
13. Balance sheet must show meaningful asset, liability, and equity composition.
14. Dashboard KPIs must look operationally believable (not trivially small or all zero).

### Customer 360 depth
15. At least 10 customers must have full chain coverage: customer -> booking -> contract -> installment schedule -> multiple collections -> posted receipt vouchers -> receipt route.
16. At least 3 customers must show multi-year collection histories with partial payments, overdue installments, and varied payment patterns.

### Module coverage depth
17. At least 200+ units across all projects with realistic status distribution.
18. At least 50+ customers with realistic Bangladesh names and addresses.
19. At least 30+ employees with realistic lifecycle patterns (joinings, some departures).
20. At least 200+ vouchers spanning all types (JOURNAL, PAYMENT, RECEIPT, CONTRA) across multiple years.
21. At least 24+ payroll runs (monthly across 2+ years) with realistic gross/allowance/deduction/net amounts in BDT ranges appropriate for Bangladesh.

### Cross-module coherence
22. Every sale contract must connect to a booking, a customer, a unit, installment schedules, and at least 1 collection.
23. Every posted collection must connect to a posted receipt voucher.
24. Payroll posting must create consistent payroll expense/ payable/ deduction voucher entries.

### Seed process integrity
25. `seed:realistic:uat` must be deterministic and produce identical data on repeated runs.
26. `seed:realistic:uat` must support clean rebuild (reset + seed produces fresh identical state).
27. Verification must exist for the realistic dataset with meaningful count/quality checks.
28. The realistic seed must never auto-seed on startup, migration, Docker startup, or bootstrap.

### Bangladesh realism
29. All customer and employee names must follow realistic Bangladesh naming patterns.
30. All customer addresses must use realistic Bangladesh area/city format.
31. All phone numbers must follow realistic +880 / 01XX patterns.
32. All project names and locations must align with Real Capita Group's public project portfolio.
33. Financial amounts must reflect plausible Bangladesh real-estate pricing ranges (katha prices in ৳lakhs to ৳crores).

### Stress profile (deferred criteria)
34. `seed:realistic:stress` should produce at least 5x the UAT volume across all entity types, or be explicitly deferred with a documented reason.

---

## 10. Recommended Prompt 51B–51E Sequence

### Prompt 51B — Realistic Multi-Year Synthetic Dataset Specification
- Exact target volumes per module (UAT profile)
- Exact year range (FY2022-FY2026)
- Exact entity count ranges
- Naming standards (Bangladesh name pools, address templates, phone patterns)
- Relationship scenarios (complete operational chains)
- Accounting realism plan (realistic BDT voucher amounts, multi-year posting patterns, plausible revenue/expense/balance distributions)
- BDT/BD geography rules
- Unit inventory distribution per project
- Customer segment scenarios
- Employee lifecycle scenarios
- Payroll amount ranges appropriate for Bangladesh
- Cross-module reference chain specification
- Acceptance matrix mapping to criteria in section 9

### Prompt 51C — Implement Seed Framework Replacement
- Remove old low-quality visible seed content from `scripts/lib/demo-data.mjs`
- Implement new realistic UAT profile generation system under a modular architecture
- New seed entry points: `seed:realistic:uat`, `seed:realistic:uat:reset`, `seed:realistic:uat:verify`
- Preserve technical reset/bootstrap/safety mechanics from existing code
- Preserve Prisma transaction pattern, env loading, arg parsing, production guards
- Add BDT/৳ currency formatting to frontend (`Intl.NumberFormat` or custom ৳ formatter)
- Update demo-data docs, demo-readiness guide, and related references
- Update `foundation-status.md` with realistic seed information
- Remove or redirect old `seed:demo` commands during/after transition

### Prompt 51D — Quality Verification on Freshly Seeded Runtime
- Reset and reseed realistic UAT profile on a clean Docker runtime
- Inspect all visible UI surfaces for demo contamination (no "Demo", "Test", etc.)
- Verify Business Overview shows meaningful multi-year trends
- Verify dashboard KPIs look operationally believable
- Verify Customer 360 shows multi-step customer histories
- Verify financial reports (TB, GL, P&L, BS) have non-trivial data across periods
- Verify payroll runs span multiple years with realistic BDT amounts
- Verify voucher activity across all types and years
- Verify Bangladesh names, addresses, phones look realistic
- Verify ৳ symbol appears in financial displays
- Run lint, typecheck, build, test
- Run Docker smoke

### Prompt 51E — Stress-Volume Profile and Performance-Oriented Seed Expansion
- Implement `seed:realistic:stress` profile with 5x+ UAT volume
- Verify pagination/filter performance at stress volumes
- Verify dashboard/report performance at stress volumes
- Verify no UI breakage at large data volumes
- Deferred if UAT profile quality is the immediate priority

---

## 11. Supervisor Decisions Needed

1. **Company naming for realistic seed**: Should the realistic UAT company be named "Real Capita Group" (matching the public brand) or a realistic but slightly differentiated synthetic name? The current demo uses "Real Capita Demo / UAT". A realistic dataset should use something like "Real Capita Group" or "RC Property Development Ltd" to look operationally real, but the supervisor must decide whether using the actual brand name in synthetic data is acceptable.

2. **User naming for realistic seed**: Should realistic users have plausible Bangladesh employee names (e.g., "Md. Abdullah Hossain", "Nadia Akter") or should they use more generic professional names? The supervisor must decide how close to real Bangladesh naming patterns the synthetic data should be.

3. **Old seed command transition**: Should `seed:demo` be immediately replaced by `seed:realistic:uat`, or should both coexist during transition so the supervisor can compare before committing?

4. **Stress profile priority**: Should Prompt 51E (stress volume) be pursued immediately after 51D, or deferred until UAT-realistic quality is validated in actual client demos?

5. **BDT/৳ UI scope**: Should BDT symbol integration be part of Prompt 51C (seed implementation) or a separate frontend-only prompt? The currency formatting change touches shared analytics components, format helpers, and potentially all financial display surfaces.

---

## Verdict

AUDIT COMPLETE. FROM-SCRATCH REPLACEMENT IS THE CORRECT PATH. THE CURRENT SEED DATA IS 100% CONTAMINATED, TOO SMALL, TOO NARROW IN TIME, AND ARCHITECTURALLY UNSUITABLE FOR SCALING. THE TECHNICAL SCAFFOLDING (RESET/VERIFY SAFETY, TRANSACTION PATTERN, ARG PARSING, PRODUCTION GUARDS) SHOULD BE PRESERVED.
