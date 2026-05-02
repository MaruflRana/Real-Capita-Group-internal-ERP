import { existsSync, readFileSync } from 'node:fs';
import process from 'node:process';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { forwardedArgs, relativeToRoot, workspaceRoot } from './ops.mjs';

export const DEMO_MARKER = 'SYNTH-DEMO-UAT';
export const DEMO_COMPANY_NAME = 'Real Capita Demo / UAT';
export const DEMO_COMPANY_SLUG = 'real-capita-demo-uat';
export const DEMO_EMAIL_DOMAIN = 'demo.realcapita.test';
export const DEMO_PASSWORD = 'change-me-demo-uat-password';

const ENVIRONMENT_FILE_PATHS = [
  'apps/api/.env.local',
  'apps/api/.env',
  '.env.local',
  '.env',
];

const DEMO_USER_SPECS = [
  {
    email: `demo.admin@${DEMO_EMAIL_DOMAIN}`,
    firstName: 'DEMO Admin',
    lastName: 'Synthetic',
    roles: ['company_admin'],
  },
  {
    email: `demo.accountant@${DEMO_EMAIL_DOMAIN}`,
    firstName: 'DEMO Accountant',
    lastName: 'Synthetic',
    roles: ['company_accountant'],
  },
  {
    email: `demo.hr@${DEMO_EMAIL_DOMAIN}`,
    firstName: 'DEMO HR',
    lastName: 'Synthetic',
    roles: ['company_hr'],
  },
  {
    email: `demo.payroll@${DEMO_EMAIL_DOMAIN}`,
    firstName: 'DEMO Payroll',
    lastName: 'Synthetic',
    roles: ['company_payroll'],
  },
  {
    email: `demo.sales@${DEMO_EMAIL_DOMAIN}`,
    firstName: 'DEMO Sales',
    lastName: 'Synthetic',
    roles: ['company_sales'],
  },
  {
    email: `demo.member@${DEMO_EMAIL_DOMAIN}`,
    firstName: 'DEMO Member',
    lastName: 'Synthetic',
    roles: ['company_member'],
  },
];

const ROLE_DEFINITIONS = [
  {
    code: 'company_admin',
    name: 'Company Administrator',
    description: 'Full administrative access within the selected company scope.',
  },
  {
    code: 'company_accountant',
    name: 'Company Accountant',
    description:
      'Accounting administration access for chart-of-accounts and voucher operations within the selected company scope.',
  },
  {
    code: 'company_hr',
    name: 'Company HR',
    description:
      'HR administration access for employees, attendance, leave types, and leave requests within the selected company scope.',
  },
  {
    code: 'company_payroll',
    name: 'Company Payroll',
    description:
      'Payroll administration access for salary structures, payroll runs, payroll lines, and payroll posting within the selected company scope.',
  },
  {
    code: 'company_member',
    name: 'Company Member',
    description: 'Baseline authenticated access within the selected company scope.',
  },
  {
    code: 'company_sales',
    name: 'Company Sales',
    description:
      'CRM and property desk access for customers, leads, bookings, contracts, schedules, and collections within the selected company scope.',
  },
];

const TRIGGER_RESET_TABLES = ['voucher_lines', 'vouchers', 'payroll_run_lines'];

const SEED_USAGE = `Usage: corepack pnpm seed:demo [-- --dry-run] [-- --reset-first]

Creates explicit synthetic demo/UAT data in the "${DEMO_COMPANY_NAME}" company.

Options:
  --dry-run                         Print the seed plan without connecting to the database
  --reset-first                     Run the guarded demo reset before seeding
  --confirm-production-demo-data    Required if NODE_ENV=production
  -h, --help                        Show this help text
`;

const RESET_USAGE = `Usage: corepack pnpm seed:demo:reset [-- --dry-run]

Deletes only guarded synthetic demo/UAT data for the "${DEMO_COMPANY_NAME}" company.

Options:
  --dry-run                         Print planned deletion counts without deleting data
  --confirm-production-demo-data    Required if NODE_ENV=production
  -h, --help                        Show this help text
`;

const VERIFY_USAGE = `Usage: corepack pnpm seed:demo:verify

Verifies the synthetic demo/UAT company, access, module counts, report-ready accounting data,
and reset markers.

Options:
  --confirm-production-demo-data    Required if NODE_ENV=production
  -h, --help                        Show this help text
`;

const parseEnvironmentFile = (filePath) => {
  const entries = {};
  const fileContent = readFileSync(filePath, 'utf8');

  for (const line of fileContent.split(/\r?\n/u)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    let value = trimmedLine.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    entries[key] = value;
  }

  return entries;
};

const loadEnvironmentFiles = () => {
  const externallyDefinedKeys = new Set(Object.keys(process.env));
  const loadedFiles = [];

  for (const filePath of [...ENVIRONMENT_FILE_PATHS].reverse()) {
    const absoluteFilePath = resolve(workspaceRoot, filePath);

    if (!existsSync(absoluteFilePath)) {
      continue;
    }

    const parsedEntries = parseEnvironmentFile(absoluteFilePath);

    for (const [key, value] of Object.entries(parsedEntries)) {
      if (externallyDefinedKeys.has(key)) {
        continue;
      }

      process.env[key] = value;
    }

    loadedFiles.push(relativeToRoot(absoluteFilePath));
  }

  return loadedFiles;
};

const parseCommonArguments = (usage, options = {}) => {
  const { values } = parseArgs({
    args: forwardedArgs(),
    options: {
      'dry-run': {
        type: 'boolean',
      },
      'reset-first': {
        type: 'boolean',
      },
      'confirm-production-demo-data': {
        type: 'boolean',
      },
      help: {
        type: 'boolean',
        short: 'h',
      },
    },
    allowPositionals: false,
  });

  if (values.help) {
    console.log(usage);
    process.exit(0);
  }

  if (!options.allowResetFirst && values['reset-first']) {
    throw new Error('--reset-first is only supported by seed:demo.');
  }

  return {
    dryRun: values['dry-run'] ?? false,
    resetFirst: values['reset-first'] ?? false,
    confirmProductionDemoData:
      values['confirm-production-demo-data'] ?? false,
  };
};

const assertDatabaseEnvironment = (options) => {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error(
      'DATABASE_URL is required. Copy .env.example to .env or provide DATABASE_URL explicitly.',
    );
  }

  if (
    process.env.NODE_ENV === 'production' &&
    !options.confirmProductionDemoData
  ) {
    throw new Error(
      'Refusing synthetic demo/UAT data command in NODE_ENV=production without --confirm-production-demo-data.',
    );
  }
};

const createPrismaClient = async () => {
  const { PrismaClient } = await import('@prisma/client');
  return new PrismaClient();
};

const dateOnly = (value) => new Date(`${value}T00:00:00.000Z`);

const markerText = (description) => `${DEMO_MARKER}: ${description}`;

const RCG_CONTEXT_NOTE =
  'RCG context-aligned synthetic demo/UAT data; public naming context only';

const ensureRoleDefinitions = async (tx) => {
  const roles = {};

  for (const roleDefinition of ROLE_DEFINITIONS) {
    const role = await tx.role.upsert({
      where: {
        code: roleDefinition.code,
      },
      create: {
        ...roleDefinition,
        isActive: true,
      },
      update: {
        name: roleDefinition.name,
        description: roleDefinition.description,
        isActive: true,
      },
    });

    roles[role.code] = role;
  }

  return roles;
};

const ensureDemoCompany = async (tx) => {
  const existingCompany = await tx.company.findUnique({
    where: {
      slug: DEMO_COMPANY_SLUG,
    },
  });

  if (existingCompany && existingCompany.name !== DEMO_COMPANY_NAME) {
    throw new Error(
      `Company slug ${DEMO_COMPANY_SLUG} already exists with a non-demo name. Refusing to seed into it.`,
    );
  }

  return tx.company.upsert({
    where: {
      slug: DEMO_COMPANY_SLUG,
    },
    create: {
      name: DEMO_COMPANY_NAME,
      slug: DEMO_COMPANY_SLUG,
      isActive: true,
    },
    update: {
      name: DEMO_COMPANY_NAME,
      isActive: true,
    },
  });
};

const ensureDemoUsersAndRoles = async (tx, company, roles, passwordHash) => {
  const users = {};

  for (const userSpec of DEMO_USER_SPECS) {
    const user = await tx.user.upsert({
      where: {
        email: userSpec.email,
      },
      create: {
        email: userSpec.email,
        passwordHash,
        firstName: userSpec.firstName,
        lastName: userSpec.lastName,
        isActive: true,
      },
      update: {
        passwordHash,
        firstName: userSpec.firstName,
        lastName: userSpec.lastName,
        isActive: true,
      },
    });

    users[userSpec.email] = user;

    for (const roleCode of userSpec.roles) {
      await tx.userRole.upsert({
        where: {
          userId_companyId_roleId: {
            userId: user.id,
            companyId: company.id,
            roleId: roles[roleCode].id,
          },
        },
        create: {
          userId: user.id,
          companyId: company.id,
          roleId: roles[roleCode].id,
          isActive: true,
        },
        update: {
          isActive: true,
        },
      });
    }
  }

  return {
    users,
    adminUser: users[`demo.admin@${DEMO_EMAIL_DOMAIN}`],
  };
};

const ensureLocation = async (tx, companyId, input) =>
  tx.location.upsert({
    where: {
      companyId_code: {
        companyId,
        code: input.code,
      },
    },
    create: {
      companyId,
      code: input.code,
      name: input.name,
      description: markerText(input.description),
      isActive: true,
    },
    update: {
      name: input.name,
      description: markerText(input.description),
      isActive: true,
    },
  });

const ensureDepartment = async (tx, companyId, input) =>
  tx.department.upsert({
    where: {
      companyId_code: {
        companyId,
        code: input.code,
      },
    },
    create: {
      companyId,
      code: input.code,
      name: input.name,
      description: markerText(input.description),
      isActive: true,
    },
    update: {
      name: input.name,
      description: markerText(input.description),
      isActive: true,
    },
  });

const seedOrgStructure = async (tx, companyId) => {
  const locations = {};
  const departments = {};

  for (const input of [
    {
      code: 'DEMO-DHK',
      name: 'DEMO Real Capita Group Corporate Office',
      description:
        'synthetic corporate office context for Real Capita Group family walkthroughs',
    },
    {
      code: 'DEMO-SITE',
      name: 'DEMO RC Maya Kanon Site - Keraniganj',
      description:
        'public project-location context: Abdullahpur, Keraniganj near RAJUK Jhilmil and Dhaka-Mawa 300 ft Highway',
    },
    {
      code: 'DEMO-DHK-SALES',
      name: 'DEMO Dhaka Sales Office',
      description:
        'synthetic sales office context for RC Property Development Ltd and RC Holdings Ltd public project enquiries',
    },
    {
      code: 'DEMO-RIVERY',
      name: 'DEMO RC Rivery Village Site - Rupganj',
      description:
        'public project-location context: Rupganj, Narayanganj adjacent to Purbachal 3 No. Sector and near Purbachal Express Highway',
    },
    {
      code: 'DEMO-KUAKATA',
      name: 'DEMO RC Ocean Bliss Site - Kuakata',
      description:
        'public project-location context: Kuakata, Patuakhali hotel and suite walkthrough context',
    },
    {
      code: 'DEMO-AZIMPUR',
      name: 'DEMO RC Daira Noor Site - Azimpur',
      description:
        'public project-location context: Azimpur, Dhaka apartment project walkthrough context',
    },
    {
      code: 'DEMO-KHULNA',
      name: 'DEMO Khulna Apartment Sites',
      description:
        'public project-location context for RC Dalim Tower and RC Rainbow synthetic walkthrough records',
    },
    {
      code: 'DEMO-SAVAR',
      name: 'DEMO RC Nurjahan Kunjo Site - Savar',
      description:
        'public project-location context: Savar, Dhaka apartment project walkthrough context',
    },
  ]) {
    const location = await ensureLocation(tx, companyId, input);
    locations[input.code] = location;
  }

  for (const input of [
    {
      code: 'DEMO-FIN',
      name: 'Accounts & Finance',
      description: 'synthetic ERP finance department for RCG demo walkthroughs',
    },
    {
      code: 'DEMO-SALES',
      name: 'Sales & CRM',
      description:
        'synthetic sales and CRM department for property enquiry and booking walkthroughs',
    },
    {
      code: 'DEMO-HR',
      name: 'HR & Admin',
      description: 'synthetic HR and administration department',
    },
    {
      code: 'DEMO-PAY',
      name: 'Payroll Operations',
      description: 'synthetic payroll operations department',
    },
    {
      code: 'DEMO-OPS',
      name: 'Project Operations',
      description:
        'synthetic project operations department for site, amenities, and infrastructure walkthroughs',
    },
    {
      code: 'DEMO-IT',
      name: 'IT',
      description: 'synthetic IT department for ERP and attendance-device support',
    },
    {
      code: 'DEMO-LEGAL',
      name: 'Legal & Documentation',
      description:
        'synthetic legal and documentation department for booking, allotment, and handover support',
    },
    {
      code: 'DEMO-RCG',
      name: 'RCG Sister Concern Coordination',
      description:
        'public family-name context only: Real Capita Group, RC Property Development Ltd, RC Holdings Ltd, Real Capita Trade International, RC Bay, Afseen Realty, Afseen Construction, ABD Foundation, RESDA',
    },
  ]) {
    const department = await ensureDepartment(tx, companyId, input);
    departments[input.code] = department;
  }

  return {
    locations,
    departments,
  };
};

