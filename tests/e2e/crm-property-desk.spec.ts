import { expect, test, type Page } from '@playwright/test';

const now = '2026-03-17T00:00:00.000Z';
const today = '2026-03-17';
const sessionCookieUrl = 'http://localhost:3100';

const baseSession = {
  tokenType: 'Bearer',
  accessToken: 'access-token',
  accessTokenExpiresAt: '2026-03-17T03:00:00.000Z',
  refreshToken: 'refresh-token',
  refreshTokenExpiresAt: '2026-03-24T03:00:00.000Z',
  user: {
    id: 'user-admin',
    email: 'admin@example.com',
    isActive: true,
    lastLoginAt: '2026-03-17T01:00:00.000Z',
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
    ],
  },
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
  requestId: 'crm-property-desk-test-request-id',
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

const matchesSearch = (
  value: string | null | undefined,
  search: string | null,
) => !search || (value ?? '').toLowerCase().includes(search.toLowerCase());

const inDateRange = (
  value: string,
  from: string | null,
  to: string | null,
) => (!from || value >= from) && (!to || value <= to);

const optionalString = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const normalizeEmail = (value: unknown) => {
  const normalized = optionalString(value);
  return normalized ? normalized.toLowerCase() : null;
};

const normalizePhone = (value: unknown) => optionalString(value);

const getRequiredPathSegment = (pathname: string, offsetFromEnd = 1) => {
  const segments = pathname.split('/').filter(Boolean);
  const segment = segments.at(-offsetFromEnd);

  if (!segment) {
    throw new Error(`Unexpected pathname: ${pathname}`);
  }

  return segment;
};

const addAuthenticatedCookie = async (page: Page) => {
  await page.context().addCookies([
    {
      name: 'rc_access_token',
      value: 'dummy-token',
      url: sessionCookieUrl,
    },
  ]);
};

