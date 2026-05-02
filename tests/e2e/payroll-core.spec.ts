import { expect, test, type Page } from '@playwright/test';

const now = '2026-04-01T00:00:00.000Z';
const sessionCookieUrl = 'http://localhost:3100';

const baseSession = {
  tokenType: 'Bearer',
  accessToken: 'access-token',
  accessTokenExpiresAt: '2026-04-01T03:00:00.000Z',
  refreshToken: 'refresh-token',
  refreshTokenExpiresAt: '2026-04-08T03:00:00.000Z',
  user: {
    id: 'user-payroll',
    email: 'payroll@example.com',
    isActive: true,
    lastLoginAt: '2026-04-01T01:00:00.000Z',
    currentCompany: {
      id: 'company-1',
      name: 'Real Capita Holdings',
      slug: 'real-capita-holdings',
    },
    roles: ['company_payroll'],
    assignments: [
      {
        company: {
          id: 'company-1',
          name: 'Real Capita Holdings',
          slug: 'real-capita-holdings',
        },
        roles: ['company_payroll'],
      },
    ],
  },
};

type MockRoute = Parameters<Page['route']>[1] extends (
  route: infer T,
) => unknown
  ? T
  : never;

type SalaryStructureState = {
  id: string;
  companyId: string;
  code: string;
  name: string;
  description: string | null;
  basicAmount: string;
  allowanceAmount: string;
  deductionAmount: string;
  netAmount: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type PayrollRunState = {
  id: string;
  companyId: string;
  payrollYear: number;
  payrollMonth: number;
  projectId: string | null;
  costCenterId: string | null;
  description: string | null;
  status: 'DRAFT' | 'FINALIZED' | 'CANCELLED' | 'POSTED';
  postedVoucherId: string | null;
  postedVoucherReference: string | null;
  postedVoucherDate: string | null;
  finalizedAt: string | null;
  cancelledAt: string | null;
  postedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type PayrollRunLineState = {
  id: string;
  companyId: string;
  payrollRunId: string;
  employeeId: string;
  basicAmount: string;
  allowanceAmount: string;
  deductionAmount: string;
  netAmount: string;
  createdAt: string;
  updatedAt: string;
};

const createApiError = (statusCode: number, message: string) => ({
  statusCode,
  error:
    statusCode === 401
      ? 'Unauthorized'
      : statusCode === 404
        ? 'Not Found'
        : statusCode === 409
          ? 'Conflict'
          : 'Bad Request',
  message,
  path: '/api/v1',
  timestamp: now,
  requestId: 'payroll-core-test-request-id',
});

const fulfillJson = async (route: MockRoute, status: number, payload: unknown) => {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  });
};

const createMeta = (page: number, pageSize: number, total: number) => ({
  page,
  pageSize,
  total,
  totalPages: Math.max(1, Math.ceil(total / pageSize)),
});

const paginate = <T,>(
  items: T[],
  searchParams: URLSearchParams,
  defaultPageSize: number,
) => {
  const page = Number(searchParams.get('page') ?? '1');
  const pageSize = Number(searchParams.get('pageSize') ?? String(defaultPageSize));
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    meta: createMeta(page, pageSize, items.length),
  };
};

const matchesSearch = (value: string | null | undefined, search: string | null) =>
  !search || (value ?? '').toLowerCase().includes(search.toLowerCase());

const optionalString = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const optionalNumber = (value: string | null) =>
  value && value.length > 0 ? Number(value) : null;

const toFixedAmount = (value: unknown) => Number(value ?? 0).toFixed(2);

const buildVoucherReference = (payrollYear: number, payrollMonth: number) =>
  `PAYROLL-${payrollYear}-${String(payrollMonth).padStart(2, '0')}`;

const addAuthenticatedCookie = async (page: Page) => {
  await page.context().addCookies([
    {
      name: 'rc_access_token',
      value: 'dummy-token',
      url: sessionCookieUrl,
    },
  ]);
};