const seedAccounting = async (tx, companyId, adminUserId) => {
  const accountClasses = Object.fromEntries(
    (
      await tx.accountClass.findMany({
        where: {
          code: {
            in: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'],
          },
        },
      })
    ).map((accountClass) => [accountClass.code, accountClass]),
  );

  for (const code of ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']) {
    if (!accountClasses[code]) {
      throw new Error(`Required account class ${code} is missing.`);
    }
  }

  const groupSpecs = [
    ['currentAssets', 'ASSET', 'DEMO-AST-CUR', 'DEMO RCG Current Assets'],
    ['propertyAssets', 'ASSET', 'DEMO-AST-PROP', 'DEMO RCG Project Assets'],
    ['currentLiabilities', 'LIABILITY', 'DEMO-LIA-CUR', 'DEMO RCG Current Liabilities'],
    ['equity', 'EQUITY', 'DEMO-EQTY', 'DEMO RCG Equity'],
    ['salesRevenue', 'REVENUE', 'DEMO-REV-SALES', 'DEMO RCG Property Sales Revenue'],
    ['operatingExpenses', 'EXPENSE', 'DEMO-EXP-OPEX', 'DEMO RCG Operating Expenses'],
  ];
  const groups = {};

  for (const [key, accountClassCode, code, name] of groupSpecs) {
    groups[key] = await tx.accountGroup.upsert({
      where: {
        companyId_code: {
          companyId,
          code,
        },
      },
      create: {
        companyId,
        accountClassId: accountClasses[accountClassCode].id,
        code,
        name,
        description: markerText(`${name} group`),
        isActive: true,
      },
      update: {
        accountClassId: accountClasses[accountClassCode].id,
        name,
        description: markerText(`${name} group`),
        isActive: true,
      },
    });
  }

  const ledgerSpecs = [
    ['bank', 'currentAssets', 'DEMO-BANK', 'DEMO Bank and Cash'],
    ['receivables', 'currentAssets', 'DEMO-AR', 'DEMO Synthetic Customer Receivables'],
    ['inventory', 'propertyAssets', 'DEMO-WIP', 'DEMO RCG Project Work in Progress'],
    ['customerAdvances', 'currentLiabilities', 'DEMO-ADV', 'DEMO Synthetic Customer Advances'],
    ['payrollPayable', 'currentLiabilities', 'DEMO-PAYABLE', 'DEMO Payroll Payables'],
    ['capital', 'equity', 'DEMO-CAPITAL', 'DEMO Owner Capital'],
    ['unitSales', 'salesRevenue', 'DEMO-UNIT-SALES', 'DEMO Land and Apartment Sales'],
    ['bookingFees', 'salesRevenue', 'DEMO-BOOKING-FEES', 'DEMO Booking and Service Fees'],
    ['suiteSales', 'salesRevenue', 'DEMO-SUITE-SALES', 'DEMO Suite Sales Revenue'],
    ['marketing', 'operatingExpenses', 'DEMO-MKTG', 'DEMO Marketing Expenses'],
    ['siteOperations', 'operatingExpenses', 'DEMO-SITE-OPEX', 'DEMO Site Operations Expenses'],
    ['payrollExpense', 'operatingExpenses', 'DEMO-PAYROLL-EXP', 'DEMO Payroll Expenses'],
    ['officeExpense', 'operatingExpenses', 'DEMO-OFFICE-EXP', 'DEMO Office Expenses'],
    ['legalExpense', 'operatingExpenses', 'DEMO-LEGAL-EXP', 'DEMO Legal and Documentation Expenses'],
  ];
  const ledgers = {};

  for (const [key, groupKey, code, name] of ledgerSpecs) {
    ledgers[key] = await tx.ledgerAccount.upsert({
      where: {
        companyId_code: {
          companyId,
          code,
        },
      },
      create: {
        companyId,
        accountGroupId: groups[groupKey].id,
        code,
        name,
        description: markerText(`${name} ledger`),
        isActive: true,
      },
      update: {
        accountGroupId: groups[groupKey].id,
        name,
        description: markerText(`${name} ledger`),
        isActive: true,
      },
    });
  }

  const particularSpecs = [
    ['bankMain', 'bank', 'DEMO-BANK-MAIN', 'DEMO Main Operating Bank'],
    ['cashHeadOffice', 'bank', 'DEMO-CASH-HO', 'DEMO Head Office Cash'],
    ['customerReceivable', 'receivables', 'DEMO-AR-CUSTOMERS', 'DEMO Synthetic Customer Receivables'],
    ['propertyInventory', 'inventory', 'DEMO-WIP-PROPERTY', 'DEMO RCG Context Project Inventory WIP'],
    ['customerAdvances', 'customerAdvances', 'DEMO-CUST-ADV', 'DEMO Synthetic Customer Advances'],
    ['payrollPayable', 'payrollPayable', 'DEMO-PAYROLL-PAYABLE', 'DEMO Payroll Payable'],
    ['payrollDeductions', 'payrollPayable', 'DEMO-PAYROLL-DEDUCT', 'DEMO Payroll Deductions Payable'],
    ['ownerCapital', 'capital', 'DEMO-OWNER-CAPITAL', 'DEMO Owner Capital'],
    ['unitSalesRevenue', 'unitSales', 'DEMO-UNIT-SALES-REV', 'DEMO RCG Context Unit Sales Revenue'],
    ['bookingFeeRevenue', 'bookingFees', 'DEMO-BOOKING-FEE-REV', 'DEMO Booking Fee Revenue'],
    ['suiteSalesRevenue', 'suiteSales', 'DEMO-SUITE-SALES-REV', 'DEMO Ocean Bliss Suite Sales Revenue'],
    ['marketingExpense', 'marketing', 'DEMO-MARKETING-EXP', 'DEMO Marketing Expense'],
    ['siteOperationsExpense', 'siteOperations', 'DEMO-SITE-OPEX-EXP', 'DEMO Site Operations Expense'],
    ['payrollExpense', 'payrollExpense', 'DEMO-PAYROLL-EXPENSE', 'DEMO Payroll Gross Expense'],
    ['officeExpense', 'officeExpense', 'DEMO-OFFICE-EXPENSE', 'DEMO Office Expense'],
    ['legalExpense', 'legalExpense', 'DEMO-LEGAL-DOC-EXPENSE', 'DEMO Legal Documentation Expense'],
  ];
  const accounts = {};

  for (const [key, ledgerKey, code, name] of particularSpecs) {
    accounts[key] = await tx.particularAccount.upsert({
      where: {
        companyId_code: {
          companyId,
          code,
        },
      },
      create: {
        companyId,
        ledgerAccountId: ledgers[ledgerKey].id,
        code,
        name,
        description: markerText(`${name} posting account`),
        isActive: true,
      },
      update: {
        ledgerAccountId: ledgers[ledgerKey].id,
        name,
        description: markerText(`${name} posting account`),
        isActive: true,
      },
    });
  }

  const ensureVoucher = async (input) => {
    const existingVoucher = await tx.voucher.findFirst({
      where: {
        companyId,
        reference: input.reference,
      },
    });

    if (existingVoucher) {
      return existingVoucher;
    }

    const voucher = await tx.voucher.create({
      data: {
        companyId,
        createdById: adminUserId,
        voucherType: input.voucherType,
        status: 'DRAFT',
        voucherDate: dateOnly(input.voucherDate),
        description: markerText(input.description),
        reference: input.reference,
        voucherLines: {
          create: input.lines.map((line, index) => ({
            particularAccountId: accounts[line.accountKey].id,
            lineNumber: index + 1,
            description: markerText(line.description),
            debitAmount: line.debitAmount ?? '0.00',
            creditAmount: line.creditAmount ?? '0.00',
          })),
        },
      },
    });

    if (input.status === 'POSTED') {
      return tx.voucher.update({
        where: {
          id: voucher.id,
        },
        data: {
          status: 'POSTED',
          postedById: adminUserId,
        },
      });
    }

    return voucher;
  };

  const baseVoucherSpecs = [
    {
      reference: 'DEMO-JRN-2026-001',
      voucherType: 'JOURNAL',
      status: 'POSTED',
      voucherDate: '2026-01-05',
      description: 'opening synthetic demo/UAT owner capital for RCG context walkthrough',
      lines: [
        {
          accountKey: 'bankMain',
          debitAmount: '25000000.00',
          description: 'opening bank balance',
        },
        {
          accountKey: 'ownerCapital',
          creditAmount: '25000000.00',
          description: 'opening owner capital',
        },
      ],
    },
    {
      reference: 'DEMO-PAY-2026-001',
      voucherType: 'PAYMENT',
      status: 'POSTED',
      voucherDate: '2026-01-18',
      description: 'RC Maya Kanon and Rivery Village synthetic development WIP spend',
      lines: [
        {
          accountKey: 'propertyInventory',
          debitAmount: '5200000.00',
          description: 'project development work in progress',
        },
        {
          accountKey: 'bankMain',
          creditAmount: '5200000.00',
          description: 'bank payment for development work',
        },
      ],
    },
    {
      reference: 'DEMO-RCT-2026-001',
      voucherType: 'RECEIPT',
      status: 'POSTED',
      voucherDate: '2026-02-02',
      description: 'RC Maya Kanon synthetic booking deposit received into bank',
      lines: [
        {
          accountKey: 'bankMain',
          debitAmount: '650000.00',
          description: 'RC Maya Kanon booking deposit bank receipt',
        },
        {
          accountKey: 'customerAdvances',
          creditAmount: '650000.00',
          description: 'synthetic customer advance liability',
        },
      ],
    },
    {
      reference: 'DEMO-RCT-2026-002',
      voucherType: 'RECEIPT',
      status: 'POSTED',
      voucherDate: '2026-02-18',
      description: 'RC Rivery Village synthetic booking deposit received into bank',
      lines: [
        {
          accountKey: 'bankMain',
          debitAmount: '575000.00',
          description: 'RC Rivery Village booking deposit bank receipt',
        },
        {
          accountKey: 'customerAdvances',
          creditAmount: '575000.00',
          description: 'synthetic customer advance liability',
        },
      ],
    },
    {
      reference: 'DEMO-CONTRA-2026-001',
      voucherType: 'CONTRA',
      status: 'POSTED',
      voucherDate: '2026-02-22',
      description: 'cash withdrawal for RCG context sales and site operations',
      lines: [
        {
          accountKey: 'cashHeadOffice',
          debitAmount: '200000.00',
          description: 'cash received from bank',
        },
        {
          accountKey: 'bankMain',
          creditAmount: '200000.00',
          description: 'bank transfer to cash',
        },
      ],
    },
    {
      reference: 'DEMO-PAY-2026-002',
      voucherType: 'PAYMENT',
      status: 'POSTED',
      voucherDate: '2026-03-02',
      description: 'project site operations expense for synthetic RCG walkthrough',
      lines: [
        {
          accountKey: 'siteOperationsExpense',
          debitAmount: '240000.00',
          description: 'site security, utility, and amenities support expense',
        },
        {
          accountKey: 'bankMain',
          creditAmount: '240000.00',
          description: 'bank payment for site operations expense',
        },
      ],
    },
    {
      reference: 'DEMO-JRN-2026-002',
      voucherType: 'JOURNAL',
      status: 'POSTED',
      voucherDate: '2026-03-12',
      description: 'RC Maya Kanon synthetic unit sale revenue recognition',
      lines: [
        {
          accountKey: 'customerReceivable',
          debitAmount: '4150000.00',
          description: 'receivable on contracted RC Maya Kanon unit sale',
        },
        {
          accountKey: 'customerAdvances',
          debitAmount: '650000.00',
          description: 'advance applied to RC Maya Kanon sale',
        },
        {
          accountKey: 'unitSalesRevenue',
          creditAmount: '4800000.00',
          description: 'recognized RC Maya Kanon unit sale revenue',
        },
      ],
    },
    {
      reference: 'DEMO-JRN-2026-003',
      voucherType: 'JOURNAL',
      status: 'POSTED',
      voucherDate: '2026-03-28',
      description: 'RC Rivery Village synthetic unit sale revenue recognition',
      lines: [
        {
          accountKey: 'customerReceivable',
          debitAmount: '3325000.00',
          description: 'receivable on contracted RC Rivery Village unit sale',
        },
        {
          accountKey: 'customerAdvances',
          debitAmount: '575000.00',
          description: 'advance applied to RC Rivery Village sale',
        },
        {
          accountKey: 'unitSalesRevenue',
          creditAmount: '3900000.00',
          description: 'recognized RC Rivery Village unit sale revenue',
        },
      ],
    },
    {
      reference: 'DEMO-PAY-2026-003',
      voucherType: 'PAYMENT',
      status: 'POSTED',
      voucherDate: '2026-03-30',
      description: 'RCG context marketing campaign expense paid from bank',
      lines: [
        {
          accountKey: 'marketingExpense',
          debitAmount: '325000.00',
          description: 'digital, event, and sales-office marketing expense',
        },
        {
          accountKey: 'bankMain',
          creditAmount: '325000.00',
          description: 'bank payment for marketing expense',
        },
      ],
    },
    {
      reference: 'DEMO-JRN-2026-004',
      voucherType: 'JOURNAL',
      status: 'POSTED',
      voucherDate: '2026-04-08',
      description: 'RC Ocean Bliss synthetic suite sale revenue recognition',
      lines: [
        {
          accountKey: 'customerReceivable',
          debitAmount: '2700000.00',
          description: 'receivable on contracted RC Ocean Bliss suite sale',
        },
        {
          accountKey: 'suiteSalesRevenue',
          creditAmount: '2700000.00',
          description: 'recognized RC Ocean Bliss suite sale revenue',
        },
      ],
    },
    {
      reference: 'DEMO-PAY-2026-004',
      voucherType: 'PAYMENT',
      status: 'POSTED',
      voucherDate: '2026-04-11',
      description: 'legal and documentation expense for synthetic property contracts',
      lines: [
        {
          accountKey: 'legalExpense',
          debitAmount: '155000.00',
          description: 'booking, allotment, and documentation support expense',
        },
        {
          accountKey: 'bankMain',
          creditAmount: '155000.00',
          description: 'bank payment for legal documentation expense',
        },
      ],
    },
    {
      reference: 'DEMO-PAY-2026-005',
      voucherType: 'PAYMENT',
      status: 'POSTED',
      voucherDate: '2026-04-15',
      description: 'admin office expense for RCG context demo',
      lines: [
        {
          accountKey: 'officeExpense',
          debitAmount: '210000.00',
          description: 'corporate office and sales-office admin expense',
        },
        {
          accountKey: 'bankMain',
          creditAmount: '210000.00',
          description: 'bank payment for office admin expense',
        },
      ],
    },
    {
      reference: 'DEMO-RCT-2026-003',
      voucherType: 'RECEIPT',
      status: 'POSTED',
      voucherDate: '2026-04-20',
      description: 'synthetic booking service fee revenue received into bank',
      lines: [
        {
          accountKey: 'bankMain',
          debitAmount: '180000.00',
          description: 'booking service fee bank receipt',
        },
        {
          accountKey: 'bookingFeeRevenue',
          creditAmount: '180000.00',
          description: 'recognized synthetic booking service fee revenue',
        },
      ],
    },
    {
      reference: 'DEMO-JRN-2026-003-DRAFT',
      voucherType: 'JOURNAL',
      status: 'DRAFT',
      voucherDate: '2026-04-10',
      description: 'draft office accrual excluded from formal reports',
      lines: [
        {
          accountKey: 'officeExpense',
          debitAmount: '85000.00',
          description: 'draft office expense accrual',
        },
        {
          accountKey: 'customerAdvances',
          creditAmount: '85000.00',
          description: 'draft offset for UAT visibility only',
        },
      ],
    },
  ];

  const vouchers = {};

  for (const voucherSpec of baseVoucherSpecs) {
    const voucher = await ensureVoucher(voucherSpec);
    vouchers[voucherSpec.reference] = voucher;
  }

  return {
    accounts,
    ensureVoucher,
    vouchers,
  };
};

