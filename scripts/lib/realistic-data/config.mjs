// ── Realistic UAT Seed Configuration ──────────────────────────────────
// All volume targets, financial ranges, and structural constants
// for the Real Capita Group UAT dataset.

import { dateOnly } from './shared.mjs';

export const COMPANY_NAME = 'Real Capita Group';
export const COMPANY_SLUG = 'real-capita-group';
export const getUatPassword = () => process.env.UAT_PASSWORD || 'CHANGE_ME_SET_IN_ENV';
export const UAT_PASSWORD = process.env.UAT_PASSWORD || 'CHANGE_ME_SET_IN_ENV';

export const SEED_TIMESTAMP = '2026-01-15T10:00:00.000Z';

// ── Volume targets ────────────────────────────────────────────────────

export const VOLUME_TARGETS = {
  locations: 10,
  departments: 10,
  costCenters: 11,
  users: 6,
  projects: 13,
  accountGroups: 20,
  ledgerAccounts: 30,
  particularAccounts: 50,
  unitTypes: 10,
  units: 850,
  customers: 600,
  leads: 400,
  bookings: 350,
  saleContracts: 250,
  installmentScheduleRows: 2500,
  collections: 2000,
  vouchers: 3500,
  employees: 90,
  salaryStructures: 8,
  payrollRuns: 46,
  payrollRunLines: 3600,
  leaveTypes: 6,
  leaveRequests: 500,
  attendanceDevices: 5,
  attendanceLogs: 24000,
  attachments: 200,
  attachmentLinks: 250,
  auditEvents: 500,
};

// ── Walkthrough user specifications ──────────────────────────────────

export const WALKTHROUGH_USERS = [
  { email: 'admin@realcapita.com.bd', firstName: 'Md. Rafiq', lastName: 'Hossain', roles: ['company_admin'] },
  { email: 'accountant@realcapita.com.bd', firstName: 'Amina', lastName: 'Akter', roles: ['company_accountant'] },
  { email: 'hr@realcapita.com.bd', firstName: 'Suresh', lastName: 'Chandra Das', roles: ['company_hr'] },
  { email: 'payroll@realcapita.com.bd', firstName: 'Ishrat', lastName: 'Begum', roles: ['company_payroll'] },
  { email: 'sales@realcapita.com.bd', firstName: 'Tanvir', lastName: 'Ahmed', roles: ['company_sales'] },
  { email: 'member@realcapita.com.bd', firstName: 'Farah', lastName: 'Rahman', roles: ['company_member'] },
];

// ── Role definitions ──────────────────────────────────────────────────

export const ROLE_DEFINITIONS = [
  { code: 'company_admin', name: 'Company Administrator', description: 'Full administrative access within the selected company scope.' },
  { code: 'company_accountant', name: 'Company Accountant', description: 'Accounting administration access for chart-of-accounts and voucher operations within the selected company scope.' },
  { code: 'company_hr', name: 'Company HR', description: 'HR administration access for employees, attendance, leave types, and leave requests within the selected company scope.' },
  { code: 'company_payroll', name: 'Company Payroll', description: 'Payroll administration access for salary structures, payroll runs, payroll lines, and payroll posting within the selected company scope.' },
  { code: 'company_sales', name: 'Company Sales', description: 'CRM and property desk access for customers, leads, bookings, contracts, schedules, and collections within the selected company scope.' },
  { code: 'company_member', name: 'Company Member', description: 'Baseline authenticated access within the selected company scope.' },
];

// ── Locations ──────────────────────────────────────────────────────────

export const LOCATION_SPECS = [
  { code: 'RCG-CORP-DHK', name: 'Real Capita Group Corporate Office, Dhaka', description: 'Corporate headquarters' },
  { code: 'RCG-SITE-MAYA', name: 'RC Maya Kanon Site Office, Keraniganj', description: 'Maya Kanon project site' },
  { code: 'RCG-SITE-RIVERY', name: 'RC Rivery Village Site Office, Rupganj', description: 'Rivery Village project site' },
  { code: 'RCG-SALES-DHK', name: 'Dhaka Sales Office', description: 'Primary sales and CRM office' },
  { code: 'RCG-SITE-VALLEY', name: 'RC South Valley Site Office, Munshiganj', description: 'South Valley project site' },
  { code: 'RCG-SITE-OCEAN', name: 'RC Ocean Bliss Operations, Kuakata', description: 'Ocean Bliss resort operations' },
  { code: 'RCG-SITE-KHULNA', name: 'Khulna Projects Office', description: 'Dalim Tower and Rainbow operations' },
  { code: 'RCG-SITE-DAIRA', name: 'RC Daira Noor Office, Azimpur', description: 'Daira Noor apartment operations' },
  { code: 'RCG-SITE-SAVAR', name: 'RC Nurjahan Kunjo Office, Savar', description: 'Nurjahan Kunjo site' },
  { code: 'RCG-SITE-ECO', name: 'RC Maya Kanon Eco Village Office, Keraniganj', description: 'Eco Village project site' },
];