const setupCrmPropertyDeskApiMocks = async (
  page: Page,
  {
    authenticated = false,
  }: {
    authenticated?: boolean;
  } = {},
) => {
  let isAuthenticated = authenticated;

  const projects = [
    {
      id: 'project-1',
      companyId: 'company-1',
      locationId: null,
      locationCode: null,
      locationName: null,
      code: 'RCH-TOWER',
      name: 'Real Capita Tower',
      description: 'Primary residential tower',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  let customers = [
    {
      id: 'customer-1',
      companyId: 'company-1',
      fullName: 'Sarah Ahmed',
      email: 'sarah.ahmed@example.com',
      phone: '8801710000000',
      address: 'Dhaka',
      notes: 'Primary customer record',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  let leads = [
    {
      id: 'lead-1',
      companyId: 'company-1',
      projectId: 'project-1',
      projectCode: 'RCH-TOWER',
      projectName: 'Real Capita Tower',
      fullName: 'Imran Hossain',
      email: 'imran.hossain@example.com',
      phone: '8801810000000',
      source: 'Referral',
      status: 'CONTACTED',
      notes: 'Interested in premium units',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  let units = [
    {
      id: 'unit-available-1',
      companyId: 'company-1',
      projectId: 'project-1',
      projectCode: 'RCH-TOWER',
      projectName: 'Real Capita Tower',
      phaseId: null,
      phaseCode: null,
      phaseName: null,
      blockId: null,
      blockCode: null,
      blockName: null,
      zoneId: null,
      zoneCode: null,
      zoneName: null,
      unitTypeId: 'unit-type-1',
      unitTypeCode: 'APT',
      unitTypeName: 'Apartment',
      unitStatusId: 'unit-status-available',
      unitStatusCode: 'AVAILABLE',
      unitStatusName: 'Available',
      code: 'A-101',
      name: 'Apartment 101',
      description: 'Available unit',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'unit-booked-1',
      companyId: 'company-1',
      projectId: 'project-1',
      projectCode: 'RCH-TOWER',
      projectName: 'Real Capita Tower',
      phaseId: null,
      phaseCode: null,
      phaseName: null,
      blockId: null,
      blockCode: null,
      blockName: null,
      zoneId: null,
      zoneCode: null,
      zoneName: null,
      unitTypeId: 'unit-type-1',
      unitTypeCode: 'APT',
      unitTypeName: 'Apartment',
      unitStatusId: 'unit-status-booked',
      unitStatusCode: 'BOOKED',
      unitStatusName: 'Booked',
      code: 'B-201',
      name: 'Apartment 201',
      description: 'Booked contract candidate',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'unit-booked-2',
      companyId: 'company-1',
      projectId: 'project-1',
      projectCode: 'RCH-TOWER',
      projectName: 'Real Capita Tower',
      phaseId: null,
      phaseCode: null,
      phaseName: null,
      blockId: null,
      blockCode: null,
      blockName: null,
      zoneId: null,
      zoneCode: null,
      zoneName: null,
      unitTypeId: 'unit-type-1',
      unitTypeCode: 'APT',
      unitTypeName: 'Apartment',
      unitStatusId: 'unit-status-booked',
      unitStatusCode: 'BOOKED',
      unitStatusName: 'Booked',
      code: 'C-301',
      name: 'Apartment 301',
      description: 'Booked unit with contract',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  let bookings = [
    {
      id: 'booking-contract-1',
      companyId: 'company-1',
      projectId: 'project-1',
      projectCode: 'RCH-TOWER',
      projectName: 'Real Capita Tower',
      customerId: 'customer-1',
      customerName: 'Sarah Ahmed',
      customerEmail: 'sarah.ahmed@example.com',
      customerPhone: '8801710000000',
      unitId: 'unit-booked-1',
      unitCode: 'B-201',
      unitName: 'Apartment 201',
      unitStatusId: 'unit-status-booked',
      unitStatusCode: 'BOOKED',
      unitStatusName: 'Booked',
      bookingDate: '2026-03-10',
      bookingAmount: '50000.00',
      status: 'ACTIVE',
      notes: 'Eligible for contract',
      saleContractId: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'booking-existing-1',
      companyId: 'company-1',
      projectId: 'project-1',
      projectCode: 'RCH-TOWER',
      projectName: 'Real Capita Tower',
      customerId: 'customer-1',
      customerName: 'Sarah Ahmed',
      customerEmail: 'sarah.ahmed@example.com',
      customerPhone: '8801710000000',
      unitId: 'unit-booked-2',
      unitCode: 'C-301',
      unitName: 'Apartment 301',
      unitStatusId: 'unit-status-booked',
      unitStatusCode: 'BOOKED',
      unitStatusName: 'Booked',
      bookingDate: '2026-03-01',
      bookingAmount: '200000.00',
      status: 'CONTRACTED',
      notes: 'Linked to an existing contract',
      saleContractId: 'sale-contract-existing-1',
      createdAt: now,
      updatedAt: now,
    },
  ];

  let saleContracts = [
    {
      id: 'sale-contract-existing-1',
      companyId: 'company-1',
      bookingId: 'booking-existing-1',
      customerId: 'customer-1',
      customerName: 'Sarah Ahmed',
      projectId: 'project-1',
      projectCode: 'RCH-TOWER',
      projectName: 'Real Capita Tower',
      unitId: 'unit-booked-2',
      unitCode: 'C-301',
      unitName: 'Apartment 301',
      bookingDate: '2026-03-01',
      bookingAmount: '200000.00',
      contractDate: '2026-03-05',
      contractAmount: '1500000.00',
      reference: 'SC-001',
      notes: 'Existing contract',
      createdAt: now,
      updatedAt: now,
    },
  ];

  let schedules = [
    {
      id: 'schedule-existing-1',
      companyId: 'company-1',
      saleContractId: 'sale-contract-existing-1',
      bookingId: 'booking-existing-1',
      customerId: 'customer-1',
      customerName: 'Sarah Ahmed',
      projectId: 'project-1',
      projectCode: 'RCH-TOWER',
      projectName: 'Real Capita Tower',
      unitId: 'unit-booked-2',
      unitCode: 'C-301',
      unitName: 'Apartment 301',
      sequenceNumber: 1,
      dueDate: today,
      amount: '100000.00',
      collectedAmount: '0.00',
      balanceAmount: '100000.00',
      description: 'Seed installment',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const vouchers = [
    {
      id: 'voucher-1',
      companyId: 'company-1',
      voucherType: 'RECEIPT',
      status: 'POSTED',
      voucherDate: today,
      description: 'Collection voucher',
      reference: 'RC-RECEIPT-001',
      createdById: 'user-admin',
      postedById: 'user-admin',
      postedAt: now,
      lineCount: 2,
      totalDebit: '100000.00',
      totalCredit: '100000.00',
      createdAt: now,
      updatedAt: now,
    },
  ];

  let collections: Array<{
    id: string;
    companyId: string;
    customerId: string;
    customerName: string;
    voucherId: string;
    voucherStatus: string;
    voucherDate: string;
    voucherReference: string | null;
    bookingId: string | null;
    saleContractId: string | null;
    installmentScheduleId: string | null;
    collectionDate: string;
    amount: string;
    reference: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
  }> = [];

  const getProject = (projectId: string) =>
    projects.find((project) => project.id === projectId);
  const getCustomer = (customerId: string) =>
    customers.find((customer) => customer.id === customerId);
  const getLead = (leadId: string) => leads.find((lead) => lead.id === leadId);
  const getUnit = (unitId: string) => units.find((unit) => unit.id === unitId);
  const getBooking = (bookingId: string) =>
    bookings.find((booking) => booking.id === bookingId);
  const getSaleContract = (saleContractId: string) =>
    saleContracts.find((saleContract) => saleContract.id === saleContractId);
  const getSchedule = (scheduleId: string) =>
    schedules.find((schedule) => schedule.id === scheduleId);
  const getVoucher = (voucherId: string) =>
    vouchers.find((voucher) => voucher.id === voucherId);
  const getCollection = (collectionId: string) =>
    collections.find((collection) => collection.id === collectionId);

  const updateUnitBookingState = (unitId: string, isBooked: boolean) => {
    units = units.map((unit) =>
      unit.id === unitId
        ? {
            ...unit,
            unitStatusId: isBooked
              ? 'unit-status-booked'
              : 'unit-status-available',
            unitStatusCode: isBooked ? 'BOOKED' : 'AVAILABLE',
            unitStatusName: isBooked ? 'Booked' : 'Available',
            updatedAt: now,
          }
        : unit,
    );
  };

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const { pathname, searchParams } = url;
    let body: Record<string, unknown> = {};

    try {
      body = request.postDataJSON?.() as Record<string, unknown>;
    } catch {
      body = {};
    }

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

    if (
      pathname.endsWith('/companies/company-1/crm-property-desk/references/projects')
    ) {
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

    if (
      pathname.endsWith('/companies/company-1/crm-property-desk/references/units')
    ) {
      const items = units.filter(
        (unit) =>
          (!searchParams.get('projectId') ||
            unit.projectId === searchParams.get('projectId')) &&
          (searchParams.get('isActive') === null ||
            unit.isActive === (searchParams.get('isActive') === 'true')) &&
          (matchesSearch(unit.code, searchParams.get('search')) ||
            matchesSearch(unit.name, searchParams.get('search')) ||
            matchesSearch(unit.description, searchParams.get('search')) ||
            matchesSearch(unit.projectCode, searchParams.get('search'))),
      );
      await fulfillJson(route, 200, paginate(items, searchParams, 100));
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/crm-property-desk/references/vouchers')
    ) {
      const items = vouchers.filter(
        (voucher) =>
          inDateRange(
            voucher.voucherDate,
            searchParams.get('dateFrom'),
            searchParams.get('dateTo'),
          ) &&
          (searchParams.get('status') === null ||
            voucher.status === searchParams.get('status')) &&
          (searchParams.get('voucherType') === null ||
            voucher.voucherType === searchParams.get('voucherType')) &&
          (matchesSearch(voucher.reference, searchParams.get('search')) ||
            matchesSearch(voucher.description, searchParams.get('search'))),
      );
      await fulfillJson(route, 200, paginate(items, searchParams, 100));
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/customers') &&
      request.method() === 'GET'
    ) {
      const items = customers.filter(
        (customer) =>
          (searchParams.get('isActive') === null ||
            customer.isActive === (searchParams.get('isActive') === 'true')) &&
          (matchesSearch(customer.fullName, searchParams.get('search')) ||
            matchesSearch(customer.email, searchParams.get('search')) ||
            matchesSearch(customer.phone, searchParams.get('search')) ||
            matchesSearch(customer.address, searchParams.get('search')) ||
            matchesSearch(customer.notes, searchParams.get('search'))),
      );
      await fulfillJson(route, 200, paginate(items, searchParams, 10));
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/customers') &&
      request.method() === 'POST'
    ) {
      const email = normalizeEmail(body.email);
      const phone = normalizePhone(body.phone);

      if (email && customers.some((customer) => customer.email === email)) {
        await fulfillJson(
          route,
          409,
          createApiError(409, 'A customer with this email already exists in the company.'),
        );
        return;
      }

      if (phone && customers.some((customer) => customer.phone === phone)) {
        await fulfillJson(
          route,
          409,
          createApiError(409, 'A customer with this phone already exists in the company.'),
        );
        return;
      }

      const record = {
        id: `customer-${customers.length + 1}`,
        companyId: 'company-1',
        fullName: String(body.fullName),
        email,
        phone,
        address: optionalString(body.address),
        notes: optionalString(body.notes),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      customers = [record, ...customers];
      await fulfillJson(route, 201, record);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/customers\/[^/]+$/u) &&
      request.method() === 'GET'
    ) {
      const customer = getCustomer(getRequiredPathSegment(pathname));

      if (!customer) {
        await fulfillJson(route, 404, createApiError(404, 'Customer not found.'));
        return;
      }

      await fulfillJson(route, 200, customer);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/customers\/[^/]+$/u) &&
      request.method() === 'PATCH'
    ) {
      const customerId = getRequiredPathSegment(pathname);
      const existing = getCustomer(customerId);

      if (!existing) {
        await fulfillJson(route, 404, createApiError(404, 'Customer not found.'));
        return;
      }

      const nextEmail =
        body.email === undefined ? existing.email : normalizeEmail(body.email);
      const nextPhone =
        body.phone === undefined ? existing.phone : normalizePhone(body.phone);

      if (
        nextEmail &&
        customers.some(
          (customer) => customer.id !== customerId && customer.email === nextEmail,
        )
      ) {
        await fulfillJson(
          route,
          409,
          createApiError(409, 'A customer with this email already exists in the company.'),
        );
        return;
      }

      if (
        nextPhone &&
        customers.some(
          (customer) => customer.id !== customerId && customer.phone === nextPhone,
        )
      ) {
        await fulfillJson(
          route,
          409,
          createApiError(409, 'A customer with this phone already exists in the company.'),
        );
        return;
      }

      const updated = {
        ...existing,
        fullName: (body.fullName as string | undefined) ?? existing.fullName,
        email: nextEmail,
        phone: nextPhone,
        address:
          body.address === undefined ? existing.address : optionalString(body.address),
        notes: body.notes === undefined ? existing.notes : optionalString(body.notes),
        updatedAt: now,
      };
      customers = customers.map((customer) =>
        customer.id === customerId ? updated : customer,
      );
      await fulfillJson(route, 200, updated);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/customers\/[^/]+\/activate$/u) &&
      request.method() === 'POST'
    ) {
      const customerId = getRequiredPathSegment(pathname, 2);
      const existing = getCustomer(customerId);

      if (!existing) {
        await fulfillJson(route, 404, createApiError(404, 'Customer not found.'));
        return;
      }

      const updated = { ...existing, isActive: true, updatedAt: now };
      customers = customers.map((customer) =>
        customer.id === customerId ? updated : customer,
      );
      await fulfillJson(route, 200, updated);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/customers\/[^/]+\/deactivate$/u) &&
      request.method() === 'POST'
    ) {
      const customerId = getRequiredPathSegment(pathname, 2);
      const existing = getCustomer(customerId);

      if (!existing) {
        await fulfillJson(route, 404, createApiError(404, 'Customer not found.'));
        return;
      }

      const updated = { ...existing, isActive: false, updatedAt: now };
      customers = customers.map((customer) =>
        customer.id === customerId ? updated : customer,
      );
      await fulfillJson(route, 200, updated);
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/leads') &&
      request.method() === 'GET'
    ) {
      const items = leads.filter(
        (lead) =>
          (!searchParams.get('projectId') || lead.projectId === searchParams.get('projectId')) &&
          (searchParams.get('status') === null ||
            lead.status === searchParams.get('status')) &&
          (searchParams.get('isActive') === null ||
            lead.isActive === (searchParams.get('isActive') === 'true')) &&
          (matchesSearch(lead.fullName, searchParams.get('search')) ||
            matchesSearch(lead.email, searchParams.get('search')) ||
            matchesSearch(lead.phone, searchParams.get('search')) ||
            matchesSearch(lead.source, searchParams.get('search')) ||
            matchesSearch(lead.notes, searchParams.get('search'))),
      );
      await fulfillJson(route, 200, paginate(items, searchParams, 10));
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/leads') &&
      request.method() === 'POST'
    ) {
      const projectId = optionalString(body.projectId);
      const project = projectId ? getProject(projectId) : null;

      if (projectId && !project) {
        await fulfillJson(route, 404, createApiError(404, 'Project not found.'));
        return;
      }

      const record = {
        id: `lead-${leads.length + 1}`,
        companyId: 'company-1',
        projectId: project?.id ?? null,
        projectCode: project?.code ?? null,
        projectName: project?.name ?? null,
        fullName: String(body.fullName),
        email: normalizeEmail(body.email),
        phone: normalizePhone(body.phone),
        source: optionalString(body.source),
        status: String(body.status ?? 'NEW'),
        notes: optionalString(body.notes),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      leads = [record, ...leads];
      await fulfillJson(route, 201, record);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/leads\/[^/]+$/u) &&
      request.method() === 'GET'
    ) {
      const lead = getLead(getRequiredPathSegment(pathname));

      if (!lead) {
        await fulfillJson(route, 404, createApiError(404, 'Lead not found.'));
        return;
      }

      await fulfillJson(route, 200, lead);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/leads\/[^/]+$/u) &&
      request.method() === 'PATCH'
    ) {
      const leadId = getRequiredPathSegment(pathname);
      const existing = getLead(leadId);

      if (!existing) {
        await fulfillJson(route, 404, createApiError(404, 'Lead not found.'));
        return;
      }

      const projectId =
        body.projectId === undefined ? existing.projectId : optionalString(body.projectId);
      const project = projectId ? getProject(projectId) : null;

      if (projectId && !project) {
        await fulfillJson(route, 404, createApiError(404, 'Project not found.'));
        return;
      }

      const updated = {
        ...existing,
        projectId: project?.id ?? null,
        projectCode: project?.code ?? null,
        projectName: project?.name ?? null,
        fullName: (body.fullName as string | undefined) ?? existing.fullName,
        email: body.email === undefined ? existing.email : normalizeEmail(body.email),
        phone: body.phone === undefined ? existing.phone : normalizePhone(body.phone),
        source: body.source === undefined ? existing.source : optionalString(body.source),
        status: (body.status as string | undefined) ?? existing.status,
        notes: body.notes === undefined ? existing.notes : optionalString(body.notes),
        updatedAt: now,
      };
      leads = leads.map((lead) => (lead.id === leadId ? updated : lead));
      await fulfillJson(route, 200, updated);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/leads\/[^/]+\/activate$/u) &&
      request.method() === 'POST'
    ) {
      const leadId = getRequiredPathSegment(pathname, 2);
      const existing = getLead(leadId);

      if (!existing) {
        await fulfillJson(route, 404, createApiError(404, 'Lead not found.'));
        return;
      }

      const updated = { ...existing, isActive: true, updatedAt: now };
      leads = leads.map((lead) => (lead.id === leadId ? updated : lead));
      await fulfillJson(route, 200, updated);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/leads\/[^/]+\/deactivate$/u) &&
      request.method() === 'POST'
    ) {
      const leadId = getRequiredPathSegment(pathname, 2);
      const existing = getLead(leadId);

      if (!existing) {
        await fulfillJson(route, 404, createApiError(404, 'Lead not found.'));
        return;
      }

      const updated = { ...existing, isActive: false, updatedAt: now };
      leads = leads.map((lead) => (lead.id === leadId ? updated : lead));
      await fulfillJson(route, 200, updated);
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/bookings') &&
      request.method() === 'GET'
    ) {
      const items = bookings.filter(
        (booking) =>
          (!searchParams.get('customerId') ||
            booking.customerId === searchParams.get('customerId')) &&
          (!searchParams.get('projectId') ||
            booking.projectId === searchParams.get('projectId')) &&
          (!searchParams.get('unitId') || booking.unitId === searchParams.get('unitId')) &&
          (searchParams.get('status') === null ||
            booking.status === searchParams.get('status')) &&
          inDateRange(
            booking.bookingDate,
            searchParams.get('dateFrom'),
            searchParams.get('dateTo'),
          ) &&
          (matchesSearch(booking.customerName, searchParams.get('search')) ||
            matchesSearch(booking.projectName, searchParams.get('search')) ||
            matchesSearch(booking.projectCode, searchParams.get('search')) ||
            matchesSearch(booking.unitCode, searchParams.get('search')) ||
            matchesSearch(booking.unitName, searchParams.get('search')) ||
            matchesSearch(booking.notes, searchParams.get('search'))),
      );
      await fulfillJson(route, 200, paginate(items, searchParams, 100));
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/bookings') &&
      request.method() === 'POST'
    ) {
      const customer = getCustomer(String(body.customerId));
      const unit = getUnit(String(body.unitId));

      if (!customer) {
        await fulfillJson(route, 404, createApiError(404, 'Customer not found.'));
        return;
      }

      if (!customer.isActive) {
        await fulfillJson(
          route,
          400,
          createApiError(400, 'Inactive customers cannot create bookings.'),
        );
        return;
      }

      if (!unit) {
        await fulfillJson(route, 404, createApiError(404, 'Unit not found.'));
        return;
      }

      if (String(body.bookingAmount) === '999.00' || unit.unitStatusCode !== 'AVAILABLE') {
        await fulfillJson(
          route,
          400,
          createApiError(400, 'Only AVAILABLE units can be booked.'),
        );
        return;
      }

      const record = {
        id: `booking-${bookings.length + 1}`,
        companyId: 'company-1',
        projectId: unit.projectId,
        projectCode: unit.projectCode,
        projectName: unit.projectName,
        customerId: customer.id,
        customerName: customer.fullName,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        unitId: unit.id,
        unitCode: unit.code,
        unitName: unit.name,
        unitStatusId: 'unit-status-booked',
        unitStatusCode: 'BOOKED',
        unitStatusName: 'Booked',
        bookingDate: String(body.bookingDate),
        bookingAmount: String(body.bookingAmount),
        status: 'ACTIVE',
        notes: optionalString(body.notes),
        saleContractId: null,
        createdAt: now,
        updatedAt: now,
      };
      bookings = [record, ...bookings];
      updateUnitBookingState(unit.id, true);
      await fulfillJson(route, 201, record);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/bookings\/[^/]+$/u) &&
      request.method() === 'GET'
    ) {
      const booking = getBooking(getRequiredPathSegment(pathname));

      if (!booking) {
        await fulfillJson(route, 404, createApiError(404, 'Booking not found.'));
        return;
      }

      await fulfillJson(route, 200, booking);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/bookings\/[^/]+$/u) &&
      request.method() === 'PATCH'
    ) {
      const bookingId = getRequiredPathSegment(pathname);
      const existing = getBooking(bookingId);

      if (!existing) {
        await fulfillJson(route, 404, createApiError(404, 'Booking not found.'));
        return;
      }

      const updated = {
        ...existing,
        notes: body.notes === undefined ? existing.notes : optionalString(body.notes),
        updatedAt: now,
      };
      bookings = bookings.map((booking) => (booking.id === bookingId ? updated : booking));
      await fulfillJson(route, 200, updated);
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/sale-contracts') &&
      request.method() === 'GET'
    ) {
      const items = saleContracts.filter(
        (saleContract) =>
          (!searchParams.get('customerId') ||
            saleContract.customerId === searchParams.get('customerId')) &&
          (!searchParams.get('projectId') ||
            saleContract.projectId === searchParams.get('projectId')) &&
          (!searchParams.get('unitId') ||
            saleContract.unitId === searchParams.get('unitId')) &&
          inDateRange(
            saleContract.contractDate,
            searchParams.get('dateFrom'),
            searchParams.get('dateTo'),
          ) &&
          (matchesSearch(saleContract.customerName, searchParams.get('search')) ||
            matchesSearch(saleContract.projectName, searchParams.get('search')) ||
            matchesSearch(saleContract.unitCode, searchParams.get('search')) ||
            matchesSearch(saleContract.reference, searchParams.get('search')) ||
            matchesSearch(saleContract.notes, searchParams.get('search'))),
      );
      await fulfillJson(route, 200, paginate(items, searchParams, 100));
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/sale-contracts') &&
      request.method() === 'POST'
    ) {
      const booking = getBooking(String(body.bookingId));

      if (!booking) {
        await fulfillJson(route, 404, createApiError(404, 'Booking not found.'));
        return;
      }

      if (String(body.contractAmount) === '999.00') {
        await fulfillJson(
          route,
          400,
          createApiError(400, 'Sale contract can only be created from an active booking.'),
        );
        return;
      }

      if (booking.saleContractId) {
        await fulfillJson(
          route,
          409,
          createApiError(409, 'A sale contract already exists for the requested booking.'),
        );
        return;
      }

      if (booking.status !== 'ACTIVE') {
        await fulfillJson(
          route,
          400,
          createApiError(400, 'Sale contract can only be created from an active booking.'),
        );
        return;
      }

      const record = {
        id: `sale-contract-${saleContracts.length + 1}`,
        companyId: 'company-1',
        bookingId: booking.id,
        customerId: booking.customerId,
        customerName: booking.customerName,
        projectId: booking.projectId,
        projectCode: booking.projectCode,
        projectName: booking.projectName,
        unitId: booking.unitId,
        unitCode: booking.unitCode,
        unitName: booking.unitName,
        bookingDate: booking.bookingDate,
        bookingAmount: booking.bookingAmount,
        contractDate: String(body.contractDate),
        contractAmount: String(body.contractAmount),
        reference: optionalString(body.reference),
        notes: optionalString(body.notes),
        createdAt: now,
        updatedAt: now,
      };
      saleContracts = [record, ...saleContracts];
      bookings = bookings.map((candidate) =>
        candidate.id === booking.id
          ? {
              ...candidate,
              status: 'CONTRACTED',
              saleContractId: record.id,
              updatedAt: now,
            }
          : candidate,
      );
      await fulfillJson(route, 201, record);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/sale-contracts\/[^/]+$/u) &&
      request.method() === 'GET'
    ) {
      const saleContract = getSaleContract(getRequiredPathSegment(pathname));

      if (!saleContract) {
        await fulfillJson(route, 404, createApiError(404, 'Sale contract not found.'));
        return;
      }

      await fulfillJson(route, 200, saleContract);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/sale-contracts\/[^/]+$/u) &&
      request.method() === 'PATCH'
    ) {
      const saleContractId = getRequiredPathSegment(pathname);
      const existing = getSaleContract(saleContractId);

      if (!existing) {
        await fulfillJson(route, 404, createApiError(404, 'Sale contract not found.'));
        return;
      }

      const updated = {
        ...existing,
        reference:
          body.reference === undefined ? existing.reference : optionalString(body.reference),
        notes: body.notes === undefined ? existing.notes : optionalString(body.notes),
        updatedAt: now,
      };
      saleContracts = saleContracts.map((saleContract) =>
        saleContract.id === saleContractId ? updated : saleContract,
      );
      await fulfillJson(route, 200, updated);
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/installment-schedules') &&
      request.method() === 'GET'
    ) {
      const items = schedules.filter(
        (schedule) =>
          (!searchParams.get('saleContractId') ||
            schedule.saleContractId === searchParams.get('saleContractId')) &&
          (searchParams.get('dueState') === null ||
            (searchParams.get('dueState') === 'due' && schedule.dueDate === today) ||
            (searchParams.get('dueState') === 'overdue' && schedule.dueDate < today)) &&
          (matchesSearch(schedule.customerName, searchParams.get('search')) ||
            matchesSearch(schedule.unitCode, searchParams.get('search')) ||
            matchesSearch(schedule.unitName, searchParams.get('search')) ||
            matchesSearch(schedule.description, searchParams.get('search')) ||
            matchesSearch(
              getSaleContract(schedule.saleContractId)?.reference ?? null,
              searchParams.get('search'),
            )),
      );
      await fulfillJson(route, 200, paginate(items, searchParams, 100));
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/installment-schedules') &&
      request.method() === 'POST'
    ) {
      const saleContract = getSaleContract(String(body.saleContractId));
      const rows = Array.isArray(body.rows)
        ? (body.rows as Array<Record<string, unknown>>)
        : [];

      if (!saleContract) {
        await fulfillJson(route, 404, createApiError(404, 'Sale contract not found.'));
        return;
      }

      const sequenceNumbers = rows.map((row) => Number(row.sequenceNumber));
      if (new Set(sequenceNumbers).size !== sequenceNumbers.length) {
        await fulfillJson(
          route,
          400,
          createApiError(
            400,
            'Installment schedule sequence numbers must be unique within the request.',
          ),
        );
        return;
      }

      if (
        rows.some((row) =>
          schedules.some(
            (schedule) =>
              schedule.saleContractId === saleContract.id &&
              schedule.sequenceNumber === Number(row.sequenceNumber),
          ),
        )
      ) {
        await fulfillJson(
          route,
          409,
          createApiError(
            409,
            'An installment schedule with this sequence number already exists for the contract.',
          ),
        );
        return;
      }

      const created = rows.map((row, index) => ({
        id: `schedule-${schedules.length + index + 1}`,
        companyId: 'company-1',
        saleContractId: saleContract.id,
        bookingId: saleContract.bookingId,
        customerId: saleContract.customerId,
        customerName: saleContract.customerName,
        projectId: saleContract.projectId,
        projectCode: saleContract.projectCode,
        projectName: saleContract.projectName,
        unitId: saleContract.unitId,
        unitCode: saleContract.unitCode,
        unitName: saleContract.unitName,
        sequenceNumber: Number(row.sequenceNumber),
        dueDate: String(row.dueDate),
        amount: String(row.amount),
        collectedAmount: '0.00',
        balanceAmount: String(row.amount),
        description: optionalString(row.description),
        createdAt: now,
        updatedAt: now,
      }));
      schedules = [...created, ...schedules];
      await fulfillJson(route, 201, {
        items: created,
        meta: createMeta(1, created.length, created.length),
      });
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/installment-schedules\/[^/]+$/u) &&
      request.method() === 'GET'
    ) {
      const schedule = getSchedule(getRequiredPathSegment(pathname));

      if (!schedule) {
        await fulfillJson(route, 404, createApiError(404, 'Installment schedule not found.'));
        return;
      }

      await fulfillJson(route, 200, schedule);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/installment-schedules\/[^/]+$/u) &&
      request.method() === 'PATCH'
    ) {
      const scheduleId = getRequiredPathSegment(pathname);
      const existing = getSchedule(scheduleId);

      if (!existing) {
        await fulfillJson(route, 404, createApiError(404, 'Installment schedule not found.'));
        return;
      }

      if (collections.some((collection) => collection.installmentScheduleId === scheduleId)) {
        await fulfillJson(
          route,
          400,
          createApiError(400, 'Installment schedules with linked collections cannot be changed.'),
        );
        return;
      }

      if (
        body.sequenceNumber !== undefined &&
        schedules.some(
          (schedule) =>
            schedule.id !== scheduleId &&
            schedule.saleContractId === existing.saleContractId &&
            schedule.sequenceNumber === Number(body.sequenceNumber),
        )
      ) {
        await fulfillJson(
          route,
          409,
          createApiError(
            409,
            'An installment schedule with this sequence number already exists for the contract.',
          ),
        );
        return;
      }

      const nextAmount = body.amount === undefined ? existing.amount : String(body.amount);
      const updated = {
        ...existing,
        sequenceNumber:
          body.sequenceNumber === undefined
            ? existing.sequenceNumber
            : Number(body.sequenceNumber),
        dueDate: (body.dueDate as string | undefined) ?? existing.dueDate,
        amount: nextAmount,
        balanceAmount: (
          Number(nextAmount) - Number(existing.collectedAmount)
        ).toFixed(2),
        description:
          body.description === undefined
            ? existing.description
            : optionalString(body.description),
        updatedAt: now,
      };
      schedules = schedules.map((schedule) => (schedule.id === scheduleId ? updated : schedule));
      await fulfillJson(route, 200, updated);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/installment-schedules\/[^/]+$/u) &&
      request.method() === 'DELETE'
    ) {
      const scheduleId = getRequiredPathSegment(pathname);
      const existing = getSchedule(scheduleId);

      if (!existing) {
        await fulfillJson(route, 404, createApiError(404, 'Installment schedule not found.'));
        return;
      }

      if (collections.some((collection) => collection.installmentScheduleId === scheduleId)) {
        await fulfillJson(
          route,
          400,
          createApiError(400, 'Installment schedules with linked collections cannot be changed.'),
        );
        return;
      }

      schedules = schedules.filter((schedule) => schedule.id !== scheduleId);
      await fulfillJson(route, 200, existing);
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/collections') &&
      request.method() === 'GET'
    ) {
      const items = collections.filter(
        (collection) =>
          (!searchParams.get('customerId') ||
            collection.customerId === searchParams.get('customerId')) &&
          (!searchParams.get('bookingId') ||
            collection.bookingId === searchParams.get('bookingId')) &&
          (!searchParams.get('saleContractId') ||
            collection.saleContractId === searchParams.get('saleContractId')) &&
          (!searchParams.get('installmentScheduleId') ||
            collection.installmentScheduleId === searchParams.get('installmentScheduleId')) &&
          (!searchParams.get('voucherId') ||
            collection.voucherId === searchParams.get('voucherId')) &&
          inDateRange(
            collection.collectionDate,
            searchParams.get('dateFrom'),
            searchParams.get('dateTo'),
          ) &&
          (matchesSearch(collection.customerName, searchParams.get('search')) ||
            matchesSearch(collection.reference, searchParams.get('search')) ||
            matchesSearch(collection.notes, searchParams.get('search')) ||
            matchesSearch(collection.voucherReference, searchParams.get('search'))),
      );
      await fulfillJson(route, 200, paginate(items, searchParams, 100));
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/collections') &&
      request.method() === 'POST'
    ) {
      const customer = getCustomer(String(body.customerId));
      const voucher = getVoucher(String(body.voucherId));
      const bookingId = optionalString(body.bookingId);
      const saleContractId = optionalString(body.saleContractId);
      const installmentScheduleId = optionalString(body.installmentScheduleId);

      if (!customer) {
        await fulfillJson(route, 404, createApiError(404, 'Customer not found.'));
        return;
      }

      if (!customer.isActive) {
        await fulfillJson(
          route,
          400,
          createApiError(400, 'Inactive customers cannot receive new collections.'),
        );
        return;
      }

      if (!voucher) {
        await fulfillJson(route, 404, createApiError(404, 'Voucher not found.'));
        return;
      }

      if (voucher.status !== 'POSTED') {
        await fulfillJson(
          route,
          400,
          createApiError(400, 'Collection must reference a posted voucher.'),
        );
        return;
      }

      if (collections.some((collection) => collection.voucherId === voucher.id)) {
        await fulfillJson(
          route,
          409,
          createApiError(409, 'The voucher is already linked to an existing collection.'),
        );
        return;
      }

      if (String(body.amount) === '999.00') {
        await fulfillJson(
          route,
          400,
          createApiError(400, 'Collection booking and sale contract do not match.'),
        );
        return;
      }

      let resolvedBookingId = bookingId;

      if (bookingId) {
        const booking = getBooking(bookingId);

        if (!booking) {
          await fulfillJson(route, 404, createApiError(404, 'Booking not found.'));
          return;
        }

        if (booking.customerId !== customer.id) {
          await fulfillJson(
            route,
            400,
            createApiError(400, 'Collection customer does not match the referenced booking.'),
          );
          return;
        }
      }

      if (saleContractId) {
        const saleContract = getSaleContract(saleContractId);

        if (!saleContract) {
          await fulfillJson(route, 404, createApiError(404, 'Sale contract not found.'));
          return;
        }

        if (saleContract.customerId !== customer.id) {
          await fulfillJson(
            route,
            400,
            createApiError(
              400,
              'Collection customer does not match the referenced sale contract.',
            ),
          );
          return;
        }

        if (resolvedBookingId && saleContract.bookingId !== resolvedBookingId) {
          await fulfillJson(
            route,
            400,
            createApiError(400, 'Collection booking and sale contract do not match.'),
          );
          return;
        }

        resolvedBookingId = saleContract.bookingId;
      }

      if (installmentScheduleId) {
        const schedule = getSchedule(installmentScheduleId);

        if (!schedule) {
          await fulfillJson(
            route,
            404,
            createApiError(404, 'Installment schedule not found.'),
          );
          return;
        }

        if (schedule.customerId !== customer.id) {
          await fulfillJson(
            route,
            400,
            createApiError(
              400,
              'Collection customer does not match the referenced installment schedule.',
            ),
          );
          return;
        }

        if (saleContractId && schedule.saleContractId !== saleContractId) {
          await fulfillJson(
            route,
            400,
            createApiError(
              400,
              'Collection sale contract and installment schedule do not match.',
            ),
          );
          return;
        }

        if (resolvedBookingId && schedule.bookingId !== resolvedBookingId) {
          await fulfillJson(
            route,
            400,
            createApiError(
              400,
              'Collection booking and installment schedule do not match.',
            ),
          );
          return;
        }

        resolvedBookingId = schedule.bookingId;
      }

      const record = {
        id: `collection-${collections.length + 1}`,
        companyId: 'company-1',
        customerId: customer.id,
        customerName: customer.fullName,
        voucherId: voucher.id,
        voucherStatus: voucher.status,
        voucherDate: voucher.voucherDate,
        voucherReference: voucher.reference,
        bookingId: resolvedBookingId,
        saleContractId,
        installmentScheduleId,
        collectionDate: String(body.collectionDate),
        amount: String(body.amount),
        reference: optionalString(body.reference),
        notes: optionalString(body.notes),
        createdAt: now,
        updatedAt: now,
      };
      collections = [record, ...collections];

      if (installmentScheduleId) {
        schedules = schedules.map((schedule) =>
          schedule.id === installmentScheduleId
            ? {
                ...schedule,
                collectedAmount: (
                  Number(schedule.collectedAmount) + Number(record.amount)
                ).toFixed(2),
                balanceAmount: (
                  Number(schedule.amount) -
                  (Number(schedule.collectedAmount) + Number(record.amount))
                ).toFixed(2),
                updatedAt: now,
              }
            : schedule,
        );
      }

      await fulfillJson(route, 201, record);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/collections\/[^/]+$/u) &&
      request.method() === 'GET'
    ) {
      const collection = getCollection(getRequiredPathSegment(pathname));

      if (!collection) {
        await fulfillJson(route, 404, createApiError(404, 'Collection not found.'));
        return;
      }

      await fulfillJson(route, 200, collection);
      return;
    }

    await route.continue();
  });

  return {
    getSchedule,
  };
};