const seedProjectProperty = async (tx, companyId, locations) => {
  const projects = {};
  const costCenters = {};
  const phases = {};
  const blocks = {};
  const zones = {};
  const unitTypes = {};
  const units = {};

  const projectSpecs = [
    {
      key: 'maya',
      code: 'DEMO-RC-MAYA',
      name: 'RC Maya Kanon',
      locationCode: 'DEMO-SITE',
      description:
        'public project-name and location context: Abdullahpur, Keraniganj, Dhaka; near RAJUK Jhilmil and Dhaka-Mawa 300 ft Highway; amenities include school/college/university, playground/park, CCTV/security, mosque, medical support, shopping complex, community center, utilities, sewerage, fire service, and green space',
    },
    {
      key: 'rivery',
      code: 'DEMO-RC-RIVERY',
      name: 'RC Rivery Village',
      locationCode: 'DEMO-RIVERY',
      description:
        'public project-name and location context: Rupganj, Narayanganj; adjacent to Purbachal 3 No. Sector and near Purbachal Express Highway',
    },
    {
      key: 'priyojan',
      code: 'DEMO-RC-PRIYOJAN',
      name: 'RC Priyojan Grihayan Prokolpo',
      locationCode: 'DEMO-SITE',
      description:
        'public project-name context for Abdullahpur, Keraniganj share ownership / apartment-style walkthroughs',
    },
    {
      key: 'southValley',
      code: 'DEMO-RC-SOUTH-VALLEY',
      name: 'RC South Valley',
      locationCode: 'DEMO-SITE',
      description:
        'public project-name context with neutral location note because public references vary between Sreenagar, Munshiganj and Abdullahpur/Keraniganj',
    },
    {
      key: 'mayaEco',
      code: 'DEMO-RC-MAYA-ECO',
      name: 'RC Maya Kanon Eco Village',
      locationCode: 'DEMO-SITE',
      description:
        'public project-name context for Abdullahpur/Keraniganj eco-village walkthrough records',
    },
    {
      key: 'bondhujon',
      code: 'DEMO-RC-BONDHUJON',
      name: 'RC Bondhujon Abason / Abashon',
      locationCode: 'DEMO-DHK-SALES',
      description:
        'public project-name context for group-buy land ownership walkthrough records',
    },
    {
      key: 'oceanBliss',
      code: 'DEMO-RC-OCEAN-BLISS',
      name: 'RC Ocean Bliss',
      locationCode: 'DEMO-KUAKATA',
      description:
        'public project-name context for Kuakata, Patuakhali hotel/suite walkthrough records',
    },
    {
      key: 'dairaNoor',
      code: 'DEMO-RC-DAIRA-NOOR',
      name: 'RC Daira Noor',
      locationCode: 'DEMO-AZIMPUR',
      description:
        'public project-name context for Azimpur, Dhaka apartment walkthrough records',
    },
    {
      key: 'shantiKuthir',
      code: 'DEMO-RC-SHANTI-KUTHIR',
      name: 'RC Shanti Kuthir / Santi Kutir',
      locationCode: 'DEMO-DHK-SALES',
      description:
        'public project-name context with synthetic apartment project note because public location references vary',
    },
    {
      key: 'dalimTower',
      code: 'DEMO-RC-DALIM-TOWER',
      name: 'RC Dalim Tower',
      locationCode: 'DEMO-KHULNA',
      description: 'public project-name context for Khulna tower walkthrough records',
    },
    {
      key: 'tulip',
      code: 'DEMO-RC-TULIP',
      name: 'RC Tulip',
      locationCode: 'DEMO-DHK-SALES',
      description:
        'public project-name context for Badda/Gulshan apartment walkthrough records',
    },
    {
      key: 'nurjahanKunjo',
      code: 'DEMO-RC-NURJAHAN',
      name: 'RC Nurjahan Kunjo',
      locationCode: 'DEMO-SAVAR',
      description: 'public project-name context for Savar, Dhaka apartment walkthrough records',
    },
    {
      key: 'rainbow',
      code: 'DEMO-RC-RAINBOW',
      name: 'RC Rainbow',
      locationCode: 'DEMO-KHULNA',
      description:
        'public project-name context for Sonadanga R/A, Khulna apartment walkthrough records',
    },
  ];

  for (const spec of projectSpecs) {
    projects[spec.key] = await tx.project.upsert({
      where: {
        companyId_code: {
          companyId,
          code: spec.code,
        },
      },
      create: {
        companyId,
        locationId: locations[spec.locationCode].id,
        code: spec.code,
        name: spec.name,
        description: markerText(spec.description),
        isActive: true,
      },
      update: {
        locationId: locations[spec.locationCode].id,
        name: spec.name,
        description: markerText(spec.description),
        isActive: true,
      },
    });
  }

  for (const spec of [
    ['rcgCorporate', null, 'DEMO-RCG-CORP', 'Real Capita Group Corporate Cost Center'],
    ['propertyDevelopment', null, 'DEMO-RCPDL-DESK', 'RC Property Development Ltd Coordination Cost Center'],
    ['holdingsDesk', null, 'DEMO-RCHL-DESK', 'RC Holdings Ltd Coordination Cost Center'],
    ['mayaSales', 'maya', 'DEMO-MAYA-SALES', 'RC Maya Kanon Sales Cost Center'],
    ['mayaSite', 'maya', 'DEMO-MAYA-SITE', 'RC Maya Kanon Site Operations Cost Center'],
    ['riverySales', 'rivery', 'DEMO-RIVERY-SALES', 'RC Rivery Village Sales Cost Center'],
    ['riverySite', 'rivery', 'DEMO-RIVERY-SITE', 'RC Rivery Village Site Operations Cost Center'],
    ['priyojanShare', 'priyojan', 'DEMO-PRIYOJAN-SHARE', 'RC Priyojan Share Ownership Cost Center'],
    ['oceanOps', 'oceanBliss', 'DEMO-OCEAN-OPS', 'RC Ocean Bliss Suite Operations Cost Center'],
    ['khulnaApt', 'dalimTower', 'DEMO-KHULNA-APT', 'Khulna Apartment Projects Cost Center'],
    ['legalDocs', null, 'DEMO-LEGAL-DOCS', 'Legal and Documentation Cost Center'],
  ]) {
    const [key, projectKey, code, name] = spec;
    costCenters[key] = await tx.costCenter.upsert({
      where: {
        companyId_code: {
          companyId,
          code,
        },
      },
      create: {
        companyId,
        projectId: projectKey ? projects[projectKey].id : null,
        code,
        name,
        description: markerText(`${name} cost center`),
        isActive: true,
      },
      update: {
        projectId: projectKey ? projects[projectKey].id : null,
        name,
        description: markerText(`${name} cost center`),
        isActive: true,
      },
    });
  }

  for (const spec of [
    ['mayaPhase1', 'maya', 'DEMO-MAYA-P1', 'RC Maya Kanon Phase 1'],
    ['mayaPhase2', 'maya', 'DEMO-MAYA-P2', 'RC Maya Kanon Phase 2'],
    ['riveryPhase1', 'rivery', 'DEMO-RIVERY-P1', 'RC Rivery Village Phase 1'],
    ['priyojanPhase1', 'priyojan', 'DEMO-PRIYOJAN-P1', 'RC Priyojan Share Ownership Phase'],
    ['southPhase1', 'southValley', 'DEMO-SOUTH-P1', 'RC South Valley Demo Phase'],
    ['mayaEcoPhase1', 'mayaEco', 'DEMO-MAYA-ECO-P1', 'RC Maya Kanon Eco Village Phase'],
    ['bondhujonPhase1', 'bondhujon', 'DEMO-BONDHUJON-P1', 'RC Bondhujon Group Ownership Phase'],
    ['oceanPhase1', 'oceanBliss', 'DEMO-OCEAN-P1', 'RC Ocean Bliss Suite Phase'],
    ['dairaPhase1', 'dairaNoor', 'DEMO-DAIRA-P1', 'RC Daira Noor Apartment Phase'],
    ['shantiPhase1', 'shantiKuthir', 'DEMO-SHANTI-P1', 'RC Shanti Kuthir Apartment Phase'],
    ['dalimPhase1', 'dalimTower', 'DEMO-DALIM-P1', 'RC Dalim Tower Phase'],
    ['tulipPhase1', 'tulip', 'DEMO-TULIP-P1', 'RC Tulip Apartment Phase'],
    ['nurjahanPhase1', 'nurjahanKunjo', 'DEMO-NURJAHAN-P1', 'RC Nurjahan Kunjo Phase'],
    ['rainbowPhase1', 'rainbow', 'DEMO-RAINBOW-P1', 'RC Rainbow Apartment Phase'],
  ]) {
    const [key, projectKey, code, name] = spec;
    phases[key] = await tx.projectPhase.upsert({
      where: {
        projectId_code: {
          projectId: projects[projectKey].id,
          code,
        },
      },
      create: {
        projectId: projects[projectKey].id,
        code,
        name,
        description: markerText(`${name} phase`),
        isActive: true,
      },
      update: {
        name,
        description: markerText(`${name} phase`),
        isActive: true,
      },
    });
  }

  for (const spec of [
    ['mayaBlockA', 'maya', 'mayaPhase1', 'DEMO-MAYA-BLOCK-A', 'Block A'],
    ['mayaBlockB', 'maya', 'mayaPhase1', 'DEMO-MAYA-BLOCK-B', 'Block B'],
    ['mayaBlockC', 'maya', 'mayaPhase2', 'DEMO-MAYA-BLOCK-C', 'Block C'],
    ['mayaBlockD', 'maya', 'mayaPhase2', 'DEMO-MAYA-BLOCK-D', 'Block D'],
    ['riveryBlockE', 'rivery', 'riveryPhase1', 'DEMO-RIVERY-BLOCK-E', 'Block E'],
    ['riveryBlockF', 'rivery', 'riveryPhase1', 'DEMO-RIVERY-BLOCK-F', 'Block F'],
    ['priyojanBlockG', 'priyojan', 'priyojanPhase1', 'DEMO-PRIYOJAN-BLOCK-G', 'Block G'],
    ['southBlockH', 'southValley', 'southPhase1', 'DEMO-SOUTH-BLOCK-H', 'Block H'],
    ['mayaEcoBlockA', 'mayaEco', 'mayaEcoPhase1', 'DEMO-MAYA-ECO-BLOCK-A', 'Block A'],
    ['bondhujonBlockB', 'bondhujon', 'bondhujonPhase1', 'DEMO-BONDHUJON-BLOCK-B', 'Block B'],
    ['oceanBlockC', 'oceanBliss', 'oceanPhase1', 'DEMO-OCEAN-BLOCK-C', 'Block C'],
    ['dairaBlockD', 'dairaNoor', 'dairaPhase1', 'DEMO-DAIRA-BLOCK-D', 'Block D'],
    ['shantiBlockE', 'shantiKuthir', 'shantiPhase1', 'DEMO-SHANTI-BLOCK-E', 'Block E'],
    ['dalimBlockF', 'dalimTower', 'dalimPhase1', 'DEMO-DALIM-BLOCK-F', 'Block F'],
    ['tulipBlockG', 'tulip', 'tulipPhase1', 'DEMO-TULIP-BLOCK-G', 'Block G'],
    ['nurjahanBlockH', 'nurjahanKunjo', 'nurjahanPhase1', 'DEMO-NURJAHAN-BLOCK-H', 'Block H'],
    ['rainbowBlockA', 'rainbow', 'rainbowPhase1', 'DEMO-RAINBOW-BLOCK-A', 'Block A'],
  ]) {
    const [key, projectKey, phaseKey, code, name] = spec;
    blocks[key] = await tx.block.upsert({
      where: {
        projectId_code: {
          projectId: projects[projectKey].id,
          code,
        },
      },
      create: {
        projectId: projects[projectKey].id,
        phaseId: phases[phaseKey].id,
        code,
        name,
        description: markerText(`${name} block`),
        isActive: true,
      },
      update: {
        phaseId: phases[phaseKey].id,
        name,
        description: markerText(`${name} block`),
        isActive: true,
      },
    });
  }

  for (const spec of [
    ['mayaZoneB', 'maya', 'mayaBlockA', 'DEMO-ZONE-B', 'Zone B'],
    ['mayaZoneD', 'maya', 'mayaBlockB', 'DEMO-ZONE-D', 'Zone D'],
    ['mayaZoneN', 'maya', 'mayaBlockC', 'DEMO-ZONE-N', 'Zone N'],
    ['riveryZoneM', 'rivery', 'riveryBlockE', 'DEMO-ZONE-M', 'Zone M'],
    ['riveryZoneE', 'rivery', 'riveryBlockF', 'DEMO-ZONE-E', 'Zone E'],
    ['priyojanZoneS', 'priyojan', 'priyojanBlockG', 'DEMO-ZONE-S', 'Zone S'],
    ['southZoneES', 'southValley', 'southBlockH', 'DEMO-ZONE-ES', 'Zone ES'],
    ['bondhujonZoneDV', 'bondhujon', 'bondhujonBlockB', 'DEMO-ZONE-DV', 'Zone DV'],
    ['oceanZoneTV', 'oceanBliss', 'oceanBlockC', 'DEMO-ZONE-TV', 'Zone TV'],
    ['mayaEcoZoneB', 'mayaEco', 'mayaEcoBlockA', 'DEMO-ECO-ZONE-B', 'Zone B'],
    ['dairaZoneN', 'dairaNoor', 'dairaBlockD', 'DEMO-DAIRA-ZONE-N', 'Zone N'],
    ['shantiZoneS', 'shantiKuthir', 'shantiBlockE', 'DEMO-SHANTI-ZONE-S', 'Zone S'],
    ['dalimZoneE', 'dalimTower', 'dalimBlockF', 'DEMO-DALIM-ZONE-E', 'Zone E'],
    ['tulipZoneD', 'tulip', 'tulipBlockG', 'DEMO-TULIP-ZONE-D', 'Zone D'],
    ['nurjahanZoneM', 'nurjahanKunjo', 'nurjahanBlockH', 'DEMO-NURJAHAN-ZONE-M', 'Zone M'],
    ['rainbowZoneTV', 'rainbow', 'rainbowBlockA', 'DEMO-RAINBOW-ZONE-TV', 'Zone TV'],
  ]) {
    const [key, projectKey, blockKey, code, name] = spec;
    zones[key] = await tx.zone.upsert({
      where: {
        projectId_code: {
          projectId: projects[projectKey].id,
          code,
        },
      },
      create: {
        projectId: projects[projectKey].id,
        blockId: blocks[blockKey].id,
        code,
        name,
        description: markerText(`${name} zone`),
        isActive: true,
      },
      update: {
        blockId: blocks[blockKey].id,
        name,
        description: markerText(`${name} zone`),
        isActive: true,
      },
    });
  }

  for (const spec of [
    ['commercial', 'DEMO-COMMERCIAL', 'Commercial'],
    ['residential', 'DEMO-RESIDENTIAL', 'Residential'],
    ['shareOwnership', 'DEMO-SHARE-OWNERSHIP', 'Share Ownership'],
    ['duplex', 'DEMO-DUPLEX', 'Duplex'],
    ['triplex', 'DEMO-TRIPLEX', 'Triplex'],
    ['deluxeSuite', 'DEMO-DELUXE-SUITE', 'Deluxe Suite'],
    ['standardDeluxe', 'DEMO-STANDARD-DELUXE', 'Standard Deluxe'],
    ['executiveSuite', 'DEMO-EXECUTIVE-SUITE', 'Executive Suite'],
    ['presidentSuite', 'DEMO-PRESIDENT-SUITE', 'President Suite'],
  ]) {
    const [key, code, name] = spec;
    unitTypes[key] = await tx.unitType.upsert({
      where: {
        companyId_code: {
          companyId,
          code,
        },
      },
      create: {
        companyId,
        code,
        name,
        description: markerText(`${name} unit type`),
        isActive: true,
      },
      update: {
        name,
        description: markerText(`${name} unit type`),
        isActive: true,
      },
    });
  }

  const unitStatuses = Object.fromEntries(
    (
      await tx.unitStatus.findMany({
        where: {
          code: {
            in: ['AVAILABLE', 'BOOKED', 'ALLOTTED', 'SOLD', 'TRANSFERRED', 'CANCELLED'],
          },
        },
      })
    ).map((status) => [status.code, status]),
  );

  for (const statusCode of [
    'AVAILABLE',
    'BOOKED',
    'ALLOTTED',
    'SOLD',
    'TRANSFERRED',
    'CANCELLED',
  ]) {
    if (!unitStatuses[statusCode]) {
      throw new Error(`Required unit status ${statusCode} is missing.`);
    }
  }

  const ensureUnit = async (spec) => {
    const project = projects[spec.projectKey];
    const existingUnit = await tx.unit.findFirst({
      where: {
        projectId: project.id,
        code: spec.code,
      },
    });

    if (existingUnit) {
      const updatedUnit = await tx.unit.update({
        where: {
          id: existingUnit.id,
        },
        data: {
          phaseId: phases[spec.phaseKey]?.id,
          blockId: blocks[spec.blockKey]?.id,
          zoneId: zones[spec.zoneKey]?.id,
          unitTypeId: unitTypes[spec.unitTypeKey].id,
          name: spec.name,
          description: markerText(spec.description),
          isActive: true,
        },
      });
      units[spec.code] = updatedUnit;
      return updatedUnit;
    }

    const unit = await tx.unit.create({
      data: {
        projectId: project.id,
        phaseId: phases[spec.phaseKey]?.id,
        blockId: blocks[spec.blockKey]?.id,
        zoneId: zones[spec.zoneKey]?.id,
        unitTypeId: unitTypes[spec.unitTypeKey].id,
        unitStatusId: unitStatuses[spec.statusCode].id,
        code: spec.code,
        name: spec.name,
        description: markerText(spec.description),
        isActive: true,
      },
    });

    units[spec.code] = unit;
    return unit;
  };

  for (const spec of [
    {
      projectKey: 'maya',
      phaseKey: 'mayaPhase1',
      blockKey: 'mayaBlockA',
      zoneKey: 'mayaZoneB',
      unitTypeKey: 'residential',
      statusCode: 'AVAILABLE',
      code: 'DEMO-MAYA-A-B-2P5-001',
      name: 'RC Maya Kanon A-B 2.5 Katha Unit 001',
      description: '2.5 size pattern; public project context; synthetic inventory unit',
    },
    {
      projectKey: 'maya',
      phaseKey: 'mayaPhase1',
      blockKey: 'mayaBlockA',
      zoneKey: 'mayaZoneB',
      unitTypeKey: 'residential',
      statusCode: 'AVAILABLE',
      code: 'DEMO-MAYA-A-B-3-002',
      name: 'RC Maya Kanon A-B 3 Katha Unit 002',
      description: '3 size pattern; public project context; synthetic inventory unit',
    },
    {
      projectKey: 'maya',
      phaseKey: 'mayaPhase1',
      blockKey: 'mayaBlockB',
      zoneKey: 'mayaZoneD',
      unitTypeKey: 'residential',
      statusCode: 'AVAILABLE',
      code: 'DEMO-MAYA-B-D-5-003',
      name: 'RC Maya Kanon B-D 5 Katha Unit 003',
      description: '5 size pattern; public project context; synthetic inventory unit',
    },
    {
      projectKey: 'maya',
      phaseKey: 'mayaPhase2',
      blockKey: 'mayaBlockC',
      zoneKey: 'mayaZoneN',
      unitTypeKey: 'residential',
      statusCode: 'ALLOTTED',
      code: 'DEMO-MAYA-C-N-10-004',
      name: 'RC Maya Kanon C-N 10 Katha Unit 004',
      description: '10 size pattern; allotted synthetic inventory unit',
    },
    {
      projectKey: 'maya',
      phaseKey: 'mayaPhase2',
      blockKey: 'mayaBlockD',
      zoneKey: 'mayaZoneD',
      unitTypeKey: 'triplex',
      statusCode: 'TRANSFERRED',
      code: 'DEMO-MAYA-D-D-TRIPLEX-005',
      name: 'RC Maya Kanon D-D Triplex 005',
      description: 'triplex public type pattern; transferred synthetic inventory unit',
    },
    {
      projectKey: 'rivery',
      phaseKey: 'riveryPhase1',
      blockKey: 'riveryBlockE',
      zoneKey: 'riveryZoneM',
      unitTypeKey: 'residential',
      statusCode: 'AVAILABLE',
      code: 'DEMO-RIVERY-E-M-3-001',
      name: 'RC Rivery Village E-M 3 Katha Unit 001',
      description: '3 size pattern near Purbachal context; synthetic inventory unit',
    },
    {
      projectKey: 'rivery',
      phaseKey: 'riveryPhase1',
      blockKey: 'riveryBlockF',
      zoneKey: 'riveryZoneE',
      unitTypeKey: 'residential',
      statusCode: 'AVAILABLE',
      code: 'DEMO-RIVERY-F-E-5-002',
      name: 'RC Rivery Village F-E 5 Katha Unit 002',
      description: '5 size pattern near Purbachal context; synthetic inventory unit',
    },
    {
      projectKey: 'rivery',
      phaseKey: 'riveryPhase1',
      blockKey: 'riveryBlockE',
      zoneKey: 'riveryZoneM',
      unitTypeKey: 'residential',
      statusCode: 'ALLOTTED',
      code: 'DEMO-RIVERY-E-M-10-003',
      name: 'RC Rivery Village E-M 10 Katha Unit 003',
      description: '10 size pattern; allotted synthetic inventory unit',
    },
    {
      projectKey: 'rivery',
      phaseKey: 'riveryPhase1',
      blockKey: 'riveryBlockF',
      zoneKey: 'riveryZoneE',
      unitTypeKey: 'duplex',
      statusCode: 'CANCELLED',
      code: 'DEMO-RIVERY-F-E-DUPLEX-004',
      name: 'RC Rivery Village F-E Duplex 004',
      description: 'duplex public type pattern; cancelled synthetic inventory unit',
    },
    {
      projectKey: 'priyojan',
      phaseKey: 'priyojanPhase1',
      blockKey: 'priyojanBlockG',
      zoneKey: 'priyojanZoneS',
      unitTypeKey: 'shareOwnership',
      statusCode: 'AVAILABLE',
      code: 'DEMO-PRIYOJAN-G-S-SHARE-001',
      name: 'RC Priyojan G-S Share Ownership 001',
      description: 'share ownership public type pattern; synthetic inventory unit',
    },
    {
      projectKey: 'priyojan',
      phaseKey: 'priyojanPhase1',
      blockKey: 'priyojanBlockG',
      zoneKey: 'priyojanZoneS',
      unitTypeKey: 'residential',
      statusCode: 'ALLOTTED',
      code: 'DEMO-PRIYOJAN-G-S-APT-002',
      name: 'RC Priyojan G-S Apartment 002',
      description: 'apartment-style synthetic inventory unit',
    },
    {
      projectKey: 'southValley',
      phaseKey: 'southPhase1',
      blockKey: 'southBlockH',
      zoneKey: 'southZoneES',
      unitTypeKey: 'residential',
      statusCode: 'AVAILABLE',
      code: 'DEMO-SOUTH-H-ES-2P5-001',
      name: 'RC South Valley H-ES 2.5 Katha Unit 001',
      description: '2.5 size pattern with neutral public location note; synthetic inventory unit',
    },
    {
      projectKey: 'southValley',
      phaseKey: 'southPhase1',
      blockKey: 'southBlockH',
      zoneKey: 'southZoneES',
      unitTypeKey: 'residential',
      statusCode: 'CANCELLED',
      code: 'DEMO-SOUTH-H-ES-5-002',
      name: 'RC South Valley H-ES 5 Katha Unit 002',
      description: '5 size pattern; cancelled synthetic inventory unit',
    },
    {
      projectKey: 'mayaEco',
      phaseKey: 'mayaEcoPhase1',
      blockKey: 'mayaEcoBlockA',
      zoneKey: 'mayaEcoZoneB',
      unitTypeKey: 'duplex',
      statusCode: 'AVAILABLE',
      code: 'DEMO-MAYA-ECO-A-B-DUP-001',
      name: 'RC Maya Kanon Eco Village Duplex 001',
      description: 'duplex public type pattern with eco-village context; synthetic inventory unit',
    },
    {
      projectKey: 'mayaEco',
      phaseKey: 'mayaEcoPhase1',
      blockKey: 'mayaEcoBlockA',
      zoneKey: 'mayaEcoZoneB',
      unitTypeKey: 'residential',
      statusCode: 'AVAILABLE',
      code: 'DEMO-MAYA-ECO-A-B-3-002',
      name: 'RC Maya Kanon Eco Village 3 Katha Unit 002',
      description: '3 size pattern with green space context; synthetic inventory unit',
    },
    {
      projectKey: 'bondhujon',
      phaseKey: 'bondhujonPhase1',
      blockKey: 'bondhujonBlockB',
      zoneKey: 'bondhujonZoneDV',
      unitTypeKey: 'shareOwnership',
      statusCode: 'AVAILABLE',
      code: 'DEMO-BONDHU-B-DV-5-001',
      name: 'RC Bondhujon B-DV 5 Katha Share 001',
      description: 'group-buy land ownership context; synthetic inventory unit',
    },
    {
      projectKey: 'bondhujon',
      phaseKey: 'bondhujonPhase1',
      blockKey: 'bondhujonBlockB',
      zoneKey: 'bondhujonZoneDV',
      unitTypeKey: 'shareOwnership',
      statusCode: 'TRANSFERRED',
      code: 'DEMO-BONDHU-B-DV-10-002',
      name: 'RC Bondhujon B-DV 10 Katha Share 002',
      description: '10 size pattern; transferred synthetic inventory unit',
    },
    {
      projectKey: 'oceanBliss',
      phaseKey: 'oceanPhase1',
      blockKey: 'oceanBlockC',
      zoneKey: 'oceanZoneTV',
      unitTypeKey: 'standardDeluxe',
      statusCode: 'AVAILABLE',
      code: 'DEMO-OCEAN-C-TV-STD-101',
      name: 'RC Ocean Bliss Standard Deluxe 101',
      description: 'Ocean Bliss suite-style public type pattern; synthetic inventory unit',
    },
    {
      projectKey: 'oceanBliss',
      phaseKey: 'oceanPhase1',
      blockKey: 'oceanBlockC',
      zoneKey: 'oceanZoneTV',
      unitTypeKey: 'deluxeSuite',
      statusCode: 'AVAILABLE',
      code: 'DEMO-OCEAN-C-TV-DELUXE-201',
      name: 'RC Ocean Bliss Deluxe Suite 201',
      description: 'Ocean Bliss suite-style public type pattern; synthetic inventory unit',
    },
    {
      projectKey: 'oceanBliss',
      phaseKey: 'oceanPhase1',
      blockKey: 'oceanBlockC',
      zoneKey: 'oceanZoneTV',
      unitTypeKey: 'executiveSuite',
      statusCode: 'ALLOTTED',
      code: 'DEMO-OCEAN-C-TV-EXEC-301',
      name: 'RC Ocean Bliss Executive Suite 301',
      description: 'Ocean Bliss suite-style public type pattern; allotted synthetic inventory unit',
    },
    {
      projectKey: 'oceanBliss',
      phaseKey: 'oceanPhase1',
      blockKey: 'oceanBlockC',
      zoneKey: 'oceanZoneTV',
      unitTypeKey: 'presidentSuite',
      statusCode: 'AVAILABLE',
      code: 'DEMO-OCEAN-C-TV-PRES-501',
      name: 'RC Ocean Bliss President Suite 501',
      description: 'Ocean Bliss suite-style public type pattern; synthetic inventory unit',
    },
    {
      projectKey: 'dairaNoor',
      phaseKey: 'dairaPhase1',
      blockKey: 'dairaBlockD',
      zoneKey: 'dairaZoneN',
      unitTypeKey: 'residential',
      statusCode: 'SOLD',
      code: 'DEMO-DAIRA-D-N-APT-401',
      name: 'RC Daira Noor Apartment 401',
      description: 'Azimpur apartment context; sold synthetic inventory unit',
    },
    {
      projectKey: 'shantiKuthir',
      phaseKey: 'shantiPhase1',
      blockKey: 'shantiBlockE',
      zoneKey: 'shantiZoneS',
      unitTypeKey: 'residential',
      statusCode: 'AVAILABLE',
      code: 'DEMO-SHANTI-E-S-APT-501',
      name: 'RC Shanti Kuthir Apartment 501',
      description: 'synthetic apartment context because public location references vary',
    },
    {
      projectKey: 'dalimTower',
      phaseKey: 'dalimPhase1',
      blockKey: 'dalimBlockF',
      zoneKey: 'dalimZoneE',
      unitTypeKey: 'commercial',
      statusCode: 'AVAILABLE',
      code: 'DEMO-DALIM-F-E-COM-101',
      name: 'RC Dalim Tower Commercial 101',
      description: 'Khulna commercial unit context; synthetic inventory unit',
    },
    {
      projectKey: 'tulip',
      phaseKey: 'tulipPhase1',
      blockKey: 'tulipBlockG',
      zoneKey: 'tulipZoneD',
      unitTypeKey: 'residential',
      statusCode: 'AVAILABLE',
      code: 'DEMO-TULIP-G-D-APT-601',
      name: 'RC Tulip Apartment 601',
      description: 'Badda/Gulshan apartment context; synthetic inventory unit',
    },
    {
      projectKey: 'nurjahanKunjo',
      phaseKey: 'nurjahanPhase1',
      blockKey: 'nurjahanBlockH',
      zoneKey: 'nurjahanZoneM',
      unitTypeKey: 'residential',
      statusCode: 'AVAILABLE',
      code: 'DEMO-NURJAHAN-H-M-APT-301',
      name: 'RC Nurjahan Kunjo Apartment 301',
      description: 'Savar apartment context; synthetic inventory unit',
    },
    {
      projectKey: 'rainbow',
      phaseKey: 'rainbowPhase1',
      blockKey: 'rainbowBlockA',
      zoneKey: 'rainbowZoneTV',
      unitTypeKey: 'residential',
      statusCode: 'AVAILABLE',
      code: 'DEMO-RAINBOW-A-TV-APT-701',
      name: 'RC Rainbow Apartment 701',
      description: 'Sonadanga R/A Khulna apartment context; synthetic inventory unit',
    },
    {
      projectKey: 'rainbow',
      phaseKey: 'rainbowPhase1',
      blockKey: 'rainbowBlockA',
      zoneKey: 'rainbowZoneTV',
      unitTypeKey: 'commercial',
      statusCode: 'ALLOTTED',
      code: 'DEMO-RAINBOW-A-TV-COM-001',
      name: 'RC Rainbow Commercial 001',
      description: 'Khulna commercial context; allotted synthetic inventory unit',
    },
  ]) {
    await ensureUnit(spec);
  }

  return {
    projects,
    costCenters,
    phases,
    blocks,
    zones,
    unitTypes,
    unitStatuses,
    units,
  };
};

