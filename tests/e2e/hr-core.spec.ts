import { expect, test, type Page } from '@playwright/test';

const now = '2026-03-17T00:00:00.000Z';
const sessionCookieUrl = 'http://localhost:3100';

const baseSession = {
  tokenType: 'Bearer',
  accessToken: 'access-token',
  accessTokenExpiresAt: '2026-03-17T03:00:00.000Z',
  refreshToken: 'refresh-token',
  refreshTokenExpiresAt: '2026-03-24T03:00:00.000Z',
  user: {
    id: 'user-hr',
    email: 'hr@example.com',
    isActive: true,
    lastLoginAt: '2026-03-17T01:00:00.000Z',
    currentCompany: {
      id: 'company-1',
      name: 'Real Capita Holdings',
      slug: 'real-capita-holdings',
    },
    roles: ['company_hr'],
    assignments: [
      {
        company: {
          id: 'company-1',
          name: 'Real Capita Holdings',
          slug: 'real-capita-holdings',
        },
        roles: ['company_hr'],
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
  requestId: 'hr-core-test-request-id',
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

const setupHrCoreApiMocks = async (
  page: Page,
  {
    authenticated = false,
  }: {
    authenticated?: boolean;
  } = {},
) => {
  let isAuthenticated = authenticated;

  const departments = [
    {
      id: 'department-1',
      companyId: 'company-1',
      code: 'HR',
      name: 'Human Resources',
      description: 'People operations',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const locations = [
    {
      id: 'location-1',
      companyId: 'company-1',
      code: 'HQ',
      name: 'Head Office',
      description: 'Corporate office',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const users = [
    {
      id: 'user-1',
      email: 'manager@example.com',
      firstName: 'Mina',
      lastName: 'Khan',
      identityIsActive: true,
      companyAccessIsActive: true,
      roles: ['company_hr'],
      lastLoginAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user-2',
      email: 'staff@example.com',
      firstName: 'Nasrin',
      lastName: 'Akter',
      identityIsActive: true,
      companyAccessIsActive: true,
      roles: ['company_member'],
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    },
  ];

  let employees = [
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
      userId: 'user-1',
      userEmail: 'manager@example.com',
      userFirstName: 'Mina',
      userLastName: 'Khan',
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

  let attendanceDevices = [
    {
      id: 'device-1',
      companyId: 'company-1',
      code: 'DEV-001',
      name: 'Front Gate Device',
      description: 'Primary gate reader',
      locationId: 'location-1',
      locationCode: 'HQ',
      locationName: 'Head Office',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  let deviceUsers = [
    {
      id: 'device-user-1',
      companyId: 'company-1',
      employeeId: 'employee-1',
      employeeCode: 'EMP-001',
      employeeFullName: 'Mina Khan',
      attendanceDeviceId: 'device-1',
      attendanceDeviceCode: 'DEV-001',
      attendanceDeviceName: 'Front Gate Device',
      locationId: 'location-1',
      locationCode: 'HQ',
      locationName: 'Head Office',
      deviceEmployeeCode: '1001',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  let attendanceLogs = [
    {
      id: 'attendance-log-1',
      companyId: 'company-1',
      deviceUserId: 'device-user-1',
      employeeId: 'employee-1',
      employeeCode: 'EMP-001',
      employeeFullName: 'Mina Khan',
      attendanceDeviceId: 'device-1',
      attendanceDeviceCode: 'DEV-001',
      attendanceDeviceName: 'Front Gate Device',
      locationId: 'location-1',
      locationCode: 'HQ',
      locationName: 'Head Office',
      deviceEmployeeCode: '1001',
      loggedAt: '2026-03-17T08:30:00.000Z',
      direction: 'IN',
      externalLogId: 'LOG-1',
      createdAt: now,
      updatedAt: now,
    },
  ];

  let leaveTypes = [
    {
      id: 'leave-type-1',
      companyId: 'company-1',
      code: 'ANNUAL',
      name: 'Annual Leave',
      description: 'Regular annual leave',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  let leaveRequests = [
    {
      id: 'leave-request-seed-1',
      companyId: 'company-1',
      employeeId: 'employee-1',
      employeeCode: 'EMP-001',
      employeeFullName: 'Mina Khan',
      departmentId: 'department-1',
      departmentCode: 'HR',
      departmentName: 'Human Resources',
      locationId: 'location-1',
      locationCode: 'HQ',
      locationName: 'Head Office',
      leaveTypeId: 'leave-type-1',
      leaveTypeCode: 'ANNUAL',
      leaveTypeName: 'Annual Leave',
      startDate: '2026-03-20',
      endDate: '2026-03-21',
      reason: 'Existing approved leave',
      decisionNote: 'Approved by HR',
      status: 'APPROVED',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const getEmployee = (employeeId: string) =>
    employees.find((employee) => employee.id === employeeId);
  const getAttendanceDevice = (attendanceDeviceId: string) =>
    attendanceDevices.find((device) => device.id === attendanceDeviceId);
  const getDeviceUser = (deviceUserId: string) =>
    deviceUsers.find((deviceUser) => deviceUser.id === deviceUserId);
  const getLeaveType = (leaveTypeId: string) =>
    leaveTypes.find((leaveType) => leaveType.id === leaveTypeId);
  const getLeaveRequest = (leaveRequestId: string) =>
    leaveRequests.find((leaveRequest) => leaveRequest.id === leaveRequestId);

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

    if (pathname.endsWith('/companies/company-1/hr/references/departments')) {
      const items = departments.filter(
        (department) =>
          (searchParams.get('isActive') === null ||
            department.isActive === (searchParams.get('isActive') === 'true')) &&
          (matchesSearch(department.code, searchParams.get('search')) ||
            matchesSearch(department.name, searchParams.get('search')) ||
            matchesSearch(department.description, searchParams.get('search'))),
      );
      await fulfillJson(route, 200, paginate(items, searchParams, 100));
      return;
    }

    if (pathname.endsWith('/companies/company-1/hr/references/locations')) {
      const items = locations.filter(
        (location) =>
          (searchParams.get('isActive') === null ||
            location.isActive === (searchParams.get('isActive') === 'true')) &&
          (matchesSearch(location.code, searchParams.get('search')) ||
            matchesSearch(location.name, searchParams.get('search')) ||
            matchesSearch(location.description, searchParams.get('search'))),
      );
      await fulfillJson(route, 200, paginate(items, searchParams, 100));
      return;
    }

    if (pathname.endsWith('/companies/company-1/hr/references/users')) {
      const items = users.filter(
        (user) =>
          (searchParams.get('isActive') === null ||
            user.companyAccessIsActive === (searchParams.get('isActive') === 'true')) &&
          (!searchParams.get('roleCode') ||
            user.roles.includes(String(searchParams.get('roleCode')))) &&
          (matchesSearch(user.email, searchParams.get('search')) ||
            matchesSearch(user.firstName, searchParams.get('search')) ||
            matchesSearch(user.lastName, searchParams.get('search'))),
      );
      await fulfillJson(route, 200, paginate(items, searchParams, 100));
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/employees') &&
      request.method() === 'GET'
    ) {
      const requestedPageSize = Number(searchParams.get('pageSize') ?? '10');

      if (requestedPageSize > 100) {
        await fulfillJson(
          route,
          400,
          createApiError(400, 'pageSize must not be greater than 100'),
        );
        return;
      }

      const items = employees.filter(
        (employee) =>
          (!searchParams.get('departmentId') ||
            employee.departmentId === searchParams.get('departmentId')) &&
          (!searchParams.get('locationId') ||
            employee.locationId === searchParams.get('locationId')) &&
          (!searchParams.get('managerEmployeeId') ||
            employee.managerEmployeeId === searchParams.get('managerEmployeeId')) &&
          (searchParams.get('isActive') === null ||
            employee.isActive === (searchParams.get('isActive') === 'true')) &&
          (matchesSearch(employee.employeeCode, searchParams.get('search')) ||
            matchesSearch(employee.fullName, searchParams.get('search')) ||
            matchesSearch(employee.departmentName, searchParams.get('search')) ||
            matchesSearch(employee.locationName, searchParams.get('search')) ||
            matchesSearch(employee.userEmail, searchParams.get('search')) ||
            matchesSearch(employee.managerFullName, searchParams.get('search'))),
      );
      await fulfillJson(route, 200, paginate(items, searchParams, 10));
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/employees') &&
      request.method() === 'POST'
    ) {
      if (
        body.userId &&
        employees.some((employee) => employee.userId === String(body.userId))
      ) {
        await fulfillJson(
          route,
          409,
          createApiError(
            409,
            'This user is already linked to another employee in the company.',
          ),
        );
        return;
      }

      if (
        employees.some(
          (employee) =>
            employee.employeeCode.toLowerCase() ===
            String(body.employeeCode).toLowerCase(),
        )
      ) {
        await fulfillJson(
          route,
          409,
          createApiError(409, 'An employee with this code already exists in the company.'),
        );
        return;
      }

      const manager = body.managerEmployeeId
        ? getEmployee(String(body.managerEmployeeId))
        : null;
      const linkedUser = body.userId
        ? users.find((user) => user.id === String(body.userId))
        : null;
      const department = body.departmentId
        ? departments.find((entry) => entry.id === String(body.departmentId))
        : null;
      const location = body.locationId
        ? locations.find((entry) => entry.id === String(body.locationId))
        : null;
      const record = {
        id: `employee-${employees.length + 1}`,
        companyId: 'company-1',
        employeeCode: String(body.employeeCode),
        fullName: String(body.fullName),
        departmentId: department?.id ?? null,
        departmentCode: department?.code ?? null,
        departmentName: department?.name ?? null,
        locationId: location?.id ?? null,
        locationCode: location?.code ?? null,
        locationName: location?.name ?? null,
        userId: linkedUser?.id ?? null,
        userEmail: linkedUser?.email ?? null,
        userFirstName: linkedUser?.firstName ?? null,
        userLastName: linkedUser?.lastName ?? null,
        managerEmployeeId: manager?.id ?? null,
        managerEmployeeCode: manager?.employeeCode ?? null,
        managerFullName: manager?.fullName ?? null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      employees = [record, ...employees];
      await fulfillJson(route, 201, record);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/employees\/[^/]+$/u) &&
      request.method() === 'GET'
    ) {
      const employee = getEmployee(getRequiredPathSegment(pathname));

      if (!employee) {
        await fulfillJson(route, 404, createApiError(404, 'Employee not found.'));
        return;
      }

      await fulfillJson(route, 200, employee);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/employees\/[^/]+$/u) &&
      request.method() === 'PATCH'
    ) {
      const employeeId = getRequiredPathSegment(pathname);
      const existing = getEmployee(employeeId);

      if (!existing) {
        await fulfillJson(route, 404, createApiError(404, 'Employee not found.'));
        return;
      }

      const nextUserId =
        body.userId === undefined ? existing.userId : optionalString(body.userId);
      if (
        nextUserId &&
        employees.some((employee) => employee.id !== employeeId && employee.userId === nextUserId)
      ) {
        await fulfillJson(
          route,
          409,
          createApiError(
            409,
            'This user is already linked to another employee in the company.',
          ),
        );
        return;
      }

      const nextManager = body.managerEmployeeId
        ? getEmployee(String(body.managerEmployeeId))
        : body.managerEmployeeId === null || body.managerEmployeeId === ''
          ? null
          : existing.managerEmployeeId
            ? getEmployee(existing.managerEmployeeId)
            : null;
      const nextDepartment = body.departmentId
        ? departments.find((entry) => entry.id === String(body.departmentId))
        : body.departmentId === null || body.departmentId === ''
          ? null
          : existing.departmentId
            ? departments.find((entry) => entry.id === existing.departmentId)
            : null;
      const nextLocation = body.locationId
        ? locations.find((entry) => entry.id === String(body.locationId))
        : body.locationId === null || body.locationId === ''
          ? null
          : existing.locationId
            ? locations.find((entry) => entry.id === existing.locationId)
            : null;
      const nextUser = nextUserId
        ? users.find((user) => user.id === nextUserId)
        : null;
      const updated = {
        ...existing,
        employeeCode: (body.employeeCode as string | undefined) ?? existing.employeeCode,
        fullName: (body.fullName as string | undefined) ?? existing.fullName,
        departmentId: nextDepartment?.id ?? null,
        departmentCode: nextDepartment?.code ?? null,
        departmentName: nextDepartment?.name ?? null,
        locationId: nextLocation?.id ?? null,
        locationCode: nextLocation?.code ?? null,
        locationName: nextLocation?.name ?? null,
        userId: nextUser?.id ?? null,
        userEmail: nextUser?.email ?? null,
        userFirstName: nextUser?.firstName ?? null,
        userLastName: nextUser?.lastName ?? null,
        managerEmployeeId: nextManager?.id ?? null,
        managerEmployeeCode: nextManager?.employeeCode ?? null,
        managerFullName: nextManager?.fullName ?? null,
        updatedAt: now,
      };
      employees = employees.map((employee) =>
        employee.id === employeeId ? updated : employee,
      );
      await fulfillJson(route, 200, updated);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/employees\/[^/]+\/(activate|deactivate)$/u)
    ) {
      const employeeId = getRequiredPathSegment(pathname, 2);
      const existing = getEmployee(employeeId);

      if (!existing) {
        await fulfillJson(route, 404, createApiError(404, 'Employee not found.'));
        return;
      }

      const updated = {
        ...existing,
        isActive: pathname.endsWith('/activate'),
        updatedAt: now,
      };
      employees = employees.map((employee) =>
        employee.id === employeeId ? updated : employee,
      );
      await fulfillJson(route, 200, updated);
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/attendance-devices') &&
      request.method() === 'GET'
    ) {
      const items = attendanceDevices.filter(
        (device) =>
          (!searchParams.get('locationId') ||
            device.locationId === searchParams.get('locationId')) &&
          (searchParams.get('isActive') === null ||
            device.isActive === (searchParams.get('isActive') === 'true')) &&
          (matchesSearch(device.code, searchParams.get('search')) ||
            matchesSearch(device.name, searchParams.get('search')) ||
            matchesSearch(device.description, searchParams.get('search')) ||
            matchesSearch(device.locationName, searchParams.get('search'))),
      );
      await fulfillJson(route, 200, paginate(items, searchParams, 10));
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/attendance-devices') &&
      request.method() === 'POST'
    ) {
      if (
        attendanceDevices.some(
          (device) => device.code.toLowerCase() === String(body.code).toLowerCase(),
        )
      ) {
        await fulfillJson(
          route,
          409,
          createApiError(
            409,
            'An attendance device with this code already exists in the company.',
          ),
        );
        return;
      }

      const location = body.locationId
        ? locations.find((entry) => entry.id === String(body.locationId))
        : null;
      const record = {
        id: `device-${attendanceDevices.length + 1}`,
        companyId: 'company-1',
        code: String(body.code),
        name: String(body.name),
        description: optionalString(body.description),
        locationId: location?.id ?? null,
        locationCode: location?.code ?? null,
        locationName: location?.name ?? null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      attendanceDevices = [record, ...attendanceDevices];
      await fulfillJson(route, 201, record);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/attendance-devices\/[^/]+$/u) &&
      request.method() === 'GET'
    ) {
      const attendanceDevice = getAttendanceDevice(getRequiredPathSegment(pathname));

      if (!attendanceDevice) {
        await fulfillJson(route, 404, createApiError(404, 'Attendance device not found.'));
        return;
      }

      await fulfillJson(route, 200, attendanceDevice);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/attendance-devices\/[^/]+$/u) &&
      request.method() === 'PATCH'
    ) {
      const attendanceDeviceId = getRequiredPathSegment(pathname);
      const existing = getAttendanceDevice(attendanceDeviceId);

      if (!existing) {
        await fulfillJson(route, 404, createApiError(404, 'Attendance device not found.'));
        return;
      }

      const nextCode = String(body.code ?? existing.code);

      if (
        attendanceDevices.some(
          (device) =>
            device.id !== attendanceDeviceId &&
            device.code.toLowerCase() === nextCode.toLowerCase(),
        )
      ) {
        await fulfillJson(
          route,
          409,
          createApiError(
            409,
            'An attendance device with this code already exists in the company.',
          ),
        );
        return;
      }

      const location = body.locationId === undefined
        ? (existing.locationId
            ? locations.find((entry) => entry.id === existing.locationId) ?? null
            : null)
        : body.locationId
          ? locations.find((entry) => entry.id === String(body.locationId)) ?? null
          : null;
      const updated = {
        ...existing,
        code: nextCode,
        name: String(body.name ?? existing.name),
        description:
          body.description === undefined
            ? existing.description
            : optionalString(body.description),
        locationId: location?.id ?? null,
        locationCode: location?.code ?? null,
        locationName: location?.name ?? null,
        updatedAt: now,
      };
      attendanceDevices = attendanceDevices.map((device) =>
        device.id === attendanceDeviceId ? updated : device,
      );
      await fulfillJson(route, 200, updated);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/attendance-devices\/[^/]+\/(activate|deactivate)$/u)
    ) {
      const attendanceDeviceId = getRequiredPathSegment(pathname, 2);
      const existing = getAttendanceDevice(attendanceDeviceId);

      if (!existing) {
        await fulfillJson(route, 404, createApiError(404, 'Attendance device not found.'));
        return;
      }

      const updated = {
        ...existing,
        isActive: pathname.endsWith('/activate'),
        updatedAt: now,
      };
      attendanceDevices = attendanceDevices.map((device) =>
        device.id === attendanceDeviceId ? updated : device,
      );
      await fulfillJson(route, 200, updated);
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/device-users') &&
      request.method() === 'GET'
    ) {
      const items = deviceUsers.filter(
        (deviceUser) =>
          (!searchParams.get('employeeId') ||
            deviceUser.employeeId === searchParams.get('employeeId')) &&
          (!searchParams.get('attendanceDeviceId') ||
            deviceUser.attendanceDeviceId === searchParams.get('attendanceDeviceId')) &&
          (!searchParams.get('locationId') ||
            deviceUser.locationId === searchParams.get('locationId')) &&
          (searchParams.get('isActive') === null ||
            deviceUser.isActive === (searchParams.get('isActive') === 'true')) &&
          (matchesSearch(deviceUser.deviceEmployeeCode, searchParams.get('search')) ||
            matchesSearch(deviceUser.employeeCode, searchParams.get('search')) ||
            matchesSearch(deviceUser.employeeFullName, searchParams.get('search')) ||
            matchesSearch(deviceUser.attendanceDeviceCode, searchParams.get('search')) ||
            matchesSearch(deviceUser.attendanceDeviceName, searchParams.get('search'))),
      );
      await fulfillJson(route, 200, paginate(items, searchParams, 10));
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/device-users') &&
      request.method() === 'POST'
    ) {
      if (
        deviceUsers.some(
          (deviceUser) =>
            deviceUser.employeeId === String(body.employeeId) &&
            deviceUser.attendanceDeviceId === String(body.attendanceDeviceId) &&
            deviceUser.isActive,
        )
      ) {
        await fulfillJson(
          route,
          409,
          createApiError(
            409,
            'The employee already has an active mapping on this attendance device.',
          ),
        );
        return;
      }

      const employee = getEmployee(String(body.employeeId));
      const attendanceDevice = getAttendanceDevice(String(body.attendanceDeviceId));

      if (!employee || !attendanceDevice) {
        await fulfillJson(
          route,
          400,
          createApiError(
            400,
            'Validation failed or the linked employee/device is inactive or invalid.',
          ),
        );
        return;
      }

      if (!employee.isActive) {
        await fulfillJson(
          route,
          400,
          createApiError(400, 'Inactive employees cannot be mapped to attendance devices.'),
        );
        return;
      }

      if (!attendanceDevice.isActive) {
        await fulfillJson(
          route,
          400,
          createApiError(
            400,
            'Inactive attendance devices cannot receive employee mappings.',
          ),
        );
        return;
      }

      if (
        deviceUsers.some(
          (deviceUser) =>
            deviceUser.id !== String(body.deviceUserId ?? '') &&
            deviceUser.attendanceDeviceId === attendanceDevice.id &&
            deviceUser.deviceEmployeeCode.toLowerCase() ===
              String(body.deviceEmployeeCode).toLowerCase() &&
            deviceUser.isActive,
        )
      ) {
        await fulfillJson(
          route,
          409,
          createApiError(
            409,
            'The device employee code is already assigned on this attendance device.',
          ),
        );
        return;
      }

      const record = {
        id: `device-user-${deviceUsers.length + 1}`,
        companyId: 'company-1',
        employeeId: employee.id,
        employeeCode: employee.employeeCode,
        employeeFullName: employee.fullName,
        attendanceDeviceId: attendanceDevice.id,
        attendanceDeviceCode: attendanceDevice.code,
        attendanceDeviceName: attendanceDevice.name,
        locationId: attendanceDevice.locationId,
        locationCode: attendanceDevice.locationCode,
        locationName: attendanceDevice.locationName,
        deviceEmployeeCode: String(body.deviceEmployeeCode),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      deviceUsers = [record, ...deviceUsers];
      await fulfillJson(route, 201, record);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/device-users\/[^/]+$/u) &&
      request.method() === 'GET'
    ) {
      const deviceUser = getDeviceUser(getRequiredPathSegment(pathname));

      if (!deviceUser) {
        await fulfillJson(route, 404, createApiError(404, 'Attendance device user mapping not found.'));
        return;
      }

      await fulfillJson(route, 200, deviceUser);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/device-users\/[^/]+$/u) &&
      request.method() === 'PATCH'
    ) {
      const deviceUserId = getRequiredPathSegment(pathname);
      const existing = getDeviceUser(deviceUserId);

      if (!existing) {
        await fulfillJson(route, 404, createApiError(404, 'Attendance device user mapping not found.'));
        return;
      }

      const employee = getEmployee(String(body.employeeId ?? existing.employeeId));
      const attendanceDevice = getAttendanceDevice(
        String(body.attendanceDeviceId ?? existing.attendanceDeviceId),
      );
      const nextDeviceEmployeeCode = String(
        body.deviceEmployeeCode ?? existing.deviceEmployeeCode,
      );

      if (!employee || !attendanceDevice) {
        await fulfillJson(
          route,
          400,
          createApiError(
            400,
            'Validation failed or the linked employee/device is inactive or invalid.',
          ),
        );
        return;
      }

      if (!employee.isActive) {
        await fulfillJson(
          route,
          400,
          createApiError(400, 'Inactive employees cannot be mapped to attendance devices.'),
        );
        return;
      }

      if (!attendanceDevice.isActive) {
        await fulfillJson(
          route,
          400,
          createApiError(
            400,
            'Inactive attendance devices cannot receive employee mappings.',
          ),
        );
        return;
      }

      if (
        deviceUsers.some(
          (deviceUser) =>
            deviceUser.id !== deviceUserId &&
            deviceUser.employeeId === employee.id &&
            deviceUser.attendanceDeviceId === attendanceDevice.id &&
            deviceUser.isActive,
        )
      ) {
        await fulfillJson(
          route,
          409,
          createApiError(
            409,
            'The employee already has an active mapping on this attendance device.',
          ),
        );
        return;
      }

      if (
        deviceUsers.some(
          (deviceUser) =>
            deviceUser.id !== deviceUserId &&
            deviceUser.attendanceDeviceId === attendanceDevice.id &&
            deviceUser.deviceEmployeeCode.toLowerCase() ===
              nextDeviceEmployeeCode.toLowerCase() &&
            deviceUser.isActive,
        )
      ) {
        await fulfillJson(
          route,
          409,
          createApiError(
            409,
            'The device employee code is already assigned on this attendance device.',
          ),
        );
        return;
      }

      const updated = {
        ...existing,
        employeeId: employee.id,
        employeeCode: employee.employeeCode,
        employeeFullName: employee.fullName,
        attendanceDeviceId: attendanceDevice.id,
        attendanceDeviceCode: attendanceDevice.code,
        attendanceDeviceName: attendanceDevice.name,
        locationId: attendanceDevice.locationId,
        locationCode: attendanceDevice.locationCode,
        locationName: attendanceDevice.locationName,
        deviceEmployeeCode: nextDeviceEmployeeCode,
        updatedAt: now,
      };
      deviceUsers = deviceUsers.map((deviceUser) =>
        deviceUser.id === deviceUserId ? updated : deviceUser,
      );
      await fulfillJson(route, 200, updated);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/device-users\/[^/]+\/(activate|deactivate)$/u)
    ) {
      const deviceUserId = getRequiredPathSegment(pathname, 2);
      const existing = getDeviceUser(deviceUserId);

      if (!existing) {
        await fulfillJson(route, 404, createApiError(404, 'Attendance device user mapping not found.'));
        return;
      }

      const updated = {
        ...existing,
        isActive: pathname.endsWith('/activate'),
        updatedAt: now,
      };
      deviceUsers = deviceUsers.map((deviceUser) =>
        deviceUser.id === deviceUserId ? updated : deviceUser,
      );
      await fulfillJson(route, 200, updated);
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/attendance-logs') &&
      request.method() === 'GET'
    ) {
      const items = attendanceLogs.filter(
        (attendanceLog) =>
          (!searchParams.get('employeeId') ||
            attendanceLog.employeeId === searchParams.get('employeeId')) &&
          (!searchParams.get('attendanceDeviceId') ||
            attendanceLog.attendanceDeviceId === searchParams.get('attendanceDeviceId')) &&
          (!searchParams.get('locationId') ||
            attendanceLog.locationId === searchParams.get('locationId')) &&
          (!searchParams.get('direction') ||
            attendanceLog.direction === searchParams.get('direction')) &&
          inDateRange(
            attendanceLog.loggedAt.slice(0, 10),
            searchParams.get('dateFrom'),
            searchParams.get('dateTo'),
          ) &&
          (matchesSearch(attendanceLog.employeeCode, searchParams.get('search')) ||
            matchesSearch(attendanceLog.employeeFullName, searchParams.get('search')) ||
            matchesSearch(attendanceLog.attendanceDeviceCode, searchParams.get('search')) ||
            matchesSearch(attendanceLog.attendanceDeviceName, searchParams.get('search')) ||
            matchesSearch(attendanceLog.deviceEmployeeCode, searchParams.get('search')) ||
            matchesSearch(attendanceLog.externalLogId, searchParams.get('search'))),
      );
      await fulfillJson(route, 200, paginate(items, searchParams, 10));
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/attendance-logs') &&
      request.method() === 'POST'
    ) {
      const loggedAt = String(body.loggedAt);
      const direction = String(body.direction ?? 'UNKNOWN');

      if (
        optionalString(body.externalLogId) &&
        attendanceLogs.some(
          (attendanceLog) =>
            attendanceLog.externalLogId?.toLowerCase() ===
            optionalString(body.externalLogId)?.toLowerCase(),
        )
      ) {
        await fulfillJson(
          route,
          409,
          createApiError(
            409,
            'An attendance log with this external log ID already exists in the company.',
          ),
        );
        return;
      }

      if (
        attendanceLogs.some(
          (attendanceLog) =>
            attendanceLog.deviceUserId === String(body.deviceUserId) &&
            attendanceLog.loggedAt === loggedAt &&
            attendanceLog.direction === direction,
        )
      ) {
        await fulfillJson(
          route,
          409,
          createApiError(
            409,
            'A duplicate attendance log already exists for the same device user, timestamp, and direction.',
          ),
        );
        return;
      }

      const deviceUser = getDeviceUser(String(body.deviceUserId));

      if (!deviceUser) {
        await fulfillJson(
          route,
          400,
          createApiError(400, 'Validation failed or the attendance mapping was invalid.'),
        );
        return;
      }

      const record = {
        id: `attendance-log-${attendanceLogs.length + 1}`,
        companyId: 'company-1',
        deviceUserId: deviceUser.id,
        employeeId: deviceUser.employeeId,
        employeeCode: deviceUser.employeeCode,
        employeeFullName: deviceUser.employeeFullName,
        attendanceDeviceId: deviceUser.attendanceDeviceId,
        attendanceDeviceCode: deviceUser.attendanceDeviceCode,
        attendanceDeviceName: deviceUser.attendanceDeviceName,
        locationId: deviceUser.locationId,
        locationCode: deviceUser.locationCode,
        locationName: deviceUser.locationName,
        deviceEmployeeCode: deviceUser.deviceEmployeeCode,
        loggedAt,
        direction,
        externalLogId: optionalString(body.externalLogId),
        createdAt: now,
        updatedAt: now,
      };
      attendanceLogs = [record, ...attendanceLogs];
      await fulfillJson(route, 201, record);
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/attendance-logs/bulk') &&
      request.method() === 'POST'
    ) {
      const entries = Array.isArray(body.entries)
        ? (body.entries as Array<Record<string, unknown>>)
        : [];
      let createdCount = 0;

      for (const entry of entries) {
        const loggedAt = String(entry.loggedAt);
        const direction = String(entry.direction ?? 'UNKNOWN');
        const duplicate = attendanceLogs.some(
          (attendanceLog) =>
            attendanceLog.deviceUserId === String(entry.deviceUserId) &&
            attendanceLog.loggedAt === loggedAt &&
            attendanceLog.direction === direction,
        );

        if (duplicate) {
          continue;
        }

        const deviceUser = getDeviceUser(String(entry.deviceUserId));

        if (!deviceUser) {
          continue;
        }

        attendanceLogs = [
          {
            id: `attendance-log-${attendanceLogs.length + 1}`,
            companyId: 'company-1',
            deviceUserId: deviceUser.id,
            employeeId: deviceUser.employeeId,
            employeeCode: deviceUser.employeeCode,
            employeeFullName: deviceUser.employeeFullName,
            attendanceDeviceId: deviceUser.attendanceDeviceId,
            attendanceDeviceCode: deviceUser.attendanceDeviceCode,
            attendanceDeviceName: deviceUser.attendanceDeviceName,
            locationId: deviceUser.locationId,
            locationCode: deviceUser.locationCode,
            locationName: deviceUser.locationName,
            deviceEmployeeCode: deviceUser.deviceEmployeeCode,
            loggedAt,
            direction,
            externalLogId: optionalString(entry.externalLogId),
            createdAt: now,
            updatedAt: now,
          },
          ...attendanceLogs,
        ];
        createdCount += 1;
      }

      await fulfillJson(route, 201, {
        createdCount,
        skippedCount: entries.length - createdCount,
      });
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/attendance-logs\/[^/]+$/u) &&
      request.method() === 'GET'
    ) {
      const attendanceLog = attendanceLogs.find(
        (entry) => entry.id === getRequiredPathSegment(pathname),
      );

      if (!attendanceLog) {
        await fulfillJson(route, 404, createApiError(404, 'Attendance log not found.'));
        return;
      }

      await fulfillJson(route, 200, attendanceLog);
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/leave-types') &&
      request.method() === 'GET'
    ) {
      const items = leaveTypes.filter(
        (leaveType) =>
          (searchParams.get('isActive') === null ||
            leaveType.isActive === (searchParams.get('isActive') === 'true')) &&
          (matchesSearch(leaveType.code, searchParams.get('search')) ||
            matchesSearch(leaveType.name, searchParams.get('search')) ||
            matchesSearch(leaveType.description, searchParams.get('search'))),
      );
      await fulfillJson(route, 200, paginate(items, searchParams, 10));
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/leave-types') &&
      request.method() === 'POST'
    ) {
      if (
        leaveTypes.some(
          (leaveType) => leaveType.code.toLowerCase() === String(body.code).toLowerCase(),
        )
      ) {
        await fulfillJson(
          route,
          409,
          createApiError(409, 'A leave type with this code already exists in the company.'),
        );
        return;
      }

      if (
        leaveTypes.some(
          (leaveType) => leaveType.name.toLowerCase() === String(body.name).toLowerCase(),
        )
      ) {
        await fulfillJson(
          route,
          409,
          createApiError(409, 'A leave type with this name already exists in the company.'),
        );
        return;
      }

      const record = {
        id: `leave-type-${leaveTypes.length + 1}`,
        companyId: 'company-1',
        code: String(body.code),
        name: String(body.name),
        description: optionalString(body.description),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      leaveTypes = [record, ...leaveTypes];
      await fulfillJson(route, 201, record);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/leave-types\/[^/]+$/u) &&
      request.method() === 'GET'
    ) {
      const leaveType = getLeaveType(getRequiredPathSegment(pathname));

      if (!leaveType) {
        await fulfillJson(route, 404, createApiError(404, 'Leave type not found.'));
        return;
      }

      await fulfillJson(route, 200, leaveType);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/leave-types\/[^/]+$/u) &&
      request.method() === 'PATCH'
    ) {
      const leaveTypeId = getRequiredPathSegment(pathname);
      const existing = getLeaveType(leaveTypeId);

      if (!existing) {
        await fulfillJson(route, 404, createApiError(404, 'Leave type not found.'));
        return;
      }

      const nextCode = String(body.code ?? existing.code);
      const nextName = String(body.name ?? existing.name);

      if (
        leaveTypes.some(
          (leaveType) =>
            leaveType.id !== leaveTypeId &&
            leaveType.code.toLowerCase() === nextCode.toLowerCase(),
        )
      ) {
        await fulfillJson(
          route,
          409,
          createApiError(409, 'A leave type with this code already exists in the company.'),
        );
        return;
      }

      if (
        leaveTypes.some(
          (leaveType) =>
            leaveType.id !== leaveTypeId &&
            leaveType.name.toLowerCase() === nextName.toLowerCase(),
        )
      ) {
        await fulfillJson(
          route,
          409,
          createApiError(409, 'A leave type with this name already exists in the company.'),
        );
        return;
      }

      const updated = {
        ...existing,
        code: nextCode,
        name: nextName,
        description:
          body.description === undefined
            ? existing.description
            : optionalString(body.description),
        updatedAt: now,
      };
      leaveTypes = leaveTypes.map((leaveType) =>
        leaveType.id === leaveTypeId ? updated : leaveType,
      );
      await fulfillJson(route, 200, updated);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/leave-types\/[^/]+\/(activate|deactivate)$/u)
    ) {
      const leaveTypeId = getRequiredPathSegment(pathname, 2);
      const existing = getLeaveType(leaveTypeId);

      if (!existing) {
        await fulfillJson(route, 404, createApiError(404, 'Leave type not found.'));
        return;
      }

      const updated = {
        ...existing,
        isActive: pathname.endsWith('/activate'),
        updatedAt: now,
      };
      leaveTypes = leaveTypes.map((leaveType) =>
        leaveType.id === leaveTypeId ? updated : leaveType,
      );
      await fulfillJson(route, 200, updated);
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/leave-requests') &&
      request.method() === 'GET'
    ) {
      const items = leaveRequests.filter(
        (leaveRequest) =>
          (!searchParams.get('employeeId') ||
            leaveRequest.employeeId === searchParams.get('employeeId')) &&
          (!searchParams.get('leaveTypeId') ||
            leaveRequest.leaveTypeId === searchParams.get('leaveTypeId')) &&
          (!searchParams.get('departmentId') ||
            leaveRequest.departmentId === searchParams.get('departmentId')) &&
          (!searchParams.get('locationId') ||
            leaveRequest.locationId === searchParams.get('locationId')) &&
          (!searchParams.get('status') ||
            leaveRequest.status === searchParams.get('status')) &&
          inDateRange(
            leaveRequest.startDate,
            searchParams.get('dateFrom'),
            searchParams.get('dateTo'),
          ) &&
          (matchesSearch(leaveRequest.reason, searchParams.get('search')) ||
            matchesSearch(leaveRequest.decisionNote, searchParams.get('search')) ||
            matchesSearch(leaveRequest.employeeCode, searchParams.get('search')) ||
            matchesSearch(leaveRequest.employeeFullName, searchParams.get('search')) ||
            matchesSearch(leaveRequest.leaveTypeCode, searchParams.get('search')) ||
            matchesSearch(leaveRequest.leaveTypeName, searchParams.get('search'))),
      );
      await fulfillJson(route, 200, paginate(items, searchParams, 10));
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/leave-requests') &&
      request.method() === 'POST'
    ) {
      const employee = getEmployee(String(body.employeeId));
      const leaveType = getLeaveType(String(body.leaveTypeId));

      if (!employee || !leaveType) {
        await fulfillJson(
          route,
          400,
          createApiError(400, 'Validation failed or linked employee/leave type is invalid.'),
        );
        return;
      }

      const startDate = String(body.startDate);
      const endDate = String(body.endDate);
      const overlaps = leaveRequests.some(
        (leaveRequest) =>
          leaveRequest.employeeId === employee.id &&
          (leaveRequest.status === 'SUBMITTED' || leaveRequest.status === 'APPROVED') &&
          !(leaveRequest.endDate < startDate || leaveRequest.startDate > endDate),
      );

      if (overlaps) {
        await fulfillJson(
          route,
          409,
          createApiError(
            409,
            'The employee already has an overlapping submitted or approved leave request.',
          ),
        );
        return;
      }

      const record = {
        id: `leave-request-${leaveRequests.length + 1}`,
        companyId: 'company-1',
        employeeId: employee.id,
        employeeCode: employee.employeeCode,
        employeeFullName: employee.fullName,
        departmentId: employee.departmentId,
        departmentCode: employee.departmentCode,
        departmentName: employee.departmentName,
        locationId: employee.locationId,
        locationCode: employee.locationCode,
        locationName: employee.locationName,
        leaveTypeId: leaveType.id,
        leaveTypeCode: leaveType.code,
        leaveTypeName: leaveType.name,
        startDate,
        endDate,
        reason: optionalString(body.reason),
        decisionNote: null,
        status: 'DRAFT',
        createdAt: now,
        updatedAt: now,
      };
      leaveRequests = [record, ...leaveRequests];
      await fulfillJson(route, 201, record);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/leave-requests\/[^/]+$/u) &&
      request.method() === 'GET'
    ) {
      const leaveRequest = getLeaveRequest(getRequiredPathSegment(pathname));

      if (!leaveRequest) {
        await fulfillJson(route, 404, createApiError(404, 'Leave request not found.'));
        return;
      }

      await fulfillJson(route, 200, leaveRequest);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/leave-requests\/[^/]+$/u) &&
      request.method() === 'PATCH'
    ) {
      const leaveRequestId = getRequiredPathSegment(pathname);
      const existing = getLeaveRequest(leaveRequestId);

      if (!existing) {
        await fulfillJson(route, 404, createApiError(404, 'Leave request not found.'));
        return;
      }

      if (existing.status !== 'DRAFT') {
        await fulfillJson(
          route,
          400,
          createApiError(400, 'Only draft leave requests can be updated.'),
        );
        return;
      }

      const employee = getEmployee(String(body.employeeId ?? existing.employeeId));
      const leaveType = getLeaveType(String(body.leaveTypeId ?? existing.leaveTypeId));

      if (!employee || !leaveType || !employee.isActive || !leaveType.isActive) {
        await fulfillJson(
          route,
          400,
          createApiError(400, 'Validation failed or linked employee/leave type is invalid.'),
        );
        return;
      }

      const startDate = String(body.startDate ?? existing.startDate);
      const endDate = String(body.endDate ?? existing.endDate);
      const overlaps = leaveRequests.some(
        (leaveRequest) =>
          leaveRequest.id !== leaveRequestId &&
          leaveRequest.employeeId === employee.id &&
          (leaveRequest.status === 'SUBMITTED' || leaveRequest.status === 'APPROVED') &&
          !(leaveRequest.endDate < startDate || leaveRequest.startDate > endDate),
      );

      if (overlaps) {
        await fulfillJson(
          route,
          409,
          createApiError(
            409,
            'The employee already has an overlapping submitted or approved leave request.',
          ),
        );
        return;
      }

      const updated = {
        ...existing,
        employeeId: employee.id,
        employeeCode: employee.employeeCode,
        employeeFullName: employee.fullName,
        departmentId: employee.departmentId,
        departmentCode: employee.departmentCode,
        departmentName: employee.departmentName,
        locationId: employee.locationId,
        locationCode: employee.locationCode,
        locationName: employee.locationName,
        leaveTypeId: leaveType.id,
        leaveTypeCode: leaveType.code,
        leaveTypeName: leaveType.name,
        startDate,
        endDate,
        reason:
          body.reason === undefined ? existing.reason : optionalString(body.reason),
        updatedAt: now,
      };
      leaveRequests = leaveRequests.map((leaveRequest) =>
        leaveRequest.id === leaveRequestId ? updated : leaveRequest,
      );
      await fulfillJson(route, 200, updated);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/leave-requests\/[^/]+\/submit$/u) &&
      request.method() === 'POST'
    ) {
      const leaveRequestId = getRequiredPathSegment(pathname, 2);
      const existing = getLeaveRequest(leaveRequestId);

      if (!existing) {
        await fulfillJson(route, 404, createApiError(404, 'Leave request not found.'));
        return;
      }

      if (existing.status !== 'DRAFT') {
        await fulfillJson(
          route,
          400,
          createApiError(400, 'Only draft leave requests can be submitted.'),
        );
        return;
      }

      const overlaps = leaveRequests.some(
        (leaveRequest) =>
          leaveRequest.id !== leaveRequestId &&
          leaveRequest.employeeId === existing.employeeId &&
          (leaveRequest.status === 'SUBMITTED' || leaveRequest.status === 'APPROVED') &&
          !(leaveRequest.endDate < existing.startDate || leaveRequest.startDate > existing.endDate),
      );

      if (overlaps) {
        await fulfillJson(
          route,
          409,
          createApiError(
            409,
            'The employee already has an overlapping submitted or approved leave request.',
          ),
        );
        return;
      }

      const updated = {
        ...existing,
        status: 'SUBMITTED',
        updatedAt: now,
      };
      leaveRequests = leaveRequests.map((leaveRequest) =>
        leaveRequest.id === leaveRequestId ? updated : leaveRequest,
      );
      await fulfillJson(route, 200, updated);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/leave-requests\/[^/]+\/approve$/u) &&
      request.method() === 'POST'
    ) {
      const leaveRequestId = getRequiredPathSegment(pathname, 2);
      const existing = getLeaveRequest(leaveRequestId);

      if (!existing) {
        await fulfillJson(route, 404, createApiError(404, 'Leave request not found.'));
        return;
      }

      if (existing.status !== 'SUBMITTED') {
        await fulfillJson(
          route,
          400,
          createApiError(400, 'Only submitted leave requests can be approved or rejected.'),
        );
        return;
      }

      const updated = {
        ...existing,
        status: 'APPROVED',
        decisionNote: optionalString(body.decisionNote),
        updatedAt: now,
      };
      leaveRequests = leaveRequests.map((leaveRequest) =>
        leaveRequest.id === leaveRequestId ? updated : leaveRequest,
      );
      await fulfillJson(route, 200, updated);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/leave-requests\/[^/]+\/reject$/u) &&
      request.method() === 'POST'
    ) {
      const leaveRequestId = getRequiredPathSegment(pathname, 2);
      const existing = getLeaveRequest(leaveRequestId);

      if (!existing) {
        await fulfillJson(route, 404, createApiError(404, 'Leave request not found.'));
        return;
      }

      if (existing.status !== 'SUBMITTED') {
        await fulfillJson(
          route,
          400,
          createApiError(400, 'Only submitted leave requests can be approved or rejected.'),
        );
        return;
      }

      const updated = {
        ...existing,
        status: 'REJECTED',
        decisionNote: optionalString(body.decisionNote),
        updatedAt: now,
      };
      leaveRequests = leaveRequests.map((leaveRequest) =>
        leaveRequest.id === leaveRequestId ? updated : leaveRequest,
      );
      await fulfillJson(route, 200, updated);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/leave-requests\/[^/]+\/cancel$/u) &&
      request.method() === 'POST'
    ) {
      const leaveRequestId = getRequiredPathSegment(pathname, 2);
      const existing = getLeaveRequest(leaveRequestId);

      if (!existing) {
        await fulfillJson(route, 404, createApiError(404, 'Leave request not found.'));
        return;
      }

      if (existing.status !== 'DRAFT' && existing.status !== 'SUBMITTED') {
        await fulfillJson(
          route,
          400,
          createApiError(400, 'Only draft or submitted leave requests can be cancelled.'),
        );
        return;
      }

      const updated = {
        ...existing,
        status: 'CANCELLED',
        decisionNote: optionalString(body.decisionNote),
        updatedAt: now,
      };
      leaveRequests = leaveRequests.map((leaveRequest) =>
        leaveRequest.id === leaveRequestId ? updated : leaveRequest,
      );
      await fulfillJson(route, 200, updated);
      return;
    }

    await route.continue();
  });
};

