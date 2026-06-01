import type {
  DefenseTraceCopyStrategy,
  DefenseTraceEntry,
  DefenseTraceFileReference,
  DefenseTraceSearchCommand,
} from './types';

const DEFAULT_COPY_STRATEGIES = [
  'relative-path',
  'absolute-path',
  'vscode-cli',
  'ripgrep',
] as const satisfies readonly DefenseTraceCopyStrategy[];

const fileRef = (
  relativePath: string,
  options: {
    line?: number;
    symbolName?: string;
    rolePurpose?: string;
  } = {},
): DefenseTraceFileReference => ({
  relativePath,
  ...(options.line === undefined ? {} : { line: options.line }),
  ...(options.symbolName ? { symbolName: options.symbolName } : {}),
  ...(options.rolePurpose ? { rolePurpose: options.rolePurpose } : {}),
  openStrategy: 'vscode-file-uri',
  copyStrategy: DEFAULT_COPY_STRATEGIES,
});

const searchCommand = (
  label: string,
  command: string,
  scope?: string,
): DefenseTraceSearchCommand => ({
  label,
  command,
  ...(scope ? { scope } : {}),
});

export const defenseTraceRegistry = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    category: 'dashboard',
    routePatterns: ['/dashboard'],
    apiPatterns: ['dashboard', 'summary', 'activity'],
    uiTexts: [
      'Dashboard',
      'Business result',
      'Total assets',
      'Operational health',
    ],
    primaryFrontendFile: fileRef('apps/web/src/features/dashboard/dashboard-page.tsx', {
      symbolName: 'DashboardPage',
      rolePurpose: 'Main UI component',
    }),
    frontendRouteFiles: [
      fileRef('apps/web/src/app/(app)/dashboard/page.tsx', {
        rolePurpose: 'Route page',
      }),
    ],
    frontendFeatureFiles: [
      fileRef('apps/web/src/features/dashboard/dashboard-page.tsx', {
        symbolName: 'DashboardPage',
        rolePurpose: 'Main UI component',
      }),
      fileRef('apps/web/src/features/dashboard/hooks.ts', {
        rolePurpose: 'Dashboard hooks',
      }),
      fileRef('apps/web/src/features/dashboard/shared.tsx', {
        rolePurpose: 'Shared dashboard components',
      }),
      fileRef('apps/web/src/features/dashboard/health-status-card.tsx', {
        rolePurpose: 'Health status card',
      }),
      fileRef('apps/web/src/features/dashboard/utils.ts', {
        rolePurpose: 'Dashboard utility functions',
      }),
    ],
    frontendApiFiles: [
      fileRef('apps/web/src/lib/api/dashboard.ts', {
        rolePurpose: 'API helper',
      }),
      fileRef('apps/web/src/lib/api/financial-reporting.ts', {
        rolePurpose: 'Financial reporting API helper',
      }),
      fileRef('apps/web/src/lib/api/accounting.ts', {
        rolePurpose: 'Accounting API helper',
      }),
      fileRef('apps/web/src/lib/api/crm-property-desk.ts', {
        rolePurpose: 'CRM API helper',
      }),
      fileRef('apps/web/src/lib/api/hr-core.ts', {
        rolePurpose: 'HR API helper',
      }),
      fileRef('apps/web/src/lib/api/payroll.ts', {
        rolePurpose: 'Payroll API helper',
      }),
      fileRef('apps/web/src/lib/api/audit-documents.ts', {
        rolePurpose: 'Audit documents API helper',
      }),
    ],
    backendFiles: [],
    prismaModels: [
      'Voucher',
      'VoucherLine',
      'Unit',
      'Booking',
      'SaleContract',
      'Collection',
      'Employee',
      'LeaveRequest',
      'PayrollRun',
      'Attachment',
      'AuditEvent',
    ],
    searchCommands: [
      searchCommand(
        'Find dashboard page composition',
        'rg "DashboardPage|getDashboardSummary|getDashboardActivity" apps/web/src',
      ),
      searchCommand(
        'Find backend endpoints used by dashboard helper calls',
        'rg "listVouchers|listBookings|listPayrollRuns|getTrialBalanceReport" apps/web/src/lib/api apps/api/src/app',
      ),
    ],
    presenterSummary:
      'The dashboard is a frontend aggregation surface that summarizes existing company-scoped ERP endpoints without adding a dedicated dashboard backend controller.',
    stackContext:
      'Next.js renders the dashboard route, React hooks call typed web API helpers, those helpers reuse existing NestJS module endpoints, and Prisma data comes from the underlying accounting, CRM, HR, payroll, document, and audit models.',
    beginnerExplanation:
      'The dashboard is like a control room. The screen itself is frontend code, the helper gathers small pieces of data from existing API endpoints, and the database records come from the modules that already own each business area.',
    implementationNotes: [
      'No dedicated NestJS dashboard controller was found; backendFiles is intentionally empty for this entry.',
      'Dashboard API calls are distributed through existing typed helpers in apps/web/src/lib/api.',
    ],
    editImpact: [
      'Layout or wording changes are usually frontend-only.',
      'Changing a metric definition can affect the API helper and the module endpoint that owns the source data.',
      'Changing stored fields or relationships would be database-backed and is outside this phase.',
    ],
    studyNotes: [
      'Trace dashboard cards from dashboard-page.tsx to hooks.ts, then into apps/web/src/lib/api/dashboard.ts.',
      'Use the search command when a metric comes from another module helper.',
    ],
    riskNotes: [
      'Dashboard totals may blend multiple modules, so verify the source helper before changing calculations.',
      'Keep dashboard behavior read-only unless a later phase explicitly scopes actions.',
    ],
  },
  {
    id: 'login-auth',
    label: 'Login/Auth',
    category: 'auth',
    routePatterns: ['/login'],
    apiPatterns: ['auth/login', 'auth/me', 'auth/refresh', 'auth/logout'],
    uiTexts: ['Real Capita Group', 'Checking session', 'Select the company workspace'],
    primaryFrontendFile: fileRef('apps/web/src/features/auth/login-page.tsx', {
      symbolName: 'LoginPage',
    }),
    frontendRouteFiles: [
      fileRef('apps/web/src/app/(public)/login/page.tsx'),
    ],
    frontendFeatureFiles: [
      fileRef('apps/web/src/features/auth/login-page.tsx', {
        symbolName: 'LoginPage',
      }),
      fileRef('apps/web/src/components/providers/auth-provider.tsx'),
      fileRef('apps/web/src/components/auth/auth-guard.tsx'),
    ],
    frontendApiFiles: [
      fileRef('apps/web/src/lib/api/auth.ts'),
      fileRef('apps/web/src/lib/api/client.ts'),
      fileRef('apps/web/src/lib/api/types.ts'),
    ],
    backendFiles: [
      fileRef('apps/api/src/app/auth/auth.controller.ts'),
      fileRef('apps/api/src/app/auth/auth.service.ts'),
      fileRef('apps/api/src/app/auth/auth.repository.ts'),
      fileRef('apps/api/src/app/auth/auth-token.service.ts'),
      fileRef('apps/api/src/app/auth/auth-cookie.service.ts'),
      fileRef('apps/api/src/app/auth/password.service.ts'),
      fileRef('apps/api/src/app/auth/strategies/access-token.strategy.ts'),
    ],
    prismaModels: ['User', 'Company', 'Role', 'UserRole', 'RefreshToken'],
    searchCommands: [
      searchCommand(
        'Find login flow across frontend and backend',
        'rg "login|refresh|logout|getCurrentUser|signIn" apps/web/src apps/api/src/app/auth',
      ),
      searchCommand(
        'Find session provider usage',
        'rg "useAuth|AuthProvider|AuthGuard" apps/web/src',
      ),
    ],
    presenterSummary:
      'Login/Auth connects the public login screen to the NestJS auth API, browser cookies, refresh-token rotation, and active company selection.',
    stackContext:
      'The frontend login form submits through the auth provider and typed auth helper. The backend auth controller/service validates credentials, issues session cookies, and reads User, Role, UserRole, RefreshToken, and Company records through Prisma.',
    beginnerExplanation:
      'The login screen is frontend. The actual sign-in decision is backend. Prisma checks the user, company, role assignments, and refresh token records that keep the browser session alive.',
    implementationNotes: [
      'The public route delegates UI to LoginPage and session state to auth-provider.tsx.',
      'The browser API helper calls /auth/login, /auth/me, /auth/refresh, and /auth/logout through the shared API client.',
    ],
    editImpact: [
      'Visual login form changes are usually frontend-only.',
      'Session rules, cookie behavior, password checks, and company selection are backend/API changes.',
      'Changing auth storage tables would be database-backed and requires explicit schema scope.',
    ],
    studyNotes: [
      'Start at login-page.tsx, follow signIn into auth-provider.tsx, then inspect apps/web/src/lib/api/auth.ts.',
      'Backend tracing starts at auth.controller.ts and moves into auth.service.ts and auth.repository.ts.',
    ],
    riskNotes: [
      'Auth code protects every module, so changes require targeted auth tests.',
      'Do not log credential values, cookie contents, or token contents while tracing.',
    ],
  },
  {
    id: 'role-access',
    label: 'Role Access',
    category: 'authorization',
    routePatterns: [
      '/dashboard',
      '/accounting/*',
      '/crm-property-desk/*',
      '/hr/*',
      '/payroll/*',
      '/audit-documents/*',
      '/org-security/*',
    ],
    apiPatterns: ['auth/me', 'roles', 'users/:userId/roles', 'access'],
    uiTexts: ['Company Administrator', 'Company Accountant', 'Company HR'],
    primaryFrontendFile: fileRef('apps/web/src/lib/access.ts'),
    frontendRouteFiles: [
      fileRef('apps/web/src/app/unauthorized/page.tsx'),
    ],
    frontendFeatureFiles: [
      fileRef('apps/web/src/lib/access.ts'),
      fileRef('apps/web/src/features/shell/route-access-boundary.tsx'),
      fileRef('apps/web/src/features/shell/app-shell.tsx'),
      fileRef('apps/web/src/components/auth/auth-guard.tsx'),
      fileRef('packages/config/src/access.ts'),
    ],
    frontendApiFiles: [fileRef('apps/web/src/lib/api/auth.ts')],
    backendFiles: [
      fileRef('apps/api/src/app/auth/guards/roles.guard.ts'),
      fileRef('apps/api/src/app/auth/guards/company-assignment.guard.ts'),
      fileRef('apps/api/src/app/auth/guards/company-scope.guard.ts'),
      fileRef('apps/api/src/app/auth/decorators/roles.decorator.ts'),
      fileRef(
        'apps/api/src/app/auth/decorators/require-company-accounting-access.decorator.ts',
      ),
      fileRef(
        'apps/api/src/app/auth/decorators/require-company-document-access.decorator.ts',
      ),
      fileRef(
        'apps/api/src/app/auth/decorators/require-company-hr-access.decorator.ts',
      ),
      fileRef(
        'apps/api/src/app/auth/decorators/require-company-payroll-access.decorator.ts',
      ),
      fileRef(
        'apps/api/src/app/auth/decorators/require-company-sales-access.decorator.ts',
      ),
    ],
    prismaModels: ['Role', 'UserRole', 'Company', 'User'],
    searchCommands: [
      searchCommand(
        'Find access matrix and route boundary usage',
        'rg "PHASE1_ACCESS_MATRIX|RouteAccessBoundary|canAccessRoute|getRouteAccessRequirement" packages apps/web/src apps/api/src',
      ),
      searchCommand(
        'Find backend role decorators',
        'rg "RequireCompany|Roles\\(" apps/api/src/app',
      ),
    ],
    presenterSummary:
      'Role Access is the shared permission layer that controls visible navigation, protected frontend routes, and backend endpoint guards.',
    stackContext:
      'The shared access matrix lives in packages/config. The web app uses it for route and navigation decisions, while the API uses guards and decorators to enforce company-scoped roles on REST endpoints.',
    beginnerExplanation:
      'The frontend decides what the signed-in user should see. The backend still makes the final access decision before any protected API response is returned.',
    implementationNotes: [
      'Role labels and module access rules are centralized in packages/config/src/access.ts.',
      'The exact backend decorator varies by module; use the search command for the target controller.',
    ],
    editImpact: [
      'Changing labels or frontend route messages is frontend/shared-config work.',
      'Changing who can access a module affects shared config and backend guards.',
      'Changing stored role assignments is database-backed and involves Role/UserRole records.',
    ],
    studyNotes: [
      'Explain access as two layers: frontend guidance plus backend enforcement.',
      'For route questions, start with apps/web/src/lib/access.ts and app-shell.tsx.',
    ],
    riskNotes: [
      'Never rely on hidden navigation as the only protection; backend guards must remain aligned.',
      'Any role-matrix change can affect multiple modules at once.',
    ],
  },
  {
    id: 'chart-of-accounts',
    label: 'Chart of Accounts',
    category: 'accounting',
    routePatterns: ['/accounting/chart-of-accounts'],
    uiTexts: ['Chart of Accounts', 'Account classes', 'Account groups'],
    primaryFrontendFile: fileRef('apps/web/src/features/accounting/chart-of-accounts-page.tsx'),
    frontendRouteFiles: [
      fileRef('apps/web/src/app/(app)/accounting/chart-of-accounts/page.tsx'),
    ],
    frontendFeatureFiles: [
      fileRef('apps/web/src/features/accounting/chart-of-accounts-page.tsx'),
      fileRef('apps/web/src/features/accounting/chart-of-accounts-forms.tsx'),
      fileRef('apps/web/src/features/accounting/hooks.ts'),
      fileRef('apps/web/src/features/accounting/shared.tsx'),
    ],
    frontendApiFiles: [fileRef('apps/web/src/lib/api/accounting.ts')],
    backendFiles: [
      fileRef('apps/api/src/app/chart-of-accounts/account-classes.controller.ts'),
      fileRef('apps/api/src/app/chart-of-accounts/account-groups.controller.ts'),
      fileRef('apps/api/src/app/chart-of-accounts/ledger-accounts.controller.ts'),
      fileRef(
        'apps/api/src/app/chart-of-accounts/particular-accounts.controller.ts',
      ),
      fileRef('apps/api/src/app/chart-of-accounts/chart-of-accounts.service.ts'),
      fileRef('apps/api/src/app/chart-of-accounts/chart-of-accounts.module.ts'),
    ],
    prismaModels: [
      'AccountClass',
      'AccountGroup',
      'LedgerAccount',
      'ParticularAccount',
    ],
    searchCommands: [
      searchCommand(
        'Find chart-of-accounts frontend and API helper code',
        'rg "ChartOfAccounts|AccountGroup|LedgerAccount|ParticularAccount" apps/web/src/features/accounting apps/web/src/lib/api/accounting.ts',
      ),
      searchCommand(
        'Find chart-of-accounts backend endpoints',
        'rg "account-classes|account-groups|ledger-accounts|particular-accounts" apps/api/src/app/chart-of-accounts',
      ),
    ],
    presenterSummary:
      'Chart of Accounts manages the accounting hierarchy used by vouchers and reports: account classes, groups, ledger accounts, and particular accounts.',
    stackContext:
      'The Next.js route renders accounting feature components. The typed accounting API helper calls NestJS chart-of-accounts controllers, and the service persists hierarchy records through Prisma models.',
    beginnerExplanation:
      'This screen is the accounting address book. Vouchers post money to particular accounts, which belong to ledgers, groups, and account classes.',
    implementationNotes: [
      'The frontend feature files are shared with voucher screens, so inspect component names before editing.',
      'Account classes are catalog-style records while company-scoped account groups, ledgers, and particulars are editable business data.',
    ],
    editImpact: [
      'Table layout, filters, and form copy are frontend-only.',
      'Create/update rules and validation are backend/API work.',
      'Changing hierarchy relationships or columns is database-backed and outside this phase.',
    ],
    studyNotes: [
      'Trace a create form from chart-of-accounts-forms.tsx to apps/web/src/lib/api/accounting.ts.',
      'Then follow the matching controller into chart-of-accounts.service.ts.',
    ],
    riskNotes: [
      'Chart-of-accounts changes can affect voucher posting and financial report outputs.',
      'Avoid changing account hierarchy semantics without accounting validation.',
    ],
  },
  {
    id: 'vouchers',
    label: 'Vouchers',
    category: 'accounting',
    routePatterns: [
      '/accounting/vouchers',
      '/accounting/vouchers/new',
      '/accounting/vouchers/[voucherId]',
    ],
    apiPatterns: [
      'accounting/vouchers',
      'accounting/vouchers/:voucherId',
      'accounting/vouchers/:voucherId/lines',
      'accounting/vouchers/:voucherId/post',
    ],
    uiTexts: ['Vouchers', 'New voucher', 'Post voucher', 'Voucher detail'],
    primaryFrontendFile: fileRef('apps/web/src/features/accounting/vouchers-page.tsx'),
    frontendRouteFiles: [
      fileRef('apps/web/src/app/(app)/accounting/vouchers/page.tsx'),
      fileRef('apps/web/src/app/(app)/accounting/vouchers/new/page.tsx'),
      fileRef('apps/web/src/app/(app)/accounting/vouchers/[voucherId]/page.tsx'),
    ],
    frontendFeatureFiles: [
      fileRef('apps/web/src/features/accounting/vouchers-page.tsx'),
      fileRef('apps/web/src/features/accounting/voucher-create-page.tsx'),
      fileRef('apps/web/src/features/accounting/voucher-detail-page.tsx'),
      fileRef('apps/web/src/features/accounting/voucher-forms.tsx'),
      fileRef('apps/web/src/features/accounting/hooks.ts'),
    ],
    frontendApiFiles: [fileRef('apps/web/src/lib/api/accounting.ts')],
    backendFiles: [
      fileRef('apps/api/src/app/vouchers/vouchers.controller.ts'),
      fileRef('apps/api/src/app/vouchers/vouchers.service.ts'),
      fileRef('apps/api/src/app/vouchers/voucher-exports.ts'),
      fileRef('apps/api/src/app/vouchers/dto/vouchers.dto.ts'),
      fileRef('apps/api/src/app/vouchers/vouchers.module.ts'),
    ],
    prismaModels: ['Voucher', 'VoucherLine', 'ParticularAccount', 'User'],
    searchCommands: [
      searchCommand(
        'Find voucher frontend actions and helper calls',
        'rg "createVoucherDraft|updateVoucherLine|postVoucher|VoucherDetail" apps/web/src',
      ),
      searchCommand(
        'Find voucher backend posting rules',
        'rg "post|balanced|VoucherLine|voucherDate" apps/api/src/app/vouchers',
      ),
    ],
    presenterSummary:
      'Vouchers are the accounting transaction workflow: draft creation, voucher-line editing, explicit posting, CSV export, and print-friendly detail output.',
    stackContext:
      'Frontend pages render the voucher list, creation form, and detail screen. The accounting API helper calls the NestJS voucher controller/service, which validates balanced lines and stores Voucher and VoucherLine records with Prisma.',
    beginnerExplanation:
      'A voucher records debits and credits. The frontend lets the user enter lines; the backend checks that the accounting entry is balanced before it becomes posted business data.',
    implementationNotes: [
      'Voucher helpers live inside accounting.ts with chart-of-accounts helpers.',
      'Posting behavior is backend-owned and should be traced through vouchers.service.ts.',
    ],
    editImpact: [
      'List/detail presentation is usually frontend-only.',
      'Draft, line, posting, and export behavior are backend/API changes.',
      'Changing voucher storage or posting constraints is database-backed.',
    ],
    studyNotes: [
      'Start from voucher-detail-page.tsx when explaining an existing voucher.',
      'Start from voucher-create-page.tsx and voucher-forms.tsx when explaining data entry.',
    ],
    riskNotes: [
      'Voucher changes can affect financial reports, payroll posting, and CRM collections.',
      'Posting rules must preserve debit/credit balance.',
    ],
  },
  {
    id: 'trial-balance',
    label: 'Trial Balance',
    category: 'financial-reporting',
    routePatterns: ['/accounting/reports/trial-balance'],
    apiPatterns: [
      'accounting/reports/trial-balance',
      'accounting/reports/trial-balance/export',
    ],
    uiTexts: ['Trial Balance', 'Closing debit', 'Closing credit'],
    primaryFrontendFile: fileRef('apps/web/src/features/financial-reporting/trial-balance-page.tsx'),
    frontendRouteFiles: [
      fileRef('apps/web/src/app/(app)/accounting/reports/trial-balance/page.tsx'),
    ],
    frontendFeatureFiles: [
      fileRef('apps/web/src/features/financial-reporting/trial-balance-page.tsx'),
      fileRef('apps/web/src/features/financial-reporting/hooks.ts'),
      fileRef('apps/web/src/features/financial-reporting/filters.tsx'),
      fileRef('apps/web/src/features/financial-reporting/tables.tsx'),
      fileRef('apps/web/src/features/financial-reporting/shared.tsx'),
      fileRef('apps/web/src/features/financial-reporting/printable-report.tsx'),
    ],
    frontendApiFiles: [fileRef('apps/web/src/lib/api/financial-reporting.ts')],
    backendFiles: [
      fileRef('apps/api/src/app/financial-reporting/financial-reporting.controller.ts'),
      fileRef('apps/api/src/app/financial-reporting/financial-reporting.service.ts'),
      fileRef(
        'apps/api/src/app/financial-reporting/financial-reporting.repository.ts',
      ),
      fileRef(
        'apps/api/src/app/financial-reporting/financial-reporting-exports.ts',
      ),
      fileRef('apps/api/src/app/financial-reporting/dto/financial-reporting.dto.ts'),
    ],
    prismaModels: [
      'Voucher',
      'VoucherLine',
      'AccountClass',
      'AccountGroup',
      'LedgerAccount',
      'ParticularAccount',
    ],
    searchCommands: [
      searchCommand(
        'Find trial balance frontend and API helper',
        'rg "TrialBalance|getTrialBalanceReport|trial-balance" apps/web/src',
      ),
      searchCommand(
        'Find trial balance backend query path',
        'rg "trial-balance|TrialBalance|trialBalance" apps/api/src/app/financial-reporting',
      ),
    ],
    presenterSummary:
      'Trial Balance is a read-only financial report built from posted voucher lines and the chart-of-accounts hierarchy.',
    stackContext:
      'The frontend report page controls filters and display. The financial-reporting API helper calls the NestJS report controller/service, and the repository uses reporting SQL over Prisma-managed tables.',
    beginnerExplanation:
      'The trial balance checks whether debit and credit totals match. The UI only shows the report; the backend calculates it from posted accounting records.',
    implementationNotes: [
      'Financial reporting intentionally centralizes report queries in financial-reporting.repository.ts.',
      'CSV export follows the same financial-reporting backend module.',
    ],
    editImpact: [
      'Wording, layout, filters, and print presentation are frontend-only unless filter behavior changes API parameters.',
      'Report totals and grouping are backend/report-query work.',
      'Changing accounting source tables is database-backed.',
    ],
    studyNotes: [
      'Trace from trial-balance-page.tsx to getTrialBalanceReport.',
      'Use the backend search command to find the exact repository method.',
    ],
    riskNotes: [
      'Report calculation changes must be checked against accounting expectations.',
      'Do not alter posted voucher semantics from the report screen.',
    ],
  },
  {
    id: 'business-overview',
    label: 'Business Overview',
    category: 'financial-reporting',
    routePatterns: ['/accounting/reports/business-overview'],
    apiPatterns: [
      'accounting/reports/business-overview',
      'accounting/reports/business-overview/export',
    ],
    uiTexts: ['Business Performance Overview', 'Business result', 'Collection efficiency'],
    primaryFrontendFile: fileRef('apps/web/src/features/financial-reporting/business-report-page.tsx'),
    frontendRouteFiles: [
      fileRef(
        'apps/web/src/app/(app)/accounting/reports/business-overview/page.tsx',
      ),
    ],
    frontendFeatureFiles: [
      fileRef('apps/web/src/features/financial-reporting/business-report-page.tsx'),
      fileRef('apps/web/src/features/financial-reporting/hooks.ts'),
      fileRef('apps/web/src/features/financial-reporting/shared.tsx'),
      fileRef('apps/web/src/features/financial-reporting/printable-report.tsx'),
      fileRef('apps/web/src/features/analytics/components.tsx'),
    ],
    frontendApiFiles: [fileRef('apps/web/src/lib/api/financial-reporting.ts')],
    backendFiles: [
      fileRef('apps/api/src/app/financial-reporting/financial-reporting.controller.ts'),
      fileRef('apps/api/src/app/financial-reporting/financial-reporting.service.ts'),
      fileRef(
        'apps/api/src/app/financial-reporting/financial-reporting.repository.ts',
      ),
      fileRef(
        'apps/api/src/app/financial-reporting/financial-reporting-exports.ts',
      ),
    ],
    prismaModels: [
      'Voucher',
      'VoucherLine',
      'Booking',
      'SaleContract',
      'Collection',
      'Customer',
    ],
    searchCommands: [
      searchCommand(
        'Find business overview frontend report flow',
        'rg "BusinessOverview|Business Performance Overview|getBusinessOverviewReport" apps/web/src',
      ),
      searchCommand(
        'Find business overview backend calculations',
        'rg "business-overview|BusinessOverview|overview" apps/api/src/app/financial-reporting',
      ),
    ],
    presenterSummary:
      'Business Overview is a management-facing financial and commercial report combining posted voucher results with CRM sales and collection activity.',
    stackContext:
      'Next.js renders the report route, the financial-reporting helper requests the business overview endpoint, and NestJS calculates the report from accounting plus CRM/property-desk records.',
    beginnerExplanation:
      'This report answers how the business is doing. It combines accounting results with sales contracts, bookings, and collections, then presents the result in a dashboard-like report page.',
    implementationNotes: [
      'The visible report title is Business Performance Overview while the route and API naming use business overview.',
      'The chart component is shared with analytics components, so visual changes can affect other retained charts.',
    ],
    editImpact: [
      'Report presentation and chart styling are frontend-only.',
      'Period totals, ratios, and CSV output require backend/reporting changes.',
      'Changing source fields or relationships is database-backed.',
    ],
    studyNotes: [
      'Use this entry for final-defense questions about business value and report source of truth.',
      'Separate UI labels from backend calculation ownership when explaining the stack.',
    ],
    riskNotes: [
      'Report metrics mix accounting and commercial data, so calculation changes need focused verification.',
      'Shared chart changes can alter dashboard visuals.',
    ],
  },
  {
    id: 'customers',
    label: 'Customers',
    category: 'crm',
    routePatterns: ['/crm-property-desk/customers'],
    apiPatterns: ['customers'],
    uiTexts: ['Customers', 'Customer', 'CRM & Property Desk'],
    primaryFrontendFile: fileRef('apps/web/src/features/crm-property-desk/customers-page.tsx'),
    frontendRouteFiles: [
      fileRef('apps/web/src/app/(app)/crm-property-desk/customers/page.tsx'),
    ],
    frontendFeatureFiles: [
      fileRef('apps/web/src/features/crm-property-desk/customers-page.tsx'),
      fileRef('apps/web/src/features/crm-property-desk/forms.tsx'),
      fileRef('apps/web/src/features/crm-property-desk/hooks.ts'),
      fileRef('apps/web/src/features/crm-property-desk/shared.tsx'),
      fileRef('apps/web/src/features/crm-property-desk/utils.ts'),
    ],
    frontendApiFiles: [fileRef('apps/web/src/lib/api/crm-property-desk.ts')],
    backendFiles: [
      fileRef('apps/api/src/app/crm-property-desk/customers.controller.ts'),
      fileRef('apps/api/src/app/crm-property-desk/customers.service.ts'),
      fileRef('apps/api/src/app/crm-property-desk/dto/customers.dto.ts'),
      fileRef('apps/api/src/app/crm-property-desk/crm-property-desk.module.ts'),
    ],
    prismaModels: ['Customer', 'Booking', 'SaleContract', 'Collection'],
    searchCommands: [
      searchCommand(
        'Find customer list frontend and helper calls',
        'rg "CustomersPage|listCustomers|createCustomer|updateCustomer" apps/web/src',
      ),
      searchCommand(
        'Find customer backend controller and service methods',
        'rg "customers|Customer" apps/api/src/app/crm-property-desk',
      ),
    ],
    presenterSummary:
      'Customers is the CRM list and maintenance surface for company-scoped customer records used by bookings, contracts, and collections.',
    stackContext:
      'The customer route renders CRM feature components. The web helper calls the customer REST endpoints, and the backend service stores Customer records plus related CRM activity through Prisma.',
    beginnerExplanation:
      'The customer screen is where people records are listed and edited. The customer record then links to property bookings, contracts, and payments in the CRM module.',
    implementationNotes: [
      'Customers share forms, hooks, and utility files with other CRM/property-desk pages.',
      'Profile-level read-only aggregation is covered by the separate Customer Profile entry.',
    ],
    editImpact: [
      'List columns, filters, and form layout are usually frontend-only.',
      'Customer validation and persistence are backend/API changes.',
      'New customer fields require database-backed scope.',
    ],
    studyNotes: [
      'Trace listCustomers in crm-property-desk.ts, then match it to customers.controller.ts.',
      'Use shared.tsx and forms.tsx carefully because other CRM screens may reuse them.',
    ],
    riskNotes: [
      'Customer changes may affect bookings, sale contracts, collections, and Customer Profile display.',
      'Keep customer identity/contact data handling minimal in logs and debug output.',
    ],
  },
  {
    id: 'customer-profile',
    label: 'Customer Profile',
    category: 'crm',
    routePatterns: ['/crm-property-desk/customers/[customerId]'],
    apiPatterns: ['customers/:customerId/profile'],
    uiTexts: ['Customer Profile', 'Transaction History', 'Commercial timeline'],
    primaryFrontendFile: fileRef('apps/web/src/features/crm-property-desk/customer-profile-page.tsx'),
    frontendRouteFiles: [
      fileRef(
        'apps/web/src/app/(app)/crm-property-desk/customers/[customerId]/page.tsx',
      ),
    ],
    frontendFeatureFiles: [
      fileRef('apps/web/src/features/crm-property-desk/customer-profile-page.tsx'),
      fileRef('apps/web/src/features/crm-property-desk/hooks.ts'),
      fileRef('apps/web/src/features/crm-property-desk/shared.tsx'),
      fileRef('apps/web/src/features/crm-property-desk/utils.ts'),
    ],
    frontendApiFiles: [fileRef('apps/web/src/lib/api/crm-property-desk.ts')],
    backendFiles: [
      fileRef('apps/api/src/app/crm-property-desk/customers.controller.ts'),
      fileRef('apps/api/src/app/crm-property-desk/customers.service.ts'),
      fileRef('apps/api/src/app/crm-property-desk/collections.service.ts'),
      fileRef('apps/api/src/app/crm-property-desk/bookings.service.ts'),
      fileRef('apps/api/src/app/crm-property-desk/sale-contracts.service.ts'),
    ],
    prismaModels: [
      'Customer',
      'Booking',
      'SaleContract',
      'InstallmentSchedule',
      'Collection',
      'Voucher',
    ],
    searchCommands: [
      searchCommand(
        'Find customer profile frontend flow',
        'rg "CustomerProfile|getCustomerProfile|Transaction History|Commercial timeline" apps/web/src',
      ),
      searchCommand(
        'Find customer profile backend aggregation',
        'rg "profile|CustomerProfile|transaction" apps/api/src/app/crm-property-desk',
      ),
    ],
    presenterSummary:
      'Customer Profile is the Customer 360 view that consolidates identity, bookings, contracts, installment and collection history, voucher-linked receipt context, and activity timeline.',
    stackContext:
      'The frontend dynamic route loads a customer id, the CRM API helper calls the profile endpoint, and backend CRM services aggregate related Prisma records for read-only display.',
    beginnerExplanation:
      'The list page shows many customers; the profile page opens one customer and gathers their related business records into one place.',
    implementationNotes: [
      'The exact profile assembly should be verified inside customers.service.ts before changing aggregation logic.',
      'Receipt detail has a separate dynamic route under collections and may be linked from the profile.',
    ],
    editImpact: [
      'Profile card layout and wording are frontend-only.',
      'Changing which related records appear is backend/API work.',
      'Adding a new persisted relation or metric may require database-backed scope.',
    ],
    studyNotes: [
      'Use Customer Profile to explain how one screen can read from multiple CRM and accounting-backed models.',
      'Separate profile display from receipt print behavior.',
    ],
    riskNotes: [
      'Profile changes can be high impact because the page combines several workflows.',
      'Aggregation changes must preserve company scoping.',
    ],
  },
  {
    id: 'attachments-documents',
    label: 'Attachments/Documents',
    category: 'attachments',
    routePatterns: [
      '/audit-documents/attachments',
      '/audit-documents/attachments/[attachmentId]',
    ],
    apiPatterns: [
      'attachments',
      'attachments/uploads',
      'attachments/:attachmentId/finalize',
      'attachments/:attachmentId/download-url',
      'attachments/:attachmentId/links',
      'attachments/references',
    ],
    uiTexts: ['Attachments', 'Upload attachment', 'Download access'],
    primaryFrontendFile: fileRef('apps/web/src/features/audit-documents/attachments-page.tsx'),
    frontendRouteFiles: [
      fileRef('apps/web/src/app/(app)/audit-documents/attachments/page.tsx'),
      fileRef(
        'apps/web/src/app/(app)/audit-documents/attachments/[attachmentId]/page.tsx',
      ),
    ],
    frontendFeatureFiles: [
      fileRef('apps/web/src/features/audit-documents/attachments-page.tsx'),
      fileRef('apps/web/src/features/audit-documents/attachment-detail-page.tsx'),
      fileRef('apps/web/src/features/audit-documents/forms.tsx'),
      fileRef('apps/web/src/features/audit-documents/hooks.ts'),
      fileRef('apps/web/src/features/audit-documents/shared.tsx'),
      fileRef('apps/web/src/features/audit-documents/utils.ts'),
    ],
    frontendApiFiles: [fileRef('apps/web/src/lib/api/audit-documents.ts')],
    backendFiles: [
      fileRef('apps/api/src/app/attachments/attachments.controller.ts'),
      fileRef('apps/api/src/app/attachments/attachments.service.ts'),
      fileRef('apps/api/src/app/attachments/attachments-references.controller.ts'),
      fileRef('apps/api/src/app/attachments/attachments-references.service.ts'),
      fileRef('apps/api/src/app/attachments/attachment-entity-reference.service.ts'),
      fileRef('apps/api/src/app/storage/storage.service.ts'),
      fileRef('apps/api/src/app/storage/storage.module.ts'),
    ],
    prismaModels: ['Attachment', 'AttachmentLink', 'AuditEvent', 'User'],
    searchCommands: [
      searchCommand(
        'Find attachment frontend upload and download flow',
        'rg "Attachment|createAttachmentUploadIntent|DownloadAccess|finalize" apps/web/src',
      ),
      searchCommand(
        'Find attachment backend storage flow',
        'rg "upload|download|presigned|AttachmentLink|Storage" apps/api/src/app/attachments apps/api/src/app/storage',
      ),
    ],
    presenterSummary:
      'Attachments/Documents provides company-scoped document records, entity links, upload intent creation, direct object-storage upload, finalization, and download access.',
    stackContext:
      'The frontend asks the API for upload/download instructions. The API records attachment metadata and returns storage access details, while the browser talks directly to object storage for file bytes.',
    beginnerExplanation:
      'The ERP stores document information in the database, but the actual file bytes go to object storage. The web app does not proxy file contents through Next.js.',
    implementationNotes: [
      'Document upload is a multi-step flow: create intent, browser upload to storage, then finalize in the API.',
      'Attachment links are polymorphic by entity type and entity id, so confirm target entity handling before editing.',
    ],
    editImpact: [
      'Attachment list and detail presentation are frontend-only.',
      'Upload, finalize, download access, and link behavior are backend/API changes.',
      'Changing attachment metadata or link schema is database-backed.',
    ],
    studyNotes: [
      'Use this entry to explain MinIO/S3-compatible storage without claiming Next.js handles file bytes.',
      'Trace createAttachmentUploadIntent first, then the finalization helper.',
    ],
    riskNotes: [
      'Do not print upload URLs, cookie values, or credential-like material in debug output.',
      'Storage endpoint changes can affect browser reachability across machines.',
    ],
  },
  {
    id: 'hr',
    label: 'HR',
    category: 'hr',
    routePatterns: [
      '/hr/employees',
      '/hr/attendance-devices',
      '/hr/device-mappings',
      '/hr/attendance-logs',
      '/hr/leave-types',
      '/hr/leave-requests',
    ],
    apiPatterns: [
      'employees',
      'attendance-devices',
      'device-users',
      'attendance-logs',
      'leave-types',
      'leave-requests',
      'hr/references',
    ],
    uiTexts: ['Employees', 'Attendance devices', 'Leave requests'],
    primaryFrontendFile: fileRef('apps/web/src/features/hr-core/employees-page.tsx'),
    frontendRouteFiles: [
      fileRef('apps/web/src/app/(app)/hr/employees/page.tsx'),
      fileRef('apps/web/src/app/(app)/hr/attendance-devices/page.tsx'),
      fileRef('apps/web/src/app/(app)/hr/device-mappings/page.tsx'),
      fileRef('apps/web/src/app/(app)/hr/attendance-logs/page.tsx'),
      fileRef('apps/web/src/app/(app)/hr/leave-types/page.tsx'),
      fileRef('apps/web/src/app/(app)/hr/leave-requests/page.tsx'),
    ],
    frontendFeatureFiles: [
      fileRef('apps/web/src/features/hr-core/employees-page.tsx'),
      fileRef('apps/web/src/features/hr-core/attendance-devices-page.tsx'),
      fileRef('apps/web/src/features/hr-core/device-mappings-page.tsx'),
      fileRef('apps/web/src/features/hr-core/attendance-logs-page.tsx'),
      fileRef('apps/web/src/features/hr-core/leave-types-page.tsx'),
      fileRef('apps/web/src/features/hr-core/leave-requests-page.tsx'),
      fileRef('apps/web/src/features/hr-core/forms.tsx'),
      fileRef('apps/web/src/features/hr-core/hooks.ts'),
      fileRef('apps/web/src/features/hr-core/shared.tsx'),
    ],
    frontendApiFiles: [fileRef('apps/web/src/lib/api/hr-core.ts')],
    backendFiles: [
      fileRef('apps/api/src/app/hr/employees.controller.ts'),
      fileRef('apps/api/src/app/hr/employees.service.ts'),
      fileRef('apps/api/src/app/hr/attendance-devices.controller.ts'),
      fileRef('apps/api/src/app/hr/attendance-devices.service.ts'),
      fileRef('apps/api/src/app/hr/device-users.controller.ts'),
      fileRef('apps/api/src/app/hr/device-users.service.ts'),
      fileRef('apps/api/src/app/hr/attendance-logs.controller.ts'),
      fileRef('apps/api/src/app/hr/attendance-logs.service.ts'),
      fileRef('apps/api/src/app/hr/leave-types.controller.ts'),
      fileRef('apps/api/src/app/hr/leave-types.service.ts'),
      fileRef('apps/api/src/app/hr/leave-requests.controller.ts'),
      fileRef('apps/api/src/app/hr/leave-requests.service.ts'),
      fileRef('apps/api/src/app/hr/hr-references.controller.ts'),
      fileRef('apps/api/src/app/hr/hr-references.service.ts'),
    ],
    prismaModels: [
      'Employee',
      'AttendanceDevice',
      'DeviceUser',
      'AttendanceLog',
      'LeaveType',
      'LeaveRequest',
      'Department',
      'Location',
      'User',
    ],
    searchCommands: [
      searchCommand(
        'Find HR frontend pages and hooks',
        'rg "EmployeesPage|LeaveRequestsPage|AttendanceLogsPage|listEmployees|listLeaveRequests" apps/web/src',
      ),
      searchCommand(
        'Find HR backend module endpoints',
        'rg "employees|attendance|leave" apps/api/src/app/hr',
      ),
    ],
    presenterSummary:
      'HR covers employees, attendance devices and mappings, attendance logs, leave types, and leave requests for the active company.',
    stackContext:
      'The HR route pages reuse hr-core feature components and typed API helpers. NestJS HR controllers/services own validation and persistence against employee, attendance, and leave Prisma models.',
    beginnerExplanation:
      'HR is a group of related screens. The frontend shows employee and attendance/leave forms, the API helper sends requests, and the backend keeps company-scoped HR records in the database.',
    implementationNotes: [
      'HR reference endpoints provide selectors for departments, locations, and users.',
      'Device mappings use DeviceUser naming in backend and Prisma models.',
    ],
    editImpact: [
      'Screen layout and labels are usually frontend-only.',
      'Create/update rules and lifecycle status behavior are backend/API changes.',
      'New HR fields or relationships require database-backed scope.',
    ],
    studyNotes: [
      'For employees, trace employees-page.tsx to listEmployees in hr-core.ts.',
      'For leave, trace leave-requests-page.tsx to leave-requests.controller.ts.',
    ],
    riskNotes: [
      'HR data is people data, so keep debug output minimal and professional.',
      'Leave and attendance changes can affect payroll readiness.',
    ],
  },
  {
    id: 'payroll',
    label: 'Payroll',
    category: 'payroll',
    routePatterns: [
      '/payroll/salary-structures',
      '/payroll/runs',
      '/payroll/runs/[payrollRunId]',
      '/payroll/posting',
    ],
    apiPatterns: [
      'payroll',
      'salary-structures',
      'payroll-runs',
      'payroll-runs/:payrollRunId/lines',
      'payroll-runs/:payrollRunId/post',
    ],
    uiTexts: ['Payroll Runs', 'Salary Structures', 'Payroll Posting'],
    primaryFrontendFile: fileRef('apps/web/src/features/payroll-core/payroll-runs-page.tsx'),
    frontendRouteFiles: [
      fileRef('apps/web/src/app/(app)/payroll/salary-structures/page.tsx'),
      fileRef('apps/web/src/app/(app)/payroll/runs/page.tsx'),
      fileRef('apps/web/src/app/(app)/payroll/runs/[payrollRunId]/page.tsx'),
      fileRef('apps/web/src/app/(app)/payroll/posting/page.tsx'),
    ],
    frontendFeatureFiles: [
      fileRef('apps/web/src/features/payroll-core/salary-structures-page.tsx'),
      fileRef('apps/web/src/features/payroll-core/payroll-runs-page.tsx'),
      fileRef('apps/web/src/features/payroll-core/payroll-run-detail-page.tsx'),
      fileRef('apps/web/src/features/payroll-core/payroll-posting-page.tsx'),
      fileRef('apps/web/src/features/payroll-core/forms.tsx'),
      fileRef('apps/web/src/features/payroll-core/hooks.ts'),
      fileRef('apps/web/src/features/payroll-core/shared.tsx'),
    ],
    frontendApiFiles: [fileRef('apps/web/src/lib/api/payroll.ts')],
    backendFiles: [
      fileRef('apps/api/src/app/payroll/salary-structures.controller.ts'),
      fileRef('apps/api/src/app/payroll/salary-structures.service.ts'),
      fileRef('apps/api/src/app/payroll/payroll-runs.controller.ts'),
      fileRef('apps/api/src/app/payroll/payroll-runs.service.ts'),
      fileRef('apps/api/src/app/payroll/payroll-run-lines.controller.ts'),
      fileRef('apps/api/src/app/payroll/payroll-run-lines.service.ts'),
      fileRef('apps/api/src/app/payroll/payroll-references.controller.ts'),
      fileRef('apps/api/src/app/payroll/payroll-references.service.ts'),
      fileRef('apps/api/src/app/payroll/payroll.module.ts'),
    ],
    prismaModels: [
      'SalaryStructure',
      'PayrollRun',
      'PayrollRunLine',
      'Employee',
      'Project',
      'CostCenter',
      'Voucher',
      'ParticularAccount',
    ],
    searchCommands: [
      searchCommand(
        'Find payroll frontend and helper flow',
        'rg "PayrollRunsPage|PayrollPosting|postPayrollRun|listPayrollRuns" apps/web/src',
      ),
      searchCommand(
        'Find payroll backend posting and run logic',
        'rg "post|PayrollRun|SalaryStructure|payroll-runs" apps/api/src/app/payroll',
      ),
    ],
    presenterSummary:
      'Payroll manages salary structures, payroll runs, payroll run lines, and explicit posting into accounting vouchers.',
    stackContext:
      'The frontend payroll screens call the payroll API helper. NestJS payroll controllers/services validate payroll data, read HR references, and can create accounting-backed voucher records during posting.',
    beginnerExplanation:
      'Payroll starts from employee pay data, creates monthly run records, and can post finalized payroll into accounting so finance reports can include it.',
    implementationNotes: [
      'Payroll references provide selectors for projects, cost centers, employees, and particular accounts.',
      'Payroll posting crosses into accounting, so trace both payroll and voucher models when needed.',
    ],
    editImpact: [
      'Payroll screen layout is frontend-only.',
      'Run lifecycle, line calculations, and posting are backend/API changes.',
      'New payroll storage requirements are database-backed.',
    ],
    studyNotes: [
      'Use payroll-posting-page.tsx and postPayrollRun as the main trace for posting questions.',
      'Explain that posting is intentionally explicit, not automatic.',
    ],
    riskNotes: [
      'Payroll posting can affect accounting records and financial reports.',
      'Validate role access because payroll is available to Admin, HR, and Payroll roles.',
    ],
  },
  {
    id: 'sidebar-navigation',
    label: 'Sidebar/Navigation',
    category: 'navigation',
    routePatterns: ['/*'],
    uiTexts: [
      'Core',
      'Accounting',
      'Financial Reports',
      'Audit & Documents',
      'CRM & Property Desk',
    ],
    primaryFrontendFile: fileRef('apps/web/src/features/shell/app-shell.tsx'),
    frontendRouteFiles: [fileRef('apps/web/src/lib/routes.ts')],
    frontendFeatureFiles: [
      fileRef('apps/web/src/features/shell/app-shell.tsx'),
      fileRef('apps/web/src/features/shell/route-access-boundary.tsx'),
      fileRef('apps/web/src/lib/access.ts'),
      fileRef('packages/config/src/access.ts'),
    ],
    frontendApiFiles: [fileRef('apps/web/src/lib/api/auth.ts')],
    backendFiles: [],
    prismaModels: ['Role', 'UserRole', 'Company', 'User'],
    searchCommands: [
      searchCommand(
        'Find navigation configuration and route constants',
        'rg "navigation|APP_ROUTES|PROTECTED_ROUTE_PREFIXES|moduleKey" apps/web/src/features/shell apps/web/src/lib packages/config/src/access.ts',
      ),
      searchCommand(
        'Find a specific sidebar label',
        'rg "Business Overview|Chart of Accounts|Payroll Runs|Attachments" apps/web/src/features/shell apps/web/src/lib/routes.ts',
      ),
    ],
    presenterSummary:
      'Sidebar/Navigation is the authenticated shell that maps route constants, module labels, role-aware visibility, active route state, and search/navigation behavior.',
    stackContext:
      'The app shell is frontend code. It reads auth state and shared access rules, then displays only navigation items that match the active company role summary.',
    beginnerExplanation:
      'Navigation is not the business logic. It is the map of where the user can go, filtered by the role rules that also protect routes and API endpoints.',
    implementationNotes: [
      'No dedicated backend navigation controller was found; backendFiles is intentionally empty.',
      'Role filtering depends on shared access config, not hardcoded role checks inside each nav item.',
    ],
    editImpact: [
      'Changing menu labels, grouping, icons, or route constants is frontend/shared-config work.',
      'Changing access eligibility must stay aligned with backend guards.',
      'Adding new modules would be broader product scope and is outside this phase.',
    ],
    studyNotes: [
      'Start at app-shell.tsx when explaining visible sidebar items.',
      'Use routes.ts to connect labels to actual Next.js route paths.',
    ],
    riskNotes: [
      'Navigation visibility is not a substitute for backend authorization.',
      'Changing route constants can break links across the app.',
    ],
  },
  {
    id: 'api-client',
    label: 'API Client',
    category: 'api-client',
    routePatterns: ['/api/v1/*'],
    uiTexts: ['Request failed', 'Unable to sign in'],
    primaryFrontendFile: fileRef('apps/web/src/lib/api/client.ts'),
    frontendRouteFiles: [],
    frontendFeatureFiles: [
      fileRef('apps/web/src/components/providers/auth-provider.tsx'),
      fileRef('apps/web/src/components/providers/query-provider.tsx'),
    ],
    frontendApiFiles: [
      fileRef('apps/web/src/lib/api/client.ts'),
      fileRef('apps/web/src/lib/api/types.ts'),
      fileRef('apps/web/src/lib/api/query-string.ts'),
      fileRef('apps/web/src/lib/api/auth.ts'),
      fileRef('apps/web/src/lib/api/accounting.ts'),
      fileRef('apps/web/src/lib/api/financial-reporting.ts'),
      fileRef('apps/web/src/lib/api/crm-property-desk.ts'),
      fileRef('apps/web/src/lib/api/hr-core.ts'),
      fileRef('apps/web/src/lib/api/payroll.ts'),
      fileRef('apps/web/src/lib/api/audit-documents.ts'),
      fileRef('apps/web/src/lib/api/project-property.ts'),
      fileRef('apps/web/src/lib/api/org-security.ts'),
    ],
    backendFiles: [
      fileRef('apps/api/src/app/app.module.ts'),
      fileRef('apps/api/src/app/common/filters/api-exception.filter.ts'),
      fileRef('apps/api/src/app/common/interceptors/request-logging.interceptor.ts'),
      fileRef('apps/api/src/app/common/middleware/request-id.middleware.ts'),
    ],
    prismaModels: [],
    searchCommands: [
      searchCommand(
        'Find shared web API request behavior',
        'rg "apiRequest|apiRequestText|ApiError|buildApiUrl" apps/web/src packages',
      ),
      searchCommand(
        'Find API error and request-id handling',
        'rg "ApiExceptionFilter|RequestLoggingInterceptor|RequestIdMiddleware" apps/api/src/app',
      ),
    ],
    presenterSummary:
      'API Client is the browser-side REST request layer used by every module helper to call the NestJS API with credentials, JSON handling, refresh retry, and normalized errors.',
    stackContext:
      'The web app uses typed helper functions over apiRequest. The API base URL is configured for the browser, while NestJS handles the REST endpoints and returns structured JSON errors.',
    beginnerExplanation:
      'Feature pages do not call fetch everywhere. They call typed helper functions, and those helpers share one API client that handles common request and error behavior.',
    implementationNotes: [
      'This entry is about frontend request plumbing, not a business module.',
      'BackendFiles list cross-cutting API infrastructure rather than domain controllers.',
    ],
    editImpact: [
      'Changing helper function names or response types affects frontend callers.',
      'Changing request credentials, refresh retry, or error handling can affect the full app.',
      'Database edits are not part of this layer.',
    ],
    studyNotes: [
      'Use this entry when a route works visually but a network request fails.',
      'Trace from a module helper into apiRequest before inspecting backend controllers.',
    ],
    riskNotes: [
      'Shared API client edits have a broad blast radius.',
      'Avoid exposing request headers or cookie content in logs or projector-visible output.',
    ],
  },
  {
    id: 'database-prisma',
    label: 'Database/Prisma',
    category: 'database',
    routePatterns: [],
    uiTexts: ['PostgreSQL', 'Prisma', 'Company scope'],
    primaryFrontendFile: fileRef('prisma/schema.prisma'),
    frontendRouteFiles: [],
    frontendFeatureFiles: [],
    frontendApiFiles: [],
    backendFiles: [
      fileRef('prisma/schema.prisma'),
      fileRef('apps/api/src/app/database/prisma.service.ts'),
      fileRef('apps/api/src/app/database/prisma.module.ts'),
      fileRef('apps/api/src/app/app.module.ts'),
    ],
    prismaModels: [
      'Company',
      'User',
      'Role',
      'UserRole',
      'RefreshToken',
      'AccountClass',
      'AccountGroup',
      'LedgerAccount',
      'ParticularAccount',
      'Voucher',
      'VoucherLine',
      'Project',
      'CostCenter',
      'Unit',
      'Customer',
      'Booking',
      'SaleContract',
      'InstallmentSchedule',
      'Collection',
      'Employee',
      'PayrollRun',
      'PayrollRunLine',
      'Attachment',
      'AttachmentLink',
      'AuditEvent',
    ],
    searchCommands: [
      searchCommand(
        'Find Prisma model definitions',
        'rg "model (Company|Voucher|Customer|Employee|PayrollRun|Attachment|AuditEvent)" prisma/schema.prisma',
      ),
      searchCommand(
        'Find Prisma service usage in API modules',
        'rg "PrismaService|prisma\\." apps/api/src/app',
      ),
    ],
    presenterSummary:
      'Database/Prisma is the persistence foundation for company-scoped ERP records, migrations, generated Prisma types, and backend service data access.',
    stackContext:
      'Frontend pages never talk to Prisma directly. NestJS services use PrismaService to read and write PostgreSQL tables defined in prisma/schema.prisma.',
    beginnerExplanation:
      'The database stores the real business records. Prisma is the TypeScript-friendly layer the backend uses to work with those records safely.',
    implementationNotes: [
      'This phase does not change the Prisma schema or create migrations.',
      'The registry includes this entry so future trace UI can explain where data models live.',
    ],
    editImpact: [
      'Reading model names is documentation/trace work.',
      'Changing backend queries is backend/API work.',
      'Changing model fields, constraints, or relations is database-backed and requires explicit approval.',
    ],
    studyNotes: [
      'Use schema.prisma to identify model ownership, then search for PrismaService usage in the relevant NestJS module.',
      'Explain that companyId scoping is a core database and API boundary.',
    ],
    riskNotes: [
      'Schema changes are explicitly out of scope for this feature phase.',
      'Raw database edits should not be part of defense trace tooling.',
    ],
  },
] as const satisfies readonly DefenseTraceEntry[];

export type DefenseTraceEntryId = (typeof defenseTraceRegistry)[number]['id'];

export const getDefenseTraceEntryById = (
  id: DefenseTraceEntryId,
): DefenseTraceEntry | undefined =>
  defenseTraceRegistry.find((entry) => entry.id === id);

export const getDefenseTraceEntriesByCategory = (
  category: DefenseTraceEntry['category'],
): readonly DefenseTraceEntry[] =>
  defenseTraceRegistry.filter((entry) => entry.category === category);