const seedCrmPropertyDesk = async (
  tx,
  companyId,
  propertyData,
  accountingData,
) => {
  const customers = {};
  const leads = {};
  const bookings = {};
  const saleContracts = {};
  const installmentSchedules = {};
  const collections = {};

  for (const spec of [
    ['customer01', 'DEMO Customer Nadia Synthetic', 'demo.customer01@example.test', 'SYNTH-PHONE-0101'],
    ['customer02', 'DEMO Customer Arif Synthetic', 'demo.customer02@example.test', 'SYNTH-PHONE-0102'],
    ['customer03', 'DEMO Customer Farah Synthetic', 'demo.customer03@example.test', 'SYNTH-PHONE-0103'],
    ['customer04', 'DEMO Customer Ruhan Synthetic', 'demo.customer04@example.test', 'SYNTH-PHONE-0104'],
    ['customer05', 'DEMO Customer Samira Synthetic', 'demo.customer05@example.test', 'SYNTH-PHONE-0105'],
    ['customer06', 'DEMO Customer Tanvir Synthetic', 'demo.customer06@example.test', 'SYNTH-PHONE-0106'],
    ['customer07', 'DEMO Customer Lamia Synthetic', 'demo.customer07@example.test', 'SYNTH-PHONE-0107'],
    ['customer08', 'DEMO Customer Omar Synthetic', 'demo.customer08@example.test', 'SYNTH-PHONE-0108'],
  ]) {
    const [key, fullName, email, phone] = spec;
    customers[key] = await tx.customer.upsert({
      where: {
        companyId_email: {
          companyId,
          email,
        },
      },
      create: {
        companyId,
        fullName,
        email,
        phone,
        address: 'SYNTHETIC DEMO/UAT ADDRESS ONLY',
        notes: markerText('synthetic customer contact for RCG context-aligned demo/UAT'),
        isActive: true,
      },
      update: {
        fullName,
        phone,
        address: 'SYNTHETIC DEMO/UAT ADDRESS ONLY',
        notes: markerText('synthetic customer contact for RCG context-aligned demo/UAT'),
        isActive: true,
      },
    });
  }

  for (const spec of [
    ['lead01', 'DEMO Lead RC Maya Kanon Website Inquiry', 'NEW', 'Website enquiry', 'maya'],
    ['lead02', 'DEMO Lead Rivery Village Sales Office Visit', 'CONTACTED', 'Sales office visit', 'rivery'],
    ['lead03', 'DEMO Lead Ocean Bliss Suite Inquiry', 'QUALIFIED', 'Tourism fair booth', 'oceanBliss'],
    ['lead04', 'DEMO Lead Priyojan Share Ownership Referral', 'QUALIFIED', 'Referral', 'priyojan'],
    ['lead05', 'DEMO Lead Bondhujon Group Land Inquiry', 'CONTACTED', 'Group-buyer desk', 'bondhujon'],
    ['lead06', 'DEMO Lead Tulip Apartment Inquiry', 'NEW', 'Phone enquiry', 'tulip'],
    ['lead07', 'DEMO Lead South Valley Follow Up', 'CLOSED', 'Social campaign', 'southValley'],
    ['lead08', 'DEMO Lead Dalim Tower Commercial Inquiry', 'QUALIFIED', 'Broker desk', 'dalimTower'],
    ['lead09', 'DEMO Lead Rainbow Apartment Inquiry', 'CONTACTED', 'Walk-in', 'rainbow'],
  ]) {
    const [key, fullName, status, source, projectKey] = spec;
    const existingLead = await tx.lead.findFirst({
      where: {
        companyId,
        fullName,
        notes: {
          contains: DEMO_MARKER,
        },
      },
    });

    if (existingLead) {
      leads[key] = await tx.lead.update({
        where: {
          id: existingLead.id,
        },
        data: {
          projectId: propertyData.projects[projectKey].id,
          email: `${key}@example.test`,
          phone: `SYNTH-LEAD-PHONE-${key.slice(-2)}`,
          source,
          status,
          notes: markerText('synthetic RCG-context lead pipeline record'),
          isActive: true,
        },
      });
      continue;
    }

    leads[key] = await tx.lead.create({
      data: {
        companyId,
        projectId: propertyData.projects[projectKey].id,
        fullName,
        email: `${key}@example.test`,
        phone: `SYNTH-LEAD-PHONE-${key.slice(-2)}`,
        source,
        status,
        notes: markerText('synthetic RCG-context lead pipeline record'),
        isActive: true,
      },
    });
  }

  const ensureBooking = async (spec) => {
    const existingBooking = await tx.booking.findFirst({
      where: {
        companyId,
        unitId: propertyData.units[spec.unitCode].id,
        notes: {
          contains: DEMO_MARKER,
        },
      },
    });

    if (existingBooking) {
      bookings[spec.key] = await tx.booking.update({
        where: {
          id: existingBooking.id,
        },
        data: {
          notes: markerText(spec.notes),
        },
      });
      return existingBooking;
    }

    const booking = await tx.booking.create({
      data: {
        companyId,
        projectId: propertyData.projects[spec.projectKey].id,
        customerId: customers[spec.customerKey].id,
        unitId: propertyData.units[spec.unitCode].id,
        bookingDate: dateOnly(spec.bookingDate),
        bookingAmount: spec.bookingAmount,
        notes: markerText(spec.notes),
      },
    });

    bookings[spec.key] = booking;
    return booking;
  };

  for (const spec of [
    {
      key: 'booking01',
      projectKey: 'maya',
      customerKey: 'customer01',
      unitCode: 'DEMO-MAYA-A-B-2P5-001',
      bookingDate: '2026-02-02',
      bookingAmount: '650000.00',
      notes: 'synthetic booking for RC Maya Kanon walkthrough',
    },
    {
      key: 'booking02',
      projectKey: 'rivery',
      customerKey: 'customer02',
      unitCode: 'DEMO-RIVERY-E-M-3-001',
      bookingDate: '2026-02-18',
      bookingAmount: '575000.00',
      notes: 'synthetic booking for RC Rivery Village walkthrough',
    },
    {
      key: 'booking03',
      projectKey: 'oceanBliss',
      customerKey: 'customer03',
      unitCode: 'DEMO-OCEAN-C-TV-STD-101',
      bookingDate: '2026-03-05',
      bookingAmount: '420000.00',
      notes: 'synthetic booking for RC Ocean Bliss suite walkthrough',
    },
    {
      key: 'booking04',
      projectKey: 'priyojan',
      customerKey: 'customer04',
      unitCode: 'DEMO-PRIYOJAN-G-S-SHARE-001',
      bookingDate: '2026-03-22',
      bookingAmount: '360000.00',
      notes: 'synthetic booking for RC Priyojan share ownership walkthrough',
    },
    {
      key: 'booking05',
      projectKey: 'bondhujon',
      customerKey: 'customer05',
      unitCode: 'DEMO-BONDHU-B-DV-5-001',
      bookingDate: '2026-04-03',
      bookingAmount: '520000.00',
      notes: 'synthetic booking for RC Bondhujon group ownership walkthrough',
    },
    {
      key: 'booking06',
      projectKey: 'mayaEco',
      customerKey: 'customer06',
      unitCode: 'DEMO-MAYA-ECO-A-B-DUP-001',
      bookingDate: '2026-04-14',
      bookingAmount: '440000.00',
      notes: 'active synthetic booking for RC Maya Kanon Eco Village',
    },
    {
      key: 'booking07',
      projectKey: 'tulip',
      customerKey: 'customer07',
      unitCode: 'DEMO-TULIP-G-D-APT-601',
      bookingDate: '2026-04-18',
      bookingAmount: '300000.00',
      notes: 'active synthetic booking for RC Tulip apartment context',
    },
  ]) {
    await ensureBooking(spec);
  }

  const ensureSaleContract = async (spec) => {
    const existingContract = await tx.saleContract.findFirst({
      where: {
        companyId,
        reference: spec.reference,
      },
    });

    if (existingContract) {
      saleContracts[spec.key] = await tx.saleContract.update({
        where: {
          id: existingContract.id,
        },
        data: {
          reference: spec.reference,
          notes: markerText(spec.notes),
        },
      });
      return existingContract;
    }

    const saleContract = await tx.saleContract.create({
      data: {
        companyId,
        bookingId: bookings[spec.bookingKey].id,
        contractDate: dateOnly(spec.contractDate),
        contractAmount: spec.contractAmount,
        reference: spec.reference,
        notes: markerText(spec.notes),
      },
    });

    saleContracts[spec.key] = saleContract;
    return saleContract;
  };

  for (const spec of [
    {
      key: 'contract01',
      bookingKey: 'booking01',
      contractDate: '2026-03-12',
      contractAmount: '4800000.00',
      reference: 'DEMO-SC-2026-RC-MAYA-001',
      notes: 'synthetic RC Maya Kanon contracted unit sale',
    },
    {
      key: 'contract02',
      bookingKey: 'booking02',
      contractDate: '2026-03-28',
      contractAmount: '3900000.00',
      reference: 'DEMO-SC-2026-RC-RIVERY-002',
      notes: 'synthetic RC Rivery Village contracted unit sale',
    },
    {
      key: 'contract03',
      bookingKey: 'booking03',
      contractDate: '2026-04-08',
      contractAmount: '2700000.00',
      reference: 'DEMO-SC-2026-RC-OCEAN-003',
      notes: 'synthetic RC Ocean Bliss contracted suite sale',
    },
    {
      key: 'contract04',
      bookingKey: 'booking04',
      contractDate: '2026-04-12',
      contractAmount: '1800000.00',
      reference: 'DEMO-SC-2026-RC-PRIYOJAN-004',
      notes: 'synthetic RC Priyojan share ownership contract',
    },
    {
      key: 'contract05',
      bookingKey: 'booking05',
      contractDate: '2026-04-20',
      contractAmount: '2400000.00',
      reference: 'DEMO-SC-2026-RC-BONDHUJON-005',
      notes: 'synthetic RC Bondhujon group land ownership contract',
    },
  ]) {
    await ensureSaleContract(spec);
  }

  for (const contractKey of [
    'contract01',
    'contract02',
    'contract03',
    'contract04',
    'contract05',
  ]) {
    const contract = saleContracts[contractKey];
    const amount = Number(contract.contractAmount);
    const installmentAmount = (amount / 4).toFixed(2);

    for (let sequenceNumber = 1; sequenceNumber <= 4; sequenceNumber += 1) {
      const existingSchedule = await tx.installmentSchedule.findFirst({
        where: {
          saleContractId: contract.id,
          sequenceNumber,
        },
      });

      if (existingSchedule) {
        installmentSchedules[`${contractKey}-${sequenceNumber}`] = existingSchedule;
        continue;
      }

      const dueMonth = 2 + sequenceNumber;
      const dueDate = `2026-${String(dueMonth).padStart(2, '0')}-15`;
      installmentSchedules[`${contractKey}-${sequenceNumber}`] =
        await tx.installmentSchedule.create({
          data: {
            companyId,
            saleContractId: contract.id,
            sequenceNumber,
            dueDate: dateOnly(dueDate),
            amount: installmentAmount,
            description: markerText(
              `installment ${sequenceNumber} for ${contract.reference}`,
            ),
          },
        });
    }
  }

  const collectionSpecs = [
    {
      key: 'collection01',
      reference: 'DEMO-COL-2026-001',
      customerKey: 'customer01',
      bookingKey: 'booking01',
      contractKey: 'contract01',
      scheduleKey: 'contract01-1',
      collectionDate: '2026-03-16',
      amount: '1200000.00',
      creditAccountKey: 'customerReceivable',
    },
    {
      key: 'collection02',
      reference: 'DEMO-COL-2026-002',
      customerKey: 'customer02',
      bookingKey: 'booking02',
      contractKey: 'contract02',
      scheduleKey: 'contract02-1',
      collectionDate: '2026-04-16',
      amount: '975000.00',
      creditAccountKey: 'customerReceivable',
    },
    {
      key: 'collection03',
      reference: 'DEMO-COL-2026-003',
      customerKey: 'customer03',
      bookingKey: 'booking03',
      contractKey: 'contract03',
      scheduleKey: 'contract03-1',
      collectionDate: '2026-04-18',
      amount: '675000.00',
      creditAccountKey: 'customerReceivable',
    },
    {
      key: 'collection04',
      reference: 'DEMO-COL-2026-004',
      customerKey: 'customer04',
      bookingKey: 'booking04',
      contractKey: 'contract04',
      scheduleKey: 'contract04-1',
      collectionDate: '2026-04-21',
      amount: '450000.00',
      creditAccountKey: 'customerReceivable',
    },
    {
      key: 'collection05',
      reference: 'DEMO-COL-2026-005',
      customerKey: 'customer05',
      bookingKey: 'booking05',
      contractKey: 'contract05',
      scheduleKey: 'contract05-1',
      collectionDate: '2026-04-23',
      amount: '600000.00',
      creditAccountKey: 'customerReceivable',
    },
    {
      key: 'collection06',
      reference: 'DEMO-COL-2026-006',
      customerKey: 'customer06',
      bookingKey: 'booking06',
      contractKey: null,
      scheduleKey: null,
      collectionDate: '2026-04-25',
      amount: '440000.00',
      creditAccountKey: 'customerAdvances',
    },
  ];

  for (const spec of collectionSpecs) {
    const voucher = await accountingData.ensureVoucher({
      reference: spec.reference,
      voucherType: 'RECEIPT',
      status: 'POSTED',
      voucherDate: spec.collectionDate,
      description: `collection receipt ${spec.reference}`,
      lines: [
        {
          accountKey: 'bankMain',
          debitAmount: spec.amount,
          description: `bank receipt for ${spec.reference}`,
        },
        {
          accountKey: spec.creditAccountKey,
          creditAmount: spec.amount,
          description: `customer credit for ${spec.reference}`,
        },
      ],
    });

    const existingCollection = await tx.collection.findFirst({
      where: {
        companyId,
        reference: spec.reference,
      },
    });

    if (existingCollection) {
      collections[spec.key] = existingCollection;
      continue;
    }

    collections[spec.key] = await tx.collection.create({
      data: {
        companyId,
        customerId: customers[spec.customerKey].id,
        voucherId: voucher.id,
        bookingId: bookings[spec.bookingKey].id,
        saleContractId: spec.contractKey
          ? saleContracts[spec.contractKey].id
          : null,
        installmentScheduleId: spec.scheduleKey
          ? installmentSchedules[spec.scheduleKey].id
          : null,
        collectionDate: dateOnly(spec.collectionDate),
        amount: spec.amount,
        reference: spec.reference,
        notes: markerText('synthetic collection for demo/UAT cash trend'),
      },
    });
  }

  return {
    customers,
    leads,
    bookings,
    saleContracts,
    installmentSchedules,
    collections,
  };
};