// ── Departments ────────────────────────────────────────────────────────

export const DEPARTMENT_SPECS = [
  { code: 'FIN', name: 'Accounts & Finance' },
  { code: 'SALES', name: 'Sales & CRM' },
  { code: 'HR', name: 'HR & Admin' },
  { code: 'PAY', name: 'Payroll Operations' },
  { code: 'OPS', name: 'Project Operations' },
  { code: 'IT', name: 'IT & Systems' },
  { code: 'LEGAL', name: 'Legal & Documentation' },
  { code: 'ENG', name: 'Engineering & Site Supervision' },
  { code: 'MGMT', name: 'Management & Support' },
  { code: 'MKTG', name: 'Marketing & Communications' },
];

// ── Employee department distribution ──────────────────────────────────

export const DEPARTMENT_EMPLOYEE_COUNTS = {
  FIN: 8, SALES: 15, HR: 5, PAY: 3, OPS: 20, IT: 4, LEGAL: 5, ENG: 15, MGMT: 7, MKTG: 13,
};

// ── Account classes ────────────────────────────────────────────────────

export const ACCOUNT_CLASS_SPECS = [
  { code: 'ASSET', name: 'Asset', naturalBalance: 'DEBIT', sortOrder: 1 },
  { code: 'LIABILITY', name: 'Liability', naturalBalance: 'CREDIT', sortOrder: 2 },
  { code: 'EQUITY', name: 'Equity', naturalBalance: 'CREDIT', sortOrder: 3 },
  { code: 'REVENUE', name: 'Revenue', naturalBalance: 'CREDIT', sortOrder: 4 },
  { code: 'EXPENSE', name: 'Expense', naturalBalance: 'DEBIT', sortOrder: 5 },
];

// ── Account groups ────────────────────────────────────────────────────

export const ACCOUNT_GROUP_SPECS = [
  { code: 'AST-CUR', name: 'Current Assets', classCode: 'ASSET' },
  { code: 'AST-PROP', name: 'Project Property Assets', classCode: 'ASSET' },
  { code: 'AST-BANK', name: 'Bank and Cash', classCode: 'ASSET' },
  { code: 'LIA-CUR', name: 'Current Liabilities', classCode: 'LIABILITY' },
  { code: 'LIA-ADV', name: 'Customer Advances Received', classCode: 'LIABILITY' },
  { code: 'LIA-PAY', name: 'Payables', classCode: 'LIABILITY' },
  { code: 'EQTY-CAP', name: 'Owner Equity and Capital', classCode: 'EQUITY' },
  { code: 'EQTY-RET', name: 'Retained Earnings', classCode: 'EQUITY' },
  { code: 'REV-SALES', name: 'Property Sales Revenue', classCode: 'REVENUE' },
  { code: 'REV-BOOKING', name: 'Booking and Service Fee Revenue', classCode: 'REVENUE' },
  { code: 'REV-SUITE', name: 'Suite and Hospitality Revenue', classCode: 'REVENUE' },
  { code: 'REV-OTHER', name: 'Other Operating Revenue', classCode: 'REVENUE' },
  { code: 'EXP-OPEX', name: 'Operating Expenses', classCode: 'EXPENSE' },
  { code: 'EXP-LAND', name: 'Land Acquisition Costs', classCode: 'EXPENSE' },
  { code: 'EXP-CONSTR', name: 'Construction and Development Costs', classCode: 'EXPENSE' },
  { code: 'EXP-MKTG', name: 'Marketing and Sales Expenses', classCode: 'EXPENSE' },
  { code: 'EXP-PAYROLL', name: 'Payroll and Staff Expenses', classCode: 'EXPENSE' },
  { code: 'EXP-OFFICE', name: 'Office and Administrative Expenses', classCode: 'EXPENSE' },
  { code: 'EXP-LEGAL', name: 'Legal and Documentation Expenses', classCode: 'EXPENSE' },
  { code: 'EXP-MAINT', name: 'Maintenance and Logistics', classCode: 'EXPENSE' },
];

// ── Ledger accounts ────────────────────────────────────────────────────