test('redirects CRM/property desk routes to login when no browser session exists', async ({
  page,
}) => {
  await page.goto('/crm-property-desk/customers');

  await expect(page).toHaveURL(/\/login\?next=%2Fcrm-property-desk%2Fcustomers/);
});

test('renders CRM/property desk navigation and supports customer and lead operations', async ({
  page,
}) => {
  await addAuthenticatedCookie(page);
  await setupCrmPropertyDeskApiMocks(page, { authenticated: true });

  await page.goto('/crm-property-desk/customers');
  await expect(page.getByRole('heading', { name: 'Customers' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Customers' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Leads' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Bookings' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sale Contracts' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Installment Schedules' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Collections' })).toBeVisible();

  await page.getByRole('button', { name: 'New customer' }).click();
  const customerDialog = page.getByRole('dialog');
  await customerDialog.getByLabel('Customer name').fill('Nadia Islam');
  await customerDialog.getByLabel('Email').fill('nadia.islam@example.com');
  await customerDialog.getByLabel('Phone').fill('8801910000000');
  await customerDialog.getByLabel('Address').fill('Gulshan, Dhaka');
  await customerDialog.getByLabel('Notes').fill('Created from Prompt 15 smoke test');
  await customerDialog.getByRole('button', { name: 'Create customer' }).click();
  await expect(customerDialog).toBeHidden();
  await expect(page.locator('tr', { hasText: 'Nadia Islam' })).toBeVisible();

  await page.getByRole('button', { name: 'New customer' }).click();
  const duplicateCustomerDialog = page.getByRole('dialog');
  await duplicateCustomerDialog.getByLabel('Customer name').fill('Duplicate Sarah');
  await duplicateCustomerDialog.getByLabel('Email').fill('sarah.ahmed@example.com');
  await duplicateCustomerDialog.getByRole('button', { name: 'Create customer' }).click();
  await expect(
    duplicateCustomerDialog.getByText(
      'A customer with this email already exists in the company.',
    ),
  ).toBeVisible();
  await duplicateCustomerDialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(duplicateCustomerDialog).toBeHidden();

  await page.getByRole('link', { name: 'Leads' }).click();
  await expect(page.getByRole('heading', { name: 'Leads' })).toBeVisible();
  await page.getByRole('button', { name: 'New lead' }).click();
  const leadDialog = page.getByRole('dialog');
  await leadDialog.getByLabel('Project').selectOption('project-1');
  await leadDialog.getByLabel('Lead name').fill('Karim Uddin');
  await leadDialog.getByLabel('Email').fill('karim.uddin@example.com');
  await leadDialog.getByLabel('Phone').fill('8801610000000');
  await leadDialog.getByLabel('Source').fill('Walk-in');
  await leadDialog.getByLabel('Notes').fill('Interested in tower inventory');
  await leadDialog.getByRole('button', { name: 'Create lead' }).click();
  await expect(leadDialog).toBeHidden();
  await expect(page.locator('tr', { hasText: 'Karim Uddin' })).toBeVisible();
});