const seedHr = async (tx, companyId, orgData, demoUsers) => {
  const employees = {};
  const attendanceDevices = {};
  const deviceUsers = {};
  const leaveTypes = {};
  const leaveRequests = {};

  const employeeSpecs = [
    ['emp001', 'DEMO-EMP-001', 'DEMO Employee Amina Finance', 'DEMO-FIN', 'DEMO-DHK', `demo.accountant@${DEMO_EMAIL_DOMAIN}`],
    ['emp002', 'DEMO-EMP-002', 'DEMO Employee Bilal CRM', 'DEMO-SALES', 'DEMO-DHK-SALES', `demo.sales@${DEMO_EMAIL_DOMAIN}`],
    ['emp003', 'DEMO-EMP-003', 'DEMO Employee Cynthia HR', 'DEMO-HR', 'DEMO-DHK', `demo.hr@${DEMO_EMAIL_DOMAIN}`],
    ['emp004', 'DEMO-EMP-004', 'DEMO Employee Dawood Payroll', 'DEMO-PAY', 'DEMO-DHK', `demo.payroll@${DEMO_EMAIL_DOMAIN}`],
    ['emp005', 'DEMO-EMP-005', 'DEMO Employee Esha Maya Site', 'DEMO-OPS', 'DEMO-SITE', null],
    ['emp006', 'DEMO-EMP-006', 'DEMO Employee Faisal Rivery Site', 'DEMO-OPS', 'DEMO-RIVERY', null],
    ['emp007', 'DEMO-EMP-007', 'DEMO Employee Gita Documentation', 'DEMO-LEGAL', 'DEMO-DHK', null],
    ['emp008', 'DEMO-EMP-008', 'DEMO Employee Harun Admin', 'DEMO-RCG', 'DEMO-DHK', `demo.admin@${DEMO_EMAIL_DOMAIN}`],
    ['emp009', 'DEMO-EMP-009', 'DEMO Employee Ishrat IT', 'DEMO-IT', 'DEMO-DHK', null],
    ['emp010', 'DEMO-EMP-010', 'DEMO Employee Jamil Ocean Site', 'DEMO-OPS', 'DEMO-KUAKATA', null],
    ['emp011', 'DEMO-EMP-011', 'DEMO Employee Kamal Khulna Site', 'DEMO-OPS', 'DEMO-KHULNA', null],
    ['emp012', 'DEMO-EMP-012', 'DEMO Employee Lina Legal', 'DEMO-LEGAL', 'DEMO-DHK-SALES', null],
  ];

  for (const spec of employeeSpecs) {
    const [key, employeeCode, fullName, departmentCode, locationCode, userEmail] =
      spec;
    employees[key] = await tx.employee.upsert({
      where: {
        companyId_employeeCode: {
          companyId,
          employeeCode,
        },
      },
      create: {
        companyId,
        departmentId: orgData.departments[departmentCode].id,
        locationId: orgData.locations[locationCode].id,
        userId: userEmail ? demoUsers[userEmail].id : null,
        employeeCode,
        fullName,
        isActive: true,
      },
      update: {
        departmentId: orgData.departments[departmentCode].id,
        locationId: orgData.locations[locationCode].id,
        userId: userEmail ? demoUsers[userEmail].id : null,
        fullName,
        isActive: true,
      },
    });
  }

  for (const spec of [
    ['hqDevice', 'DEMO-ATT-HQ-01', 'DEMO HQ Attendance Device', 'DEMO-DHK'],
    ['mayaDevice', 'DEMO-ATT-MAYA-01', 'DEMO RC Maya Kanon Site Attendance Device', 'DEMO-SITE'],
    ['riveryDevice', 'DEMO-ATT-RIVERY-01', 'DEMO RC Rivery Village Site Attendance Device', 'DEMO-RIVERY'],
  ]) {
    const [key, code, name, locationCode] = spec;
    attendanceDevices[key] = await tx.attendanceDevice.upsert({
      where: {
        companyId_code: {
          companyId,
          code,
        },
      },
      create: {
        companyId,
        locationId: orgData.locations[locationCode].id,
        code,
        name,
        description: markerText(`${name} synthetic device`),
        isActive: true,
      },
      update: {
        locationId: orgData.locations[locationCode].id,
        name,
        description: markerText(`${name} synthetic device`),
        isActive: true,
      },
    });
  }

  for (const [index, employeeKey] of Object.keys(employees).entries()) {
    const employee = employees[employeeKey];
    const deviceCycle = ['hqDevice', 'mayaDevice', 'riveryDevice'];
    const deviceKey = deviceCycle[index % deviceCycle.length];
    const existingDeviceUser = await tx.deviceUser.findFirst({
      where: {
        companyId,
        employeeId: employee.id,
        attendanceDeviceId: attendanceDevices[deviceKey].id,
      },
    });

    if (existingDeviceUser) {
      deviceUsers[employeeKey] = existingDeviceUser;
      continue;
    }

    deviceUsers[employeeKey] = await tx.deviceUser.create({
      data: {
        companyId,
        employeeId: employee.id,
        attendanceDeviceId: attendanceDevices[deviceKey].id,
        deviceEmployeeCode: `DEMO-DEV-${String(index + 1).padStart(3, '0')}`,
        isActive: true,
      },
    });
  }

  for (const spec of [
    ['annual', 'DEMO-ANNUAL', 'DEMO Annual Leave'],
    ['sick', 'DEMO-SICK', 'DEMO Sick Leave'],
    ['casual', 'DEMO-CASUAL', 'DEMO Casual Leave'],
    ['unpaid', 'DEMO-UNPAID', 'DEMO Unpaid Leave'],
    ['fieldDuty', 'DEMO-FIELD-DUTY', 'DEMO Field Duty Leave'],
  ]) {
    const [key, code, name] = spec;
    leaveTypes[key] = await tx.leaveType.upsert({
      where: {
        companyId_code: {
          companyId,
          code,
        },
      },
      create: {
        companyId,
        code,
        name,
        description: markerText(`${name} synthetic leave type`),
        isActive: true,
      },
      update: {
        name,
        description: markerText(`${name} synthetic leave type`),
        isActive: true,
      },
    });
  }

  for (const spec of [
    ['leave01', 'emp001', 'annual', '2026-04-07', '2026-04-08', 'APPROVED', 'approved planned finance leave'],
    ['leave02', 'emp002', 'casual', '2026-04-22', '2026-04-22', 'SUBMITTED', 'submitted sales office leave'],
    ['leave03', 'emp003', 'sick', '2026-03-17', '2026-03-18', 'REJECTED', 'rejected overlapping HR support coverage'],
    ['leave04', 'emp004', 'annual', '2026-05-05', '2026-05-06', 'DRAFT', 'draft future payroll leave'],
    ['leave05', 'emp005', 'unpaid', '2026-02-10', '2026-02-10', 'CANCELLED', 'cancelled Maya site unpaid leave'],
    ['leave06', 'emp006', 'fieldDuty', '2026-04-24', '2026-04-24', 'APPROVED', 'approved Rivery site field duty leave'],
    ['leave07', 'emp010', 'casual', '2026-04-26', '2026-04-26', 'SUBMITTED', 'submitted Ocean Bliss site leave'],
  ]) {
    const [key, employeeKey, leaveTypeKey, startDate, endDate, status, reason] =
      spec;
    const existingLeaveRequest = await tx.leaveRequest.findFirst({
      where: {
        companyId,
        employeeId: employees[employeeKey].id,
        leaveTypeId: leaveTypes[leaveTypeKey].id,
        startDate: dateOnly(startDate),
        reason: {
          contains: DEMO_MARKER,
        },
      },
    });

    if (existingLeaveRequest) {
      leaveRequests[key] = existingLeaveRequest;
      continue;
    }

    leaveRequests[key] = await tx.leaveRequest.create({
      data: {
        companyId,
        employeeId: employees[employeeKey].id,
        leaveTypeId: leaveTypes[leaveTypeKey].id,
        startDate: dateOnly(startDate),
        endDate: dateOnly(endDate),
        reason: markerText(reason),
        decisionNote:
          status === 'APPROVED' || status === 'REJECTED' || status === 'CANCELLED'
            ? markerText(`synthetic ${status.toLowerCase()} decision`)
            : null,
        status,
      },
    });
  }

  const attendanceDates = [
    '2026-04-17',
    '2026-04-18',
    '2026-04-19',
    '2026-04-20',
    '2026-04-21',
    '2026-04-22',
  ];

  for (const [employeeIndex, employeeKey] of Object.keys(deviceUsers).entries()) {
    const deviceUser = deviceUsers[employeeKey];

    for (const [dateIndex, attendanceDate] of attendanceDates.entries()) {
      for (const direction of ['IN', 'OUT']) {
        const hour = direction === 'IN' ? 9 : employeeIndex % 2 === 0 ? 18 : 17;
        const minute = direction === 'IN' ? employeeIndex + dateIndex : 30;
        const externalLogId = `DEMO-ATT-${employeeKey}-${attendanceDate}-${direction}`;
        await tx.attendanceLog.upsert({
          where: {
            companyId_externalLogId: {
              companyId,
              externalLogId,
            },
          },
          create: {
            companyId,
            deviceUserId: deviceUser.id,
            loggedAt: new Date(
              `${attendanceDate}T${String(hour).padStart(2, '0')}:${String(
                minute,
              ).padStart(2, '0')}:00.000Z`,
            ),
            direction,
            externalLogId,
          },
          update: {
            deviceUserId: deviceUser.id,
            direction,
          },
        });
      }
    }
  }

  return {
    employees,
    attendanceDevices,
    deviceUsers,
    leaveTypes,
    leaveRequests,
  };
};