export const LEDGER_ACCOUNT_SPECS = [
  { code: 'AST-CUR-INV', name: 'Inventory and Prepayments', groupCode: 'AST-CUR' },
  { code: 'AST-CUR-REC', name: 'Receivables', groupCode: 'AST-CUR' },
  { code: 'AST-PROP-WIP', name: 'Property Work in Progress', groupCode: 'AST-PROP' },
  { code: 'AST-PROP-FIN', name: 'Completed Property Inventory', groupCode: 'AST-PROP' },
  { code: 'AST-BANK-ACCTS', name: 'Bank Accounts', groupCode: 'AST-BANK' },
  { code: 'AST-BANK-CASH', name: 'Cash on Hand', groupCode: 'AST-BANK' },
  { code: 'LIA-CUR-TAX', name: 'Tax Payables', groupCode: 'LIA-CUR' },
  { code: 'LIA-CUR-ACC', name: 'Accrued Expenses', groupCode: 'LIA-CUR' },
  { code: 'LIA-ADV-CUST', name: 'Customer Deposit Advances', groupCode: 'LIA-ADV' },
  { code: 'LIA-PAY-VEND', name: 'Vendor Payables', groupCode: 'LIA-PAY' },
  { code: 'LIA-PAY-SAL', name: 'Salary Payables', groupCode: 'LIA-PAY' },
  { code: 'EQTY-CAP-OWN', name: 'Owner Capital Account', groupCode: 'EQTY-CAP' },
  { code: 'EQTY-RET-EAR', name: 'Accumulated Retained Earnings', groupCode: 'EQTY-RET' },
  { code: 'REV-SALES-PL', name: 'Plot Sales Revenue', groupCode: 'REV-SALES' },
  { code: 'REV-SALES-APT', name: 'Apartment Sales Revenue', groupCode: 'REV-SALES' },
  { code: 'REV-SALES-SUITE', name: 'Suite Sales Revenue', groupCode: 'REV-SALES' },
  { code: 'REV-BOOKING-FEE', name: 'Booking Fees', groupCode: 'REV-BOOKING' },
  { code: 'REV-SUITE-OPS', name: 'Suite Operations Revenue', groupCode: 'REV-SUITE' },
  { code: 'REV-OTHER-MISC', name: 'Miscellaneous Revenue', groupCode: 'REV-OTHER' },
  { code: 'EXP-OPEX-GEN', name: 'General Operating Expenses', groupCode: 'EXP-OPEX' },
  { code: 'EXP-LAND-ACQ', name: 'Land Acquisition', groupCode: 'EXP-LAND' },
  { code: 'EXP-CONSTR-DEV', name: 'Construction Development', groupCode: 'EXP-CONSTR' },
  { code: 'EXP-CONSTR-MAT', name: 'Construction Materials', groupCode: 'EXP-CONSTR' },
  { code: 'EXP-MKTG-CAMP', name: 'Marketing Campaigns', groupCode: 'EXP-MKTG' },
  { code: 'EXP-PAYROLL-GROSS', name: 'Gross Salary Expense', groupCode: 'EXP-PAYROLL' },
  { code: 'EXP-PAYROLL-DED', name: 'Payroll Deductions Expense', groupCode: 'EXP-PAYROLL' },
  { code: 'EXP-OFFICE-RENT', name: 'Office Rent and Utilities', groupCode: 'EXP-OFFICE' },
  { code: 'EXP-LEGAL-REG', name: 'Registration and Legal Fees', groupCode: 'EXP-LEGAL' },
  { code: 'EXP-MAINT-LOG', name: 'Maintenance and Logistics', groupCode: 'EXP-MAINT' },
  { code: 'EXP-OPEX-SURV', name: 'Survey and Design Consultancy', groupCode: 'EXP-OPEX' },
];

// ── Particular accounts ────────────────────────────────────────────────

