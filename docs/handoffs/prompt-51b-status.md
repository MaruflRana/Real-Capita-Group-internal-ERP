# Prompt 51B Status

## Prompt 51B: Realistic Multi-Year Synthetic Dataset Specification

**Status**: COMPLETE (specification/planning only — no code edits, seed changes, database alterations, staging, commit, or push)
**Date**: 2026-05-20
**Branch**: main
**Latest pushed commit**: 02d1c19a2
**Uncommitted work**: Prompt 50A phone-field changes preserved in dirty worktree
**Prerequisite**: Prompt 51A audit completed, from-scratch replacement confirmed

---

## 1. Final Dataset Philosophy

The realistic UAT dataset must make the Real Capita ERP look like it has been actively operated by a Bangladesh real-estate business for approximately 4+ fiscal years. It must feel like a mature, lived-in operational system — not a demo, not a test, not a mock.

**Core principles:**
- Every visible business-facing record must look like real operational data, with no "Demo", "Test", "Sample", "Mock", "Seed", "UAT", "Synthetic", "Placeholder", "Fake", or "Example" strings appearing in display fields.
- The company workspace reads as "Real Capita Group" — the actual brand name, not a synthetic variant.
- All monetary values are BDT. The UI displays ৳ on all money-bearing surfaces.
- All people names follow Bangladesh conventions. All phones follow 01XXXXXXXXX / +8801XXXXXXXXX patterns. All addresses use Bangladesh area/city format.
- The dataset spans FY2022 through partial FY2026, with growth trends, occasional weaker months, and realistic temporal variation.
- Cross-module chains form complete, coherent operational stories: customer → booking → contract → installment → collection → receipt voucher, and vendor/expense → payment voucher, and payroll → posting voucher.
- The data must support meaningful Business Overview trends, non-trivial P&L/TB/GL/BS, believable dashboard KPIs, and deep Customer 360 histories.
- The seed process is deterministic, resettable, reproducible, and safe against production misuse.

---

## 2. Canonical Realistic UAT Seed Profile Specification

### 2.1 Company identity

| Field | Value |
|-------|-------|
| Company name | `Real Capita Group` |
| Company slug | `real-capita-group` |
| Company isActive | `true` |

### 2.2 Organization structure

**Locations (10):**

| Code | Name | Description |
|------|------|-------------|
| RCG-CORP-DHK | Real Capita Group Corporate Office, Dhaka | Corporate headquarters |
| RCG-SITE-MAYA | RC Maya Kanon Site Office, Keraniganj | Maya Kanon project site |
| RCG-SITE-RIVERY | RC Rivery Village Site Office, Rupganj | Rivery Village project site |
| RCG-SALES-DHK | Dhaka Sales Office | Primary sales and CRM office |
| RCG-SITE-VALLEY | RC South Valley Site Office, Munshiganj | South Valley project site |
| RCG-SITE-OCEAN | RC Ocean Bliss Operations, Kuakata | Ocean Bliss resort operations |
| RCG-SITE-KHULNA | Khulna Projects Office | Dalim Tower and Rainbow operations |
| RCG-SITE-DAIRA | RC Daira Noor Office, Azimpur | Daira Noor apartment operations |
| RCG-SITE-SAVAR | RC Nurjahan Kunjo Office, Savar | Nurjahan Kunjo site |
| RCG-SITE-ECO | RC Maya Kanon Eco Village Office, Keraniganj | Eco Village project site |

**Departments (10):**

| Code | Name |
|------|------|
| FIN | Accounts & Finance |
| SALES | Sales & CRM |
| HR | HR & Admin |
| PAY | Payroll Operations |
| OPS | Project Operations |
| IT | IT & Systems |
| LEGAL | Legal & Documentation |
| ENG | Engineering & Site Supervision |
| MGMT | Management & Support |
| MKTG | Marketing & Communications |

### 2.3 Users and access (6 walkthrough users)

| Email | First name | Last name | Roles |
|-------|-----------|-----------|-------|
| admin@realcapita.com.bd | Md. Rafiq | Hossain | company_admin |
| accountant@realcapita.com.bd | Amina | Akter | company_accountant |
| hr@realcapita.com.bd | Suresh | Chandra Das | company_hr |
| payroll@realcapita.com.bd | Ishrat | Begum | company_payroll |
| sales@realcapita.com.bd | Tanvir | Ahmed | company_sales |
| member@realcapita.com.bd | Farah | Rahman | company_member |

Login password for UAT walkthrough: `rcg-uat-2026-password` (only for controlled UAT/demo environments; must not be used in production).

Note: These users represent ERP system operator accounts. They are linked to corresponding employee records. The email domain `realcapita.com.bd` is a plausible synthetic corporate domain. No real person's email is used.

### 2.4 Chart of accounts

The realistic chart must cover all 5 account classes (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE) with enough depth for meaningful financial reports.

**Account groups (20):**

| Class | Code | Name |
|-------|------|------|
| ASSET | AST-CUR | Current Assets |
| ASSET | AST-PROP | Project Property Assets |
| ASSET | AST-BANK | Bank and Cash |
| LIABILITY | LIA-CUR | Current Liabilities |
| LIABILITY | LIA-ADV | Customer Advances Received |
| LIABILITY | LIA-PAY | Payables |
| EQUITY | EQTY-CAP | Owner Equity and Capital |
| EQUITY | EQTY-RET | Retained Earnings |
| REVENUE | REV-SALES | Property Sales Revenue |
| REVENUE | REV-BOOKING | Booking and Service Fee Revenue |
| REVENUE | REV-SUITE | Suite and Hospitality Revenue |
| REVENUE | REV-OTHER | Other Operating Revenue |
| EXPENSE | EXP-OPEX | Operating Expenses |
| EXPENSE | EXP-LAND | Land Acquisition Costs |
| EXPENSE | EXP-CONSTR | Construction and Development Costs |
| EXPENSE | EXP-MKTG | Marketing and Sales Expenses |
| EXPENSE | EXP-PAYROLL | Payroll and Staff Expenses |
| EXPENSE | EXP-OFFICE | Office and Administrative Expenses |
| EXPENSE | EXP-LEGAL | Legal and Documentation Expenses |
| EXPENSE | EXP-MAINT | Maintenance and Logistics |

**Ledger accounts (30+):** Each group has 1-3 ledgers (e.g., under AST-BANK: "Bank Accounts", "Cash on Hand"; under EXP-PAYROLL: "Gross Salary Expense", "Payroll Deductions Expense").

**Particular accounts (50+):** Each ledger has 1-4 posting accounts (e.g., under Bank Accounts: "Prime Bank Operating Account", "City Bank Savings"; under Gross Salary Expense: "Executive Salary Expense", "Field Staff Salary Expense", "Office Staff Salary Expense").

All codes use realistic short codes (not prefixed with "DEMO-"). All names use operational language (e.g., "Prime Bank Operating Account" not "DEMO Main Operating Bank").

### 2.5 Projects, properties, and units

**Projects (13):** Using RCG public project names with realistic locations:

| Code | Name | Location | Type focus |
|------|------|----------|------------|
| RC-MAYA | RC Maya Kanon | Keraniganj | Residential plots, apartments |
| RC-RIVERY | RC Rivery Village | Rupganj/Purbachal | Residential plots |
| RC-PRIYOJAN | RC Priyojan Grihayan Prokolpo | Keraniganj | Share ownership |
| RC-SOUTH-VALLEY | RC South Valley | Munshiganj | Residential plots |
| RC-MAYA-ECO | RC Maya Kanon Eco Village | Keraniganj | Eco residential, duplex |
| RC-BONDHUJON | RC Bondhujon Abashon | Keraniganj/Rupganj | Group-buy land ownership |
| RC-OCEAN-BLISS | RC Ocean Bliss | Kuakata, Patuakhali | Suites, hospitality |
| RC-DAIRA-NOOR | RC Daira Noor | Azimpur, Dhaka | Apartments |
| RC-SHANTI-KUTHIR | RC Shanti Kuthir | Khulna | Apartments |
| RC-DALIM-TOWER | RC Dalim Tower | Khulna | Commercial + apartments |
| RC-TULIP | RC Tulip | Badda/Gulshan, Dhaka | Apartments |
| RC-NURJAHAN | RC Nurjahan Kunjo | Savar, Dhaka | Apartments |
| RC-RAINBOW | RC Rainbow | Sonadanga, Khulna | Apartments |