const seedPayroll = async (
  tx,
  companyId,
  adminUserId,
  propertyData,
  hrData,
  accountingData,
) => {
  const salaryStructures = {};
  const payrollRuns = {};

  for (const spec of [
    ['executive', 'DEMO-SAL-EXEC', 'DEMO Executive Salary Structure', '90000.00', '25000.00', '10000.00'],
    ['finance', 'DEMO-SAL-FIN', 'DEMO Finance Salary Structure', '65000.00', '15000.00', '6000.00'],
    ['sales', 'DEMO-SAL-SALES', 'DEMO Sales Salary Structure', '60000.00', '14000.00', '5000.00'],
    ['site', 'DEMO-SAL-SITE', 'DEMO Site Salary Structure', '42000.00', '8000.00', '3000.00'],
    ['support', 'DEMO-SAL-SUPPORT', 'DEMO Support Salary Structure', '50000.00', '10000.00', '4000.00'],
  ]) {
    const [key, code, name, basicAmount, allowanceAmount, deductionAmount] =
      spec;
    const netAmount = (
      Number(basicAmount) +
      Number(allowanceAmount) -
      Number(deductionAmount)
    ).toFixed(2);

    salaryStructures[key] = await tx.salaryStructure.upsert({
      where: {
        companyId_code: {
          companyId,
          code,
        },
      },
      create: {
        companyId,
        code,
        name,
        description: markerText(`${name} for synthetic payroll UAT`),
        basicAmount,
        allowanceAmount,
        deductionAmount,
        netAmount,
        isActive: true,
      },
      update: {
        name,
        description: markerText(`${name} for synthetic payroll UAT`),
        basicAmount,
        allowanceAmount,
        deductionAmount,
        netAmount,
        isActive: true,
      },
    });
  }

  const lineSpecs = [
    ['emp001', '90000.00', '25000.00', '10000.00'],
    ['emp002', '60000.00', '14000.00', '5000.00'],
    ['emp003', '55000.00', '12000.00', '5000.00'],
    ['emp004', '55000.00', '12000.00', '5000.00'],
    ['emp005', '42000.00', '8000.00', '3000.00'],
    ['emp006', '42000.00', '8000.00', '3000.00'],
    ['emp007', '50000.00', '10000.00', '4000.00'],
    ['emp008', '90000.00', '25000.00', '10000.00'],
    ['emp009', '50000.00', '10000.00', '4000.00'],
    ['emp010', '42000.00', '8000.00', '3000.00'],
    ['emp011', '42000.00', '8000.00', '3000.00'],
    ['emp012', '50000.00', '10000.00', '4000.00'],
  ];

  const ensurePayrollRun = async (spec) => {
    let run = await tx.payrollRun.findFirst({
      where: {
        companyId,
        payrollYear: spec.year,
        payrollMonth: spec.month,
        description: {
          contains: spec.description,
        },
      },
    });

    if (!run) {
      run = await tx.payrollRun.create({
        data: {
          companyId,
          projectId: propertyData.projects[spec.projectKey].id,
          costCenterId: propertyData.costCenters[spec.costCenterKey].id,
          payrollYear: spec.year,
          payrollMonth: spec.month,
          description: markerText(spec.description),
          status: 'DRAFT',
        },
      });
    }

    if (run.status === 'DRAFT') {
      for (const [employeeKey, basicAmount, allowanceAmount, deductionAmount] of lineSpecs) {
        const netAmount = (
          Number(basicAmount) +
          Number(allowanceAmount) -
          Number(deductionAmount)
        ).toFixed(2);

        await tx.payrollRunLine.upsert({
          where: {
            payrollRunId_employeeId: {
              payrollRunId: run.id,
              employeeId: hrData.employees[employeeKey].id,
            },
          },
          create: {
            companyId,
            payrollRunId: run.id,
            employeeId: hrData.employees[employeeKey].id,
            basicAmount,
            allowanceAmount,
            deductionAmount,
            netAmount,
          },
          update: {
            basicAmount,
            allowanceAmount,
            deductionAmount,
            netAmount,
          },
        });
      }
    }

    if (spec.targetStatus === 'FINALIZED' && run.status === 'DRAFT') {
      run = await tx.payrollRun.update({
        where: {
          id: run.id,
        },
        data: {
          status: 'FINALIZED',
        },
      });
    }

    if (spec.targetStatus === 'POSTED' && run.status === 'DRAFT') {
      run = await tx.payrollRun.update({
        where: {
          id: run.id,
        },
        data: {
          status: 'FINALIZED',
        },
      });
    }

    if (spec.targetStatus === 'POSTED' && run.status === 'FINALIZED') {
      await tx.$queryRawUnsafe(
        `SELECT * FROM "post_payroll_run"($1::uuid, $2::uuid, $3::uuid, $4::date, $5::uuid, $6::uuid, $7::uuid)`,
        run.id,
        companyId,
        adminUserId,
        spec.voucherDate,
        accountingData.accounts.payrollExpense.id,
        accountingData.accounts.payrollPayable.id,
        accountingData.accounts.payrollDeductions.id,
      );

      run = await tx.payrollRun.findUniqueOrThrow({
        where: {
          id: run.id,
        },
      });
    }

    payrollRuns[spec.key] = run;
    return run;
  };

  await ensurePayrollRun({
    key: 'postedFebruary',
    year: 2026,
    month: 2,
    projectKey: 'maya',
    costCenterKey: 'mayaSite',
    description: 'DEMO payroll run February 2026 for RCG context demo',
    targetStatus: 'POSTED',
    voucherDate: '2026-02-28',
  });
  await ensurePayrollRun({
    key: 'finalizedMarch',
    year: 2026,
    month: 3,
    projectKey: 'rivery',
    costCenterKey: 'riverySales',
    description: 'DEMO payroll run March 2026 for Rivery sales review',
    targetStatus: 'FINALIZED',
    voucherDate: '2026-03-31',
  });
  await ensurePayrollRun({
    key: 'draftApril',
    year: 2026,
    month: 4,
    projectKey: 'oceanBliss',
    costCenterKey: 'oceanOps',
    description: 'DEMO payroll run April 2026 draft for Ocean Bliss operations',
    targetStatus: 'DRAFT',
    voucherDate: '2026-04-30',
  });

  return {
    salaryStructures,
    payrollRuns,
  };
};

const seedAttachmentsAndAudit = async (
  tx,
  companyId,
  adminUserId,
  accountingData,
  crmData,
  hrData,
  payrollData,
) => {
  const bucket = process.env.S3_BUCKET ?? 'real-capita-erp-dev';
  const attachments = {};

  const attachmentSpecs = [
    {
      key: 'mayaBookingForm',
      storageKey: 'demo/synthetic-demo-uat/DEMO-RC-Maya-Kanon-booking-form.pdf',
      originalFileName: 'DEMO-RC-Maya-Kanon-booking-form.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 2048n,
      entityType: 'BOOKING',
      entityId: crmData.bookings.booking01.id,
    },
    {
      key: 'riveryAllotmentNote',
      storageKey: 'demo/synthetic-demo-uat/DEMO-RC-Rivery-Village-allotment-note.pdf',
      originalFileName: 'DEMO-RC-Rivery-Village-allotment-note.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1536n,
      entityType: 'SALE_CONTRACT',
      entityId: crmData.saleContracts.contract02.id,
    },
    {
      key: 'payrollSupport',
      storageKey: 'demo/synthetic-demo-uat/DEMO-Payroll-support-April.pdf',
      originalFileName: 'DEMO-Payroll-support-April.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1280n,
      entityType: 'PAYROLL_RUN',
      entityId: payrollData.payrollRuns.draftApril.id,
    },
    {
      key: 'collectionReceipt',
      storageKey: 'demo/synthetic-demo-uat/DEMO-Collection-receipt.pdf',
      originalFileName: 'DEMO-Collection-receipt.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1152n,
      entityType: 'VOUCHER',
      entityId: crmData.collections.collection01.voucherId,
    },
    {
      key: 'unitHandoverChecklist',
      storageKey: 'demo/synthetic-demo-uat/DEMO-Unit-handover-checklist.pdf',
      originalFileName: 'DEMO-Unit-handover-checklist.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1408n,
      entityType: 'SALE_CONTRACT',
      entityId: crmData.saleContracts.contract01.id,
    },
  ];

  for (const spec of attachmentSpecs) {
    const attachment = await tx.attachment.upsert({
      where: {
        storageBucket_storageKey: {
          storageBucket: bucket,
          storageKey: spec.storageKey,
        },
      },
      create: {
        companyId,
        storageBucket: bucket,
        storageKey: spec.storageKey,
        originalFileName: spec.originalFileName,
        mimeType: spec.mimeType,
        sizeBytes: spec.sizeBytes,
        checksumSha256: `DEMO-CHECKSUM-${spec.key}`,
        objectEtag: `DEMO-ETAG-${spec.key}`,
        uploadedById: adminUserId,
        status: 'AVAILABLE',
        uploadCompletedAt: new Date('2026-04-20T10:00:00.000Z'),
      },
      update: {
        companyId,
        originalFileName: spec.originalFileName,
        mimeType: spec.mimeType,
        sizeBytes: spec.sizeBytes,
        checksumSha256: `DEMO-CHECKSUM-${spec.key}`,
        objectEtag: `DEMO-ETAG-${spec.key}`,
        uploadedById: adminUserId,
        status: 'AVAILABLE',
        uploadCompletedAt: new Date('2026-04-20T10:00:00.000Z'),
        archivedById: null,
        archivedAt: null,
      },
    });

    attachments[spec.key] = attachment;

    await tx.attachmentLink.upsert({
      where: {
        companyId_attachmentId_entityType_entityId: {
          companyId,
          attachmentId: attachment.id,
          entityType: spec.entityType,
          entityId: spec.entityId,
        },
      },
      create: {
        companyId,
        attachmentId: attachment.id,
        entityType: spec.entityType,
        entityId: spec.entityId,
        createdById: adminUserId,
        isActive: true,
      },
      update: {
        createdById: adminUserId,
        removedById: null,
        removedAt: null,
        isActive: true,
      },
    });
  }

  const ensureAuditEvent = async (spec) => {
    const existingEvent = await tx.auditEvent.findFirst({
      where: {
        companyId,
        requestId: spec.requestId,
      },
    });

    if (existingEvent) {
      return existingEvent;
    }

    return tx.auditEvent.create({
      data: {
        companyId,
        actorUserId: adminUserId,
        category: spec.category,
        eventType: spec.eventType,
        targetEntityType: spec.targetEntityType,
        targetEntityId: spec.targetEntityId,
        requestId: spec.requestId,
        metadata: {
          marker: DEMO_MARKER,
          source: 'synthetic demo/UAT seed',
          summary: spec.summary,
        },
        createdAt: spec.createdAt,
      },
    });
  };

  await ensureAuditEvent({
    requestId: 'DEMO-AUDIT-ADMIN-001',
    category: 'ADMIN',
    eventType: 'demo.company.seeded',
    targetEntityType: 'COMPANY',
    targetEntityId: companyId,
    summary: 'RCG context-aligned synthetic demo/UAT company seeded',
    createdAt: new Date('2026-04-20T09:00:00.000Z'),
  });
  await ensureAuditEvent({
    requestId: 'DEMO-AUDIT-ADMIN-002',
    category: 'ADMIN',
    eventType: 'demo.rcg.context.loaded',
    targetEntityType: 'COMPANY',
    targetEntityId: companyId,
    summary: 'Public RCG company/project naming context loaded without real private records',
    createdAt: new Date('2026-04-20T09:05:00.000Z'),
  });
  await ensureAuditEvent({
    requestId: 'DEMO-AUDIT-ACCOUNTING-001',
    category: 'ACCOUNTING',
    eventType: 'demo.voucher.posted',
    targetEntityType: 'VOUCHER',
    targetEntityId: accountingData.vouchers['DEMO-JRN-2026-001'].id,
    summary: 'Synthetic opening voucher posted',
    createdAt: new Date('2026-04-20T09:10:00.000Z'),
  });
  await ensureAuditEvent({
    requestId: 'DEMO-AUDIT-ACCOUNTING-002',
    category: 'ACCOUNTING',
    eventType: 'demo.collection.voucher.posted',
    targetEntityType: 'VOUCHER',
    targetEntityId: crmData.collections.collection01.voucherId,
    summary: 'Synthetic collection receipt voucher posted',
    createdAt: new Date('2026-04-20T09:15:00.000Z'),
  });
  await ensureAuditEvent({
    requestId: 'DEMO-AUDIT-CRM-001',
    category: 'CRM_PROPERTY_DESK',
    eventType: 'demo.sale.contract.created',
    targetEntityType: 'SALE_CONTRACT',
    targetEntityId: crmData.saleContracts.contract01.id,
    summary: 'Synthetic RC Maya Kanon sale contract created',
    createdAt: new Date('2026-04-20T09:20:00.000Z'),
  });
  await ensureAuditEvent({
    requestId: 'DEMO-AUDIT-ADMIN-003',
    category: 'ADMIN',
    eventType: 'demo.attendance.seeded',
    targetEntityType: 'EMPLOYEE',
    targetEntityId: hrData.employees.emp001.id,
    summary: 'Synthetic attendance and HR records seeded',
    createdAt: new Date('2026-04-20T09:25:00.000Z'),
  });
  await ensureAuditEvent({
    requestId: 'DEMO-AUDIT-PAYROLL-001',
    category: 'PAYROLL',
    eventType: 'demo.payroll.posted',
    targetEntityType: 'PAYROLL_RUN',
    targetEntityId: payrollData.payrollRuns.postedFebruary.id,
    summary: 'Synthetic payroll run posted',
    createdAt: new Date('2026-04-20T09:30:00.000Z'),
  });
  await ensureAuditEvent({
    requestId: 'DEMO-AUDIT-ATTACHMENT-001',
    category: 'ATTACHMENT',
    eventType: 'demo.attachment.linked',
    targetEntityType: 'ATTACHMENT',
    targetEntityId: attachments.mayaBookingForm.id,
    summary: 'Synthetic RCG-context attachment linked',
    createdAt: new Date('2026-04-20T09:40:00.000Z'),
  });

  return {
    attachments,
  };
};

const countRaw = async (tx, sql, ...params) => {
  const rows = await tx.$queryRawUnsafe(sql, ...params);
  return Number(rows[0]?.count ?? 0);
};

