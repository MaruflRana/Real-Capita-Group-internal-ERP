import { expect, test, type Page } from '@playwright/test';

const baseSession = {
  tokenType: 'Bearer',
  accessToken: 'access-token',
  accessTokenExpiresAt: '2026-04-13T03:00:00.000Z',
  refreshToken: 'refresh-token',
  refreshTokenExpiresAt: '2026-04-20T03:00:00.000Z',
  user: {
    id: 'user-admin',
    email: 'admin@example.com',
    isActive: true,
    lastLoginAt: '2026-04-13T01:00:00.000Z',
    currentCompany: {
      id: 'company-1',
      name: 'Real Capita Holdings',
      slug: 'real-capita-holdings',
    },
    roles: ['company_admin'],
    assignments: [
      {
        company: {
          id: 'company-1',
          name: 'Real Capita Holdings',
          slug: 'real-capita-holdings',
        },
        roles: ['company_admin'],
      },
      {
        company: {
          id: 'company-2',
          name: 'Real Capita Property',
          slug: 'real-capita-property',
        },
        roles: ['company_admin', 'company_sales'],
      },
    ],
  },
};

const createApiError = (statusCode: number, message: string) => ({
  statusCode,
  error:
    statusCode === 401
      ? 'Unauthorized'
      : statusCode === 500
        ? 'Internal Server Error'
        : 'Bad Request',
  message,
  path: '/api/v1',
  timestamp: '2026-04-13T00:00:00.000Z',
  requestId: 'dashboard-test-request-id',
});

const fulfillJson = async (
  route: Parameters<Page['route']>[1] extends (route: infer T) => unknown
    ? T
    : never,
  status: number,
  payload: unknown,
) => {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  });
};

const createPaginatedResponse = <TItem>(
  items: TItem[],
  pageSize: number,
  total = items.length,
) => ({
  items: items.slice(0, pageSize),
  meta: {
    page: 1,
    pageSize,
    total,
    totalPages: total === 0 ? 0 : 1,
  },
});