export const PARTICULAR_ACCOUNT_SPECS = [
  { code: 'AST-CUR-INV-01', name: 'Property Prepayments', ledgerCode: 'AST-CUR-INV' },
  { code: 'AST-CUR-REC-01', name: 'Customer Receivables', ledgerCode: 'AST-CUR-REC' },
  { code: 'AST-CUR-REC-02', name: 'Staff Advance Receivables', ledgerCode: 'AST-CUR-REC' },
  { code: 'AST-PROP-WIP-01', name: 'Maya Kanon WIP', ledgerCode: 'AST-PROP-WIP' },
  { code: 'AST-PROP-WIP-02', name: 'Rivery Village WIP', ledgerCode: 'AST-PROP-WIP' },
  { code: 'AST-PROP-WIP-03', name: 'South Valley WIP', ledgerCode: 'AST-PROP-WIP' },
  { code: 'AST-PROP-FIN-01', name: 'Completed Apartment Inventory', ledgerCode: 'AST-PROP-FIN' },
  { code: 'AST-BANK-01', name: 'Prime Bank Operating Account', ledgerCode: 'AST-BANK-ACCTS' },
  { code: 'AST-BANK-02', name: 'City Bank Savings Account', ledgerCode: 'AST-BANK-ACCTS' },
  { code: 'AST-BANK-03', name: 'Dutch Bangla Bank Account', ledgerCode: 'AST-BANK-ACCTS' },
  { code: 'AST-BANK-CASH-01', name: 'Petty Cash Fund', ledgerCode: 'AST-BANK-CASH' },
  { code: 'LIA-CUR-TAX-01', name: 'VAT Payable', ledgerCode: 'LIA-CUR-TAX' },
  { code: 'LIA-CUR-TAX-02', name: 'Income Tax Payable', ledgerCode: 'LIA-CUR-TAX' },
  { code: 'LIA-CUR-ACC-01', name: 'Accrued Utilities', ledgerCode: 'LIA-CUR-ACC' },
  { code: 'LIA-CUR-ACC-02', name: 'Accrued Consultant Fees', ledgerCode: 'LIA-CUR-ACC' },
  { code: 'LIA-ADV-CUST-01', name: 'Booking Deposit Advances', ledgerCode: 'LIA-ADV-CUST' },
  { code: 'LIA-ADV-CUST-02', name: 'Installment Advances', ledgerCode: 'LIA-ADV-CUST' },
  { code: 'LIA-PAY-VEND-01', name: 'Contractor Payables', ledgerCode: 'LIA-PAY-VEND' },
  { code: 'LIA-PAY-VEND-02', name: 'Material Supplier Payables', ledgerCode: 'LIA-PAY-VEND' },
  { code: 'LIA-PAY-SAL-01', name: 'Salary Dues Payable', ledgerCode: 'LIA-PAY-SAL' },
  { code: 'LIA-PAY-SAL-02', name: 'PF Deduction Payable', ledgerCode: 'LIA-PAY-SAL' },
  { code: 'EQTY-CAP-01', name: 'Initial Capital Contribution', ledgerCode: 'EQTY-CAP-OWN' },
  { code: 'EQTY-CAP-02', name: 'Additional Capital Investment', ledgerCode: 'EQTY-CAP-OWN' },
  { code: 'EQTY-RET-01', name: 'Retained Earnings Balance', ledgerCode: 'EQTY-RET-EAR' },
  { code: 'REV-SALES-PL-01', name: 'Residential Plot Sales', ledgerCode: 'REV-SALES-PL' },
  { code: 'REV-SALES-PL-02', name: 'Commercial Plot Sales', ledgerCode: 'REV-SALES-PL' },
  { code: 'REV-SALES-APT-01', name: 'Apartment Unit Sales', ledgerCode: 'REV-SALES-APT' },
  { code: 'REV-SALES-APT-02', name: 'Duplex Unit Sales', ledgerCode: 'REV-SALES-APT' },
  { code: 'REV-SALES-SUITE-01', name: 'Suite Sales and Bookings', ledgerCode: 'REV-SALES-SUITE' },
  { code: 'REV-BOOKING-FEE-01', name: 'Booking Application Fees', ledgerCode: 'REV-BOOKING-FEE' },
  { code: 'REV-SUITE-OPS-01', name: 'Hospitality Service Revenue', ledgerCode: 'REV-SUITE-OPS' },
  { code: 'REV-OTHER-MISC-01', name: 'Transfer Fee Revenue', ledgerCode: 'REV-OTHER-MISC' },
  { code: 'REV-OTHER-MISC-02', name: 'Penalty and Late Fee Revenue', ledgerCode: 'REV-OTHER-MISC' },
  { code: 'EXP-OPEX-GEN-01', name: 'General Administration Expense', ledgerCode: 'EXP-OPEX-GEN' },
  { code: 'EXP-OPEX-GEN-02', name: 'IT Infrastructure Expense', ledgerCode: 'EXP-OPEX-GEN' },
  { code: 'EXP-OPEX-SURV-01', name: 'Survey and Design Fees', ledgerCode: 'EXP-OPEX-SURV' },
  { code: 'EXP-OPEX-SURV-02', name: 'Consultancy Fees', ledgerCode: 'EXP-OPEX-SURV' },
  { code: 'EXP-LAND-ACQ-01', name: 'Land Purchase Payments', ledgerCode: 'EXP-LAND-ACQ' },
  { code: 'EXP-LAND-ACQ-02', name: 'Land Registration Costs', ledgerCode: 'EXP-LAND-ACQ' },
  { code: 'EXP-CONSTR-DEV-01', name: 'Contractor Development Payments', ledgerCode: 'EXP-CONSTR-DEV' },
  { code: 'EXP-CONSTR-DEV-02', name: 'Site Infrastructure Costs', ledgerCode: 'EXP-CONSTR-DEV' },
  { code: 'EXP-CONSTR-MAT-01', name: 'Steel and Cement Purchases', ledgerCode: 'EXP-CONSTR-MAT' },
  { code: 'EXP-CONSTR-MAT-02', name: 'Finishing Material Purchases', ledgerCode: 'EXP-CONSTR-MAT' },
  { code: 'EXP-MKTG-CAMP-01', name: 'Digital Marketing Expenses', ledgerCode: 'EXP-MKTG-CAMP' },
  { code: 'EXP-MKTG-CAMP-02', name: 'Print and Outdoor Advertising', ledgerCode: 'EXP-MKTG-CAMP' },
  { code: 'EXP-PAYROLL-GROSS-01', name: 'Executive Salary Expense', ledgerCode: 'EXP-PAYROLL-GROSS' },
  { code: 'EXP-PAYROLL-GROSS-02', name: 'Office Staff Salary Expense', ledgerCode: 'EXP-PAYROLL-GROSS' },
  { code: 'EXP-PAYROLL-GROSS-03', name: 'Field Staff Salary Expense', ledgerCode: 'EXP-PAYROLL-GROSS' },
  { code: 'EXP-PAYROLL-DED-01', name: 'Provident Fund Deductions', ledgerCode: 'EXP-PAYROLL-DED' },
  { code: 'EXP-OFFICE-RENT-01', name: 'Office Rent Expense', ledgerCode: 'EXP-OFFICE-RENT' },
  { code: 'EXP-OFFICE-RENT-02', name: 'Utilities and Internet', ledgerCode: 'EXP-OFFICE-RENT' },
  { code: 'EXP-LEGAL-REG-01', name: 'Property Registration Fees', ledgerCode: 'EXP-LEGAL-REG' },
  { code: 'EXP-LEGAL-REG-02', name: 'Legal Consultation Fees', ledgerCode: 'EXP-LEGAL-REG' },
  { code: 'EXP-MAINT-LOG-01', name: 'Vehicle and Transport Costs', ledgerCode: 'EXP-MAINT-LOG' },
  { code: 'EXP-MAINT-LOG-02', name: 'Site Maintenance Expenses', ledgerCode: 'EXP-MAINT-LOG' },
];