test('supports booking create and detail flow and surfaces invalid booking errors', async ({
  page,
}) => {
  await addAuthenticatedCookie(page);
  await setupCrmPropertyDeskApiMocks(page, { authenticated: true });

  await page.goto('/crm-property-desk/bookings');
  await expect(page.getByRole('heading', { name: 'Bookings' })).toBeVisible();

  await page.getByRole('button', { name: 'New booking' }).click();
  const bookingDialog = page.getByRole('dialog');
  await bookingDialog.getByLabel('Customer').selectOption('customer-1');
  await bookingDialog.getByLabel('Project').selectOption('project-1');
  await bookingDialog.getByLabel('Unit').selectOption('unit-available-1');
  await bookingDialog.getByLabel('Booking date').fill(today);
  await bookingDialog.getByLabel('Booking amount').fill('999.00');
  await bookingDialog.getByLabel('Notes').fill('Should surface backend unit-state error');
  await bookingDialog.getByRole('button', { name: 'Create booking' }).click();
  await expect(bookingDialog.getByText('Only AVAILABLE units can be booked.')).toBeVisible();

  await bookingDialog.getByLabel('Booking amount').fill('75000.00');
  await bookingDialog.getByLabel('Notes').fill('First booking created from the Prompt 15 UI');
  await bookingDialog.getByRole('button', { name: 'Create booking' }).click();
  await expect(bookingDialog).toBeHidden();

  const newBookingRow = page.locator('tr', { hasText: 'A-101' });
  await expect(newBookingRow).toContainText('Sarah Ahmed');
  await newBookingRow.getByRole('button', { name: 'View / Edit' }).click();

  const bookingDetailDialog = page.getByRole('dialog');
  await expect(bookingDetailDialog.getByText('Apartment 101')).toBeVisible();
  await bookingDetailDialog.getByLabel('Notes').fill('Booking notes updated');
  await bookingDetailDialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(bookingDetailDialog).toBeHidden();

  await newBookingRow.getByRole('button', { name: 'View / Edit' }).click();
  const reopenedBookingDialog = page.getByRole('dialog');
  await expect(reopenedBookingDialog.getByLabel('Notes')).toHaveValue('Booking notes updated');
});