Note on RC South Valley: public references vary between Sreenagar/Munshiganj and Abdullahpur/Keraniganj. The specification uses Munshiganj as the primary location since the official website project page mentions Sreenagar, Munshiganj, and the current seed already notes this inconsistency. The RC Shanti Kuthir / Santi Kutir naming is normalized to "RC Shanti Kuthir" as the consistent internal reference.

**Unit types (10):**

| Code | Name |
|------|------|
| PLOT | Plot / Land |
| APT | Apartment |
| COMM | Commercial |
| SHARE | Share Ownership |
| DUPLEX | Duplex |
| TRIPLEX | Triplex |
| STD-DELUXE | Standard Deluxe Suite |
| DELUXE-SUITE | Deluxe Suite |
| EXEC-SUITE | Executive Suite |
| PRES-SUITE | President Suite |

**Unit statuses:** The existing system statuses (AVAILABLE, BOOKED, SOLD, ALLOTTED, TRANSFERRED, CANCELLED) are used. No new statuses needed.

**Unit inventory target: 850 units total**

Distribution across projects:

| Project | Approx units | Status mix |
|---------|-------------|------------|
| RC Maya Kanon | 200 | 60% available, 15% booked, 10% sold, 8% allotted, 5% transferred, 2% cancelled |
| RC Rivery Village | 150 | 55% available, 20% booked, 12% sold, 8% allotted, 3% cancelled, 2% transferred |
| RC Priyojan Grihayan Prokolpo | 60 | 40% available, 20% sold, 30% allotted, 10% cancelled |
| RC South Valley | 70 | 65% available, 10% booked, 10% sold, 10% allotted, 5% cancelled |
| RC Maya Kanon Eco Village | 50 | 50% available, 20% booked, 15% sold, 10% allotted, 5% transferred |
| RC Bondhujon Abashon | 40 | 45% available, 20% sold, 25% allotted, 10% transferred |
| RC Ocean Bliss | 30 | 40% available, 20% booked, 20% allotted, 15% sold, 5% cancelled |
| RC Daira Noor | 40 | 30% available, 30% sold, 25% allotted, 15% transferred |
| RC Shanti Kuthir | 50 | 50% available, 15% booked, 20% sold, 10% allotted, 5% cancelled |
| RC Dalim Tower | 40 | 45% available, 15% booked, 20% sold, 15% allotted, 5% commercial mix |
| RC Tulip | 60 | 55% available, 15% booked, 15% sold, 10% allotted, 5% cancelled |
| RC Nurjahan Kunjo | 50 | 60% available, 10% booked, 15% sold, 10% allotted, 5% cancelled |
| RC Rainbow | 50 | 50% available, 15% booked, 20% sold, 10% allotted, 5% cancelled |

Each project has phases (1-3), blocks (2-5), and zones (2-4) generated programmatically following the public A-H block and B/D/N/M/E/S/ES/DV/TV zone naming patterns.

**Unit naming convention:** `{ProjectShort}-{Block}-{Zone}-{SizePattern}-{Seq}` e.g., `RC-MAYA-A-B-2P5-001`, `RC-RIVERY-E-M-3-042`, `RC-OCEAN-C-TV-EXEC-301`. Size patterns: 2P5 (2.5 katha), 3, 5, 7P5, 10 for plots/land; floor-unit numbers for apartments/suites.

### 2.6 CRM: customers, leads, bookings, contracts, schedules, collections

**Customers (600):**
- 600 customer records with Bangladesh names, realistic addresses, phone numbers, and emails.
- 350 customers have at least 1 booking.
- 200 customers have at least 1 sale contract with installment schedule.
- 150 customers have at least 1 recorded collection.
- 25 customers have rich multi-step Customer 360 history (multiple bookings, contracts, installments, collections across years).
- 10 customers have full chain coverage (lead → booking → contract → schedule → multiple collections → receipt vouchers → receipt route).
- 5 customers have significant overdue/outstanding receivables (partial payments, missed installments, multi-year collection gaps).
- Customer status mix: ~85% active, ~15% inactive.

**Leads (400):**
- 400 leads across all projects.
- Status distribution: 25% NEW, 30% CONTACTED, 25% QUALIFIED, 20% CLOSED.
- Source distribution: 35% Website enquiry, 25% Sales office visit, 15% Referral, 10% Social campaign, 10% Walk-in, 5% Broker.
- About 200 leads convert to bookings (50% conversion rate overall).

**Bookings (350):**
- 350 bookings across projects spanning FY2022–FY2026.
- Booking amounts: ৳50,000 to ৳2,000,000 depending on project and unit size.
- Status mix: 60% ACTIVE, 40% CONTRACTED (have progressed to sale contract).
- Booking dates spread across years with increasing volume over time.

**Sale contracts (250):**
- 250 sale contracts derived from bookings.
- Contract amounts: ৳500,000 to ৳50,000,000 (plot/land in ৳lakhs–crores range; apartments ৳lakhs range; suites ৳lakhs range).
- Contract dates spanning FY2022–FY2026.
- Each contract has 4-12 installment schedule rows (longer schedules for higher-value contracts).

**Installment schedule rows (2,500):**
- 250 contracts × ~10 installment rows each = ~2,500 rows.
- Installment amounts computed from contract total divided across schedule.
- Due dates span contract signing + 3–36 months.
- About 70% of installments have at least partial collection against them; 30% remain outstanding or overdue.

**Collections (2,000):**
- 2,000 collection records.
- Collection dates spanning FY2022–FY2026 with monthly distribution.
- Each collection links to a posted receipt voucher.
- Amount distribution: ৳20,000 to ৳10,000,000 (installment payments, booking deposits, down payments, partial payments).
- About 800 collections link to installment schedules (structured payments).
- About 600 collections are advance/booking deposits without installment linkage.
- About 200 collections are ad-hoc/other payments.
- Reference format: `COL-{YYYY}-{Seq}` (e.g., `COL-2024-0001`, `COL-2025-0432`).

### 2.7 Accounting vouchers

**Vouchers (3,500 total):**

| Type | Count | Time span |
|------|-------|-----------|
| RECEIPT | 1,500 | FY2022–FY2026 (collection receipts, advance receipts, other income) |
| PAYMENT | 1,200 | FY2022–FY2026 (vendor payments, contractor payments, land acquisition, office expenses, payroll posting) |
| JOURNAL | 600 | FY2022–FY2026 (revenue recognition, expense accruals, adjustment entries) |
| CONTRA | 200 | FY2022–FY2026 (bank-to-cash transfers, inter-account adjustments) |

**Status distribution:** ~95% POSTED, ~5% DRAFT.

**Voucher reference format:** `{TYPE}-{YYYY}-{Seq}` (e.g., `RCT-2023-0001`, `PAY-2024-0432`, `JRN-2025-0100`, `CTR-2022-0005`).

**Monthly distribution:** Vouchers spread across ~48 months (FY2022 Jul–FY2026 Apr) with:
- Lower volume in early months (FY2022: ~40-50 vouchers/month)
- Growth trend (FY2023: ~60-80, FY2024: ~70-100, FY2025: ~80-110)
- Recent months (FY2026): ~90-120/month
- Occasional lower months (seasonal dips, holidays)
- Not monotonically increasing — some months dip below prior month

**Expense voucher categories (represented through payment and journal vouchers):**
- Land acquisition payments: ~৳5M-৳20M per transaction, 5-10 per quarter
- Contractor/development payments: ~৳500K-৳5M, 10-20 per month
- Construction material purchases: ~৳200K-৳2M, 8-15 per month
- Marketing expenses: ~৳100K-৳800K, 3-8 per month
- Payroll posting: linked to payroll runs (~৳3M-৳8M per month total payroll)
- Office rent/utilities: ~৳50K-৳300K, 2-5 per month
- Registration/legal: ~৳50K-৳500K, 2-4 per quarter
- Survey/design/consultancy: ~৳100K-৳1M, 1-3 per quarter
- Maintenance/logistics: ~৳30K-৳200K, 2-4 per month