// ── Unit type specifications ──────────────────────────────────────────

export const UNIT_TYPE_SPECS = [
  { code: 'PLOT', name: 'Plot / Land' },
  { code: 'APT', name: 'Apartment' },
  { code: 'COMM', name: 'Commercial' },
  { code: 'SHARE', name: 'Share Ownership' },
  { code: 'DUPLEX', name: 'Duplex' },
  { code: 'TRIPLEX', name: 'Triplex' },
  { code: 'STD-DELUXE', name: 'Standard Deluxe Suite' },
  { code: 'DELUXE-SUITE', name: 'Deluxe Suite' },
  { code: 'EXEC-SUITE', name: 'Executive Suite' },
  { code: 'PRES-SUITE', name: 'President Suite' },
];

// ── Project specifications ────────────────────────────────────────────

export const PROJECT_SPECS = [
  { code: 'RC-MAYA', name: 'RC Maya Kanon', locationCode: 'RCG-SITE-MAYA', location: 'Keraniganj, Dhaka', typeFocus: 'residential', unitCount: 200, unitTypeCodes: ['PLOT', 'APT'] },
  { code: 'RC-RIVERY', name: 'RC Rivery Village', locationCode: 'RCG-SITE-RIVERY', location: 'Rupganj, Narayanganj', typeFocus: 'residential', unitCount: 150, unitTypeCodes: ['PLOT'] },
  { code: 'RC-PRIYOJAN', name: 'RC Priyojan Grihayan Prokolpo', locationCode: 'RCG-SITE-MAYA', location: 'Keraniganj, Dhaka', typeFocus: 'share', unitCount: 60, unitTypeCodes: ['SHARE'] },
  { code: 'RC-SOUTH-VALLEY', name: 'RC South Valley', locationCode: 'RCG-SITE-VALLEY', location: 'Sreenagar, Munshiganj', typeFocus: 'residential', unitCount: 70, unitTypeCodes: ['PLOT'] },
  { code: 'RC-MAYA-ECO', name: 'RC Maya Kanon Eco Village', locationCode: 'RCG-SITE-ECO', location: 'Keraniganj, Dhaka', typeFocus: 'eco', unitCount: 50, unitTypeCodes: ['PLOT', 'DUPLEX'] },
  { code: 'RC-BONDHUJON', name: 'RC Bondhujon Abashon', locationCode: 'RCG-SITE-MAYA', location: 'Keraniganj/Rupganj', typeFocus: 'group', unitCount: 40, unitTypeCodes: ['SHARE'] },
  { code: 'RC-OCEAN-BLISS', name: 'RC Ocean Bliss', locationCode: 'RCG-SITE-OCEAN', location: 'Kuakata, Patuakhali', typeFocus: 'hospitality', unitCount: 30, unitTypeCodes: ['STD-DELUXE', 'DELUXE-SUITE', 'EXEC-SUITE', 'PRES-SUITE'] },
  { code: 'RC-DAIRA-NOOR', name: 'RC Daira Noor', locationCode: 'RCG-SITE-DAIRA', location: 'Azimpur, Dhaka', typeFocus: 'apartment', unitCount: 40, unitTypeCodes: ['APT'] },
  { code: 'RC-SHANTI-KUTHIR', name: 'RC Shanti Kuthir', locationCode: 'RCG-SITE-KHULNA', location: 'Khulna', typeFocus: 'apartment', unitCount: 50, unitTypeCodes: ['APT'] },
  { code: 'RC-DALIM-TOWER', name: 'RC Dalim Tower', locationCode: 'RCG-SITE-KHULNA', location: 'Khulna', typeFocus: 'mixed', unitCount: 40, unitTypeCodes: ['APT', 'COMM'] },
  { code: 'RC-TULIP', name: 'RC Tulip', locationCode: 'RCG-SALES-DHK', location: 'Badda/Gulshan, Dhaka', typeFocus: 'apartment', unitCount: 60, unitTypeCodes: ['APT'] },
  { code: 'RC-NURJAHAN', name: 'RC Nurjahan Kunjo', locationCode: 'RCG-SITE-SAVAR', location: 'Savar, Dhaka', typeFocus: 'apartment', unitCount: 50, unitTypeCodes: ['APT'] },
  { code: 'RC-RAINBOW', name: 'RC Rainbow', locationCode: 'RCG-SITE-KHULNA', location: 'Sonadanga, Khulna', typeFocus: 'apartment', unitCount: 50, unitTypeCodes: ['APT'] },
];