test('supports sale contract creation plus installment schedule CRUD and invalid contract errors', async ({
  page,
}) => {
  await addAuthenticatedCookie(page);
  const crmState = await setupCrmPropertyDeskApiMocks(page, { authenticated: true });

  await page.goto('/crm-property-desk/sale-contracts');
  await expect(page.getByRole('heading', { name: 'Sale Contracts' })).toBeVisible();

  await page.getByRole('button', { name: 'New contract' }).click();
  const contractDialog = page.getByRole('dialog');
  await contractDialog.getByLabel('Booking').selectOption('booking-contract-1');
  await contractDialog.getByLabel('Contract date').fill(today);
  await contractDialog.getByLabel('Contract amount').fill('999.00');
  await contractDialog.getByRole('button', { name: 'Create contract' }).click();
  await expect(
    contractDialog.getByText('Sale contract can only be created from an active booking.'),
  ).toBeVisible();

  await contractDialog.getByLabel('Contract amount').fill('900000.00');
  await contractDialog.getByLabel('Reference').fill('SC-002');
  await contractDialog.getByLabel('Notes').fill('Prompt 15 contract flow');
  await contractDialog.getByRole('button', { name: 'Create contract' }).click();
  await expect(contractDialog).toBeHidden();
  await expect(page.locator('tr', { hasText: 'SC-002' })).toBeVisible();

  await page.getByRole('link', { name: 'Installment Schedules' }).click();
  await expect(page.getByRole('heading', { name: 'Installment Schedules' })).toBeVisible();
  await page.getByRole('button', { name: 'New schedules' }).click();

  const scheduleDialog = page.getByRole('dialog');
  await scheduleDialog.getByLabel('Sale contract').selectOption('sale-contract-2');
  await scheduleDialog.locator('#schedule-sequence-0').fill('1');
  await scheduleDialog.locator('#schedule-date-0').fill(today);
  await scheduleDialog.locator('#schedule-amount-0').fill('250000.00');
  await scheduleDialog.locator('#schedule-description-0').fill('Down payment');
  await scheduleDialog.getByRole('button', { name: 'Add row' }).click();
  await scheduleDialog.locator('#schedule-sequence-1').fill('2');
  await scheduleDialog.locator('#schedule-date-1').fill('2026-04-17');
  await scheduleDialog.locator('#schedule-amount-1').fill('250000.00');
  await scheduleDialog.locator('#schedule-description-1').fill('Milestone installment');
  await scheduleDialog.getByRole('button', { name: 'Create schedules' }).click();
  await expect(scheduleDialog).toBeHidden();

  const primaryScheduleRow = page
    .locator('tbody tr')
    .filter({ hasText: 'B-201' })
    .filter({ hasText: '#1' });
  await expect(primaryScheduleRow).toContainText('Down payment');
  await primaryScheduleRow.getByRole('button', { name: 'Edit' }).click();

  const editScheduleDialog = page.getByRole('dialog');
  await editScheduleDialog.getByLabel('Description').fill('Down payment revised');
  await editScheduleDialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(editScheduleDialog).toBeHidden();
  await expect
    .poll(() => crmState.getSchedule('schedule-2')?.description ?? null)
    .toBe('Down payment revised');

  const milestoneRow = page
    .locator('tbody tr')
    .filter({ hasText: 'B-201' })
    .filter({ hasText: '#2' });
  await expect(milestoneRow).toContainText('Milestone installment');
  await milestoneRow.getByRole('button', { name: 'Delete' }).click();
  await expect.poll(() => crmState.getSchedule('schedule-3') ?? null).toBeNull();
});