### 2.8 HR: employees, attendance, leave

**Employees (90):**
- 90 employees across all departments.
- Department distribution: FIN: 8, SALES: 15, HR: 5, PAY: 3, OPS: 20, IT: 4, LEGAL: 5, ENG: 15, MGMT: 7, MKTG: 13
- Join date distribution: ~20% joined FY2022, ~25% FY2023, ~20% FY2024, ~15% FY2025, ~20% FY2026 (recent hires)
- ~80 active, ~10 inactive/resigned (with realistic exit dates).
- 6 walkthrough users have linked employee records.
- Employee codes: `EMP-{Seq4}` (e.g., `EMP-0001`, `EMP-0090`).
- Names follow Bangladesh naming patterns (see Section 5).

**Attendance devices (5):**
- 5 devices across major locations (Corporate HQ, Maya Kanon site, Rivery Village site, Khulna site, Sales office).

**Attendance logs (24,000):**
- ~24,000 attendance log entries across ~50 working days per year × 3+ years × ~80 employees × 2 directions (50 × 3+ × 80 × 2 ≈ 24,000).
- Logged at realistic IN/OUT times (IN: 08:30-09:30, OUT: 17:00-18:30, some variation).
- External log IDs: `ATT-{DeviceCode}-{Date}-{Dir}`.

**Leave types (6):**

| Code | Name | Description |
|------|------|-------------|
| ANNUAL | Annual Leave | Standard annual earned leave |
| SICK | Sick Leave | Medical leave with documentation |
| CASUAL | Casual Leave | Short-notice personal leave |
| UNPAID | Unpaid Leave | Leave without pay |
| FIELD | Field Duty Leave | On-site/field assignment leave |
| MATERNITY | Maternity Leave | Statutory maternity leave |

**Leave requests (500):**
- 500 leave requests spanning FY2022–FY2026.
- Status distribution: 35% APPROVED, 25% SUBMITTED, 15% DRAFT, 15% REJECTED, 10% CANCELLED.
- Spread across leave types proportional to typical usage (annual: 40%, casual: 25%, sick: 20%, field: 10%, unpaid: 3%, maternity: 2%).

### 2.9 Payroll

**Salary structures (8):**

| Code | Name | Basic (৳) | Allowance (৳) | Deduction (৳) | Net (৳) |
|------|------|-----------|---------------|--------------|---------|
| SAL-EXEC | Executive Salary Structure | 120,000 | 35,000 | 15,000 | 140,000 |
| SAL-MGMT | Management Salary Structure | 85,000 | 25,000 | 12,000 | 98,000 |
| SAL-FIN | Finance Salary Structure | 55,000 | 15,000 | 6,000 | 64,000 |
| SAL-SALES | Sales Salary Structure | 45,000 | 12,000 | 5,000 | 52,000 |
| SAL-ENG | Engineering Salary Structure | 40,000 | 10,000 | 4,000 | 46,000 |
| SAL-SITE | Site Operations Salary Structure | 28,000 | 7,000 | 3,000 | 32,000 |
| SAL-IT | IT Salary Structure | 50,000 | 12,000 | 5,000 | 57,000 |
| SAL-SUPPORT | Support Salary Structure | 22,000 | 5,000 | 2,000 | 25,000 |

**Payroll runs (46):**
- 46 payroll runs spanning Jul 2022 through Apr 2026 (46 distinct monthly periods).
- Each run covers all active employees for that month.
- Status distribution: 34 POSTED, 8 FINALIZED, 4 DRAFT.
- Monthly payroll total (gross): ~৳3.5M–৳8M depending on headcount growth.
- Payroll runs rotate across projects (Maya Kanon, Rivery Village, South Valley, Ocean Bliss, Corporate) as cost center assignments.

**Payroll run lines (~3,600–4,100):**
- 46 runs × varying active employees per run = ~3,600–4,100 lines (early runs have fewer employees due to workforce growth over years).
- Lines link each employee to their assigned salary structure, with amounts from that structure.

### 2.10 Documents and audit

**Attachments (200):**
- 200 attachment metadata records (no actual file bytes in MinIO for UAT profile — just metadata with AVAILABLE status, synthetic filenames, realistic MIME types, plausible size ranges).
- Categories: booking forms (50), contract documents (40), payment acknowledgements (35), payroll summaries (20), project approvals (15), vendor bills (25), handover checklists (10), miscellaneous (5).
- Storage keys: `rcg-docs/{category}/{yyyy}/{filename}` pattern.
- Filenames use realistic naming (e.g., `booking-form-RC-Maya-Kanon-Amina-Akter-2024.pdf`, not "DEMO-...pdf").
- Checksum/etag values use plausible synthetic hex patterns (not "DEMO-CHECKSUM-...").

**Attachment links (250):**
- 250 attachment-entity links connecting attachments to bookings, sale contracts, vouchers, payroll runs, employees.

**Audit events (500 seeded):**
- 500 operational audit events (not login auth events — those accumulate naturally during UAT).
- Categories: ACCOUNTING (150), CRM_PROPERTY_DESK (120), ADMIN (50), PAYROLL (80), ATTACHMENT (100).
- Request IDs: `REQ-{YYYY}-{Seq6}` (not "DEMO-AUDIT-...").
- Metadata includes realistic event summaries (e.g., "Sale contract RC-SC-2024-0032 signed for RC Maya Kanon unit", not "synthetic demo/UAT event").
- Event dates spanning FY2022–FY2026.

---

## 3. Future Stress Profile Specification

The stress profile (`seed:realistic:stress`) is specified conceptually for future implementation (Prompt 51E). It is not the implementation priority.

| Category | UAT count | Stress target (5x) |
|----------|-----------|---------------------|
| Units | 850 | 4,250 |
| Customers | 600 | 3,000 |
| Leads | 400 | 2,000 |
| Bookings | 350 | 1,750 |
| Sale contracts | 250 | 1,250 |
| Installment rows | 2,500 | 12,500 |
| Collections | 2,000 | 10,000 |
| Vouchers | 3,500 | 17,500 |
| Employees | 90 | 450 |
| Payroll runs | 46 | 230 |
| Payroll run lines | ~4,100 | ~20,500 |
| Leave requests | 500 | 2,500 |
| Attendance logs | 24,000 | 120,000 |
| Attachments | 200 | 1,000 |
| Audit events (seeded) | 500 | 2,500 |

The stress profile uses the same entity names, naming conventions, and BDT rules as the UAT profile but generates 5x more entities with broader temporal and categorical variation. Implementation approach: parameterized generators with configurable volume targets.

---

## 4. Timeline/Historical-Depth Requirements

### 4.1 Fiscal year definitions

- **FY2022**: Jul 2021 – Jun 2022 (Bangladesh FY convention)
- **FY2023**: Jul 2022 – Jun 2023
- **FY2024**: Jul 2023 – Jun 2024
- **FY2025**: Jul 2024 – Jun 2025
- **FY2026 partial**: Jul 2025 – Apr 2026 (current operational period)

However, the ERP's voucher/reporting system uses calendar dates, not fiscal year boundaries. The temporal distribution uses calendar months for simplicity:

- **2022**: Jan–Dec (low activity period, early adoption)
- **2023**: Jan–Dec (growing operations)
- **2024**: Jan–Dec (established operations)
- **2025**: Jan–Dec (strong operations)
- **2026**: Jan–Apr (current partial year)

### 4.2 Monthly activity distribution pattern

Monthly voucher volume targets (illustrative, actual generation may vary ±15%):

| Year | Avg vouchers/month | Total vouchers |
|------|-------------------|----------------|
| 2022 | 35–45 | ~400–500 |
| 2023 | 55–75 | ~650–850 |
| 2024 | 65–95 | ~750–1,100 |
| 2025 | 75–110 | ~900–1,300 |
| 2026 (Jan–Apr) | 85–120 | ~350–480 |

Monthly payroll: every month from Jul 2022 through Apr 2026 has at least 1 payroll run (some months may have 2 for different cost centers).

Monthly collection distribution: 5–20 collections/month in early years, growing to 15–40/month in later years.