test('redirects HR routes to login when no browser session exists', async ({
  page,
}) => {
  await page.goto('/hr/employees');

  await expect(page).toHaveURL(/\/login\?next=%2Fhr%2Femployees/);
  await expect(
    page.getByRole('heading', { name: 'Open the admin shell' }),
  ).toBeVisible();
});

test('renders the HR navigation and supports employee create with backend errors', async ({
  page,
}) => {
  await setupHrCoreApiMocks(page, { authenticated: true });
  await addAuthenticatedCookie(page);

  await page.goto('/hr/employees');

  await expect(page.getByRole('heading', { name: 'Employees' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Attendance Devices' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Leave Requests' })).toBeVisible();

  await page.getByRole('button', { name: 'New employee' }).click();
  const employeePanel = page.getByRole('dialog');
  await employeePanel.getByLabel('Employee code').fill('EMP-003');
  await employeePanel.getByLabel('Employee name').fill('Farzana Noor');
  await employeePanel
    .getByLabel('Department')
    .selectOption({ label: 'HR - Human Resources' });
  await employeePanel
    .getByLabel('Location')
    .selectOption({ label: 'HQ - Head Office' });
  await employeePanel
    .getByLabel('Linked user')
    .selectOption({ label: 'Nasrin Akter | staff@example.com | company_member' });
  await employeePanel
    .getByLabel('Manager')
    .selectOption({ label: 'EMP-001 - Mina Khan' });
  await employeePanel.getByRole('button', { name: 'Create employee' }).click();

  const createdEmployeeRow = page.locator('tbody tr').filter({
    hasText: 'EMP-003',
  });
  await expect(createdEmployeeRow).toContainText('Farzana Noor');

  await page.getByRole('button', { name: 'New employee' }).click();
  const duplicateEmployeePanel = page.getByRole('dialog');
  await duplicateEmployeePanel.getByLabel('Employee code').fill('EMP-004');
  await duplicateEmployeePanel.getByLabel('Employee name').fill('Duplicate User Employee');
  await duplicateEmployeePanel
    .getByLabel('Linked user')
    .selectOption({ label: 'Mina Khan | manager@example.com | company_hr' });
  await duplicateEmployeePanel
    .getByRole('button', { name: 'Create employee' })
    .click();

  await expect(
    page.getByText('This user is already linked to another employee in the company.'),
  ).toBeVisible();
});