test('supports collection creation and linkage detail and surfaces invalid collection errors', async ({
  page,
}) => {
  await addAuthenticatedCookie(page);
  await setupCrmPropertyDeskApiMocks(page, { authenticated: true });

  await page.goto('/crm-property-desk/collections');
  await expect(
    page.getByRole('heading', { name: 'Collections', exact: true }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'New collection' }).click();
  const collectionDialog = page.getByRole('dialog');
  await collectionDialog.getByLabel('Customer').selectOption('customer-1');
  await collectionDialog.getByLabel('Posted voucher').selectOption('voucher-1');
  await collectionDialog.getByLabel('Booking').selectOption('booking-existing-1');
  await collectionDialog.getByLabel('Sale contract').selectOption('sale-contract-existing-1');
  await collectionDialog.getByLabel('Installment schedule').selectOption('schedule-existing-1');
  await collectionDialog.getByLabel('Collection date').fill(today);
  await collectionDialog.getByLabel('Collection amount').fill('999.00');
  await collectionDialog.getByRole('button', { name: 'Create collection' }).click();
  await expect(
    collectionDialog.getByText('Collection booking and sale contract do not match.'),
  ).toBeVisible();

  await collectionDialog.getByLabel('Collection amount').fill('100000.00');
  await collectionDialog.getByLabel('Reference').fill('COL-001');
  await collectionDialog.getByLabel('Notes').fill('Installment collected through receipt voucher');
  await collectionDialog.getByRole('button', { name: 'Create collection' }).click();
  await expect(collectionDialog).toBeHidden();

  const collectionRow = page.locator('tr', { hasText: 'RC-RECEIPT-001' });
  await expect(collectionRow).toContainText('Sarah Ahmed');
  await collectionRow.getByRole('button', { name: 'View' }).click();

  const detailDialog = page.getByRole('dialog');
  await expect(detailDialog.getByText('Installment collected through receipt voucher')).toBeVisible();
  await expect(detailDialog.getByText('RC-RECEIPT-001')).toBeVisible();
});
