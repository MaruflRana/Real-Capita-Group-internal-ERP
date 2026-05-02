export const APP_ROUTES = {
  home: '/',
  login: '/login',
  unauthorized: '/unauthorized',
  dashboard: '/dashboard',
  accountingChartOfAccounts: '/accounting/chart-of-accounts',
  accountingVouchers: '/accounting/vouchers',
  accountingVoucherCreate: '/accounting/vouchers/new',
  accountingReportsBusinessOverview: '/accounting/reports/business-overview',
  accountingReportsDaily: '/accounting/reports/daily',
  accountingReportsWeekly: '/accounting/reports/weekly',
  accountingReportsMonthly: '/accounting/reports/monthly',
  accountingReportsYearly: '/accounting/reports/yearly',
  accountingReportsTrialBalance: '/accounting/reports/trial-balance',
  accountingReportsGeneralLedger: '/accounting/reports/general-ledger',
  accountingReportsProfitLoss: '/accounting/reports/profit-loss',
  accountingReportsBalanceSheet: '/accounting/reports/balance-sheet',
  auditDocumentsAttachments: '/audit-documents/attachments',
  auditDocumentsAuditEvents: '/audit-documents/audit-events',
  payrollSalaryStructures: '/payroll/salary-structures',
  payrollRuns: '/payroll/runs',
  payrollPosting: '/payroll/posting',
  projectPropertyProjects: '/project-property/projects',
  projectPropertyCostCenters: '/project-property/cost-centers',
  projectPropertyPhases: '/project-property/phases',
  projectPropertyBlocks: '/project-property/blocks',
  projectPropertyZones: '/project-property/zones',
  projectPropertyUnitTypes: '/project-property/unit-types',
  projectPropertyUnitStatuses: '/project-property/unit-statuses',
  projectPropertyUnits: '/project-property/units',
  crmPropertyDeskCustomers: '/crm-property-desk/customers',
  crmPropertyDeskLeads: '/crm-property-desk/leads',
  crmPropertyDeskBookings: '/crm-property-desk/bookings',
  crmPropertyDeskSaleContracts: '/crm-property-desk/sale-contracts',
  crmPropertyDeskInstallmentSchedules:
    '/crm-property-desk/installment-schedules',
  crmPropertyDeskCollections: '/crm-property-desk/collections',
  hrEmployees: '/hr/employees',
  hrAttendanceDevices: '/hr/attendance-devices',
  hrDeviceMappings: '/hr/device-mappings',
  hrAttendanceLogs: '/hr/attendance-logs',
  hrLeaveTypes: '/hr/leave-types',
  hrLeaveRequests: '/hr/leave-requests',
  orgSecurityCompanies: '/org-security/companies',
  orgSecurityLocations: '/org-security/locations',
  orgSecurityDepartments: '/org-security/departments',
  orgSecurityUsers: '/org-security/users',
  orgSecurityRoleAssignments: '/org-security/role-assignments',
} as const;

export const getVoucherDetailRoute = (voucherId: string) =>
  `${APP_ROUTES.accountingVouchers}/${voucherId}`;

export const getAttachmentDetailRoute = (attachmentId: string) =>
  `${APP_ROUTES.auditDocumentsAttachments}/${attachmentId}`;

export const getPayrollRunDetailRoute = (payrollRunId: string) =>
  `${APP_ROUTES.payrollRuns}/${payrollRunId}`;

export const PROTECTED_ROUTE_PREFIXES = [
  '/dashboard',
  '/accounting',
  '/audit-documents',
  '/payroll',
  '/project-property',
  '/crm-property-desk',
  '/hr',
  '/org-security',
] as const;