// ── Unit status specifications (system-seeded, not created by realistic seed) ──

export const UNIT_STATUS_CODES = ['AVAILABLE', 'BOOKED', 'SOLD', 'ALLOTTED', 'TRANSFERRED', 'CANCELLED'];

export const PROJECT_UNIT_STATUS_MIX = {
  'RC-MAYA': { AVAILABLE: 0.60, BOOKED: 0.15, SOLD: 0.10, ALLOTTED: 0.08, TRANSFERRED: 0.05, CANCELLED: 0.02 },
  'RC-RIVERY': { AVAILABLE: 0.55, BOOKED: 0.20, SOLD: 0.12, ALLOTTED: 0.08, CANCELLED: 0.03, TRANSFERRED: 0.02 },
  'RC-PRIYOJAN': { AVAILABLE: 0.40, SOLD: 0.20, ALLOTTED: 0.30, CANCELLED: 0.10 },
  'RC-SOUTH-VALLEY': { AVAILABLE: 0.65, BOOKED: 0.10, SOLD: 0.10, ALLOTTED: 0.10, CANCELLED: 0.05 },
  'RC-MAYA-ECO': { AVAILABLE: 0.50, BOOKED: 0.20, SOLD: 0.15, ALLOTTED: 0.10, TRANSFERRED: 0.05 },
  'RC-BONDHUJON': { AVAILABLE: 0.45, SOLD: 0.20, ALLOTTED: 0.25, TRANSFERRED: 0.10 },
  'RC-OCEAN-BLISS': { AVAILABLE: 0.40, BOOKED: 0.20, SOLD: 0.15, ALLOTTED: 0.20, CANCELLED: 0.05 },
  'RC-DAIRA-NOOR': { AVAILABLE: 0.30, SOLD: 0.30, ALLOTTED: 0.25, TRANSFERRED: 0.15 },
  'RC-SHANTI-KUTHIR': { AVAILABLE: 0.50, BOOKED: 0.15, SOLD: 0.20, ALLOTTED: 0.10, CANCELLED: 0.05 },
  'RC-DALIM-TOWER': { AVAILABLE: 0.45, BOOKED: 0.15, SOLD: 0.20, ALLOTTED: 0.15, CANCELLED: 0.05 },
  'RC-TULIP': { AVAILABLE: 0.55, BOOKED: 0.15, SOLD: 0.15, ALLOTTED: 0.10, CANCELLED: 0.05 },
  'RC-NURJAHAN': { AVAILABLE: 0.60, BOOKED: 0.10, SOLD: 0.15, ALLOTTED: 0.10, CANCELLED: 0.05 },
  'RC-RAINBOW': { AVAILABLE: 0.50, BOOKED: 0.15, SOLD: 0.20, ALLOTTED: 0.10, CANCELLED: 0.05 },
};

