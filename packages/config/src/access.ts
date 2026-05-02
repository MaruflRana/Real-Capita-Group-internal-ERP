export const COMPANY_ROLE_CODES = {
  admin: 'company_admin',
  accountant: 'company_accountant',
  hr: 'company_hr',
  member: 'company_member',
  payroll: 'company_payroll',
  sales: 'company_sales',
} as const;

export type CompanyRoleCode =
  (typeof COMPANY_ROLE_CODES)[keyof typeof COMPANY_ROLE_CODES];

export const COMPANY_ROLE_LABELS: Record<CompanyRoleCode, string> = {
  [COMPANY_ROLE_CODES.admin]: 'Company Administrator',
  [COMPANY_ROLE_CODES.accountant]: 'Company Accountant',
  [COMPANY_ROLE_CODES.hr]: 'Company HR',
  [COMPANY_ROLE_CODES.member]: 'Company Member',
  [COMPANY_ROLE_CODES.payroll]: 'Company Payroll',
  [COMPANY_ROLE_CODES.sales]: 'Company Sales',
};

export const PHASE1_MODULE_KEYS = [
  'dashboard',
  'orgSecurity',
  'accounting',
  'financialReports',
  'projectProperty',
  'crmPropertyDesk',
  'hr',
  'payroll',
  'auditDocuments',
  'auditEvents',
] as const;

export type Phase1ModuleKey = (typeof PHASE1_MODULE_KEYS)[number];

export interface Phase1ModuleAccessRule {
  label: string;
  description: string;
  allowedRoles: readonly CompanyRoleCode[];
}

export type Phase1AccessSummary = Record<Phase1ModuleKey, boolean>;

export const PHASE1_ACCESS_MATRIX: Record<
  Phase1ModuleKey,
  Phase1ModuleAccessRule
> = {
  dashboard: {
    label: 'Dashboard',
    description:
      'Authenticated operational home for the active company session.',
    allowedRoles: [
      COMPANY_ROLE_CODES.admin,
      COMPANY_ROLE_CODES.accountant,
      COMPANY_ROLE_CODES.hr,
      COMPANY_ROLE_CODES.member,
      COMPANY_ROLE_CODES.payroll,
      COMPANY_ROLE_CODES.sales,
    ],
  },
  orgSecurity: {
    label: 'Org & Security',
    description:
      'Company administration for companies, locations, departments, users, and role assignments.',
    allowedRoles: [COMPANY_ROLE_CODES.admin],
  },
  accounting: {
    label: 'Accounting',
    description:
      'Chart-of-accounts and voucher operations within the active company scope.',
    allowedRoles: [COMPANY_ROLE_CODES.admin, COMPANY_ROLE_CODES.accountant],
  },
  financialReports: {
    label: 'Financial Reports',
    description:
      'Read-only business overview, periodic daily/weekly/monthly/yearly reporting, trial balance, general ledger, profit and loss, and balance sheet views.',
    allowedRoles: [COMPANY_ROLE_CODES.admin, COMPANY_ROLE_CODES.accountant],
  },
  projectProperty: {
    label: 'Project & Property Master',
    description:
      'Project, cost-center, phase, block, zone, unit-type, unit-status, and unit master data.',
    allowedRoles: [COMPANY_ROLE_CODES.admin],
  },
  crmPropertyDesk: {
    label: 'CRM & Property Desk',
    description:
      'Customers, leads, bookings, sale contracts, installment schedules, and collections.',
    allowedRoles: [COMPANY_ROLE_CODES.admin, COMPANY_ROLE_CODES.sales],
  },
  hr: {
    label: 'HR',
    description:
      'Employees, attendance devices and logs, leave types, and leave requests.',
    allowedRoles: [COMPANY_ROLE_CODES.admin, COMPANY_ROLE_CODES.hr],
  },
  payroll: {
    label: 'Payroll',
    description:
      'Salary structures, payroll runs, payroll lines, and payroll posting.',
    allowedRoles: [
      COMPANY_ROLE_CODES.admin,
      COMPANY_ROLE_CODES.hr,
      COMPANY_ROLE_CODES.payroll,
    ],
  },
  auditDocuments: {
    label: 'Audit & Documents',
    description:
      'Attachments, upload/finalize flows, and linked-document operations.',
    allowedRoles: [
      COMPANY_ROLE_CODES.admin,
      COMPANY_ROLE_CODES.accountant,
      COMPANY_ROLE_CODES.hr,
      COMPANY_ROLE_CODES.payroll,
      COMPANY_ROLE_CODES.sales,
    ],
  },
  auditEvents: {
    label: 'Audit Events',
    description: 'Read-only audit trail browsing for the active company scope.',
    allowedRoles: [COMPANY_ROLE_CODES.admin],
  },
};

export const getPhase1ModuleAllowedRoles = (
  moduleKey: Phase1ModuleKey,
): readonly CompanyRoleCode[] => PHASE1_ACCESS_MATRIX[moduleKey].allowedRoles;

export const hasPhase1ModuleAccess = (
  roles: Iterable<string>,
  moduleKey: Phase1ModuleKey,
): boolean => {
  const assignedRoles = new Set(roles);

  return PHASE1_ACCESS_MATRIX[moduleKey].allowedRoles.some((role) =>
    assignedRoles.has(role),
  );
};

export const createEmptyPhase1AccessSummary = (): Phase1AccessSummary =>
  Object.fromEntries(
    PHASE1_MODULE_KEYS.map((moduleKey) => [moduleKey, false]),
  ) as Phase1AccessSummary;

export const buildPhase1AccessSummary = (
  roles: Iterable<string>,
): Phase1AccessSummary => {
  const assignedRoles = Array.from(roles);
  const summary = createEmptyPhase1AccessSummary();

  for (const moduleKey of PHASE1_MODULE_KEYS) {
    summary[moduleKey] = hasPhase1ModuleAccess(assignedRoles, moduleKey);
  }

  return summary;
};