const collectDemoCounts = async (tx, companyId) => ({
  companies: await countRaw(
    tx,
    `SELECT COUNT(*)::int AS count FROM "companies" WHERE "id" = $1::uuid`,
    companyId,
  ),
  userRoles: await countRaw(
    tx,
    `SELECT COUNT(*)::int AS count FROM "user_roles" WHERE "companyId" = $1::uuid`,
    companyId,
  ),
  locations: await tx.location.count({ where: { companyId } }),
  departments: await tx.department.count({ where: { companyId } }),
  accountGroups: await tx.accountGroup.count({ where: { companyId } }),
  ledgerAccounts: await tx.ledgerAccount.count({ where: { companyId } }),
  particularAccounts: await tx.particularAccount.count({ where: { companyId } }),
  vouchers: await tx.voucher.count({ where: { companyId } }),
  postedVouchers: await tx.voucher.count({
    where: {
      companyId,
      status: 'POSTED',
    },
  }),
  draftVouchers: await tx.voucher.count({
    where: {
      companyId,
      status: 'DRAFT',
    },
  }),
  projects: await tx.project.count({ where: { companyId } }),
  costCenters: await tx.costCenter.count({ where: { companyId } }),
  phases: await countRaw(
    tx,
    `SELECT COUNT(*)::int AS count
     FROM "project_phases" pp
     JOIN "projects" p ON p."id" = pp."projectId"
     WHERE p."companyId" = $1::uuid`,
    companyId,
  ),
  blocks: await countRaw(
    tx,
    `SELECT COUNT(*)::int AS count
     FROM "blocks" b
     JOIN "projects" p ON p."id" = b."projectId"
     WHERE p."companyId" = $1::uuid`,
    companyId,
  ),
  zones: await countRaw(
    tx,
    `SELECT COUNT(*)::int AS count
     FROM "zones" z
     JOIN "projects" p ON p."id" = z."projectId"
     WHERE p."companyId" = $1::uuid`,
    companyId,
  ),
  unitTypes: await tx.unitType.count({ where: { companyId } }),
  units: await countRaw(
    tx,
    `SELECT COUNT(*)::int AS count
     FROM "units" u
     JOIN "projects" p ON p."id" = u."projectId"
     WHERE p."companyId" = $1::uuid`,
    companyId,
  ),
  customers: await tx.customer.count({ where: { companyId } }),
  leads: await tx.lead.count({ where: { companyId } }),
  bookings: await tx.booking.count({ where: { companyId } }),
  saleContracts: await tx.saleContract.count({ where: { companyId } }),
  installmentSchedules: await tx.installmentSchedule.count({ where: { companyId } }),
  collections: await tx.collection.count({ where: { companyId } }),
  employees: await tx.employee.count({ where: { companyId } }),
  attendanceDevices: await tx.attendanceDevice.count({ where: { companyId } }),
  deviceUsers: await tx.deviceUser.count({ where: { companyId } }),
  attendanceLogs: await tx.attendanceLog.count({ where: { companyId } }),
  leaveTypes: await tx.leaveType.count({ where: { companyId } }),
  leaveRequests: await tx.leaveRequest.count({ where: { companyId } }),
  salaryStructures: await tx.salaryStructure.count({ where: { companyId } }),
  payrollRuns: await tx.payrollRun.count({ where: { companyId } }),
  payrollRunLines: await tx.payrollRunLine.count({ where: { companyId } }),
  attachments: await tx.attachment.count({ where: { companyId } }),
  attachmentLinks: await tx.attachmentLink.count({ where: { companyId } }),
  auditEvents: await tx.auditEvent.count({ where: { companyId } }),
});

const printCounts = (label, counts) => {
  console.log(`[demo-data] ${label}`);

  for (const [key, value] of Object.entries(counts)) {
    console.log(`- ${key}: ${value}`);
  }
};

const buildSafetyChecks = () => {
  const markerPattern = `%${DEMO_MARKER}%`;
  const demoPrefix = 'DEMO-%';
  const demoEmailPattern = `%@${DEMO_EMAIL_DOMAIN}`;

  return [
    {
      label: 'user role assignments for non-demo users',
      sql: `SELECT COUNT(*)::int AS count
            FROM "user_roles" ur
            JOIN "users" u ON u."id" = ur."userId"
            WHERE ur."companyId" = $1::uuid
              AND u."email" NOT LIKE $2`,
      params: [demoEmailPattern],
    },
    {
      label: 'locations without DEMO code',
      sql: `SELECT COUNT(*)::int AS count FROM "locations"
            WHERE "companyId" = $1::uuid AND "code" NOT LIKE $2`,
      params: [demoPrefix],
    },
    {
      label: 'departments without DEMO code',
      sql: `SELECT COUNT(*)::int AS count FROM "departments"
            WHERE "companyId" = $1::uuid AND "code" NOT LIKE $2`,
      params: [demoPrefix],
    },
    {
      label: 'account groups without DEMO code',
      sql: `SELECT COUNT(*)::int AS count FROM "account_groups"
            WHERE "companyId" = $1::uuid AND "code" NOT LIKE $2`,
      params: [demoPrefix],
    },
    {
      label: 'ledger accounts without DEMO code',
      sql: `SELECT COUNT(*)::int AS count FROM "ledger_accounts"
            WHERE "companyId" = $1::uuid AND "code" NOT LIKE $2`,
      params: [demoPrefix],
    },
    {
      label: 'particular accounts without DEMO code',
      sql: `SELECT COUNT(*)::int AS count FROM "particular_accounts"
            WHERE "companyId" = $1::uuid AND "code" NOT LIKE $2`,
      params: [demoPrefix],
    },
    {
      label: 'vouchers without DEMO reference or seed marker',
      sql: `SELECT COUNT(*)::int AS count FROM "vouchers"
            WHERE "companyId" = $1::uuid
              AND NOT (
                COALESCE("reference", '') LIKE $2
                OR COALESCE("description", '') LIKE $3
              )`,
      params: [demoPrefix, markerPattern],
    },
    {
      label: 'projects without DEMO code',
      sql: `SELECT COUNT(*)::int AS count FROM "projects"
            WHERE "companyId" = $1::uuid AND "code" NOT LIKE $2`,
      params: [demoPrefix],
    },
    {
      label: 'cost centers without DEMO code',
      sql: `SELECT COUNT(*)::int AS count FROM "cost_centers"
            WHERE "companyId" = $1::uuid AND "code" NOT LIKE $2`,
      params: [demoPrefix],
    },
    {
      label: 'phases without DEMO code',
      sql: `SELECT COUNT(*)::int AS count
            FROM "project_phases" pp
            JOIN "projects" p ON p."id" = pp."projectId"
            WHERE p."companyId" = $1::uuid AND pp."code" NOT LIKE $2`,
      params: [demoPrefix],
    },
    {
      label: 'blocks without DEMO code',
      sql: `SELECT COUNT(*)::int AS count
            FROM "blocks" b
            JOIN "projects" p ON p."id" = b."projectId"
            WHERE p."companyId" = $1::uuid AND b."code" NOT LIKE $2`,
      params: [demoPrefix],
    },
    {
      label: 'zones without DEMO code',
      sql: `SELECT COUNT(*)::int AS count
            FROM "zones" z
            JOIN "projects" p ON p."id" = z."projectId"
            WHERE p."companyId" = $1::uuid AND z."code" NOT LIKE $2`,
      params: [demoPrefix],
    },
    {
      label: 'unit types without DEMO code',
      sql: `SELECT COUNT(*)::int AS count FROM "unit_types"
            WHERE "companyId" = $1::uuid AND "code" NOT LIKE $2`,
      params: [demoPrefix],
    },
    {
      label: 'units without DEMO code',
      sql: `SELECT COUNT(*)::int AS count
            FROM "units" u
            JOIN "projects" p ON p."id" = u."projectId"
            WHERE p."companyId" = $1::uuid AND u."code" NOT LIKE $2`,
      params: [demoPrefix],
    },
    {
      label: 'customers without seed marker',
      sql: `SELECT COUNT(*)::int AS count FROM "customers"
            WHERE "companyId" = $1::uuid AND COALESCE("notes", '') NOT LIKE $2`,
      params: [markerPattern],
    },
    {
      label: 'leads without seed marker',
      sql: `SELECT COUNT(*)::int AS count FROM "leads"
            WHERE "companyId" = $1::uuid AND COALESCE("notes", '') NOT LIKE $2`,
      params: [markerPattern],
    },
    {
      label: 'bookings without seed marker',
      sql: `SELECT COUNT(*)::int AS count FROM "bookings"
            WHERE "companyId" = $1::uuid AND COALESCE("notes", '') NOT LIKE $2`,
      params: [markerPattern],
    },
    {
      label: 'sale contracts without DEMO reference or seed marker',
      sql: `SELECT COUNT(*)::int AS count FROM "sale_contracts"
            WHERE "companyId" = $1::uuid
              AND NOT (
                COALESCE("reference", '') LIKE $2
                OR COALESCE("notes", '') LIKE $3
              )`,
      params: [demoPrefix, markerPattern],
    },
    {
      label: 'installment schedules without seed marker',
      sql: `SELECT COUNT(*)::int AS count FROM "installment_schedules"
            WHERE "companyId" = $1::uuid AND COALESCE("description", '') NOT LIKE $2`,
      params: [markerPattern],
    },
    {
      label: 'collections without DEMO reference or seed marker',
      sql: `SELECT COUNT(*)::int AS count FROM "collections"
            WHERE "companyId" = $1::uuid
              AND NOT (
                COALESCE("reference", '') LIKE $2
                OR COALESCE("notes", '') LIKE $3
              )`,
      params: [demoPrefix, markerPattern],
    },
    {
      label: 'employees without DEMO code',
      sql: `SELECT COUNT(*)::int AS count FROM "employees"
            WHERE "companyId" = $1::uuid AND "employeeCode" NOT LIKE $2`,
      params: [demoPrefix],
    },
    {
      label: 'attendance devices without DEMO code',
      sql: `SELECT COUNT(*)::int AS count FROM "attendance_devices"
            WHERE "companyId" = $1::uuid AND "code" NOT LIKE $2`,
      params: [demoPrefix],
    },
    {
      label: 'device users without DEMO code',
      sql: `SELECT COUNT(*)::int AS count FROM "device_users"
            WHERE "companyId" = $1::uuid AND "deviceEmployeeCode" NOT LIKE $2`,
      params: [demoPrefix],
    },
    {
      label: 'attendance logs without DEMO external id',
      sql: `SELECT COUNT(*)::int AS count FROM "attendance_logs"
            WHERE "companyId" = $1::uuid AND COALESCE("externalLogId", '') NOT LIKE $2`,
      params: [demoPrefix],
    },
    {
      label: 'leave types without DEMO code',
      sql: `SELECT COUNT(*)::int AS count FROM "leave_types"
            WHERE "companyId" = $1::uuid AND "code" NOT LIKE $2`,
      params: [demoPrefix],
    },
    {
      label: 'leave requests without seed marker',
      sql: `SELECT COUNT(*)::int AS count FROM "leave_requests"
            WHERE "companyId" = $1::uuid
              AND COALESCE("reason", '') NOT LIKE $2
              AND COALESCE("decisionNote", '') NOT LIKE $2`,
      params: [markerPattern],
    },
    {
      label: 'salary structures without DEMO code',
      sql: `SELECT COUNT(*)::int AS count FROM "salary_structures"
            WHERE "companyId" = $1::uuid AND "code" NOT LIKE $2`,
      params: [demoPrefix],
    },
    {
      label: 'payroll runs without seed marker',
      sql: `SELECT COUNT(*)::int AS count FROM "payroll_runs"
            WHERE "companyId" = $1::uuid AND COALESCE("description", '') NOT LIKE $2`,
      params: [markerPattern],
    },
    {
      label: 'attachments without DEMO storage marker',
      sql: `SELECT COUNT(*)::int AS count FROM "attachments"
            WHERE "companyId" = $1::uuid
              AND NOT (
                COALESCE("storageKey", '') LIKE 'demo/synthetic-demo-uat/%'
                OR COALESCE("originalFileName", '') LIKE $2
              )`,
      params: [demoPrefix],
    },
    {
      label: 'audit events without DEMO request id, seed marker, or demo-user auth actor',
      sql: `SELECT COUNT(*)::int AS count
            FROM "audit_events" ae
            LEFT JOIN "users" u ON u."id" = ae."actorUserId"
            WHERE ae."companyId" = $1::uuid
              AND NOT (
                COALESCE(ae."requestId", '') LIKE $2
                OR COALESCE(ae."metadata"::text, '') LIKE $3
                OR (
                  ae."category" = 'AUTH'
                  AND COALESCE(u."email", '') LIKE $4
                )
              )`,
      params: [demoPrefix, markerPattern, demoEmailPattern],
    },
  ];
};

const findDemoCompany = async (tx) => {
  const company = await tx.company.findUnique({
    where: {
      slug: DEMO_COMPANY_SLUG,
    },
  });

  if (!company) {
    return null;
  }

  if (company.name !== DEMO_COMPANY_NAME) {
    throw new Error(
      `Refusing demo reset/verify because ${DEMO_COMPANY_SLUG} does not have the expected synthetic company name.`,
    );
  }

  return company;
};

const collectResetSafetyFailures = async (tx, companyId) => {
  const failures = [];

  for (const check of buildSafetyChecks()) {
    const count = await countRaw(tx, check.sql, companyId, ...check.params);

    if (count > 0) {
      failures.push({
        label: check.label,
        count,
      });
    }
  }

  return failures;
};

const assertResetIsSafe = async (tx, companyId) => {
  const failures = await collectResetSafetyFailures(tx, companyId);

  if (failures.length === 0) {
    return;
  }

  const details = failures
    .map((failure) => `- ${failure.label}: ${failure.count}`)
    .join('\n');

  throw new Error(
    `Refusing reset because the synthetic company contains unmarked records:\n${details}`,
  );
};