const setupDashboardApiMocks = async (
  page: Page,
  {
    authenticated = false,
    balanceSheetFails = false,
  }: {
    authenticated?: boolean;
    balanceSheetFails?: boolean;
  } = {},
) => {
  let isAuthenticated = authenticated;
  const vouchers = [
    {
      id: 'voucher-1',
      companyId: 'company-1',
      voucherType: 'JOURNAL',
      status: 'DRAFT',
      voucherDate: '2026-04-12',
      description: 'Cash adjustment',
      reference: 'JV-3001',
      createdById: 'user-admin',
      postedById: null,
      postedAt: null,
      lineCount: 3,
      totalDebit: '900.00',
      totalCredit: '900.00',
      createdAt: '2026-04-12T08:00:00.000Z',
      updatedAt: '2026-04-12T08:00:00.000Z',
    },
    {
      id: 'voucher-2',
      companyId: 'company-1',
      voucherType: 'PAYMENT',
      status: 'DRAFT',
      voucherDate: '2026-04-10',
      description: 'Office supplies',
      reference: 'PV-2004',
      createdById: 'user-admin',
      postedById: null,
      postedAt: null,
      lineCount: 2,
      totalDebit: '300.00',
      totalCredit: '300.00',
      createdAt: '2026-04-10T09:00:00.000Z',
      updatedAt: '2026-04-10T09:00:00.000Z',
    },
    {
      id: 'voucher-3',
      companyId: 'company-1',
      voucherType: 'RECEIPT',
      status: 'POSTED',
      voucherDate: '2026-04-08',
      description: 'Collection receipt',
      reference: 'RV-1001',
      createdById: 'user-admin',
      postedById: 'user-admin',
      postedAt: '2026-04-08T10:00:00.000Z',
      lineCount: 4,
      totalDebit: '4200.00',
      totalCredit: '4200.00',
      createdAt: '2026-04-08T10:00:00.000Z',
      updatedAt: '2026-04-08T10:00:00.000Z',
    },
    {
      id: 'voucher-4',
      companyId: 'company-1',
      voucherType: 'CONTRA',
      status: 'POSTED',
      voucherDate: '2026-04-05',
      description: 'Bank transfer',
      reference: 'CV-9001',
      createdById: 'user-admin',
      postedById: 'user-admin',
      postedAt: '2026-04-05T11:00:00.000Z',
      lineCount: 2,
      totalDebit: '2500.00',
      totalCredit: '2500.00',
      createdAt: '2026-04-05T11:00:00.000Z',
      updatedAt: '2026-04-05T11:00:00.000Z',
    },
  ];
  const unitStatuses = [
    {
      id: 'status-available',
      code: 'AVAILABLE',
      name: 'Available',
      sortOrder: 1,
      isActive: true,
      createdAt: '2026-04-01T00:00:00.000Z',
      updatedAt: '2026-04-01T00:00:00.000Z',
    },
    {
      id: 'status-booked',
      code: 'BOOKED',
      name: 'Booked',
      sortOrder: 2,
      isActive: true,
      createdAt: '2026-04-01T00:00:00.000Z',
      updatedAt: '2026-04-01T00:00:00.000Z',
    },
    {
      id: 'status-sold',
      code: 'SOLD',
      name: 'Sold',
      sortOrder: 4,
      isActive: true,
      createdAt: '2026-04-01T00:00:00.000Z',
      updatedAt: '2026-04-01T00:00:00.000Z',
    },
  ];
  const units = [
    {
      id: 'unit-1',
      unitStatusId: 'status-available',
      code: 'A-101',
    },
    {
      id: 'unit-2',
      unitStatusId: 'status-available',
      code: 'A-102',
    },
    {
      id: 'unit-3',
      unitStatusId: 'status-booked',
      code: 'B-201',
    },
    {
      id: 'unit-4',
      unitStatusId: 'status-sold',
      code: 'C-301',
    },
  ];
  const bookings = [
    {
      id: 'booking-1',
      companyId: 'company-1',
      projectId: 'project-1',
      projectCode: 'NORTH',
      projectName: 'North Tower',
      customerId: 'customer-1',
      customerName: 'Amina Rahman',
      customerEmail: 'amina@example.com',
      customerPhone: '0123456789',
      unitId: 'unit-3',
      unitCode: 'B-201',
      unitName: 'Tower B 201',
      unitStatusId: 'status-booked',
      unitStatusCode: 'BOOKED',
      unitStatusName: 'Booked',
      bookingDate: '2026-04-11',
      bookingAmount: '3000.00',
      status: 'ACTIVE',
      notes: null,
      saleContractId: null,
      createdAt: '2026-04-11T07:00:00.000Z',
      updatedAt: '2026-04-11T07:00:00.000Z',
    },
    {
      id: 'booking-2',
      companyId: 'company-1',
      projectId: 'project-1',
      projectCode: 'NORTH',
      projectName: 'North Tower',
      customerId: 'customer-2',
      customerName: 'Farhan Noor',
      customerEmail: 'farhan@example.com',
      customerPhone: '0987654321',
      unitId: 'unit-2',
      unitCode: 'A-102',
      unitName: 'Tower A 102',
      unitStatusId: 'status-available',
      unitStatusCode: 'AVAILABLE',
      unitStatusName: 'Available',
      bookingDate: '2026-04-06',
      bookingAmount: '1500.00',
      status: 'CONTRACTED',
      notes: null,
      saleContractId: 'contract-1',
      createdAt: '2026-04-06T07:00:00.000Z',
      updatedAt: '2026-04-06T07:00:00.000Z',
    },
  ];
  const saleContracts = [
    {
      id: 'contract-1',
      companyId: 'company-1',
      bookingId: 'booking-2',
      customerId: 'customer-2',
      customerName: 'Farhan Noor',
      projectId: 'project-1',
      projectCode: 'NORTH',
      projectName: 'North Tower',
      unitId: 'unit-2',
      unitCode: 'A-102',
      unitName: 'Tower A 102',
      bookingDate: '2026-04-06',
      bookingAmount: '1500.00',
      contractDate: '2026-04-09',
      contractAmount: '12000.00',
      reference: 'SC-1001',
      notes: null,
      createdAt: '2026-04-09T07:00:00.000Z',
      updatedAt: '2026-04-09T07:00:00.000Z',
    },
  ];
  const collections = [
    {
      id: 'collection-1',
      companyId: 'company-1',
      customerId: 'customer-1',
      customerName: 'Amina Rahman',
      voucherId: 'voucher-3',
      voucherStatus: 'POSTED',
      voucherDate: '2026-04-08',
      voucherReference: 'RV-1001',
      bookingId: 'booking-1',
      saleContractId: null,
      installmentScheduleId: null,
      collectionDate: '2026-04-08',
      amount: '4200.00',
      reference: 'COL-1',
      notes: null,
      createdAt: '2026-04-08T11:00:00.000Z',
      updatedAt: '2026-04-08T11:00:00.000Z',
    },
    {
      id: 'collection-2',
      companyId: 'company-1',
      customerId: 'customer-2',
      customerName: 'Farhan Noor',
      voucherId: 'voucher-4',
      voucherStatus: 'POSTED',
      voucherDate: '2026-04-05',
      voucherReference: 'CV-9001',
      bookingId: 'booking-2',
      saleContractId: 'contract-1',
      installmentScheduleId: null,
      collectionDate: '2026-04-05',
      amount: '2500.00',
      reference: null,
      notes: null,
      createdAt: '2026-04-05T11:30:00.000Z',
      updatedAt: '2026-04-05T11:30:00.000Z',
    },
  ];
  const employees = [
    { id: 'employee-1' },
    { id: 'employee-2' },
    { id: 'employee-3' },
    { id: 'employee-4' },
    { id: 'employee-5' },
  ];
  const leaveRequests = [
    {
      id: 'leave-1',
      companyId: 'company-1',
      employeeId: 'employee-1',
      employeeCode: 'EMP-001',
      employeeFullName: 'Amina Rahman',
      departmentId: null,
      departmentCode: null,
      departmentName: null,
      locationId: null,
      locationCode: null,
      locationName: null,
      leaveTypeId: 'type-annual',
      leaveTypeCode: 'ANNUAL',
      leaveTypeName: 'Annual Leave',
      startDate: '2026-04-15',
      endDate: '2026-04-16',
      reason: null,
      decisionNote: null,
      status: 'SUBMITTED',
      createdAt: '2026-04-12T09:00:00.000Z',
      updatedAt: '2026-04-12T09:00:00.000Z',
    },
    {
      id: 'leave-2',
      companyId: 'company-1',
      employeeId: 'employee-2',
      employeeCode: 'EMP-002',
      employeeFullName: 'Farhan Noor',
      departmentId: null,
      departmentCode: null,
      departmentName: null,
      locationId: null,
      locationCode: null,
      locationName: null,
      leaveTypeId: 'type-casual',
      leaveTypeCode: 'CASUAL',
      leaveTypeName: 'Casual Leave',
      startDate: '2026-04-18',
      endDate: '2026-04-18',
      reason: null,
      decisionNote: null,
      status: 'APPROVED',
      createdAt: '2026-04-09T09:00:00.000Z',
      updatedAt: '2026-04-09T09:00:00.000Z',
    },
  ];
  const payrollRuns = [
    {
      id: 'payroll-1',
      companyId: 'company-1',
      payrollYear: 2026,
      payrollMonth: 4,
      projectId: null,
      projectCode: null,
      projectName: null,
      costCenterId: null,
      costCenterCode: null,
      costCenterName: null,
      description: 'April payroll',
      status: 'FINALIZED',
      postedVoucherId: null,
      postedVoucherReference: null,
      postedVoucherDate: null,
      finalizedAt: '2026-04-12T12:00:00.000Z',
      cancelledAt: null,
      postedAt: null,
      lineCount: 12,
      totalBasicAmount: '10000.00',
      totalAllowanceAmount: '3500.00',
      totalDeductionAmount: '500.00',
      totalNetAmount: '13000.00',
      createdAt: '2026-04-12T12:00:00.000Z',
      updatedAt: '2026-04-12T12:00:00.000Z',
    },
    {
      id: 'payroll-2',
      companyId: 'company-1',
      payrollYear: 2026,
      payrollMonth: 3,
      projectId: null,
      projectCode: null,
      projectName: null,
      costCenterId: null,
      costCenterCode: null,
      costCenterName: null,
      description: 'March payroll',
      status: 'DRAFT',
      postedVoucherId: null,
      postedVoucherReference: null,
      postedVoucherDate: null,
      finalizedAt: null,
      cancelledAt: null,
      postedAt: null,
      lineCount: 10,
      totalBasicAmount: '9000.00',
      totalAllowanceAmount: '3000.00',
      totalDeductionAmount: '400.00',
      totalNetAmount: '11600.00',
      createdAt: '2026-04-03T12:00:00.000Z',
      updatedAt: '2026-04-03T12:00:00.000Z',
    },
  ];
  const attachments = [
    {
      id: 'attachment-1',
      companyId: 'company-1',
      storageBucket: 'docs',
      storageKey: 'docs/lease.pdf',
      originalFileName: 'lease.pdf',
      mimeType: 'application/pdf',
      sizeBytes: '4096',
      checksumSha256: null,
      objectEtag: null,
      uploadedById: 'user-admin',
      uploadedByEmail: 'admin@example.com',
      archivedById: null,
      archivedByEmail: null,
      status: 'PENDING_UPLOAD',
      activeLinkCount: 0,
      links: [],
      uploadCompletedAt: null,
      archivedAt: null,
      createdAt: '2026-04-12T13:00:00.000Z',
      updatedAt: '2026-04-12T13:00:00.000Z',
    },
    {
      id: 'attachment-2',
      companyId: 'company-1',
      storageBucket: 'docs',
      storageKey: 'docs/invoice.pdf',
      originalFileName: 'invoice.pdf',
      mimeType: 'application/pdf',
      sizeBytes: '8192',
      checksumSha256: null,
      objectEtag: 'etag-1',
      uploadedById: 'user-admin',
      uploadedByEmail: 'admin@example.com',
      archivedById: null,
      archivedByEmail: null,
      status: 'AVAILABLE',
      activeLinkCount: 1,
      links: [],
      uploadCompletedAt: '2026-04-08T13:00:00.000Z',
      archivedAt: null,
      createdAt: '2026-04-08T13:00:00.000Z',
      updatedAt: '2026-04-08T13:00:00.000Z',
    },
  ];
  const auditEvents = [
    {
      id: 'audit-1',
      companyId: 'company-1',
      category: 'ATTACHMENT',
      eventType: 'attachment.upload.finalized',
      actorUserId: 'user-admin',
      actorEmail: 'admin@example.com',
      targetEntityType: 'ATTACHMENT',
      targetEntityId: 'attachment-2',
      requestId: 'req-1',
      metadata: null,
      createdAt: '2026-04-12T14:00:00.000Z',
    },
  ];

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const { pathname, searchParams } = url;
    const pageSize = Number(searchParams.get('pageSize') ?? '20');

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

    if (pathname.endsWith('/health')) {
      await fulfillJson(route, 200, {
        status: 'ok',
        service: 'api',
        version: '1.0.0-test',
        timestamp: '2026-04-13T00:00:00.000Z',
      });
      return;
    }

    if (pathname.endsWith('/companies/company-1/accounting/vouchers')) {
      const status = searchParams.get('status');
      const filtered = status
        ? vouchers.filter((voucher) => voucher.status === status)
        : vouchers;
      const sorted = [...filtered].sort((left, right) =>
        right.voucherDate.localeCompare(left.voucherDate),
      );

      await fulfillJson(route, 200, createPaginatedResponse(sorted, pageSize, filtered.length));
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/accounting/reports/trial-balance')
    ) {
      await fulfillJson(route, 200, {
        companyId: 'company-1',
        dateFrom: searchParams.get('dateFrom'),
        dateTo: searchParams.get('dateTo'),
        voucherType: null,
        ledgerAccountId: null,
        particularAccountId: null,
        totals: {
          openingDebit: '5000.00',
          openingCredit: '5000.00',
          movementDebit: '2300.00',
          movementCredit: '2300.00',
          closingDebit: '7300.00',
          closingCredit: '7300.00',
        },
        sections: [],
      });
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/accounting/reports/profit-loss')
    ) {
      await fulfillJson(route, 200, {
        companyId: 'company-1',
        dateFrom: searchParams.get('dateFrom'),
        dateTo: searchParams.get('dateTo'),
        totals: {
          totalRevenue: '15000.00',
          totalExpense: '9200.00',
          netProfitLoss: '5800.00',
        },
        sections: [],
      });
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/accounting/reports/balance-sheet')
    ) {
      if (balanceSheetFails) {
        await fulfillJson(
          route,
          500,
          createApiError(500, 'Balance sheet endpoint unavailable.'),
        );
        return;
      }

      await fulfillJson(route, 200, {
        companyId: 'company-1',
        asOfDate: searchParams.get('asOfDate'),
        isBalanced: true,
        totals: {
          totalAssets: '25000.00',
          totalLiabilities: '8000.00',
          totalEquity: '17000.00',
          unclosedEarnings: '5800.00',
          totalLiabilitiesAndEquity: '25000.00',
        },
        sections: [],
        equityAdjustments: [
          {
            code: 'UNCLOSED_EARNINGS',
            name: 'Unclosed earnings adjustment',
            amount: '5800.00',
          },
        ],
      });
      return;
    }

    if (pathname.endsWith('/companies/company-1/unit-statuses')) {
      await fulfillJson(route, 200, createPaginatedResponse(unitStatuses, pageSize));
      return;
    }

    if (pathname.endsWith('/companies/company-1/units')) {
      const unitStatusId = searchParams.get('unitStatusId');
      const filtered = unitStatusId
        ? units.filter((unit) => unit.unitStatusId === unitStatusId)
        : units;

      await fulfillJson(route, 200, createPaginatedResponse(filtered, pageSize, filtered.length));
      return;
    }

    if (pathname.endsWith('/companies/company-1/bookings')) {
      const status = searchParams.get('status');
      const filtered = status
        ? bookings.filter((booking) => booking.status === status)
        : bookings;
      const sorted = [...filtered].sort((left, right) =>
        right.bookingDate.localeCompare(left.bookingDate),
      );

      await fulfillJson(route, 200, createPaginatedResponse(sorted, pageSize, filtered.length));
      return;
    }

    if (pathname.endsWith('/companies/company-1/sale-contracts')) {
      const sorted = [...saleContracts].sort((left, right) =>
        right.contractDate.localeCompare(left.contractDate),
      );

      await fulfillJson(
        route,
        200,
        createPaginatedResponse(sorted, pageSize, saleContracts.length),
      );
      return;
    }

    if (pathname.endsWith('/companies/company-1/collections')) {
      const sorted = [...collections].sort((left, right) =>
        right.collectionDate.localeCompare(left.collectionDate),
      );

      await fulfillJson(
        route,
        200,
        createPaginatedResponse(sorted, pageSize, collections.length),
      );
      return;
    }

    if (pathname.endsWith('/companies/company-1/employees')) {
      await fulfillJson(
        route,
        200,
        createPaginatedResponse(employees, pageSize, employees.length),
      );
      return;
    }

    if (pathname.endsWith('/companies/company-1/leave-requests')) {
      const status = searchParams.get('status');
      const filtered = status
        ? leaveRequests.filter((leaveRequest) => leaveRequest.status === status)
        : leaveRequests;
      const sorted = [...filtered].sort((left, right) =>
        right.createdAt.localeCompare(left.createdAt),
      );

      await fulfillJson(route, 200, createPaginatedResponse(sorted, pageSize, filtered.length));
      return;
    }

    if (pathname.endsWith('/companies/company-1/payroll-runs')) {
      const status = searchParams.get('status');
      const filtered = status
        ? payrollRuns.filter((payrollRun) => payrollRun.status === status)
        : payrollRuns;
      const sorted = [...filtered].sort((left, right) =>
        right.createdAt.localeCompare(left.createdAt),
      );

      await fulfillJson(route, 200, createPaginatedResponse(sorted, pageSize, filtered.length));
      return;
    }

    if (pathname.endsWith('/companies/company-1/attachments')) {
      const status = searchParams.get('status');
      const filtered = status
        ? attachments.filter((attachment) => attachment.status === status)
        : attachments;
      const sorted = [...filtered].sort((left, right) =>
        right.createdAt.localeCompare(left.createdAt),
      );

      await fulfillJson(route, 200, createPaginatedResponse(sorted, pageSize, filtered.length));
      return;
    }

    if (pathname.endsWith('/companies/company-1/audit-events')) {
      const sorted = [...auditEvents].sort((left, right) =>
        right.createdAt.localeCompare(left.createdAt),
      );

      await fulfillJson(
        route,
        200,
        createPaginatedResponse(sorted, pageSize, auditEvents.length),
      );
      return;
    }

    await route.continue();
  });
};