Not monotonically increasing. Some months dip:
- 2022: low baseline
- 2023 Apr: slight dip (Ramadan/Eid period)
- 2024 Jul–Aug: seasonal slowdown
- 2025 Dec: year-end push with higher volumes
- 2026 Jan: post-year-end recovery dip

### 4.3 Customer/booking temporal spread

- Customer creation dates: ~20% in 2022, ~25% in 2023, ~20% in 2024, ~20% in 2025, ~15% in 2026
- Booking dates: proportional to customer creation, with some lag
- Contract dates: ~30% within 1 month of booking, ~50% within 3 months, ~20% after 3+ months
- Collection dates: spread across installment due dates, with some early/late patterns

### 4.4 Employee lifecycle

- Join dates: distributed across all years (some senior staff joined 2022, newer hires in 2025/2026)
- ~10 resigned employees: exit dates in 2024–2025, with realistic exit patterns
- Salary adjustments: some employees get salary increases reflected in later payroll runs (via different salary structure assignment)

### 4.5 Dashboard current-state feel

- Recent activity (last 30 days): 5–10 new bookings, 2–5 new contracts, 10–20 new collections, 2–4 draft vouchers, 1–2 submitted leave requests
- Pending work items: 4–8 draft vouchers, 20–50 available units, 3–5 submitted leave requests, 1–2 finalized payroll runs awaiting posting, 5–15 pending-upload attachments

---

## 5. Bangladesh-Facing Naming/Contact/Location Rules

### 5.1 Customer naming