const setupPayrollApiMocks = async (
  page: Page,
  {
    authenticated = false,
  }: {
    authenticated?: boolean;
  } = {},
) => {
  let isAuthenticated = authenticated;
  let tick = 0;
  const nextTimestamp = () =>
    new Date(Date.parse(now) + tick++ * 60_000).toISOString();

  const projects = [
    {
      id: 'project-1',
      companyId: 'company-1',
      locationId: null,
      locationCode: null,
      locationName: null,
      code: 'AZR',
      name: 'Azure Heights',
      description: 'Primary residential tower',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const costCenters = [
    {
      id: 'cost-center-1',
      companyId: 'company-1',
      projectId: 'project-1',
      projectCode: 'AZR',
      projectName: 'Azure Heights',
      code: 'OPS',
      name: 'Operations',
      description: 'Main project operations',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const employees = [
    {
      id: 'employee-1',
      companyId: 'company-1',
      employeeCode: 'EMP-001',
      fullName: 'Mina Khan',
      departmentId: 'department-1',
      departmentCode: 'HR',
      departmentName: 'Human Resources',
      locationId: 'location-1',
      locationCode: 'HQ',
      locationName: 'Head Office',
      userId: null,
      userEmail: null,
      userFirstName: null,
      userLastName: null,
      managerEmployeeId: null,
      managerEmployeeCode: null,
      managerFullName: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'employee-2',
      companyId: 'company-1',
      employeeCode: 'EMP-002',
      fullName: 'Nasrin Akter',
      departmentId: 'department-1',
      departmentCode: 'HR',
      departmentName: 'Human Resources',
      locationId: 'location-1',
      locationCode: 'HQ',
      locationName: 'Head Office',
      userId: null,
      userEmail: null,
      userFirstName: null,
      userLastName: null,
      managerEmployeeId: 'employee-1',
      managerEmployeeCode: 'EMP-001',
      managerFullName: 'Mina Khan',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const particularAccounts = [
    {
      id: 'account-expense-valid',
      companyId: 'company-1',
      accountClassId: 'class-expense',
      accountClassCode: 'EXPENSE',
      accountClassName: 'Expenses',
      accountGroupId: 'group-payroll-expense',
      accountGroupCode: 'PAYROLL_EXPENSE',
      accountGroupName: 'Payroll Expense',
      ledgerAccountId: 'ledger-payroll-expense',
      ledgerAccountCode: 'PAYROLL_EXPENSE_LEDGER',
      ledgerAccountName: 'Payroll Expense Ledger',
      code: 'PAYROLL_GROSS',
      name: 'Payroll Gross Expense',
      description: 'Gross payroll expense control',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'account-expense-blocked',
      companyId: 'company-1',
      accountClassId: 'class-expense',
      accountClassCode: 'EXPENSE',
      accountClassName: 'Expenses',
      accountGroupId: 'group-payroll-expense',
      accountGroupCode: 'PAYROLL_EXPENSE',
      accountGroupName: 'Payroll Expense',
      ledgerAccountId: 'ledger-payroll-expense',
      ledgerAccountCode: 'PAYROLL_EXPENSE_LEDGER',
      ledgerAccountName: 'Payroll Expense Ledger',
      code: 'PAYROLL_GROSS_BLOCKED',
      name: 'Blocked Payroll Expense',
      description: 'Used to surface posting errors in the UI',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'account-payable',
      companyId: 'company-1',
      accountClassId: 'class-liability',
      accountClassCode: 'LIABILITY',
      accountClassName: 'Liabilities',
      accountGroupId: 'group-payroll-payable',
      accountGroupCode: 'PAYROLL_PAYABLE',
      accountGroupName: 'Payroll Payable',
      ledgerAccountId: 'ledger-payroll-payable',
      ledgerAccountCode: 'PAYROLL_PAYABLE_LEDGER',
      ledgerAccountName: 'Payroll Payable Ledger',
      code: 'PAYROLL_PAYABLE',
      name: 'Payroll Payable',
      description: 'Payroll clearing liability',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'account-deduction',
      companyId: 'company-1',
      accountClassId: 'class-liability',
      accountClassCode: 'LIABILITY',
      accountClassName: 'Liabilities',
      accountGroupId: 'group-payroll-deduction',
      accountGroupCode: 'PAYROLL_DEDUCTION',
      accountGroupName: 'Payroll Deductions',
      ledgerAccountId: 'ledger-payroll-deduction',
      ledgerAccountCode: 'PAYROLL_DEDUCTION_LEDGER',
      ledgerAccountName: 'Payroll Deduction Ledger',
      code: 'PAYROLL_DEDUCTIONS',
      name: 'Payroll Deductions Payable',
      description: 'Payroll deduction liability',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  let salaryStructures: SalaryStructureState[] = [
    {
      id: 'salary-structure-1',
      companyId: 'company-1',
      code: 'STAFF_STD',
      name: 'Staff Standard',
      description: 'Default monthly salary template',
      basicAmount: '1000.00',
      allowanceAmount: '200.00',
      deductionAmount: '100.00',
      netAmount: '1100.00',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  let payrollRuns: PayrollRunState[] = [
    {
      id: 'payroll-run-finalized',
      companyId: 'company-1',
      payrollYear: 2026,
      payrollMonth: 4,
      projectId: 'project-1',
      costCenterId: 'cost-center-1',
      description: 'April payroll ready for posting',
      status: 'FINALIZED',
      postedVoucherId: null,
      postedVoucherReference: null,
      postedVoucherDate: null,
      finalizedAt: now,
      cancelledAt: null,
      postedAt: null,
      createdAt: now,
      updatedAt: now,
    },
  ];

  let payrollRunLines: PayrollRunLineState[] = [
    {
      id: 'payroll-line-finalized-1',
      companyId: 'company-1',
      payrollRunId: 'payroll-run-finalized',
      employeeId: 'employee-2',
      basicAmount: '1400.00',
      allowanceAmount: '200.00',
      deductionAmount: '150.00',
      netAmount: '1450.00',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const resolveProject = (projectId: string | null) =>
    projects.find((project) => project.id === projectId) ?? null;

  const resolveCostCenter = (costCenterId: string | null) =>
    costCenters.find((costCenter) => costCenter.id === costCenterId) ?? null;

  const resolveEmployee = (employeeId: string) =>
    employees.find((employee) => employee.id === employeeId) ?? null;

  const getPayrollRunLines = (payrollRunId: string) =>
    payrollRunLines.filter((line) => line.payrollRunId === payrollRunId);

  const getPayrollTotals = (payrollRunId: string) =>
    getPayrollRunLines(payrollRunId).reduce(
      (totals, line) => ({
        lineCount: totals.lineCount + 1,
        totalBasicAmount: totals.totalBasicAmount + Number(line.basicAmount),
        totalAllowanceAmount:
          totals.totalAllowanceAmount + Number(line.allowanceAmount),
        totalDeductionAmount:
          totals.totalDeductionAmount + Number(line.deductionAmount),
        totalNetAmount: totals.totalNetAmount + Number(line.netAmount),
      }),
      {
        lineCount: 0,
        totalBasicAmount: 0,
        totalAllowanceAmount: 0,
        totalDeductionAmount: 0,
        totalNetAmount: 0,
      },
    );

  const toPayrollRunRecord = (payrollRun: PayrollRunState) => {
    const project = resolveProject(payrollRun.projectId);
    const costCenter = resolveCostCenter(payrollRun.costCenterId);
    const totals = getPayrollTotals(payrollRun.id);

    return {
      id: payrollRun.id,
      companyId: payrollRun.companyId,
      payrollYear: payrollRun.payrollYear,
      payrollMonth: payrollRun.payrollMonth,
      projectId: payrollRun.projectId,
      projectCode: project?.code ?? null,
      projectName: project?.name ?? null,
      costCenterId: payrollRun.costCenterId,
      costCenterCode: costCenter?.code ?? null,
      costCenterName: costCenter?.name ?? null,
      description: payrollRun.description,
      status: payrollRun.status,
      postedVoucherId: payrollRun.postedVoucherId,
      postedVoucherReference: payrollRun.postedVoucherReference,
      postedVoucherDate: payrollRun.postedVoucherDate,
      finalizedAt: payrollRun.finalizedAt,
      cancelledAt: payrollRun.cancelledAt,
      postedAt: payrollRun.postedAt,
      lineCount: totals.lineCount,
      totalBasicAmount: totals.totalBasicAmount.toFixed(2),
      totalAllowanceAmount: totals.totalAllowanceAmount.toFixed(2),
      totalDeductionAmount: totals.totalDeductionAmount.toFixed(2),
      totalNetAmount: totals.totalNetAmount.toFixed(2),
      createdAt: payrollRun.createdAt,
      updatedAt: payrollRun.updatedAt,
    };
  };

  const toPayrollRunLineRecord = (line: PayrollRunLineState) => {
    const employee = resolveEmployee(line.employeeId);

    if (!employee) {
      throw new Error(`Employee not found for payroll line ${line.id}.`);
    }

    return {
      id: line.id,
      companyId: line.companyId,
      payrollRunId: line.payrollRunId,
      employeeId: line.employeeId,
      employeeCode: employee.employeeCode,
      employeeFullName: employee.fullName,
      departmentId: employee.departmentId,
      departmentCode: employee.departmentCode,
      departmentName: employee.departmentName,
      locationId: employee.locationId,
      locationCode: employee.locationCode,
      locationName: employee.locationName,
      basicAmount: line.basicAmount,
      allowanceAmount: line.allowanceAmount,
      deductionAmount: line.deductionAmount,
      netAmount: line.netAmount,
      createdAt: line.createdAt,
      updatedAt: line.updatedAt,
    };
  };

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const { pathname, searchParams } = url;
    let body: Record<string, unknown> = {};

    try {
      body = request.postDataJSON() as Record<string, unknown>;
    } catch {
      body = {};
    }

    const salaryStructureDetailMatch = pathname.match(
      /\/companies\/company-1\/salary-structures\/([^/]+)$/u,
    );
    const salaryStructureActivateMatch = pathname.match(
      /\/companies\/company-1\/salary-structures\/([^/]+)\/activate$/u,
    );
    const salaryStructureDeactivateMatch = pathname.match(
      /\/companies\/company-1\/salary-structures\/([^/]+)\/deactivate$/u,
    );
    const payrollRunDetailMatch = pathname.match(
      /\/companies\/company-1\/payroll-runs\/([^/]+)$/u,
    );
    const payrollRunFinalizeMatch = pathname.match(
      /\/companies\/company-1\/payroll-runs\/([^/]+)\/finalize$/u,
    );
    const payrollRunCancelMatch = pathname.match(
      /\/companies\/company-1\/payroll-runs\/([^/]+)\/cancel$/u,
    );
    const payrollRunPostMatch = pathname.match(
      /\/companies\/company-1\/payroll-runs\/([^/]+)\/post$/u,
    );
    const payrollRunLinesMatch = pathname.match(
      /\/companies\/company-1\/payroll-runs\/([^/]+)\/lines$/u,
    );
    const payrollRunLineDetailMatch = pathname.match(
      /\/companies\/company-1\/payroll-runs\/([^/]+)\/lines\/([^/]+)$/u,
    );

    if (pathname.endsWith('/auth/me')) {
      if (!isAuthenticated) {
        await fulfillJson(
          route,
          401,
          createApiError(401, 'Access token verification failed.'),
        );
        return;
      }

      await fulfillJson(route, 200, baseSession.user);
      return;
    }

    if (pathname.endsWith('/auth/refresh')) {
      if (!isAuthenticated) {
        await fulfillJson(
          route,
          401,
          createApiError(401, 'Refresh token verification failed.'),
        );
        return;
      }

      await fulfillJson(route, 200, baseSession);
      return;
    }

    if (pathname.endsWith('/auth/logout')) {
      isAuthenticated = false;
      await page.context().clearCookies();
      await fulfillJson(route, 200, {
        status: 'ok',
        message: 'Session revoked.',
      });
      return;
    }

    if (pathname.endsWith('/companies/company-1/payroll/references/projects')) {
      const items = projects.filter(
        (project) =>
          (searchParams.get('isActive') === null ||
            project.isActive === (searchParams.get('isActive') === 'true')) &&
          (matchesSearch(project.code, searchParams.get('search')) ||
            matchesSearch(project.name, searchParams.get('search')) ||
            matchesSearch(project.description, searchParams.get('search'))),
      );

      await fulfillJson(route, 200, paginate(items, searchParams, 100));
      return;
    }

    if (pathname.endsWith('/companies/company-1/payroll/references/cost-centers')) {
      const projectId = optionalString(searchParams.get('projectId'));
      const items = costCenters.filter(
        (costCenter) =>
          (!projectId || costCenter.projectId === projectId) &&
          (searchParams.get('isActive') === null ||
            costCenter.isActive === (searchParams.get('isActive') === 'true')) &&
          (matchesSearch(costCenter.code, searchParams.get('search')) ||
            matchesSearch(costCenter.name, searchParams.get('search')) ||
            matchesSearch(costCenter.description, searchParams.get('search'))),
      );

      await fulfillJson(route, 200, paginate(items, searchParams, 100));
      return;
    }

    if (pathname.endsWith('/companies/company-1/payroll/references/employees')) {
      const items = employees.filter(
        (employee) =>
          (searchParams.get('isActive') === null ||
            employee.isActive === (searchParams.get('isActive') === 'true')) &&
          (matchesSearch(employee.employeeCode, searchParams.get('search')) ||
            matchesSearch(employee.fullName, searchParams.get('search'))),
      );

      await fulfillJson(route, 200, paginate(items, searchParams, 100));
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/payroll/references/particular-accounts')
    ) {
      const items = particularAccounts.filter(
        (account) =>
          (searchParams.get('isActive') === null ||
            account.isActive === (searchParams.get('isActive') === 'true')) &&
          (matchesSearch(account.code, searchParams.get('search')) ||
            matchesSearch(account.name, searchParams.get('search')) ||
            matchesSearch(account.description, searchParams.get('search'))),
      );

      await fulfillJson(route, 200, paginate(items, searchParams, 100));
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/salary-structures') &&
      request.method() === 'GET'
    ) {
      const isActiveFilter = searchParams.get('isActive');
      const items = salaryStructures.filter(
        (salaryStructure) =>
          (isActiveFilter === null ||
            salaryStructure.isActive === (isActiveFilter === 'true')) &&
          (matchesSearch(salaryStructure.code, searchParams.get('search')) ||
            matchesSearch(salaryStructure.name, searchParams.get('search')) ||
            matchesSearch(salaryStructure.description, searchParams.get('search'))),
      );

      await fulfillJson(route, 200, paginate(items, searchParams, 10));
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/salary-structures') &&
      request.method() === 'POST'
    ) {
      const code = optionalString(body.code);
      const name = optionalString(body.name);

      if (
        salaryStructures.some(
          (salaryStructure) =>
            salaryStructure.code.toLowerCase() === code?.toLowerCase(),
        )
      ) {
        await fulfillJson(
          route,
          409,
          createApiError(
            409,
            'A salary structure with this code already exists in the company.',
          ),
        );
        return;
      }

      if (
        salaryStructures.some(
          (salaryStructure) =>
            salaryStructure.name.toLowerCase() === name?.toLowerCase(),
        )
      ) {
        await fulfillJson(
          route,
          409,
          createApiError(
            409,
            'A salary structure with this name already exists in the company.',
          ),
        );
        return;
      }

      const timestamp = nextTimestamp();
      const salaryStructure: SalaryStructureState = {
        id: `salary-structure-${salaryStructures.length + 1}`,
        companyId: 'company-1',
        code: code ?? 'NEW',
        name: name ?? 'New structure',
        description: optionalString(body.description),
        basicAmount: toFixedAmount(body.basicAmount),
        allowanceAmount: toFixedAmount(body.allowanceAmount),
        deductionAmount: toFixedAmount(body.deductionAmount),
        netAmount: toFixedAmount(body.netAmount),
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      salaryStructures = [salaryStructure, ...salaryStructures];
      await fulfillJson(route, 201, salaryStructure);
      return;
    }

    if (salaryStructureDetailMatch && request.method() === 'GET') {
      const salaryStructure = salaryStructures.find(
        (item) => item.id === salaryStructureDetailMatch[1],
      );

      if (!salaryStructure) {
        await fulfillJson(
          route,
          404,
          createApiError(404, 'Salary structure not found.'),
        );
        return;
      }

      await fulfillJson(route, 200, salaryStructure);
      return;
    }

    if (salaryStructureDetailMatch && request.method() === 'PATCH') {
      const salaryStructure = salaryStructures.find(
        (item) => item.id === salaryStructureDetailMatch[1],
      );

      if (!salaryStructure) {
        await fulfillJson(
          route,
          404,
          createApiError(404, 'Salary structure not found.'),
        );
        return;
      }

      const code = optionalString(body.code) ?? salaryStructure.code;
      const name = optionalString(body.name) ?? salaryStructure.name;

      if (
        salaryStructures.some(
          (item) =>
            item.id !== salaryStructure.id &&
            item.code.toLowerCase() === code.toLowerCase(),
        )
      ) {
        await fulfillJson(
          route,
          409,
          createApiError(
            409,
            'A salary structure with this code already exists in the company.',
          ),
        );
        return;
      }

      salaryStructure.code = code;
      salaryStructure.name = name;
      salaryStructure.description =
        optionalString(body.description) ?? salaryStructure.description;
      salaryStructure.basicAmount = toFixedAmount(body.basicAmount);
      salaryStructure.allowanceAmount = toFixedAmount(body.allowanceAmount);
      salaryStructure.deductionAmount = toFixedAmount(body.deductionAmount);
      salaryStructure.netAmount = toFixedAmount(body.netAmount);
      salaryStructure.updatedAt = nextTimestamp();

      await fulfillJson(route, 200, salaryStructure);
      return;
    }

    if (salaryStructureActivateMatch && request.method() === 'POST') {
      const salaryStructure = salaryStructures.find(
        (item) => item.id === salaryStructureActivateMatch[1],
      );

      if (!salaryStructure) {
        await fulfillJson(
          route,
          404,
          createApiError(404, 'Salary structure not found.'),
        );
        return;
      }

      salaryStructure.isActive = true;
      salaryStructure.updatedAt = nextTimestamp();
      await fulfillJson(route, 200, salaryStructure);
      return;
    }

    if (salaryStructureDeactivateMatch && request.method() === 'POST') {
      const salaryStructure = salaryStructures.find(
        (item) => item.id === salaryStructureDeactivateMatch[1],
      );

      if (!salaryStructure) {
        await fulfillJson(
          route,
          404,
          createApiError(404, 'Salary structure not found.'),
        );
        return;
      }

      salaryStructure.isActive = false;
      salaryStructure.updatedAt = nextTimestamp();
      await fulfillJson(route, 200, salaryStructure);
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/payroll-runs') &&
      request.method() === 'GET'
    ) {
      const payrollYear = optionalNumber(searchParams.get('payrollYear'));
      const payrollMonth = optionalNumber(searchParams.get('payrollMonth'));
      const status = optionalString(searchParams.get('status'));
      const projectId = optionalString(searchParams.get('projectId'));
      const costCenterId = optionalString(searchParams.get('costCenterId'));
      const items = payrollRuns
        .map((payrollRun) => toPayrollRunRecord(payrollRun))
        .filter(
          (payrollRun) =>
            (!payrollYear || payrollRun.payrollYear === payrollYear) &&
            (!payrollMonth || payrollRun.payrollMonth === payrollMonth) &&
            (!status || payrollRun.status === status) &&
            (!projectId || payrollRun.projectId === projectId) &&
            (!costCenterId || payrollRun.costCenterId === costCenterId) &&
            (matchesSearch(payrollRun.description, searchParams.get('search')) ||
              matchesSearch(payrollRun.projectCode, searchParams.get('search')) ||
              matchesSearch(payrollRun.projectName, searchParams.get('search')) ||
              matchesSearch(
                payrollRun.costCenterCode,
                searchParams.get('search'),
              ) ||
              matchesSearch(
                payrollRun.postedVoucherReference,
                searchParams.get('search'),
              )),
        );

      await fulfillJson(route, 200, paginate(items, searchParams, 10));
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/payroll-runs') &&
      request.method() === 'POST'
    ) {
      const payrollYear = Number(body.payrollYear);
      const payrollMonth = Number(body.payrollMonth);
      const projectId = optionalString(body.projectId);
      const costCenterId = optionalString(body.costCenterId);

      if (
        payrollRuns.some(
          (payrollRun) =>
            payrollRun.payrollYear === payrollYear &&
            payrollRun.payrollMonth === payrollMonth &&
            payrollRun.projectId === projectId &&
            payrollRun.costCenterId === costCenterId &&
            payrollRun.status !== 'CANCELLED',
        )
      ) {
        await fulfillJson(
          route,
          409,
          createApiError(
            409,
            'A payroll run already exists for the selected company scope and period.',
          ),
        );
        return;
      }

      const timestamp = nextTimestamp();
      const payrollRun: PayrollRunState = {
        id: `payroll-run-${payrollRuns.length + 1}`,
        companyId: 'company-1',
        payrollYear,
        payrollMonth,
        projectId,
        costCenterId,
        description: optionalString(body.description),
        status: 'DRAFT',
        postedVoucherId: null,
        postedVoucherReference: null,
        postedVoucherDate: null,
        finalizedAt: null,
        cancelledAt: null,
        postedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      payrollRuns = [payrollRun, ...payrollRuns];
      await fulfillJson(route, 201, toPayrollRunRecord(payrollRun));
      return;
    }

    if (payrollRunDetailMatch && request.method() === 'GET') {
      const payrollRun = payrollRuns.find((item) => item.id === payrollRunDetailMatch[1]);

      if (!payrollRun) {
        await fulfillJson(route, 404, createApiError(404, 'Payroll run not found.'));
        return;
      }

      await fulfillJson(route, 200, toPayrollRunRecord(payrollRun));
      return;
    }

    if (payrollRunDetailMatch && request.method() === 'PATCH') {
      const payrollRun = payrollRuns.find((item) => item.id === payrollRunDetailMatch[1]);

      if (!payrollRun) {
        await fulfillJson(route, 404, createApiError(404, 'Payroll run not found.'));
        return;
      }

      if (payrollRun.status !== 'DRAFT') {
        await fulfillJson(
          route,
          409,
          createApiError(409, 'Only draft payroll runs can be updated.'),
        );
        return;
      }

      payrollRun.payrollYear = Number(body.payrollYear ?? payrollRun.payrollYear);
      payrollRun.payrollMonth = Number(body.payrollMonth ?? payrollRun.payrollMonth);
      payrollRun.projectId = optionalString(body.projectId);
      payrollRun.costCenterId = optionalString(body.costCenterId);
      payrollRun.description = optionalString(body.description);
      payrollRun.updatedAt = nextTimestamp();

      await fulfillJson(route, 200, toPayrollRunRecord(payrollRun));
      return;
    }

    if (payrollRunFinalizeMatch && request.method() === 'POST') {
      const payrollRun = payrollRuns.find(
        (item) => item.id === payrollRunFinalizeMatch[1],
      );

      if (!payrollRun) {
        await fulfillJson(route, 404, createApiError(404, 'Payroll run not found.'));
        return;
      }

      if (payrollRun.status !== 'DRAFT') {
        await fulfillJson(
          route,
          409,
          createApiError(409, 'Only draft payroll runs can be finalized.'),
        );
        return;
      }

      if (getPayrollRunLines(payrollRun.id).length === 0) {
        await fulfillJson(
          route,
          409,
          createApiError(
            409,
            'Payroll run must contain at least one line before finalization.',
          ),
        );
        return;
      }

      const timestamp = nextTimestamp();
      payrollRun.status = 'FINALIZED';
      payrollRun.finalizedAt = timestamp;
      payrollRun.updatedAt = timestamp;

      await fulfillJson(route, 200, toPayrollRunRecord(payrollRun));
      return;
    }

    if (payrollRunCancelMatch && request.method() === 'POST') {
      const payrollRun = payrollRuns.find((item) => item.id === payrollRunCancelMatch[1]);

      if (!payrollRun) {
        await fulfillJson(route, 404, createApiError(404, 'Payroll run not found.'));
        return;
      }

      if (payrollRun.status === 'POSTED') {
        await fulfillJson(
          route,
          409,
          createApiError(409, 'Posted payroll runs cannot be cancelled.'),
        );
        return;
      }

      const timestamp = nextTimestamp();
      payrollRun.status = 'CANCELLED';
      payrollRun.cancelledAt = timestamp;
      payrollRun.updatedAt = timestamp;

      await fulfillJson(route, 200, toPayrollRunRecord(payrollRun));
      return;
    }

    if (payrollRunPostMatch && request.method() === 'POST') {
      const payrollRun = payrollRuns.find((item) => item.id === payrollRunPostMatch[1]);

      if (!payrollRun) {
        await fulfillJson(route, 404, createApiError(404, 'Payroll run not found.'));
        return;
      }

      if (payrollRun.status !== 'FINALIZED') {
        await fulfillJson(
          route,
          409,
          createApiError(409, 'Only finalized payroll runs can be posted.'),
        );
        return;
      }

      const totals = getPayrollTotals(payrollRun.id);
      const expenseParticularAccountId = optionalString(body.expenseParticularAccountId);

      if (
        !expenseParticularAccountId ||
        expenseParticularAccountId === 'account-expense-blocked'
      ) {
        await fulfillJson(
          route,
          409,
          createApiError(
            409,
            'Selected gross expense account is not valid for payroll posting.',
          ),
        );
        return;
      }

      if (
        totals.totalDeductionAmount > 0 &&
        !optionalString(body.deductionParticularAccountId)
      ) {
        await fulfillJson(
          route,
          409,
          createApiError(
            409,
            'A deduction liability account is required when payroll deductions are present.',
          ),
        );
        return;
      }

      const timestamp = nextTimestamp();
      payrollRun.status = 'POSTED';
      payrollRun.postedAt = timestamp;
      payrollRun.postedVoucherId = `voucher-${payrollRun.id}`;
      payrollRun.postedVoucherReference = buildVoucherReference(
        payrollRun.payrollYear,
        payrollRun.payrollMonth,
      );
      payrollRun.postedVoucherDate =
        optionalString(body.voucherDate) ?? '2026-04-30';
      payrollRun.updatedAt = timestamp;

      await fulfillJson(route, 200, toPayrollRunRecord(payrollRun));
      return;
    }

    if (payrollRunLinesMatch && request.method() === 'GET') {
      const payrollRun = payrollRuns.find((item) => item.id === payrollRunLinesMatch[1]);

      if (!payrollRun) {
        await fulfillJson(route, 404, createApiError(404, 'Payroll run not found.'));
        return;
      }

      const employeeId = optionalString(searchParams.get('employeeId'));
      const items = getPayrollRunLines(payrollRun.id)
        .map((line) => toPayrollRunLineRecord(line))
        .filter(
          (line) =>
            (!employeeId || line.employeeId === employeeId) &&
            (matchesSearch(line.employeeCode, searchParams.get('search')) ||
              matchesSearch(line.employeeFullName, searchParams.get('search')) ||
              matchesSearch(line.departmentName, searchParams.get('search')) ||
              matchesSearch(line.locationName, searchParams.get('search'))),
        );

      await fulfillJson(route, 200, paginate(items, searchParams, 10));
      return;
    }

    if (payrollRunLinesMatch && request.method() === 'POST') {
      const payrollRun = payrollRuns.find((item) => item.id === payrollRunLinesMatch[1]);

      if (!payrollRun) {
        await fulfillJson(route, 404, createApiError(404, 'Payroll run not found.'));
        return;
      }

      if (payrollRun.status !== 'DRAFT') {
        await fulfillJson(
          route,
          409,
          createApiError(409, 'Payroll lines can only be added while the run is in draft.'),
        );
        return;
      }

      const employeeId = optionalString(body.employeeId);
      if (!employeeId || !resolveEmployee(employeeId)) {
        await fulfillJson(route, 400, createApiError(400, 'Employee is required.'));
        return;
      }

      if (
        payrollRunLines.some(
          (line) => line.payrollRunId === payrollRun.id && line.employeeId === employeeId,
        )
      ) {
        await fulfillJson(
          route,
          409,
          createApiError(
            409,
            'This employee already has a payroll line in the selected run.',
          ),
        );
        return;
      }

      const timestamp = nextTimestamp();
      const payrollRunLine: PayrollRunLineState = {
        id: `payroll-line-${payrollRunLines.length + 1}`,
        companyId: 'company-1',
        payrollRunId: payrollRun.id,
        employeeId,
        basicAmount: toFixedAmount(body.basicAmount),
        allowanceAmount: toFixedAmount(body.allowanceAmount),
        deductionAmount: toFixedAmount(body.deductionAmount),
        netAmount: toFixedAmount(body.netAmount),
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      payrollRunLines = [...payrollRunLines, payrollRunLine];
      payrollRun.updatedAt = timestamp;

      await fulfillJson(route, 201, toPayrollRunLineRecord(payrollRunLine));
      return;
    }

    if (payrollRunLineDetailMatch && request.method() === 'PATCH') {
      const payrollRun = payrollRuns.find(
        (item) => item.id === payrollRunLineDetailMatch[1],
      );
      const payrollRunLine = payrollRunLines.find(
        (item) => item.id === payrollRunLineDetailMatch[2],
      );

      if (!payrollRun || !payrollRunLine) {
        await fulfillJson(
          route,
          404,
          createApiError(404, 'Payroll run line not found.'),
        );
        return;
      }

      if (payrollRun.status !== 'DRAFT') {
        await fulfillJson(
          route,
          409,
          createApiError(
            409,
            'Payroll lines can only be updated while the run is in draft.',
          ),
        );
        return;
      }

      const timestamp = nextTimestamp();
      payrollRunLine.basicAmount = toFixedAmount(body.basicAmount);
      payrollRunLine.allowanceAmount = toFixedAmount(body.allowanceAmount);
      payrollRunLine.deductionAmount = toFixedAmount(body.deductionAmount);
      payrollRunLine.netAmount = toFixedAmount(body.netAmount);
      payrollRunLine.updatedAt = timestamp;
      payrollRun.updatedAt = timestamp;

      await fulfillJson(route, 200, toPayrollRunLineRecord(payrollRunLine));
      return;
    }

    if (payrollRunLineDetailMatch && request.method() === 'DELETE') {
      const payrollRun = payrollRuns.find(
        (item) => item.id === payrollRunLineDetailMatch[1],
      );
      const payrollRunLine = payrollRunLines.find(
        (item) => item.id === payrollRunLineDetailMatch[2],
      );

      if (!payrollRun || !payrollRunLine) {
        await fulfillJson(
          route,
          404,
          createApiError(404, 'Payroll run line not found.'),
        );
        return;
      }

      if (payrollRun.status !== 'DRAFT') {
        await fulfillJson(
          route,
          409,
          createApiError(
            409,
            'Payroll lines can only be removed while the run is in draft.',
          ),
        );
        return;
      }

      payrollRunLines = payrollRunLines.filter((item) => item.id !== payrollRunLine.id);
      payrollRun.updatedAt = nextTimestamp();

      await route.fulfill({
        status: 204,
      });
      return;
    }

    await fulfillJson(route, 404, createApiError(404, `Unhandled API path: ${pathname}`));
  });
};

test('redirects payroll routes to login when no browser session exists', async ({
  page,
}) => {
  await page.goto('/payroll/runs');

  await expect(page).toHaveURL(/\/login\?next=%2Fpayroll%2Fruns/);
  await expect(
    page.getByRole('heading', { name: 'Open the admin shell' }),
  ).toBeVisible();
});

test('renders payroll navigation and supports salary structure create with conflict surfacing', async ({
  page,
}) => {
  await setupPayrollApiMocks(page, { authenticated: true });
  await addAuthenticatedCookie(page);

  await page.goto('/payroll/salary-structures');

  await expect(
    page.getByRole('heading', { name: 'Salary Structures' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Payroll workload' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Posting readiness' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Salary Structures' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Payroll Runs' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Payroll Posting' })).toBeVisible();
  await expect(page.getByText('STAFF_STD')).toBeVisible();

  await page.getByRole('button', { name: 'New salary structure' }).click();
  const salaryStructurePanel = page.getByRole('dialog');
  await salaryStructurePanel.getByLabel('Structure code').fill('EXEC_STD');
  await salaryStructurePanel.getByLabel('Structure name').fill('Executive Standard');
  await salaryStructurePanel.getByLabel('Description').fill('Executive payroll template');
  await salaryStructurePanel.getByLabel('Basic amount').fill('2500.00');
  await salaryStructurePanel.getByLabel('Allowance amount').fill('400.00');
  await salaryStructurePanel.getByLabel('Deduction amount').fill('150.00');
  await salaryStructurePanel
    .getByRole('button', { name: 'Create salary structure' })
    .click();

  const createdStructureRow = page.locator('tbody tr').filter({
    hasText: 'EXEC_STD',
  });
  await expect(createdStructureRow).toContainText('Executive Standard');
  await expect(createdStructureRow).toContainText('2,750.00');

  await page.getByRole('button', { name: 'New salary structure' }).click();
  const duplicateSalaryStructurePanel = page.getByRole('dialog');
  await duplicateSalaryStructurePanel.getByLabel('Structure code').fill('EXEC_STD');
  await duplicateSalaryStructurePanel.getByLabel('Structure name').fill('Duplicate Exec');
  await duplicateSalaryStructurePanel.getByLabel('Basic amount').fill('1000.00');
  await duplicateSalaryStructurePanel.getByLabel('Allowance amount').fill('100.00');
  await duplicateSalaryStructurePanel.getByLabel('Deduction amount').fill('50.00');
  await duplicateSalaryStructurePanel
    .getByRole('button', { name: 'Create salary structure' })
    .click();

  await expect(
    page.getByText(
      'A salary structure with this code already exists in the company.',
    ),
  ).toBeVisible();
  await duplicateSalaryStructurePanel
    .getByRole('button', { name: 'Close panel' })
    .click();

  await createdStructureRow.getByRole('button', { name: 'Deactivate' }).click();
  await expect(createdStructureRow).toContainText('Inactive');
});

test('supports payroll run create, detail edit, line edit, and duplicate employee error handling', async ({
  page,
}) => {
  await setupPayrollApiMocks(page, { authenticated: true });
  await addAuthenticatedCookie(page);

  await page.goto('/payroll/runs');

  await expect(page.getByRole('heading', { name: 'Payroll Runs' })).toBeVisible();

  await page.getByRole('button', { name: 'New payroll run' }).click();
  const payrollRunPanel = page.getByRole('dialog');
  await payrollRunPanel.getByLabel('Payroll year').selectOption('2026');
  await payrollRunPanel.getByLabel('Payroll month').selectOption('3');
  await payrollRunPanel.getByLabel('Project').selectOption({
    label: 'AZR - Azure Heights',
  });
  await payrollRunPanel.getByLabel('Cost center').selectOption({
    label: 'OPS - Operations',
  });
  await payrollRunPanel.getByLabel('Description').fill('March payroll draft');
  await payrollRunPanel.getByRole('button', { name: 'Create payroll run' }).click();

  const createdPayrollRunRow = page.locator('tbody tr').filter({
    hasText: 'March payroll draft',
  });
  await expect(createdPayrollRunRow).toContainText('Draft');
  await createdPayrollRunRow.getByRole('link', { name: 'Open' }).click();

  await expect(
    page.getByRole('heading', { name: 'Payroll Run Detail' }),
  ).toBeVisible();
  await expect(page.getByText('March payroll draft')).toBeVisible();

  await page.getByRole('button', { name: 'Edit run' }).click();
  const editRunPanel = page.getByRole('dialog');
  await editRunPanel.getByLabel('Description').fill('March payroll revised');
  await editRunPanel.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('March payroll revised')).toBeVisible();

  await page.getByRole('button', { name: 'Add payroll line' }).click();
  const payrollLinePanel = page.getByRole('dialog');
  await payrollLinePanel.getByLabel('Employee').selectOption({
    label: 'EMP-001 - Mina Khan',
  });
  await payrollLinePanel.getByLabel('Basic amount').fill('1000.00');
  await payrollLinePanel.getByLabel('Allowance amount').fill('250.00');
  await payrollLinePanel.getByLabel('Deduction amount').fill('100.00');
  await payrollLinePanel.getByRole('button', { name: 'Create payroll line' }).click();

  const payrollLineRow = page.locator('tbody tr').filter({
    hasText: 'EMP-001',
  });
  await expect(payrollLineRow).toContainText('1,150.00');

  await payrollLineRow.getByRole('button', { name: 'Edit' }).click();
  const editLinePanel = page.getByRole('dialog');
  await editLinePanel.getByLabel('Allowance amount').fill('300.00');
  await editLinePanel.getByRole('button', { name: 'Save changes' }).click();
  await expect(payrollLineRow).toContainText('1,200.00');

  await page.getByRole('button', { name: 'Add payroll line' }).click();
  const duplicateLinePanel = page.getByRole('dialog');
  await duplicateLinePanel.getByLabel('Employee').selectOption({
    label: 'EMP-001 - Mina Khan',
  });
  await duplicateLinePanel.getByLabel('Basic amount').fill('900.00');
  await duplicateLinePanel.getByLabel('Allowance amount').fill('50.00');
  await duplicateLinePanel.getByLabel('Deduction amount').fill('10.00');
  await duplicateLinePanel.getByRole('button', { name: 'Create payroll line' }).click();

  await expect(
    page.getByText('This employee already has a payroll line in the selected run.'),
  ).toBeVisible();
  await duplicateLinePanel.getByRole('button', { name: 'Close panel' }).click();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Finalize run' }).click();
  await expect(page.getByText('Finalized for posting')).toBeVisible();
  await expect(page.getByText('Line editing locked')).toBeVisible();
});

test('supports payroll posting from the posting workspace and surfaces backend posting errors', async ({
  page,
}) => {
  await setupPayrollApiMocks(page, { authenticated: true });
  await addAuthenticatedCookie(page);

  await page.goto('/payroll/posting');

  await expect(
    page.getByRole('heading', { name: 'Payroll Posting' }),
  ).toBeVisible();

  await page.getByLabel('Status').selectOption('');
  const finalizedRunRow = page.locator('tbody tr').filter({
    hasText: 'April payroll ready for posting',
  });
  await expect(finalizedRunRow).toContainText('Finalized');
  await finalizedRunRow.getByRole('button', { name: 'Post' }).click();

  const postingPanel = page.getByRole('dialog');
  await postingPanel
    .getByLabel('Gross expense account')
    .selectOption('account-expense-blocked');
  await postingPanel
    .getByLabel('Payroll payable account')
    .selectOption('account-payable');
  await postingPanel
    .getByLabel('Deduction liability account')
    .selectOption('account-deduction');
  await postingPanel.getByRole('button', { name: 'Post payroll run' }).click();

  await expect(
    page.getByText('Selected gross expense account is not valid for payroll posting.'),
  ).toBeVisible();

  await postingPanel
    .getByLabel('Gross expense account')
    .selectOption('account-expense-valid');
  await postingPanel.getByRole('button', { name: 'Post payroll run' }).click();

  await expect(finalizedRunRow).toContainText('Posted');
  await expect(finalizedRunRow).toContainText('PAYROLL-2026-04');
  await expect(finalizedRunRow.getByRole('button', { name: 'Post' })).toHaveCount(0);

  await finalizedRunRow.getByRole('link', { name: 'Open run' }).click();
  await expect(page.getByText('Posted payroll run')).toBeVisible();
  await expect(page.getByText('Line editing locked')).toBeVisible();
});