// ── Salary structure specifications ────────────────────────────────────

export const SALARY_STRUCTURE_SPECS = [
  { code: 'SAL-EXEC', name: 'Executive Salary Structure', basic: 120000, allowance: 35000, deduction: 15000, net: 140000 },
  { code: 'SAL-MGMT', name: 'Management Salary Structure', basic: 85000, allowance: 25000, deduction: 12000, net: 98000 },
  { code: 'SAL-FIN', name: 'Finance Salary Structure', basic: 55000, allowance: 15000, deduction: 6000, net: 64000 },
  { code: 'SAL-SALES', name: 'Sales Salary Structure', basic: 45000, allowance: 12000, deduction: 5000, net: 52000 },
  { code: 'SAL-ENG', name: 'Engineering Salary Structure', basic: 40000, allowance: 10000, deduction: 4000, net: 46000 },
  { code: 'SAL-SITE', name: 'Site Operations Salary Structure', basic: 28000, allowance: 7000, deduction: 3000, net: 32000 },
  { code: 'SAL-IT', name: 'IT Salary Structure', basic: 50000, allowance: 12000, deduction: 5000, net: 57000 },
  { code: 'SAL-SUPPORT', name: 'Support Salary Structure', basic: 22000, allowance: 5000, deduction: 2000, net: 25000 },
];

export const DEPARTMENT_SALARY_MAP = {
  FIN: 'SAL-FIN', SALES: 'SAL-SALES', HR: 'SAL-MGMT', PAY: 'SAL-FIN',
  OPS: 'SAL-SITE', IT: 'SAL-IT', LEGAL: 'SAL-MGMT', ENG: 'SAL-ENG',
  MGMT: 'SAL-EXEC', MKTG: 'SAL-SALES',
};

// ── Leave type specifications ──────────────────────────────────────────

export const LEAVE_TYPE_SPECS = [
  { code: 'ANNUAL', name: 'Annual Leave', description: 'Standard annual earned leave' },
  { code: 'SICK', name: 'Sick Leave', description: 'Medical leave with documentation' },
  { code: 'CASUAL', name: 'Casual Leave', description: 'Short-notice personal leave' },
  { code: 'UNPAID', name: 'Unpaid Leave', description: 'Leave without pay' },
  { code: 'FIELD', name: 'Field Duty Leave', description: 'On-site/field assignment leave' },
  { code: 'MATERNITY', name: 'Maternity Leave', description: 'Statutory maternity leave' },
];

// ── Attendance device specifications ──────────────────────────────────

export const ATTENDANCE_DEVICE_SPECS = [
  { code: 'DEV-CORP', name: 'Corporate HQ Biometric', locationCode: 'RCG-CORP-DHK' },
  { code: 'DEV-MAYA', name: 'Maya Kanon Site Biometric', locationCode: 'RCG-SITE-MAYA' },
  { code: 'DEV-RIVERY', name: 'Rivery Village Site Biometric', locationCode: 'RCG-SITE-RIVERY' },
  { code: 'DEV-KHULNA', name: 'Khulna Office Biometric', locationCode: 'RCG-SITE-KHULNA' },
  { code: 'DEV-SALES', name: 'Sales Office Biometric', locationCode: 'RCG-SALES-DHK' },
];

// ── Cost center specifications ────────────────────────────────────────

export const COST_CENTER_SPECS = [
  { code: 'CC-CORP', name: 'Corporate Operations', projectCode: null },
  { code: 'CC-MAYA', name: 'Maya Kanon Operations', projectCode: 'RC-MAYA' },
  { code: 'CC-RIVERY', name: 'Rivery Village Operations', projectCode: 'RC-RIVERY' },
  { code: 'CC-PRIYOJAN', name: 'Priyojan Operations', projectCode: 'RC-PRIYOJAN' },
  { code: 'CC-VALLEY', name: 'South Valley Operations', projectCode: 'RC-SOUTH-VALLEY' },
  { code: 'CC-ECO', name: 'Eco Village Operations', projectCode: 'RC-MAYA-ECO' },
  { code: 'CC-BONDHUJON', name: 'Bondhujon Operations', projectCode: 'RC-BONDHUJON' },
  { code: 'CC-OCEAN', name: 'Ocean Bliss Operations', projectCode: 'RC-OCEAN-BLISS' },
  { code: 'CC-DAIRA', name: 'Daira Noor Operations', projectCode: 'RC-DAIRA-NOOR' },
  { code: 'CC-SHANTI', name: 'Shanti Kuthir Operations', projectCode: 'RC-SHANTI-KUTHIR' },
  { code: 'CC-DALIM', name: 'Dalim Tower Operations', projectCode: 'RC-DALIM-TOWER' },
];