**Muslim naming patterns (primary pool, ~70%):**
- Male: Md. [Name] [Father's name/Hossain/Khan/ Rahman/Chowdhury], e.g., Md. Rafiq Hossain, Md. Kamal Uddin, Abdullah Al Mamun, Md. Shahidul Islam, Imran Hossain, Md. Sajedul Karim, Farhan Chowdhury, Md. Nazmus Saquib, Md. Ashraf Ali, Tariq Bin Yousuf
- Female: [Name] Akter/Begum/Khatun/ Rahman/Chowdhury, e.g., Nadia Akter, Fatema Begum, Samira Rahman, Ishrat Khatun, Amina Akter, Taslima Chowdhury, Farhana Begum, Mahbuba Akter, Nasreen Rahman, Rabeya Khatun

**Hindu naming patterns (~20%):**
- Male: [Name] Chandra Das/Sharma/Bose/Mandal/Saha, e.g., Suresh Chandra Das, Rajesh Sharma, Debashish Bose, Arun Mandal, Pranab Saha, Bikash Chandra Paul, Sujit Roy, Anil Kumar Ghosh
- Female: [Name] [Surname], e.g., Priya Sharma, Gita Das, Ananya Bose, Rina Mandal, Lakshmi Saha, Soma Roy, Deepa Ghosh

**Business/company buyer names (~10%):**
- [Business Name] Ltd/Associates/Enterprises/Group/Traders/Construction, e.g., Khan Brothers Enterprises, Chowdhury & Associates Ltd, Bangladesh Premier Traders, Delta Construction Ltd, Skyline Properties Associates

**Naming constraints:**
- No serial/auto-numbered naming (no "Customer 001", "Customer 002")
- No "DEMO Customer", "Test User", "Sample Buyer" patterns
- Names must feel like real Bangladesh individuals or businesses
- Use a curated name pool of ~200 Muslim first names, ~100 Hindu first names, ~30 common Bangladesh surnames/patronymics, and ~20 business entity names

### 5.2 Employee naming

Same Bangladesh naming conventions as customers, but with department-appropriate variation:
- Finance/accounting employees: more formal naming
- Sales/CRM employees: younger first names
- Engineering/site: mixed naming
- Management: senior/respect-bearing naming (Md., Chowdhury, Khan patterns)

### 5.3 Phone conventions

**Format:** `01XXXXXXXXX` (11 digits, local mobile format)

- Mobile prefix distribution: `017` (30%), `018` (25%), `019` (20%), `016` (15%), `015` (10%)
- Generator produces realistic Bangladesh mobile numbers: `017XXXXXXXX`, `018XXXXXXXX`, etc.
- No "SYNTH-PHONE", "TEST-PHONE", or random alphanumeric patterns
- Some employee/office phones may use `02-XXXXXXX` landline format for Dhaka office numbers

### 5.4 Address conventions

**Customer address format:** `{Area}, {City/District}` or `{Road/House info}, {Area}, {City}`

Examples:
- "House 15, Road 7, Sector 4, Uttara, Dhaka"
- "Flat 4B, Block C, Dhanmondi, Dhaka"
- "Plot 23, Road 5, Abdullahpur, Keraniganj, Dhaka"
- "Village Char Janal, Sreenagar, Munshiganj"
- "2/A Sonadanga R/A, Khulna"
- "15/A Azimpur, Dhaka"
- "Road 3, Bashundhara R/A, Dhaka"

**Corporate/office addresses:** More formal with road/house/block numbers.

**Constraint:** No real private residential addresses. Use plausible but synthetic house/road/plot numbers with real area/city names. No "SYNTHETIC ADDRESS" patterns.

### 5.5 Email conventions

**Employee emails:** `{firstName}.{lastName}@realcapita.com.bd` (e.g., `amina.akter@realcapita.com.bd`, `md.rafiq.hossain@realcapita.com.bd`). Lowercase, period-separated.

**Customer emails:** `{firstName}.{lastName}@{domain}` where domain is drawn from plausible Bangladesh email domains: `gmail.com` (40%), `yahoo.com` (15%), `hotmail.com` (10%), plus synthetic local domains like `mailbox.com.bd` (5%), or leave ~30% without email (optional field).

**Constraints:**
- No "demo", "test", "synthetic", "example", "uat" anywhere in email local parts or domains
- No copying real people's emails
- The `realcapita.com.bd` domain is reserved for employee/walkthrough users only
- ~30% customers may have null/empty email (field is optional per schema)
- **Prisma constraint**: `@@unique([companyId, email])` and `@@unique([companyId, phone])` on Customer. PostgreSQL treats NULL as non-equal in unique constraints, so multiple customers can safely have null email or null phone. All non-null email values must be unique within the company. All non-null phone values must be unique within the company. The generator must ensure uniqueness by appending numeric suffixes or using deterministic collision resolution when name-based email generation produces duplicates.

---

## 6. Real Capita Project/Portfolio Realism Strategy

### 6.1 Publicly grounded project anchors

All 13 project names and their primary locations are grounded in Real Capita Group's public website (rcgcbd.com):

- RC Maya Kanon → Abdullahpur, Keraniganj, Dhaka (9-acre flagship residential)
- RC Rivery Village → Rupganj, Narayanganj (adjacent Purbachal 3 No. Sector)
- RC Priyojan Grihayan Prokolpo → Keraniganj, Dhaka (share ownership)
- RC South Valley → Sreenagar, Munshiganj (primary; acknowledging public inconsistency)
- RC Maya Kanon Eco Village → Keraniganj area (eco/sustainable residential)
- RC Bondhujon Abashon → Keraniganj/Rupganj (group-buy land ownership)
- RC Ocean Bliss → Kuakata, Patuakhali (hotel/suite tourism)
- RC Daira Noor → Azimpur, Dhaka (apartment)
- RC Shanti Kuthir → Khulna (apartment, normalized from dual naming)
- RC Dalim Tower → Khulna (tower/commercial)
- RC Tulip → Badda/Gulshan, Dhaka (apartment)
- RC Nurjahan Kunjo → Savar, Dhaka (apartment)
- RC Rainbow → Sonadanga R/A, Khulna (apartment)

### 6.2 Location resolution for inconsistencies

- RC South Valley: Use "Sreenagar, Munshiganj" as canonical location (matches official project page). Notes field may mention "Munshiganj district" context.
- RC Shanti Kuthir: Use "Khulna" as canonical. Normalize naming to "RC Shanti Kuthir" consistently.
- No project pages reference real private addresses or customer data.

### 6.3 Unit inventory realism

For each project, unit inventory follows plausible real-estate portfolio patterns:
- **Residential plot projects** (Maya Kanon, Rivery Village, South Valley, Eco Village): Large unit counts (100-200), plot sizes in katha (2.5, 3, 5, 7.5, 10), blocks/zones with letter naming
- **Share/group-ownership projects** (Priyojan, Bondhujon): Smaller counts (40-60), share-ownership type
- **Apartment projects** (Daira Noor, Shanti Kuthir, Tulip, Nurjahan, Rainbow, Dalim Tower): Floor-based unit naming (APT-301, APT-401), apartment type, 40-60 units
- **Hospitality project** (Ocean Bliss): Suite-based naming (STD-101, DELUXE-201, EXEC-301, PRES-501), 30 units

### 6.4 Product terminology alignment

The specification uses Bangladesh real-estate vocabulary that aligns with both RCG public materials and the ERP schema:
- **Katha** — standard land measurement (2.5, 3, 5, 7.5, 10 katha sizes)
- **Plot** — land parcel for sale
- **Apartment** — residential flat unit
- **Commercial** — commercial/shop/office unit
- **Share Ownership** — collective/fractional ownership model (RC Priyojan context)
- **Duplex/Triplex** — multi-story residential types (RC Eco Village context)
- **Suite types** — Standard Deluxe, Deluxe Suite, Executive Suite, President Suite (RC Ocean Bliss context)
- **Booking money** — initial deposit to secure a unit (৳50K–৳2M range)
- **Down payment** — larger initial installment portion
- **Allotment** — formal assignment of a unit to a buyer
- **Handover** — delivery of completed unit to buyer
- **Installment** — scheduled payment toward contract total

Terms only used where the ERP schema supports them (unit types: PLOT, APT, COMM, SHARE, DUPLEX, TRIPLEX; suite types exist in current seed and schema).

---

## 7. BDT/৳ Financial and UI Formatting Specification

### 7.1 Seed monetary values in BDT

All seed amounts are specified and stored as BDT values. The Prisma schema uses `Decimal(18,2)` for monetary fields — no currency code field exists. The entire dataset operates in BDT by convention.

**Realistic BDT ranges:**

| Category | Range (৳) |
|----------|-----------|
| Plot booking deposit | 50,000 – 500,000 |
| Apartment booking deposit | 100,000 – 1,000,000 |
| Suite booking deposit | 200,000 – 800,000 |
| Plot contract total | 1,500,000 – 50,000,000 (15 lakh – 5 crore) |
| Apartment contract total | 2,000,000 – 20,000,000 (20 lakh – 2 crore) |
| Suite contract total | 3,000,000 – 15,000,000 (30 lakh – 1.5 crore) |
| Installment amount | 50,000 – 5,000,000 (per installment row) |
| Collection amount | 20,000 – 10,000,000 |
| Opening bank balance | 100,000,000 (৳10 crore) |
| Land acquisition payment | 5,000,000 – 20,000,000 per transaction |
| Contractor payment | 500,000 – 5,000,000 per transaction |
| Construction material | 200,000 – 2,000,000 per transaction |
| Marketing expense | 100,000 – 800,000 per transaction |
| Monthly payroll total | 3,500,000 – 8,000,000 |
| Employee basic salary | 22,000 – 120,000 per month |
| Office rent/utilities | 50,000 – 300,000 per transaction |
| Registration/legal | 50,000 – 500,000 per transaction |

### 7.2 Centralized BDT formatter

**Implementation direction: centralized `formatBDT` helper in `apps/web/src/lib/format.ts`.**

This helper should:
- Accept a numeric value and optional compact flag
- Return a string with ৳ prefix for full format (e.g., `৳1,500,000.00` or compact `৳1.5M`)
- Use `Intl.NumberFormat('en-IN')` or a custom formatting that produces Bangladesh-appropriate number grouping (lakhs/crores where beneficial, but at minimum uses proper grouping separators)
- Replace all current `Intl.NumberFormat('en-US')` usage in financial contexts
- Be consumed by all money-bearing display surfaces via the shared formatting import

### 7.3 Surfaces requiring BDT/৳ display

**Must display ৳ in Prompt 51C/51D:**

1. Dashboard financial KPI cards and summary values
2. Business Overview report KPI cards, trend chart tooltips/labels, period table amounts
3. All financial report pages (TB, GL, P&L, BS, daily, weekly, monthly, yearly) — amounts in KPI cards, chart data, and detailed tables
4. Voucher detail page — debit/credit amounts, voucher line amounts
5. Voucher list page — amount columns
6. Customer collection surfaces — collection amounts, receipt amounts
7. Installment schedule display — due amounts, paid amounts
8. Booking list/detail — booking amounts
9. Sale contract list/detail — contract amounts
10. Payroll run detail — basic, allowance, deduction, net amounts
11. Salary structure display — amount fields
12. Customer 360 profile — financial summary amounts
13. Printable receipt surfaces — all monetary amounts
14. Printable financial report templates — all monetary amounts
15. Surviving retained shared chart/metric components that display currency (e.g., reusable analytics metric cards, trend chart amount labels)

**Current gaps requiring correction (identified in 51A):**
- `apps/web/src/lib/format.ts` — `formatAccountingAmount` uses `Intl.NumberFormat('en-US')` with no currency symbol
- `apps/web/src/features/analytics/components.tsx` — `numberFormatter`, `compactNumberFormatter` use `Intl.NumberFormat('en-US')` with no ৳ symbol
- `apps/web/src/features/analytics/components.tsx` — `formatCompactCurrency` and `formatValue` treat 'currency'/'compactCurrency' format types but output plain numbers without ৳
- All report pages use `formatAccountingAmount` or raw number formatting without ৳

### 7.4 Implementation approach for 51C

The BDT formatting change goes directly into Prompt 51C as part of the seed implementation wave. Steps:

1. Add `formatBDT(value, options)` to `apps/web/src/lib/format.ts`:
   - `formatBDT(value)` → `৳1,500,000.00` (full, 2 decimal places)
   - `formatBDT(value, { compact: true })` → `৳1.5M` or `৳15L` (compact, using lakh/crore notation)
2. Replace `Intl.NumberFormat('en-US')` in `formatAccountingAmount` with the BDT formatter
3. Replace `Intl.NumberFormat('en-US')` in analytics component formatters with BDT formatter
4. Update all format='currency' and format='compactCurrency' rendering to use ৳ prefix
5. Ensure print/PDF templates display ৳
6. Test at all key surfaces listed in 7.3

This does NOT require a separate sub-prompt. It is within the Prompt 51C scope.

---

## 8. Cross-Module Data Relationship Design

### 8.1 Complete operational chains

**Chain 1: Customer property purchase (primary)**
```
Lead (optional) → Customer → Booking (unit + amount) → Sale Contract (contract amount) →
  Installment Schedule (4-12 rows) → Collections (against installments) →
  Receipt Voucher (per collection) → Printable Receipt (for select collections)
```

At least 10 customers must have this full chain with multiple collections across years.

**Chain 2: Revenue recognition (accounting)**
```
Sale Contract → Journal Voucher (debit: Customer Receivable, credit: Sales Revenue + Customer Advances adjustment)
```

Each sale contract with ৳1M+ total should have a corresponding revenue recognition journal voucher.

**Chain 3: Expense/vendor payment**
```
Expense Category → Payment Voucher (debit: expense account, credit: bank/cash)
```

Each expense payment voucher links to a realistic expense category (land, construction, marketing, etc.).

**Chain 4: Payroll posting**
```
Payroll Run (FINALIZED → POSTED) → post_payroll_run function →
  Posted Voucher (debit: Payroll Expense, credit: Payroll Payable + Deductions Payable)
```

Each posted payroll run creates a corresponding voucher via the existing `post_payroll_run` database function.

**Chain 5: Banking operations**
```
Contra Voucher (bank-to-cash) → Receipt Voucher (cash/bank income) → Payment Voucher (cash/bank outflow)
```

Banking contra entries represent internal fund movements.

### 8.2 Reconciliation requirements

- **Contract totals = sum of installment schedule amounts** for each contract (within ৳0.01 tolerance for rounding)
- **Collection totals vs. installment totals**: Not all installments are fully collected. Outstanding balances must be materially visible. Approximate collection efficiency: 60-75% of total scheduled amounts across the portfolio.
- **Posted voucher debits = posted voucher credits** for the entire dataset (balanced books)
- **Payroll net amounts**: basic + allowance - deduction = net for each payroll line
- **Monthly payroll totals**: sum of all payroll lines for a run = plausible monthly payroll expense that aligns with the posted payroll expense vouchers
- **Business Overview coherence**: contracted sales from contracts ≈ Business Overview contracted sales; collected sales from collections ≈ Business Overview collected sales; posted voucher revenue ≈ Business Overview revenue

### 8.3 Customer 360 depth requirements

At least 25 customers must have rich Customer 360 profiles visible at `/crm-property-desk/customers/[customerId]`:

- Identity section: realistic name, email, phone, address
- Booking records: 1-3 bookings across different projects/years
- Sale contracts: 1-2 contracts with installment schedules
- Collection transaction history: 3-15 collections spanning 1-3 years
- Posted voucher context: receipt vouchers linked to collections
- Receipt action: at least 1 printable receipt accessible
- Business timeline: chronological events showing engagement over time

At least 5 customers must show significant overdue/outstanding receivables:
- Installments past due date with no collection
- Partial payments (collection amount < installment amount)
- Multiple missed installments creating an outstanding balance
- Visible in Customer 360 as incomplete payment history

---

## 9. Multi-Year Historical Timeline Specification

### 9.1 Year-by-year narrative

**2022 — Early adoption period (low activity):**
- Company workspace newly adopted. ~80 employees on payroll.
- ~50 customers registered. ~30 bookings, ~15 contracts signed.
- ~40 vouchers/month (mostly payroll payments and basic operational expenses).
- A few land acquisition payments (large individual amounts).
- First revenue recognition from early contracts.
- Total annual revenue: ~৳30–50M (mostly from 2-3 large land plot sales).

**2023 — Growth year (moderate activity):**
- ~85 employees (5 new hires). 
- ~120 customers. ~80 bookings, ~55 contracts.
- ~65 vouchers/month. More diverse expense categories.
- RC Maya Kanon starts selling more units. RC Rivery Village gains traction.
- Marketing campaigns expand (visible in expense vouchers).
- Total annual revenue: ~৳80–120M.

**2024 — Established operations (strong activity):**
- ~88 employees. Some resignations (2-3 exits).
- ~200 customers. ~120 bookings, ~90 contracts.
- ~80 vouchers/month. Regular construction/development payments.
- Several large land acquisition transactions for new phases.
- Occasional dip months (Jul-Aug seasonal slowdown, Ramadan period).
- Total annual revenue: ~৳150–200M.

**2025 — Peak year (highest activity):**
- ~90 employees. Another 5-8 hires. Another 2-3 exits.
- ~350 customers. ~100 bookings (some slowdown as inventory gets committed), ~70 contracts.
- ~95 vouchers/month. Year-end push in December.
- Strong collection activity from prior-year installment schedules maturing.
- Some weaker months in Q1 and mid-year.
- Total annual revenue: ~৳180–250M.

**2026 Jan–Apr — Current period (partial year, active):**
- ~90 employees (current headcount).
- ~60 new customers in 4 months. ~35 bookings, ~20 contracts.
- ~90 vouchers/month. Recent activity visible on dashboard.
- Collections from prior-year contracts continuing.
- 1-2 draft vouchers, 1 finalized payroll awaiting posting — dashboard "pending work" feels alive.

### 9.2 Financial report implications

This temporal distribution ensures:
- Business Overview trend chart shows 4+ years of monthly data with visible growth and occasional dips
- P&L shows progressively stronger revenue and controlled expense growth
- Balance sheet shows expanding assets (project WIP), growing equity, and manageable liabilities
- Trial balance has meaningful balances in all 5 account classes across multiple periods
- General ledger shows transaction history for key posting accounts over years

---

## 10. Verification Matrix for Prompt 51D

### 10.1 Seed process verification

| Check | Criterion |
|-------|-----------|
| Determinism | `seed:realistic:uat` produces identical counts and key entity IDs on two consecutive runs against a fresh reset |
| Resettablity | `seed:realistic:verify` passes after a full reset + reseed cycle |
| Reproducibility | Seed produces same data on different machines with same env/config |
| Production safety | Seed refuses to run in NODE_ENV=production without explicit confirmation flag |

### 10.2 Zero contamination verification

| Check | Criterion |
|-------|-----------|
| Company name | Does not contain "Demo", "UAT", "Synthetic", "Test", "Sample", "Mock", "Seed", "Placeholder", "Fake", "Example" |
| User names | Same check on firstName + lastName |
| Customer names | Same check on fullName |
| Employee names | Same check on fullName |
| Project names/codes | Same check |
| Voucher references | Same check |
| Voucher descriptions | Same check |
| Collection references | Same check |
| Address fields | Same check |
| Phone fields | Same check |
| Email fields | Same check on local part and domain (excluding system email domains like realcapita.com.bd) |
| All description/notes fields visible in UI | Same check |
| Attachment filenames | Same check |
| Audit event metadata summaries | Same check |

The verification script must programmatically search ALL seeded business-facing text fields for these contamination strings and report zero hits. Internal technical markers for reset safety may exist in non-displayed fields only.

### 10.3 Volume verification

| Module | Minimum target | Verification check |
|--------|---------------|--------------------|
| Units | 850 | count >= 850 |
| Customers | 600 | count >= 600 |
| Leads | 400 | count >= 400 |
| Bookings | 350 | count >= 350 |
| Sale contracts | 250 | count >= 250 |
| Installment schedule rows | 2,500 | count >= 2,500 |
| Collections | 2,000 | count >= 2,000 |
| Vouchers | 3,500 | count >= 3,500 |
| Posted vouchers | 3,300 | count >= 3,300 (95% of total) |
| Draft vouchers | 150 | count >= 100 |
| Employees | 90 | count >= 90 |
| Payroll runs | 46 | count >= 46 |
| Payroll run lines | ~4,100 | count >= 3,600 |
| Leave requests | 500 | count >= 500 |
| Leave types | 6 | count >= 6 |
| Salary structures | 8 | count >= 8 |
| Attendance logs | 24,000 | count >= 24,000 |
| Attachments | 200 | count >= 200 |
| Attachment links | 250 | count >= 250 |
| Audit events (seeded) | 500 | count >= 500 |
| Account groups | 20 | count >= 20 |
| Ledger accounts | 30 | count >= 30 |
| Particular accounts | 50 | count >= 50 |
| Locations | 10 | count >= 10 |
| Departments | 10 | count >= 10 |

### 10.4 Time-horizon verification

| Check | Criterion |
|-------|-----------|
| Earliest voucher date | Must be in calendar year 2022 |
| Latest voucher date | Must be in 2026 (at least through April) |
| Earliest payroll run | Must be 2022 or 2023 |
| Earliest booking date | Must be in 2022 |
| Earliest collection date | Must be in 2022 |
| Year coverage | Vouchers exist in each calendar year 2022, 2023, 2024, 2025, 2026 |
| Payroll month coverage | Payroll runs exist for at least 46 distinct year-month combinations (Jul 2022 through Apr 2026) |

### 10.5 Cross-module chain verification

| Check | Criterion |
|-------|-----------|
| Full-chain customers | At least 10 customers have: booking → sale contract → installment schedule → collection → receipt voucher → printable receipt route |
| Multi-year collection customers | At least 5 customers have collections spanning 2+ calendar years |
| Outstanding receivables | At least 3 customers have installment schedules with unpaid/partially-paid overdue rows |
| Contract-to-schedule integrity | Every sale contract has installment schedule rows whose sum equals the contract amount (within ৳0.01) |
| Collection-to-voucher integrity | Every collection links to a posted receipt voucher |
| Payroll posting integrity | Every posted payroll run links to a posted voucher via postedVoucherId |
| Voucher balance | Total posted voucher debits = total posted voucher credits (within ৳0.01) |

### 10.6 UI inspection checks (manual, Prompt 51D)

| Surface | Check |
|---------|-------|
| Dashboard | Shows believable KPIs with ৳ values, recent activity, pending work items |
| Business Overview | Shows meaningful multi-year trend chart, KPI cards with ৳, period table |
| Customer 360 | Shows rich customer profiles with identity, bookings, contracts, collection history, receipt actions |
| Voucher list | Shows many vouchers across years with ৳ amounts, realistic references |
| Financial reports (TB, GL, P&L, BS) | Show non-trivial multi-year data with ৳ formatting |
| Payroll runs | Show multi-year payroll history with ৳ amounts |
| Customer collection receipt | Prints with ৳ amounts, realistic company name, customer name |
| Project/property pages | Show realistic unit inventory with distribution across statuses |
| HR pages | Show realistic employee roster, leave history |
| Session menu | Shows "Real Capita Group" (not "Demo / UAT") |

### 10.7 Financial report verification

| Check | Criterion |
|--------|-----------|
| Business Overview trend | Daily/weekly/monthly/yearly buckets all show non-trivial variation across years |
| P&L | Revenue >> ৳50M/year in later years; net profit positive overall but some months show loss or near-zero |
| Trial Balance | All 5 account classes have material balances; debits ≈ credits |
| General Ledger | Key posting accounts show multi-year transaction history with running balances |
| Balance Sheet | Assets >> Liabilities; Equity grows over years; reasonable current ratio |
| Receivables visible | Customer receivables materially present (not zero) |
| Collections visible | Collection activity shows in Business Overview collected sales metric |

---

## 11. Prompt 51C Implementation Blueprint

### 11.1 Files/modules to create or refactor

**New seed generator architecture (replace `scripts/lib/demo-data.mjs`):**

```
scripts/lib/realistic-data/
  index.mjs                    — orchestrator, command runner, reset/seed/verify entry points
  config.mjs                   — profile configs (UAT targets, year ranges, name pools, BDT ranges)
  generators/
    org.mjs                     — company, locations, departments, roles
    users.mjs                   — walkthrough users, password hashing
    accounts.mjs                — chart of accounts (groups, ledgers, particulars)
    projects.mjs                — projects, phases, blocks, zones, unit types, units
    crm.mjs                     — customers, leads, bookings, contracts, schedules, collections
    vouchers.mjs                — receipt, payment, journal, contra vouchers with cross-module linkage
    hr.mjs                      — employees, devices, device users, attendance logs, leave types, leave requests
    payroll.mjs                 — salary structures, payroll runs, payroll lines, payroll posting
    attachments.mjs             — attachment metadata, attachment links
    audit.mjs                   — operational audit events
    timeline.mjs                — temporal distribution helpers, date generators, monthly activity planners
    names.mjs                   — Bangladesh name pools, address templates, phone generators, email generators
    bdt.mjs                     — BDT amount generators, realistic financial range helpers
  shared/
    deterministic-random.mjs    — seeded PRNG for reproducibility
    prisma-helpers.mjs          — upsert/create helpers, ID tracking, cross-module reference resolution
    safety.mjs                  — production guards, reset safety checks, marker conventions
```

**Total: ~14 domain generator modules + ~4 shared utility modules + ~2 config/entry modules = ~20 new files.**

The old `scripts/lib/demo-data.mjs` (3974 lines) is removed entirely. The old thin wrapper scripts (`seed-demo-data.mjs`, `reset-demo-data.mjs`, `verify-demo-data.mjs`) are replaced with new thin wrappers.

### 11.2 Old seed content to remove/abandon

- Delete `scripts/lib/demo-data.mjs` entirely (all 3974 lines of contaminated seed data)
- Replace `scripts/seed-demo-data.mjs` with new realistic seed wrapper
- Replace `scripts/reset-demo-data.mjs` with new realistic reset wrapper
- Replace `scripts/verify-demo-data.mjs` with new realistic verify wrapper
- The old `DEMO_MARKER`, `DEMO_COMPANY_NAME`, `DEMO_COMPANY_SLUG`, `DEMO_EMAIL_DOMAIN`, and all hardcoded demo entity arrays are removed

### 11.3 New command/scripts to introduce

**package.json additions:**

| Command | Script |
|---------|--------|
| `seed:realistic:uat` | `node scripts/seed-realistic-data.mjs` |
| `seed:realistic:verify` | `node scripts/verify-realistic-data.mjs` |
| `seed:realistic:uat:reset` | `node scripts/reset-realistic-data.mjs` |

**Legacy command transition:**

The old `seed:demo`, `seed:demo:reset`, `seed:demo:verify` commands are removed from `package.json` scripts after the realistic seed is verified working. During transition, both sets of commands may coexist briefly for comparison, but the realistic commands become canonical immediately. Documentation must reference only realistic commands after 51C.

**Command behavior:**

- `seed:realistic:uat` — forced reset of the Real Capita Group company, then seed all realistic data
- `seed:realistic:verify` — comprehensive verification (counts, contamination, timeline, cross-module chains, financial balance)
- `seed:realistic:uat:reset` — guarded reset of Real Capita Group company data only

Options: `--dry-run`, `--confirm-production-realistic-data` (for NODE_ENV=production guard).

### 11.4 Verification scripts upgrade

`scripts/verify-realistic-data.mjs` must implement all checks from Section 10:
- Module count verification against target minimums
- Contamination scan across all business-facing text fields
- Time-horizon checks (earliest/latest dates, year coverage)
- Cross-module chain checks (contract-to-schedule sum, collection-to-voucher linkage, voucher balance)
- Financial report readiness (all 5 account classes have material posted voucher activity)
- Project/unit coverage (all 13 projects present, realistic unit status distribution)

### 11.5 Documentation to rewrite

| Doc | Action |
|-----|--------|
| `docs/operations/demo-data.md` | Rewrite as `docs/operations/realistic-data.md` or update content to reference realistic seed |
| `docs/release/demo-readiness-guide.md` | Update to reference realistic seed commands, realistic company name, realistic login accounts |
| `docs/uat/phase-1-demo-walkthrough.md` | Update walkthrough paths to use realistic customer names and receipt scenarios |
| `docs/handoffs/foundation-status.md` | Update seed data section to reference realistic UAT profile |
| `README.md` | Update Demo/UAT Data section to reference realistic seed commands |
| `docs/handoffs/prompt-51-scope.md` | Update if needed (51B status doc created) |

### 11.6 BDT formatting in 51C

BDT formatting goes directly into Prompt 51C (not a separate sub-prompt). Steps:

1. Add `formatBDT()` helper to `apps/web/src/lib/format.ts`
2. Update `formatAccountingAmount` to use BDT format with ৳ prefix
3. Update analytics component formatters to use ৳ for currency/compactCurrency format types
4. Ensure all financial display surfaces listed in Section 7.3 use the BDT formatter
5. Remove the `isDemoUatCompany` check in `business-report-page.tsx` that shows "Demo/UAT workspace" banner — the realistic seed uses company slug `real-capita-group` instead of `real-capita-demo-uat`, so the old demo-company check must be removed entirely. If a data-source note is still needed for future demo scenarios, it should be based on a explicit seed-type flag rather than hardcoded company slug matching
6. Update `AnalyticsEmptyState` in `apps/web/src/features/analytics/components.tsx` — the `showDemoHint` prop currently adds "Demo workspace indicators appear when presentation data is available." This wording must be changed or removed. The realistic dataset should not display "Demo workspace" hints. The prop can be retained but with neutral wording such as "Presentation data indicators appear when seeded data is available" or removed entirely if the realistic dataset makes empty states rare enough that the hint is unnecessary
6. Update receipt/printable report templates to display ৳

### 11.7 Prisma schema considerations

No schema changes needed. The existing schema fully supports the realistic dataset:
- All monetary fields use `Decimal(18, 2)` — suitable for BDT values
- All entity models (Customer, Employee, Voucher, Collection, etc.) have the required fields
- Enums (VoucherType, VoucherStatus, LeadStatus, BookingStatus, LeaveRequestStatus, PayrollRunStatus, etc.) cover the needed status values
- Relationships (Customer→Booking→SaleContract→InstallmentSchedule→Collection→Voucher) are fully supported
- `post_payroll_run` database function exists for payroll posting

One note: The `UnitStatus` model uses system-level seeded statuses (AVAILABLE, BOOKED, SOLD, ALLOTTED, TRANSFERRED, CANCELLED). These are seeded by the application bootstrap, not by the demo/realistic seed script. The realistic seed script should verify these statuses exist but not create new ones.

### 11.9 Prisma schema unique constraints that generators must respect

The data generators must produce data that satisfies all Prisma-level unique constraints. Violating any of these will cause the seed transaction to fail. The critical constraints are:

**Company-scoped uniqueness (within the Real Capita Group company):**

| Model | Unique constraint | Generator impact |
|-------|-------------------|-----------------|
| Location | `@@unique([companyId, code])`, `@@unique([companyId, name])` | All location codes and names must be unique within the company |
| Department | `@@unique([companyId, code])`, `@@unique([companyId, name])` | All department codes and names must be unique within the company |
| Employee | `@@unique([companyId, employeeCode])`, `@@unique([companyId, userId])` | Employee codes must be unique; linked userId must be unique per employee |
| AttendanceDevice | `@@unique([companyId, code])` | Device codes must be unique within the company |
| AccountGroup | `@@unique([companyId, code])`, `@@unique([companyId, name])` | Account group codes and names must be unique |
| LedgerAccount | `@@unique([companyId, code])`, `@@unique([companyId, name])` | Ledger codes and names must be unique |
| ParticularAccount | `@@unique([companyId, code])`, `@@unique([companyId, name])` | Particular account codes and names must be unique |
| UnitType | `@@unique([companyId, code])`, `@@unique([companyId, name])` | Unit type codes and names must be unique |
| Customer | `@@unique([companyId, email])`, `@@unique([companyId, phone])` | **Critical: each customer email and phone must be unique within the company. PostgreSQL treats NULL as non-equal in unique constraints, so multiple customers CAN have null email or null phone. The ~30% null-email strategy is safe.** |
| LeaveType | `@@unique([companyId, code])`, `@@unique([companyId, name])` | Leave type codes and names must be unique |
| SalaryStructure | `@@unique([companyId, code])`, `@@unique([companyId, name])` | Salary structure codes and names must be unique |
| CostCenter | `@@unique([companyId, code])`, `@@unique([companyId, name])` | Cost center codes and names must be unique |

**Project-scoped uniqueness (within a project):**

| Model | Unique constraint | Generator impact |
|-------|-------------------|-----------------|
| Project | `@@unique([companyId, code])`, `@@unique([companyId, name])` | Project codes and names must be unique within the company |
| ProjectPhase | `@@unique([projectId, code])`, `@@unique([projectId, name])` | Phase codes/names must be unique within each project |
| Block | `@@unique([projectId, code])`, `@@unique([projectId, name])` | Block codes/names must be unique within each project |
| Zone | `@@unique([projectId, code])`, `@@unique([projectId, name])` | Zone codes/names must be unique within each project |
| Unit | `@@unique([projectId, code])` | Unit codes must be unique within each project |

**Cross-module structural uniqueness:**

| Model | Unique constraint | Generator impact |
|-------|-------------------|-----------------|
| SaleContract | `@@unique([bookingId])` | **Each booking can have at most ONE sale contract. The generator must never create multiple contracts for the same booking.** |
| Collection | `@@unique([voucherId])` | **Each voucher can link to at most ONE collection. The generator must never create multiple collections referencing the same receipt voucher.** |
| PayrollRunLine | `@@unique([payrollRunId, employeeId])` | Each employee appears exactly once per payroll run |
| VoucherLine | `@@unique([voucherId, lineNumber])` | Line numbers must be unique within each voucher |
| InstallmentSchedule | `@@unique([saleContractId, sequenceNumber])` | Sequence numbers must be unique within each contract |
| User | `@@unique email` (global) | User emails must be globally unique across all companies |

**Global uniqueness (not scoped):**

| Model | Unique constraint | Generator impact |
|-------|-------------------|-----------------|
| Role | `@@unique code`, `@@unique name` | Role codes and names are global; only upsert, never create new |
| AccountClass | `@@unique code`, `@@unique name` | Account classes are global; only upsert, never create new |
| UnitStatus | `@@unique code`, `@@unique name` | Unit statuses are global; only upsert, never create new |

**Special constraint: Customer email/phone null handling.**

PostgreSQL's unique constraint implementation treats NULL values as non-equal. This means:
- Multiple customers can have `email = NULL` without violating `@@unique([companyId, email])`
- Multiple customers can have `phone = NULL` without violating `@@unique([companyId, phone])`
- However, once a customer has a non-null email, that exact email string must be unique across ALL customers in the company
- The same applies to phone: once non-null, the exact phone string must be unique

This supports the ~30% null-email strategy in Section 5.5. The generators must:
1. Ensure every non-null customer email is unique within the company
2. Ensure every non-null customer phone is unique within the company
3. Use deterministic email generation (firstName.lastName + unique suffix if collision occurs)
4. Use deterministic phone generation (unique mobile numbers from a pool large enough for 600+ customers)

**Generator architecture implication: cross-module ID tracking**

The generators must maintain a centralized ID/entity reference map during seed execution so that:
- CRM generators know which booking IDs exist before creating sale contracts
- Voucher generators know which collection IDs exist before creating receipt vouchers
- Payroll generators know which employee IDs exist before creating payroll lines
- All generators can resolve cross-module foreign keys without circular dependency

The `prisma-helpers.mjs` module should implement this reference map as a simple JavaScript object keyed by entity type and identifier, populated incrementally as each generator module completes its seeding phase.

### 11.8 Transaction and performance considerations

The realistic seed creates ~35,000+ records (dominated by 24,000 attendance logs). The seed process should:
- Use the same forced-reset-then-seed pattern as the current demo script
- Use Prisma `$transaction` with extended timeout (180-300 seconds) for the main seed operation
- Reset must handle posted vouchers and payroll lines (disable triggers for voucher_lines, vouchers, payroll_run_lines, same as current script)
- Consider batching record creation where upsert patterns are not needed (plain creates for new entities)
- The reset transaction should delete in correct dependency order (same as current script)

**Payroll posting approach:** The existing `post_payroll_run` PostgreSQL function takes `(payrollRunId, companyId, userId, voucherDate, expenseAccountId, payableAccountId, deductionAccountId)` and creates the posted voucher with appropriate debit/credit lines. The realistic seed must either:
1. Call `post_payroll_run` via Prisma raw SQL for each payroll run to be posted (requires a known userId for the posting actor), OR
2. Manually create the posted voucher + voucher lines + update payroll run status to match the function's expected output structure

Option 1 is preferred because it uses the same posting function the application uses, ensuring consistency. The seed script should use one of the walkthrough user IDs (e.g., the payroll user) as the posting actor for all payroll posting calls. The function requires three particular account IDs (expense, payable, deduction) that must exist in the seeded chart of accounts before payroll posting can proceed.

**Seed execution order matters:** The generators must execute in dependency order:
1. Roles, Account Classes, Unit Statuses (global/system entities — upsert only)
2. Company → Locations → Departments
3. Users → User Roles
4. Account Groups → Ledger Accounts → Particular Accounts
5. Projects → Cost Centers → Phases → Blocks → Zones → Unit Types → Units
6. Leave Types → Salary Structures
7. Employees → Attendance Devices → Device Users
8. Customers → Leads
9. Bookings → Sale Contracts → Installment Schedules
10. Vouchers (receipt vouchers for collections, payment vouchers for expenses, journal vouchers for adjustments, contra vouchers for banking)
11. Collections (linking to receipt vouchers and installment schedules)
12. Payroll Runs → Payroll Run Lines → Payroll Posting (calls `post_payroll_run`)
13. Attendance Logs → Leave Requests
14. Attachments → Attachment Links → Audit Events

---

## 12. Remaining Supervisor Decisions

All decisions from Prompt 51A have been resolved by the locked supervisor requirements in this prompt:

1. **Company naming**: Decided — "Real Capita Group" (per A1)
2. **User naming**: Decided — Bangladesh names with realistic conventions (per A2)
3. **Old/new command transition**: Decided — realistic commands become canonical, legacy commands removed after verification (per Section 11.3)
4. **Stress profile priority**: Decided — deferred after UAT quality verified (per A7)
5. **BDT/৳ scope**: Decided — goes directly into 51C, centralized formatter approach (per Section 7.4)

No remaining supervisor decisions needed. The specification is implementation-ready.