test('supports employee list export for HR users', async ({ page }) => {
  await setupHrCoreApiMocks(page, { authenticated: true });
  await addAuthenticatedCookie(page);
  const exportDate = new Date().toISOString().slice(0, 10);

  await page.goto('/hr/employees');

  await expect(page.getByRole('heading', { name: 'Employees' })).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const download = await downloadPromise;

  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename()).toBe(
    `real-capita-holdings-employees-export-${exportDate}.csv`,
  );
});

test('supports attendance device and device mapping operations with conflict surfacing', async ({
  page,
}) => {
  await setupHrCoreApiMocks(page, { authenticated: true });
  await addAuthenticatedCookie(page);

  await page.goto('/hr/attendance-devices');

  await expect(
    page.getByRole('heading', { name: 'Attendance Devices' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'New device' }).click();
  const devicePanel = page.getByRole('dialog');
  await devicePanel.getByLabel('Device code').fill('DEV-002');
  await devicePanel.getByLabel('Device name').fill('Back Office Reader');
  await devicePanel
    .getByLabel('Location')
    .selectOption({ label: 'HQ - Head Office' });
  await devicePanel.getByLabel('Description').fill('Secondary attendance device');
  await devicePanel.getByRole('button', { name: 'Create device' }).click();

  await expect(page.getByText('DEV-002')).toBeVisible();
  await expect(page.getByText('Back Office Reader')).toBeVisible();

  await page.getByRole('button', { name: 'New device' }).click();
  const duplicateDevicePanel = page.getByRole('dialog');
  await duplicateDevicePanel.getByLabel('Device code').fill('DEV-001');
  await duplicateDevicePanel.getByLabel('Device name').fill('Duplicate Device');
  await duplicateDevicePanel.getByRole('button', { name: 'Create device' }).click();

  await expect(
    page.getByText('An attendance device with this code already exists in the company.'),
  ).toBeVisible();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Close panel' })
    .click();

  await page.goto('/hr/device-mappings');

  await expect(page.getByRole('heading', { name: 'Device Mappings' })).toBeVisible();
  await expect(
    page.locator('tbody tr').filter({ hasText: 'EMP-001' }).first(),
  ).toContainText('DEV-001');

  await page.getByRole('button', { name: 'New mapping' }).click();
  const deviceMappingPanel = page.getByRole('dialog');
  await deviceMappingPanel
    .getByLabel('Employee', { exact: true })
    .selectOption({ label: 'EMP-001 - Mina Khan' });
  await deviceMappingPanel
    .getByLabel('Attendance device', { exact: true })
    .selectOption({ label: 'DEV-001 - Front Gate Device' });
  await deviceMappingPanel.getByLabel('Device employee code').fill('1002');
  await deviceMappingPanel.getByRole('button', { name: 'Create mapping' }).click();

  await expect(
    page.getByText('The employee already has an active mapping on this attendance device.'),
  ).toBeVisible();
});

test('supports attendance log filtering and surfaces manual entry errors', async ({
  page,
}) => {
  await setupHrCoreApiMocks(page, { authenticated: true });
  await addAuthenticatedCookie(page);

  await page.goto('/hr/attendance-logs');

  await expect(page.getByRole('heading', { name: 'Attendance Logs' })).toBeVisible();

  await page
    .getByLabel('Employee')
    .selectOption({ label: 'EMP-001 - Mina Khan' });
  await page.getByLabel('Direction').selectOption('IN');
  await page.getByLabel('Date from').fill('2026-03-17');
  await page.getByLabel('Date to').fill('2026-03-17');

  await expect(page.getByText('LOG-1')).toBeVisible();

  await page.getByRole('button', { name: 'Manual entry' }).click();
  const attendanceLogPanel = page.getByRole('dialog');
  await attendanceLogPanel
    .getByLabel('Device mapping')
    .selectOption({ label: '1001 | EMP-001 Mina Khan | DEV-001' });
  await attendanceLogPanel.getByLabel('Logged at').fill('2026-03-17T08:45');
  await attendanceLogPanel.getByLabel('Direction').selectOption('IN');
  await attendanceLogPanel.getByLabel('External log ID').fill('LOG-2');
  await attendanceLogPanel
    .getByRole('button', { name: 'Create attendance log' })
    .click();

  await expect(page.getByText('LOG-2')).toBeVisible();

  await page.getByRole('button', { name: 'Manual entry' }).click();
  const duplicateAttendanceLogPanel = page.getByRole('dialog');
  await duplicateAttendanceLogPanel
    .getByLabel('Device mapping')
    .selectOption({ label: '1001 | EMP-001 Mina Khan | DEV-001' });
  await duplicateAttendanceLogPanel.getByLabel('Logged at').fill('2026-03-19T09:00');
  await duplicateAttendanceLogPanel.getByLabel('Direction').selectOption('IN');
  await duplicateAttendanceLogPanel.getByLabel('External log ID').fill('LOG-1');
  await duplicateAttendanceLogPanel
    .getByRole('button', { name: 'Create attendance log' })
    .click();

  await expect(
    page.getByText('An attendance log with this external log ID already exists in the company.'),
  ).toBeVisible();
});

test('supports leave type setup and leave request lifecycle with backend conflict errors', async ({
  page,
}) => {
  await setupHrCoreApiMocks(page, { authenticated: true });
  await addAuthenticatedCookie(page);

  await page.goto('/hr/leave-types');

  await expect(page.getByRole('heading', { name: 'Leave Types' })).toBeVisible();

  await page.getByRole('button', { name: 'New leave type' }).click();
  const leaveTypePanel = page.getByRole('dialog');
  await leaveTypePanel.getByLabel('Leave type code').fill('SICK');
  await leaveTypePanel.getByLabel('Leave type name').fill('Sick Leave');
  await leaveTypePanel.getByLabel('Description').fill('Medical leave category');
  await leaveTypePanel.getByRole('button', { name: 'Create leave type' }).click();

  await expect(page.getByRole('cell', { name: 'SICK', exact: true })).toBeVisible();
  await expect(page.getByText('Sick Leave')).toBeVisible();

  await page.getByRole('button', { name: 'New leave type' }).click();
  const duplicateLeaveTypePanel = page.getByRole('dialog');
  await duplicateLeaveTypePanel.getByLabel('Leave type code').fill('SICK');
  await duplicateLeaveTypePanel
    .getByLabel('Leave type name')
    .fill('Duplicate Sick Leave');
  await duplicateLeaveTypePanel
    .getByRole('button', { name: 'Create leave type' })
    .click();

  await expect(
    page.getByText('A leave type with this code already exists in the company.'),
  ).toBeVisible();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Close panel' })
    .click();

  await page.goto('/hr/leave-requests');

  await expect(page.getByRole('heading', { name: 'Leave Requests' })).toBeVisible();

  await page.getByRole('button', { name: 'New leave request' }).click();
  const leaveRequestPanel = page.getByRole('dialog');
  await leaveRequestPanel
    .getByLabel('Employee', { exact: true })
    .selectOption({ label: 'EMP-002 - Nasrin Akter' });
  await leaveRequestPanel
    .getByLabel('Leave type')
    .selectOption({ label: 'SICK - Sick Leave' });
  await leaveRequestPanel.getByLabel('Start date').fill('2026-03-23');
  await leaveRequestPanel.getByLabel('End date').fill('2026-03-24');
  await leaveRequestPanel.getByLabel('Reason').fill('Medical rest');
  await leaveRequestPanel
    .getByRole('button', { name: 'Create leave request' })
    .click();

  const nasrinRequestRow = page.locator('tbody tr').filter({
    hasText: 'EMP-002',
  });
  await expect(nasrinRequestRow).toContainText('Sick Leave');

  await nasrinRequestRow.getByRole('button', { name: 'Open' }).click();
  const leaveRequestDetailPanel = page.getByRole('dialog');
  await expect(leaveRequestDetailPanel.getByText('DRAFT', { exact: true })).toBeVisible();
  await leaveRequestDetailPanel.getByRole('button', { name: 'Submit request' }).click();

  await expect(
    leaveRequestDetailPanel.getByText('SUBMITTED', { exact: true }),
  ).toBeVisible();
  await leaveRequestDetailPanel.getByLabel('Decision note').fill('Approved by HR lead');
  await leaveRequestDetailPanel.getByRole('button', { name: 'Approve' }).click();

  await expect(
    leaveRequestDetailPanel.getByText('APPROVED', { exact: true }),
  ).toBeVisible();
  await expect(leaveRequestDetailPanel.getByText('Protected request')).toBeVisible();

  await leaveRequestDetailPanel
    .getByRole('button', { name: 'Close panel' })
    .click();
  await page.getByRole('button', { name: 'New leave request' }).click();
  const overlappingLeaveRequestPanel = page.getByRole('dialog');
  await overlappingLeaveRequestPanel
    .getByLabel('Employee', { exact: true })
    .selectOption({ label: 'EMP-001 - Mina Khan' });
  await overlappingLeaveRequestPanel
    .getByLabel('Leave type')
    .selectOption({ label: 'ANNUAL - Annual Leave' });
  await overlappingLeaveRequestPanel.getByLabel('Start date').fill('2026-03-20');
  await overlappingLeaveRequestPanel.getByLabel('End date').fill('2026-03-20');
  await overlappingLeaveRequestPanel.getByLabel('Reason').fill('Overlap validation check');
  await overlappingLeaveRequestPanel
    .getByRole('button', { name: 'Create leave request' })
    .click();

  await expect(
    page.getByText('The employee already has an overlapping submitted or approved leave request.'),
  ).toBeVisible();
});