test('renders dashboard summary, recent activity, pending work, and shortcuts', async ({
  page,
  context,
}) => {
  await context.addCookies([
    {
      name: 'rc_access_token',
      value: 'dummy-token',
      url: 'http://localhost:3100',
    },
  ]);
  await setupDashboardApiMocks(page, { authenticated: true });

  await page.goto('/dashboard');

  await expect(page.getByText('Company snapshot')).toBeVisible();
  await expect(page.getByText('Financial summary')).toBeVisible();
  await expect(page.getByText('5,800.00')).toBeVisible();
  await expect(page.getByText('Recent vouchers')).toBeVisible();
  await expect(page.getByText('JV-3001')).toBeVisible();
  await expect(page.getByText('Pending work')).toBeVisible();
  await expect(page.getByText('Draft vouchers awaiting posting')).toBeVisible();
  await expect(page.getByText('Jump to work')).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Financial reports' }),
  ).toBeVisible();
});

test('opens a quick action into an existing module route', async ({
  page,
  context,
}) => {
  await context.addCookies([
    {
      name: 'rc_access_token',
      value: 'dummy-token',
      url: 'http://localhost:3100',
    },
  ]);
  await setupDashboardApiMocks(page, { authenticated: true });

  await page.goto('/dashboard');
  await page.getByRole('link', { name: 'Financial reports' }).click();

  await expect(page).toHaveURL(/\/accounting\/reports\/trial-balance/);
  await expect(page.getByRole('heading', { name: 'Trial Balance' })).toBeVisible();
});

test('surfaces dashboard section issues when summary data fails', async ({
  page,
  context,
}) => {
  await context.addCookies([
    {
      name: 'rc_access_token',
      value: 'dummy-token',
      url: 'http://localhost:3100',
    },
  ]);
  await setupDashboardApiMocks(page, {
    authenticated: true,
    balanceSheetFails: true,
  });

  await page.goto('/dashboard');

  await expect(page.getByText('Some dashboard data could not load.')).toBeVisible();
  await expect(page.getByText('Accounting summary is unavailable.')).toBeVisible();
  await expect(page.getByText('Balance sheet endpoint unavailable.')).toBeVisible();
});
