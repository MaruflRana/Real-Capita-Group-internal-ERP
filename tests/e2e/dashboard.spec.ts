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

const memberSessionUser = {
  ...baseSession.user,
  roles: ['company_member'],
  assignments: [
    {
      company: {
        id: 'company-1',
        name: 'Real Capita Holdings',
        slug: 'real-capita-holdings',
      },
      roles: ['company_member'],
    },
  ],
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
    emptyData = false,
    sessionUser = baseSession.user,
  }: {
    authenticated?: boolean;
    balanceSheetFails?: boolean;
    emptyData?: boolean;
    sessionUser?: typeof baseSession.user;
  } = {},
) => {
  let isAuthenticated = authenticated;
  const vouchers = emptyData
    ? []
    : [
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
  const accountClasses = emptyData
    ? []
    : [
    {
      id: 'class-asset',
      code: 'ASSET',
      name: 'Assets',
      naturalBalance: 'DEBIT',
      sortOrder: 1,
      isActive: true,
      createdAt: '2026-04-01T00:00:00.000Z',
      updatedAt: '2026-04-01T00:00:00.000Z',
    },
  ];
  const accountGroups = emptyData ? [] : [{ id: 'group-current-assets' }];
  const ledgerAccounts = emptyData
    ? []
    : [{ id: 'ledger-cash' }, { id: 'ledger-sales' }];
  const particularAccounts = emptyData
    ? []
    : [
        { id: 'particular-cash' },
        { id: 'particular-sales' },
        { id: 'particular-expense' },
      ];
  const unitStatuses = emptyData
    ? []
    : [
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
  const units = emptyData
    ? []
    : [
    {
      id: 'unit-1',
      projectId: 'project-1',
      projectName: 'North Tower',
      unitTypeId: 'type-2br',
      unitTypeName: 'Two Bedroom',
      unitStatusId: 'status-available',
      code: 'A-101',
    },
    {
      id: 'unit-2',
      projectId: 'project-1',
      projectName: 'North Tower',
      unitTypeId: 'type-2br',
      unitTypeName: 'Two Bedroom',
      unitStatusId: 'status-available',
      code: 'A-102',
    },
    {
      id: 'unit-3',
      projectId: 'project-2',
      projectName: 'South Garden',
      unitTypeId: 'type-3br',
      unitTypeName: 'Three Bedroom',
      unitStatusId: 'status-booked',
      code: 'B-201',
    },
    {
      id: 'unit-4',
      projectId: 'project-2',
      projectName: 'South Garden',
      unitTypeId: 'type-studio',
      unitTypeName: 'Studio',
      unitStatusId: 'status-sold',
      code: 'C-301',
    },
  ];
  const projects = emptyData ? [] : [{ id: 'project-1' }, { id: 'project-2' }];
  const costCenters = emptyData ? [] : [{ id: 'cost-center-1' }];
  const projectPhases = emptyData ? [] : [{ id: 'phase-1' }, { id: 'phase-2' }];
  const blocks = emptyData ? [] : [{ id: 'block-1' }];
  const zones = emptyData ? [] : [{ id: 'zone-1' }, { id: 'zone-2' }];
  const unitTypes = emptyData
    ? []
    : [{ id: 'type-2br' }, { id: 'type-3br' }, { id: 'type-studio' }];
  const customers = emptyData
    ? []
    : [
        { id: 'customer-1', fullName: 'Amina Rahman' },
        { id: 'customer-2', fullName: 'Farhan Noor' },
      ];
  const leads = emptyData
    ? []
    : [
    {
      id: 'lead-1',
      status: 'NEW',
      fullName: 'Lead One',
      isActive: true,
      createdAt: '2026-04-01T00:00:00.000Z',
      updatedAt: '2026-04-01T00:00:00.000Z',
    },
    {
      id: 'lead-2',
      status: 'CONTACTED',
      fullName: 'Lead Two',
      isActive: true,
      createdAt: '2026-04-02T00:00:00.000Z',
      updatedAt: '2026-04-02T00:00:00.000Z',
    },
  ];
  const bookings = emptyData
    ? []
    : [
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
  const saleContracts = emptyData
    ? []
    : [
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
  const collections = emptyData
    ? []
    : [
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
  const installmentSchedules = emptyData
    ? []
    : [
    {
      id: 'schedule-1',
      dueDate: '2026-04-01',
    },
    {
      id: 'schedule-2',
      dueDate: '2026-04-25',
    },
  ];
  const employees = emptyData
    ? []
    : [
    {
      id: 'employee-1',
      departmentId: 'dept-sales',
      departmentName: 'Sales',
      locationId: 'loc-hq',
      locationName: 'Head Office',
    },
    {
      id: 'employee-2',
      departmentId: 'dept-hr',
      departmentName: 'HR',
      locationId: 'loc-hq',
      locationName: 'Head Office',
    },
    {
      id: 'employee-3',
      departmentId: 'dept-sales',
      departmentName: 'Sales',
      locationId: 'loc-site',
      locationName: 'Project Site',
    },
    {
      id: 'employee-4',
      departmentId: null,
      departmentName: null,
      locationId: 'loc-site',
      locationName: 'Project Site',
    },
    {
      id: 'employee-5',
      departmentId: 'dept-hr',
      departmentName: 'HR',
      locationId: null,
      locationName: null,
    },
  ];
  const departments = emptyData
    ? []
    : [
        {
          id: 'dept-sales',
          code: 'SALES',
          name: 'Sales',
          isActive: true,
          createdAt: '2026-04-01T00:00:00.000Z',
          updatedAt: '2026-04-01T00:00:00.000Z',
        },
        {
          id: 'dept-hr',
          code: 'HR',
          name: 'HR',
          isActive: true,
          createdAt: '2026-04-01T00:00:00.000Z',
          updatedAt: '2026-04-01T00:00:00.000Z',
        },
      ];
  const locations = emptyData
    ? []
    : [
        {
          id: 'loc-hq',
          code: 'HQ',
          name: 'Head Office',
          isActive: true,
          createdAt: '2026-04-01T00:00:00.000Z',
          updatedAt: '2026-04-01T00:00:00.000Z',
        },
      ];
  const leaveTypes = emptyData
    ? []
    : [
        {
          id: 'type-annual',
          code: 'ANNUAL',
          name: 'Annual Leave',
          isActive: true,
          createdAt: '2026-04-01T00:00:00.000Z',
          updatedAt: '2026-04-01T00:00:00.000Z',
        },
      ];
  const attendanceDevices = emptyData ? [] : [{ id: 'device-1' }, { id: 'device-2' }];
  const deviceUsers = emptyData
    ? []
    : [
        { id: 'device-user-1', employeeId: 'employee-1' },
        { id: 'device-user-2', employeeId: 'employee-2' },
      ];
  const leaveRequests = emptyData
    ? []
    : [
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
  const payrollRuns = emptyData
    ? []
    : [
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
  const salaryStructures = emptyData ? [] : [{ id: 'salary-1' }, { id: 'salary-2' }];
  const payrollEmployees = employees;
  const attendanceLogs = emptyData
    ? []
    : [
    {
      id: 'attendance-1',
      loggedAt: '2026-04-12T08:00:00.000Z',
      direction: 'IN',
    },
    {
      id: 'attendance-2',
      loggedAt: '2026-04-12T18:00:00.000Z',
      direction: 'OUT',
    },
    {
      id: 'attendance-3',
      loggedAt: '2026-04-13T09:00:00.000Z',
      direction: 'IN',
    },
  ];
  const attachmentUploaders = emptyData
    ? []
    : [
        {
          id: 'user-admin',
          email: 'admin@example.com',
          isActive: true,
          createdAt: '2026-04-01T00:00:00.000Z',
          updatedAt: '2026-04-01T00:00:00.000Z',
        },
      ];
  const attachments = emptyData
    ? []
    : [
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
  const auditEvents = emptyData
    ? []
    : [
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

      await fulfillJson(route, 200, sessionUser);
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

      await fulfillJson(route, 200, {
        ...baseSession,
        user: sessionUser,
      });
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
      const voucherType = searchParams.get('voucherType');
      const filtered = vouchers.filter(
        (voucher) =>
          (!status || voucher.status === status) &&
          (!voucherType || voucher.voucherType === voucherType),
      );
      const sorted = [...filtered].sort((left, right) =>
        right.voucherDate.localeCompare(left.voucherDate),
      );

      await fulfillJson(route, 200, createPaginatedResponse(sorted, pageSize, filtered.length));
      return;
    }

    if (pathname.endsWith('/companies/company-1/accounting/account-classes')) {
      await fulfillJson(
        route,
        200,
        createPaginatedResponse(accountClasses, pageSize, accountClasses.length),
      );
      return;
    }

    if (pathname.endsWith('/companies/company-1/accounting/account-groups')) {
      await fulfillJson(
        route,
        200,
        createPaginatedResponse(accountGroups, pageSize, accountGroups.length),
      );
      return;
    }

    if (pathname.endsWith('/companies/company-1/accounting/ledger-accounts')) {
      await fulfillJson(
        route,
        200,
        createPaginatedResponse(ledgerAccounts, pageSize, ledgerAccounts.length),
      );
      return;
    }

    if (pathname.endsWith('/companies/company-1/accounting/particular-accounts')) {
      await fulfillJson(
        route,
        200,
        createPaginatedResponse(
          particularAccounts,
          pageSize,
          particularAccounts.length,
        ),
      );
      return;
    }

    if (
      pathname.endsWith(
        '/companies/company-1/accounting/reports/business-overview',
      )
    ) {
      const bucket = searchParams.get('bucket') ?? 'month';

      await fulfillJson(route, 200, {
        companyId: 'company-1',
        dateFrom: searchParams.get('dateFrom'),
        dateTo: searchParams.get('dateTo'),
        bucket,
        totals: {
          contractedSalesAmount: emptyData ? '0.00' : '12000.00',
          collectedSalesAmount: emptyData ? '0.00' : '6700.00',
          revenueAmount: emptyData ? '0.00' : '15000.00',
          expenseAmount: emptyData ? '0.00' : '9200.00',
          netProfitLossAmount: emptyData ? '0.00' : '5800.00',
          profitAmount: emptyData ? '0.00' : '5800.00',
          lossAmount: '0.00',
          voucherCount: emptyData ? 0 : 4,
          draftVoucherCount: emptyData ? 0 : 2,
          postedVoucherCount: emptyData ? 0 : 2,
          bookingCount: emptyData ? 0 : 2,
          saleContractCount: emptyData ? 0 : 1,
          collectionCount: emptyData ? 0 : 2,
        },
        buckets: [
          {
            bucketKey: '2026-04',
            bucketLabel: '2026-04',
            bucketStart: '2026-04-01',
            bucketEnd: '2026-04-30',
            contractedSalesAmount: emptyData ? '0.00' : '12000.00',
            collectedSalesAmount: emptyData ? '0.00' : '6700.00',
            revenueAmount: emptyData ? '0.00' : '15000.00',
            expenseAmount: emptyData ? '0.00' : '9200.00',
            netProfitLossAmount: emptyData ? '0.00' : '5800.00',
            profitAmount: emptyData ? '0.00' : '5800.00',
            lossAmount: '0.00',
            voucherCount: emptyData ? 0 : 4,
            draftVoucherCount: emptyData ? 0 : 2,
            postedVoucherCount: emptyData ? 0 : 2,
            bookingCount: emptyData ? 0 : 2,
            saleContractCount: emptyData ? 0 : 1,
            collectionCount: emptyData ? 0 : 2,
          },
        ],
        assumptions: [
          'Revenue is derived from posted voucher lines in REVENUE account classes as credit minus debit by voucher date.',
        ],
      });
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
          openingDebit: emptyData ? '0.00' : '5000.00',
          openingCredit: emptyData ? '0.00' : '5000.00',
          movementDebit: emptyData ? '0.00' : '2300.00',
          movementCredit: emptyData ? '0.00' : '2300.00',
          closingDebit: emptyData ? '0.00' : '7300.00',
          closingCredit: emptyData ? '0.00' : '7300.00',
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
          totalRevenue: emptyData ? '0.00' : '15000.00',
          totalExpense: emptyData ? '0.00' : '9200.00',
          netProfitLoss: emptyData ? '0.00' : '5800.00',
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
          totalAssets: emptyData ? '0.00' : '25000.00',
          totalLiabilities: emptyData ? '0.00' : '8000.00',
          totalEquity: emptyData ? '0.00' : '17000.00',
          unclosedEarnings: emptyData ? '0.00' : '5800.00',
          totalLiabilitiesAndEquity: emptyData ? '0.00' : '25000.00',
        },
        sections: [],
        equityAdjustments: emptyData
          ? []
          : [
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

    if (pathname.endsWith('/companies/company-1/projects')) {
      await fulfillJson(route, 200, createPaginatedResponse(projects, pageSize));
      return;
    }

    if (pathname.endsWith('/companies/company-1/cost-centers')) {
      await fulfillJson(
        route,
        200,
        createPaginatedResponse(costCenters, pageSize, costCenters.length),
      );
      return;
    }

    if (pathname.endsWith('/companies/company-1/project-phases')) {
      await fulfillJson(
        route,
        200,
        createPaginatedResponse(projectPhases, pageSize, projectPhases.length),
      );
      return;
    }

    if (pathname.endsWith('/companies/company-1/blocks')) {
      await fulfillJson(route, 200, createPaginatedResponse(blocks, pageSize, blocks.length));
      return;
    }

    if (pathname.endsWith('/companies/company-1/zones')) {
      await fulfillJson(route, 200, createPaginatedResponse(zones, pageSize, zones.length));
      return;
    }

    if (pathname.endsWith('/companies/company-1/unit-types')) {
      await fulfillJson(route, 200, createPaginatedResponse(unitTypes, pageSize));
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

    if (pathname.endsWith('/companies/company-1/customers')) {
      await fulfillJson(
        route,
        200,
        createPaginatedResponse(customers, pageSize, customers.length),
      );
      return;
    }

    if (pathname.endsWith('/companies/company-1/leads')) {
      const status = searchParams.get('status');
      const filtered = status
        ? leads.filter((lead) => lead.status === status)
        : leads;

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

    if (pathname.endsWith('/companies/company-1/installment-schedules')) {
      const dueState = searchParams.get('dueState');
      const filtered = dueState
        ? installmentSchedules.filter((schedule) =>
            dueState === 'overdue'
              ? schedule.dueDate < '2026-04-13'
              : schedule.dueDate >= '2026-04-13',
          )
        : installmentSchedules;

      await fulfillJson(route, 200, createPaginatedResponse(filtered, pageSize, filtered.length));
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

    if (pathname.endsWith('/companies/company-1/hr/references/departments')) {
      await fulfillJson(
        route,
        200,
        createPaginatedResponse(departments, pageSize, departments.length),
      );
      return;
    }

    if (pathname.endsWith('/companies/company-1/hr/references/locations')) {
      await fulfillJson(
        route,
        200,
        createPaginatedResponse(locations, pageSize, locations.length),
      );
      return;
    }

    if (pathname.endsWith('/companies/company-1/leave-types')) {
      await fulfillJson(
        route,
        200,
        createPaginatedResponse(leaveTypes, pageSize, leaveTypes.length),
      );
      return;
    }

    if (pathname.endsWith('/companies/company-1/attendance-devices')) {
      await fulfillJson(
        route,
        200,
        createPaginatedResponse(
          attendanceDevices,
          pageSize,
          attendanceDevices.length,
        ),
      );
      return;
    }

    if (pathname.endsWith('/companies/company-1/device-users')) {
      await fulfillJson(
        route,
        200,
        createPaginatedResponse(deviceUsers, pageSize, deviceUsers.length),
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

    if (pathname.endsWith('/companies/company-1/attendance-logs')) {
      const sorted = [...attendanceLogs].sort((left, right) =>
        right.loggedAt.localeCompare(left.loggedAt),
      );

      await fulfillJson(
        route,
        200,
        createPaginatedResponse(sorted, pageSize, attendanceLogs.length),
      );
      return;
    }

    if (pathname.endsWith('/companies/company-1/salary-structures')) {
      await fulfillJson(
        route,
        200,
        createPaginatedResponse(
          salaryStructures,
          pageSize,
          salaryStructures.length,
        ),
      );
      return;
    }

    if (pathname.endsWith('/companies/company-1/payroll/references/employees')) {
      await fulfillJson(
        route,
        200,
        createPaginatedResponse(
          payrollEmployees,
          pageSize,
          payrollEmployees.length,
        ),
      );
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

    if (pathname.endsWith('/companies/company-1/attachments/references/uploaders')) {
      await fulfillJson(
        route,
        200,
        createPaginatedResponse(
          attachmentUploaders,
          pageSize,
          attachmentUploaders.length,
        ),
      );
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
      const category = searchParams.get('category');
      const filtered = category
        ? auditEvents.filter((auditEvent) => auditEvent.category === category)
        : auditEvents;
      const sorted = [...filtered].sort((left, right) =>
        right.createdAt.localeCompare(left.createdAt),
      );

      await fulfillJson(
        route,
        200,
        createPaginatedResponse(sorted, pageSize, filtered.length),
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
  await expect(page.getByText('5,800.00').first()).toBeVisible();
  await expect(page.getByText('Operational analytics')).toBeVisible();
  await expect(page.getByText('Business performance')).toBeVisible();
  await expect(page.getByText('Trend scale').first()).toBeVisible();
  await expect(page.getByText('Sales and collections')).toBeVisible();
  await expect(page.getByText('Accounting workload')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Recent vouchers' })).toBeVisible();
  await expect(page.getByText('JV-3001')).toBeVisible();
  await expect(page.getByText('Pending work')).toBeVisible();
  await expect(page.getByText('Draft vouchers awaiting posting')).toBeVisible();
  await expect(page.getByText('Jump to work')).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Financial reports' }),
  ).toBeVisible();
});

test('keeps dashboard context readable at narrower widths', async ({
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
  await page.setViewportSize({ width: 1024, height: 900 });

  await page.goto('/dashboard');

  const contextPanel = page.getByTestId('dashboard-context');

  await expect(contextPanel).toBeVisible();
  await expect(
    contextPanel.getByText('real-capita-holdings'),
  ).toBeVisible();
  await expect(page.getByTestId('dashboard-workspace-chips')).toBeVisible();
  await expect(page.getByTestId('dashboard-period-card')).toBeVisible();

  const overflow = await contextPanel.evaluate(
    (element) => element.scrollWidth - element.clientWidth,
  );

  expect(overflow).toBeLessThanOrEqual(1);
});

test('renders module-level accounting analytics on vouchers page', async ({
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

  await page.goto('/accounting/vouchers');

  await expect(page.getByTestId('accounting-operational-analytics')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Voucher control' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Accounting structure' })).toBeVisible();
  await expect(page.getByText('Debit').first()).toBeVisible();
  await expect(page.getByText('Credit').first()).toBeVisible();
});

test('shows analytics empty-state guidance when company data is sparse', async ({
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
  await setupDashboardApiMocks(page, { authenticated: true, emptyData: true });

  await page.goto('/dashboard');

  await expect(page.getByText('Operational analytics')).toBeVisible();
  await expect(page.getByText('No posted accounting movement')).toBeVisible();
  await expect(
    page.getByText(/For a populated supervisor demo, run corepack pnpm seed:demo/).first(),
  ).toBeVisible();
});

test('keeps dashboard analytics access-gated for member-only sessions', async ({
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
    sessionUser: memberSessionUser,
  });

  await page.goto('/dashboard');

  await expect(page.getByText('Operational analytics')).toBeVisible();
  await expect(page.getByText('No analytics data yet')).toBeVisible();
  await expect(page.getByText('Business performance')).toHaveCount(0);
});

test('renders representative module analytics across Phase 1 areas', async ({
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

  await page.goto('/project-property/unit-statuses');
  await expect(page.getByTestId('project-property-operational-analytics')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Inventory command center' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Project hierarchy coverage' })).toBeVisible();

  await page.goto('/crm-property-desk/customers');
  await expect(page.getByTestId('crm-operational-analytics')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'CRM pipeline' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sales value and collections' })).toBeVisible();
  await expect(page.getByText('Trend scale').first()).toBeVisible();

  await page.goto('/hr/leave-requests');
  await expect(page.getByTestId('hr-operational-analytics')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'People coverage' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Attendance movement' })).toBeVisible();

  await page.goto('/payroll/salary-structures');
  await expect(page.getByTestId('payroll-operational-analytics')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Payroll workload' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Payroll period trend' })).toBeVisible();

  await page.goto('/audit-documents/audit-events');
  await expect(page.getByTestId('audit-documents-operational-analytics')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Document coverage' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Audit activity' })).toBeVisible();
});

test('renders financial report visual summaries from report responses', async ({
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

  await page.goto('/accounting/reports/trial-balance');

  await expect(page.getByText('Trial balance comparison')).toBeVisible();
  await expect(page.getByText('Debit / credit movement')).toBeVisible();

  await page.goto('/accounting/reports/balance-sheet');
  await expect(page.getByText('Balance sheet comparison')).toBeVisible();
  await expect(page.getByText('Equity adjustments').first()).toBeVisible();
  await expect(
    page.getByText('Unclosed earnings adjustment').first(),
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

  await expect(page).toHaveURL(/\/accounting\/reports\/business-overview/);
  await expect(
    page.getByRole('heading', {
      exact: true,
      name: 'Business Overview Report',
    }),
  ).toBeVisible();
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
  await expect(
    page.getByText('Financial reports summary is unavailable.'),
  ).toBeVisible();
  await expect(
    page.getByText('Balance sheet endpoint unavailable.').first(),
  ).toBeVisible();
});