// ── BDT financial ranges ──────────────────────────────────────────────

export const BDT_RANGES = {
  plotBookingDeposit: { min: 50000, max: 500000 },
  apartmentBookingDeposit: { min: 100000, max: 1000000 },
  suiteBookingDeposit: { min: 200000, max: 800000 },
  plotContractTotal: { min: 1500000, max: 50000000 },
  apartmentContractTotal: { min: 2000000, max: 20000000 },
  suiteContractTotal: { min: 3000000, max: 15000000 },
  shareContractTotal: { min: 500000, max: 5000000 },
  installmentAmount: { min: 50000, max: 5000000 },
  collectionAmount: { min: 20000, max: 10000000 },
  openingBankBalance: 100000000,
  landAcquisitionPayment: { min: 5000000, max: 15000000 },
  contractorPayment: { min: 500000, max: 4000000 },
  constructionMaterial: { min: 200000, max: 1500000 },
  marketingExpense: { min: 100000, max: 800000 },
  officeRentUtilities: { min: 50000, max: 300000 },
  registrationLegal: { min: 50000, max: 500000 },
  maintenanceLogistics: { min: 30000, max: 200000 },
};

// ── Voucher type distribution ──────────────────────────────────────────

export const VOUCHER_TYPE_COUNTS = {
  RECEIPT: 1500,
  PAYMENT: 1200,
  JOURNAL: 600,
  CONTRA: 200,
};

export const VOUCHER_STATUS_MIX = { POSTED: 0.95, DRAFT: 0.05 };

// ── Payroll run specifications ────────────────────────────────────────

export const PAYROLL_RUN_SPEC = {
  totalRuns: 46,
  postedCount: 34,
  finalizedCount: 8,
  draftCount: 4,
};

// ── Monthly voucher volume targets ────────────────────────────────────

export const MONTHLY_VOUCHER_TARGETS = {
  2022: { avg: 40, range: 20 },
  2023: { avg: 65, range: 25 },
  2024: { avg: 80, range: 30 },
  2025: { avg: 95, range: 35 },
  2026: { avg: 100, range: 30 },
};

// ── Lead source distribution ──────────────────────────────────────────

export const LEAD_SOURCE_DISTRIBUTION = {
  'Website enquiry': 0.35,
  'Sales office visit': 0.25,
  'Referral': 0.15,
  'Social campaign': 0.10,
  'Walk-in': 0.10,
  'Broker': 0.05,
};

export const LEAD_STATUS_DISTRIBUTION = {
  NEW: 0.25, CONTACTED: 0.30, QUALIFIED: 0.25, CLOSED: 0.20,
};

// ── Booking status distribution ────────────────────────────────────────

export const BOOKING_STATUS_DISTRIBUTION = {
  ACTIVE: 0.60, CONTRACTED: 0.40,
};

// ── Leave request status distribution ────────────────────────────────

export const LEAVE_REQUEST_STATUS_DISTRIBUTION = {
  APPROVED: 0.35, SUBMITTED: 0.25, DRAFT: 0.15, REJECTED: 0.15, CANCELLED: 0.10,
};

export const LEAVE_TYPE_USAGE_DISTRIBUTION = {
  ANNUAL: 0.40, CASUAL: 0.25, SICK: 0.20, FIELD: 0.10, UNPAID: 0.03, MATERNITY: 0.02,
};

// ── Customer temporal distribution ────────────────────────────────────

export const CUSTOMER_YEAR_DISTRIBUTION = {
  2022: 0.20, 2023: 0.25, 2024: 0.20, 2025: 0.20, 2026: 0.15,
};

// ── Contamination patterns ────────────────────────────────────────────

export const CONTAMINATION_PATTERNS = [
  'demo', 'demouat', 'synth', 'synthetic', 'test', 'sample',
  'mock', 'seed', 'uat', 'placeholder', 'fake', 'example',
];

// ── Voucher reference prefixes ────────────────────────────────────────

export const VOUCHER_REF_PREFIXES = {
  RECEIPT: 'RCT',
  PAYMENT: 'PAY',
  JOURNAL: 'JRN',
  CONTRA: 'CTR',
};

export const COLLECTION_REF_PREFIX = 'COL';