const executeResetDeletes = async (tx, companyId) => {
  for (const table of TRIGGER_RESET_TABLES) {
    await tx.$executeRawUnsafe(`ALTER TABLE "${table}" DISABLE TRIGGER USER`);
  }

  const deletionStatements = [
    `DELETE FROM "attachment_links" WHERE "companyId" = $1::uuid`,
    `DELETE FROM "attachments" WHERE "companyId" = $1::uuid`,
    `DELETE FROM "audit_events" WHERE "companyId" = $1::uuid`,
    `DELETE FROM "collections" WHERE "companyId" = $1::uuid`,
    `DELETE FROM "installment_schedules" WHERE "companyId" = $1::uuid`,
    `DELETE FROM "sale_contracts" WHERE "companyId" = $1::uuid`,
    `DELETE FROM "bookings" WHERE "companyId" = $1::uuid`,
    `DELETE FROM "leads" WHERE "companyId" = $1::uuid`,
    `DELETE FROM "customers" WHERE "companyId" = $1::uuid`,
    `DELETE FROM "payroll_run_lines" WHERE "companyId" = $1::uuid`,
    `DELETE FROM "payroll_runs" WHERE "companyId" = $1::uuid`,
    `DELETE FROM "voucher_lines"
      WHERE "voucherId" IN (
        SELECT "id" FROM "vouchers" WHERE "companyId" = $1::uuid
      )`,
    `DELETE FROM "vouchers" WHERE "companyId" = $1::uuid`,
    `DELETE FROM "leave_requests" WHERE "companyId" = $1::uuid`,
    `DELETE FROM "attendance_logs" WHERE "companyId" = $1::uuid`,
    `DELETE FROM "device_users" WHERE "companyId" = $1::uuid`,
    `DELETE FROM "employees" WHERE "companyId" = $1::uuid`,
    `DELETE FROM "attendance_devices" WHERE "companyId" = $1::uuid`,
    `DELETE FROM "leave_types" WHERE "companyId" = $1::uuid`,
    `DELETE FROM "salary_structures" WHERE "companyId" = $1::uuid`,
    `DELETE FROM "units"
      WHERE "projectId" IN (
        SELECT "id" FROM "projects" WHERE "companyId" = $1::uuid
      )`,
    `DELETE FROM "zones"
      WHERE "projectId" IN (
        SELECT "id" FROM "projects" WHERE "companyId" = $1::uuid
      )`,
    `DELETE FROM "blocks"
      WHERE "projectId" IN (
        SELECT "id" FROM "projects" WHERE "companyId" = $1::uuid
      )`,
    `DELETE FROM "project_phases"
      WHERE "projectId" IN (
        SELECT "id" FROM "projects" WHERE "companyId" = $1::uuid
      )`,
    `DELETE FROM "cost_centers" WHERE "companyId" = $1::uuid`,
    `DELETE FROM "projects" WHERE "companyId" = $1::uuid`,
    `DELETE FROM "unit_types" WHERE "companyId" = $1::uuid`,
    `DELETE FROM "particular_accounts" WHERE "companyId" = $1::uuid`,
    `DELETE FROM "ledger_accounts" WHERE "companyId" = $1::uuid`,
    `DELETE FROM "account_groups" WHERE "companyId" = $1::uuid`,
    `DELETE FROM "departments" WHERE "companyId" = $1::uuid`,
    `DELETE FROM "locations" WHERE "companyId" = $1::uuid`,
    `DELETE FROM "refresh_tokens" WHERE "companyId" = $1::uuid`,
    `DELETE FROM "user_roles" WHERE "companyId" = $1::uuid`,
    `DELETE FROM "companies" WHERE "id" = $1::uuid`,
  ];

  let deletedRows = 0;

  for (const statement of deletionStatements) {
    deletedRows += await tx.$executeRawUnsafe(statement, companyId);
  }

  for (const table of [...TRIGGER_RESET_TABLES].reverse()) {
    await tx.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE TRIGGER USER`);
  }

  const deletedUsers = await tx.user.deleteMany({
    where: {
      email: {
        in: DEMO_USER_SPECS.map((user) => user.email),
      },
      userRoles: {
        none: {},
      },
    },
  });

  return {
    deletedRows,
    deletedUsers: deletedUsers.count,
  };
};

const resetDemoData = async (prisma, options = {}) => {
  return prisma.$transaction(
    async (tx) => {
      const company = await findDemoCompany(tx);

      if (!company) {
        console.log('[demo-data] no synthetic demo/UAT company found; reset skipped.');
        return {
          reset: false,
          counts: {},
          deletedRows: 0,
          deletedUsers: 0,
        };
      }

      await assertResetIsSafe(tx, company.id);
      const counts = await collectDemoCounts(tx, company.id);

      if (options.dryRun) {
        return {
          reset: false,
          counts,
          deletedRows: 0,
          deletedUsers: 0,
        };
      }

      const result = await executeResetDeletes(tx, company.id);

      return {
        reset: true,
        counts,
        ...result,
      };
    },
    {
      timeout: 120000,
    },
  );
};

const seedDemoData = async (prisma) => {
  const argon2 = await import('argon2');
  const passwordHash = await argon2.default.hash(DEMO_PASSWORD);

  return prisma.$transaction(
    async (tx) => {
      const roles = await ensureRoleDefinitions(tx);
      const company = await ensureDemoCompany(tx);
      const userData = await ensureDemoUsersAndRoles(
        tx,
        company,
        roles,
        passwordHash,
      );
      const orgData = await seedOrgStructure(tx, company.id);
      const accountingData = await seedAccounting(
        tx,
        company.id,
        userData.adminUser.id,
      );
      const propertyData = await seedProjectProperty(
        tx,
        company.id,
        orgData.locations,
      );
      const crmData = await seedCrmPropertyDesk(
        tx,
        company.id,
        propertyData,
        accountingData,
      );
      const hrData = await seedHr(tx, company.id, orgData, userData.users);
      const payrollData = await seedPayroll(
        tx,
        company.id,
        userData.adminUser.id,
        propertyData,
        hrData,
        accountingData,
      );
      await seedAttachmentsAndAudit(
        tx,
        company.id,
        userData.adminUser.id,
        accountingData,
        crmData,
        hrData,
        payrollData,
      );

      return {
        company,
        counts: await collectDemoCounts(tx, company.id),
      };
    },
    {
      timeout: 120000,
    },
  );
};

const verifyDemoData = async (prisma) => {
  const company = await findDemoCompany(prisma);
  const failures = [];

  if (!company) {
    throw new Error('Synthetic demo/UAT company does not exist.');
  }

  const counts = await collectDemoCounts(prisma, company.id);
  const requiredMinimums = {
    companies: 1,
    userRoles: 6,
    locations: 8,
    departments: 8,
    accountGroups: 6,
    ledgerAccounts: 14,
    particularAccounts: 16,
    vouchers: 20,
    postedVouchers: 18,
    draftVouchers: 1,
    projects: 13,
    costCenters: 11,
    phases: 14,
    blocks: 17,
    zones: 16,
    unitTypes: 9,
    units: 28,
    customers: 8,
    leads: 9,
    bookings: 7,
    saleContracts: 5,
    installmentSchedules: 20,
    collections: 6,
    employees: 12,
    attendanceDevices: 3,
    deviceUsers: 12,
    attendanceLogs: 140,
    leaveTypes: 5,
    leaveRequests: 7,
    salaryStructures: 5,
    payrollRuns: 3,
    payrollRunLines: 36,
    attachments: 5,
    attachmentLinks: 5,
    auditEvents: 8,
  };

  for (const [key, minimum] of Object.entries(requiredMinimums)) {
    if ((counts[key] ?? 0) < minimum) {
      failures.push(`${key} expected at least ${minimum}, found ${counts[key] ?? 0}`);
    }
  }

  const projectRows = await prisma.project.findMany({
    where: {
      companyId: company.id,
    },
    select: {
      name: true,
    },
  });
  const projectNames = new Set(projectRows.map((row) => row.name));

  for (const projectName of [
    'RC Maya Kanon',
    'RC Rivery Village',
    'RC Priyojan Grihayan Prokolpo',
    'RC South Valley',
    'RC Maya Kanon Eco Village',
    'RC Bondhujon Abason / Abashon',
    'RC Ocean Bliss',
    'RC Daira Noor',
    'RC Shanti Kuthir / Santi Kutir',
    'RC Dalim Tower',
    'RC Tulip',
    'RC Nurjahan Kunjo',
    'RC Rainbow',
  ]) {
    if (!projectNames.has(projectName)) {
      failures.push(`missing RCG context project ${projectName}`);
    }
  }

  const unitTypeRows = await prisma.unitType.findMany({
    where: {
      companyId: company.id,
    },
    select: {
      name: true,
    },
  });
  const unitTypeNames = new Set(unitTypeRows.map((row) => row.name));

  for (const unitTypeName of [
    'Commercial',
    'Residential',
    'Share Ownership',
    'Duplex',
    'Triplex',
    'Deluxe Suite',
    'Standard Deluxe',
    'Executive Suite',
    'President Suite',
  ]) {
    if (!unitTypeNames.has(unitTypeName)) {
      failures.push(`missing RCG context unit type ${unitTypeName}`);
    }
  }

  const blockRows = await prisma.$queryRawUnsafe(
    `SELECT DISTINCT b."name"
     FROM "blocks" b
     JOIN "projects" p ON p."id" = b."projectId"
     WHERE p."companyId" = $1::uuid`,
    company.id,
  );
  const blockNames = new Set(blockRows.map((row) => row.name));

  for (const blockName of [
    'Block A',
    'Block B',
    'Block C',
    'Block D',
    'Block E',
    'Block F',
    'Block G',
    'Block H',
  ]) {
    if (!blockNames.has(blockName)) {
      failures.push(`missing public block pattern ${blockName}`);
    }
  }

  const zoneRows = await prisma.$queryRawUnsafe(
    `SELECT DISTINCT z."name"
     FROM "zones" z
     JOIN "projects" p ON p."id" = z."projectId"
     WHERE p."companyId" = $1::uuid`,
    company.id,
  );
  const zoneNames = new Set(zoneRows.map((row) => row.name));

  for (const zoneName of [
    'Zone B',
    'Zone D',
    'Zone N',
    'Zone M',
    'Zone E',
    'Zone S',
    'Zone ES',
    'Zone DV',
    'Zone TV',
  ]) {
    if (!zoneNames.has(zoneName)) {
      failures.push(`missing public zone pattern ${zoneName}`);
    }
  }

  const nonSyntheticCustomers = await prisma.customer.count({
    where: {
      companyId: company.id,
      OR: [
        {
          fullName: {
            not: {
              startsWith: 'DEMO Customer ',
            },
          },
        },
        {
          email: {
            not: {
              endsWith: '@example.test',
            },
          },
        },
        {
          phone: {
            not: {
              startsWith: 'SYNTH-PHONE-',
            },
          },
        },
      ],
    },
  });

  if (nonSyntheticCustomers > 0) {
    failures.push(
      `customer private data must remain synthetic; found ${nonSyntheticCustomers} non-synthetic customer records`,
    );
  }

  const nonSyntheticEmployees = await prisma.employee.count({
    where: {
      companyId: company.id,
      OR: [
        {
          employeeCode: {
            not: {
              startsWith: 'DEMO-EMP-',
            },
          },
        },
        {
          fullName: {
            not: {
              startsWith: 'DEMO Employee ',
            },
          },
        },
      ],
    },
  });

  if (nonSyntheticEmployees > 0) {
    failures.push(
      `employee private data must remain synthetic; found ${nonSyntheticEmployees} non-synthetic employee records`,
    );
  }

  const voucherTypeRows = await prisma.$queryRawUnsafe(
    `SELECT "voucherType", COUNT(*)::int AS count
     FROM "vouchers"
     WHERE "companyId" = $1::uuid
     GROUP BY "voucherType"`,
    company.id,
  );
  const voucherTypes = new Set(voucherTypeRows.map((row) => row.voucherType));

  for (const voucherType of ['RECEIPT', 'PAYMENT', 'JOURNAL', 'CONTRA']) {
    if (!voucherTypes.has(voucherType)) {
      failures.push(`missing voucher type ${voucherType}`);
    }
  }

  const unitStatusRows = await prisma.$queryRawUnsafe(
    `SELECT us."code", COUNT(*)::int AS count
     FROM "units" u
     JOIN "projects" p ON p."id" = u."projectId"
     JOIN "unit_statuses" us ON us."id" = u."unitStatusId"
     WHERE p."companyId" = $1::uuid
     GROUP BY us."code"`,
    company.id,
  );
  const unitStatusCounts = Object.fromEntries(
    unitStatusRows.map((row) => [row.code, Number(row.count)]),
  );

  for (const status of ['AVAILABLE', 'BOOKED', 'SOLD', 'ALLOTTED', 'TRANSFERRED', 'CANCELLED']) {
    if (!unitStatusCounts[status]) {
      failures.push(`missing unit status coverage ${status}`);
    }
  }

  const payrollStatusRows = await prisma.$queryRawUnsafe(
    `SELECT "status", COUNT(*)::int AS count
     FROM "payroll_runs"
     WHERE "companyId" = $1::uuid
     GROUP BY "status"`,
    company.id,
  );
  const payrollStatuses = new Set(payrollStatusRows.map((row) => row.status));

  for (const status of ['DRAFT', 'FINALIZED', 'POSTED']) {
    if (!payrollStatuses.has(status)) {
      failures.push(`missing payroll run status ${status}`);
    }
  }

  const leaveStatusRows = await prisma.$queryRawUnsafe(
    `SELECT "status", COUNT(*)::int AS count
     FROM "leave_requests"
     WHERE "companyId" = $1::uuid
     GROUP BY "status"`,
    company.id,
  );
  const leaveStatuses = new Set(leaveStatusRows.map((row) => row.status));

  for (const status of ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED']) {
    if (!leaveStatuses.has(status)) {
      failures.push(`missing leave request status ${status}`);
    }
  }

  const financialRows = await prisma.$queryRawUnsafe(
    `SELECT
        ac."code",
        COALESCE(SUM(vl."debitAmount"), 0)::numeric AS "debitTotal",
        COALESCE(SUM(vl."creditAmount"), 0)::numeric AS "creditTotal"
     FROM "voucher_lines" vl
     JOIN "vouchers" v ON v."id" = vl."voucherId"
     JOIN "particular_accounts" pa ON pa."id" = vl."particularAccountId"
     JOIN "ledger_accounts" la ON la."id" = pa."ledgerAccountId"
     JOIN "account_groups" ag ON ag."id" = la."accountGroupId"
     JOIN "account_classes" ac ON ac."id" = ag."accountClassId"
     WHERE v."companyId" = $1::uuid AND v."status" = 'POSTED'
     GROUP BY ac."code"`,
    company.id,
  );
  const financialByClass = Object.fromEntries(
    financialRows.map((row) => [
      row.code,
      {
        debitTotal: Number(row.debitTotal),
        creditTotal: Number(row.creditTotal),
      },
    ]),
  );

  for (const accountClassCode of ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']) {
    const totals = financialByClass[accountClassCode];

    if (!totals || totals.debitTotal + totals.creditTotal <= 0) {
      failures.push(`missing financial report activity for ${accountClassCode}`);
    }
  }

  const totalDebit = financialRows.reduce(
    (sum, row) => sum + Number(row.debitTotal),
    0,
  );
  const totalCredit = financialRows.reduce(
    (sum, row) => sum + Number(row.creditTotal),
    0,
  );

  if (Math.abs(totalDebit - totalCredit) > 0.001) {
    failures.push(`posted voucher totals are unbalanced: debit ${totalDebit}, credit ${totalCredit}`);
  }

  const safetyFailures = await collectResetSafetyFailures(prisma, company.id);

  if (safetyFailures.length > 0) {
    failures.push(
      `reset markers are not clean: ${safetyFailures
        .map((failure) => `${failure.label}=${failure.count}`)
        .join(', ')}`,
    );
  }

  return {
    company,
    counts,
    unitStatusCounts,
    financialByClass,
    contextCoverage: {
      projects: projectNames.size,
      unitTypes: unitTypeNames.size,
      blocks: blockNames.size,
      zones: zoneNames.size,
    },
    failures,
  };
};

const printSeedDryRun = () => {
  console.log('[demo-data] dry run: seed plan only');
  console.log(`- company: ${DEMO_COMPANY_NAME} (${DEMO_COMPANY_SLUG})`);
  console.log(`- context: ${RCG_CONTEXT_NOTE}`);
  console.log(`- users: ${DEMO_USER_SPECS.length} synthetic demo/UAT users`);
  console.log('- modules: org/security, accounting, project/property, CRM, HR, payroll, attachments, audit');
  console.log('- safety: no production startup, migration, Docker, or bootstrap auto-seeding');
  console.log('- reset marker: DEMO-/UAT-/SYNTH markers plus synthetic company slug');
};

export const runSeedDemoCommand = async () => {
  const options = parseCommonArguments(SEED_USAGE, {
    allowResetFirst: true,
  });

  if (options.dryRun) {
    printSeedDryRun();
    return;
  }

  const loadedFiles = loadEnvironmentFiles();
  assertDatabaseEnvironment(options);

  const prisma = await createPrismaClient();
  await prisma.$connect();

  try {
    console.log(
      `[demo-data] loaded env files: ${loadedFiles.join(', ') || 'none'}`,
    );

    if (options.resetFirst) {
      const resetResult = await resetDemoData(prisma);
      printCounts('reset-before-seed counts', resetResult.counts);
      console.log(
        `[demo-data] reset-before-seed deleted rows: ${resetResult.deletedRows}; deleted users: ${resetResult.deletedUsers}`,
      );
    }

    const result = await seedDemoData(prisma);
    console.log(
      `[demo-data] seeded synthetic demo/UAT company: ${result.company.name} (${result.company.slug})`,
    );
    console.log(
      `[demo-data] demo login: demo.admin@${DEMO_EMAIL_DOMAIN} / ${DEMO_PASSWORD}`,
    );
    printCounts('seeded counts', result.counts);
  } finally {
    await prisma.$disconnect();
  }
};

export const runResetDemoCommand = async () => {
  const options = parseCommonArguments(RESET_USAGE);
  const loadedFiles = loadEnvironmentFiles();
  assertDatabaseEnvironment(options);

  const prisma = await createPrismaClient();
  await prisma.$connect();

  try {
    console.log(
      `[demo-data] loaded env files: ${loadedFiles.join(', ') || 'none'}`,
    );
    const result = await resetDemoData(prisma, {
      dryRun: options.dryRun,
    });

    if (Object.keys(result.counts).length > 0) {
      printCounts(options.dryRun ? 'reset dry-run counts' : 'reset counts', result.counts);
    }

    if (options.dryRun) {
      console.log('[demo-data] dry run only; no data deleted.');
      return;
    }

    console.log(
      `[demo-data] reset complete: deleted rows ${result.deletedRows}; deleted users ${result.deletedUsers}`,
    );
  } finally {
    await prisma.$disconnect();
  }
};

export const runVerifyDemoCommand = async () => {
  const options = parseCommonArguments(VERIFY_USAGE);
  const loadedFiles = loadEnvironmentFiles();
  assertDatabaseEnvironment(options);

  const prisma = await createPrismaClient();
  await prisma.$connect();

  try {
    console.log(
      `[demo-data] loaded env files: ${loadedFiles.join(', ') || 'none'}`,
    );
    const result = await verifyDemoData(prisma);
    printCounts('verify counts', result.counts);
    console.log('[demo-data] unit status distribution');

    for (const [status, count] of Object.entries(result.unitStatusCounts)) {
      console.log(`- ${status}: ${count}`);
    }

    console.log('[demo-data] RCG context coverage');
    console.log(`- projects: ${result.contextCoverage.projects}`);
    console.log(`- unit types: ${result.contextCoverage.unitTypes}`);
    console.log(`- block patterns: ${result.contextCoverage.blocks}`);
    console.log(`- zone patterns: ${result.contextCoverage.zones}`);

    console.log('[demo-data] financial report readiness by account class');

    for (const [accountClassCode, totals] of Object.entries(
      result.financialByClass,
    )) {
      console.log(
        `- ${accountClassCode}: debit ${totals.debitTotal.toFixed(
          2,
        )}; credit ${totals.creditTotal.toFixed(2)}`,
      );
    }

    if (result.failures.length > 0) {
      console.error('[demo-data] verify failed:');

      for (const failure of result.failures) {
        console.error(`- ${failure}`);
      }

      throw new Error('Synthetic demo/UAT data verification failed.');
    }

    console.log(
      `[demo-data] verify ok: ${result.company.name} (${result.company.slug})`,
    );
  } finally {
    await prisma.$disconnect();
  }
};

export const demoDataScriptMetadata = {
  demoCompanyName: DEMO_COMPANY_NAME,
  demoCompanySlug: DEMO_COMPANY_SLUG,
  demoMarker: DEMO_MARKER,
  demoEmailDomain: DEMO_EMAIL_DOMAIN,
  seedUsage: SEED_USAGE,
  resetUsage: RESET_USAGE,
  verifyUsage: VERIFY_USAGE,
};
