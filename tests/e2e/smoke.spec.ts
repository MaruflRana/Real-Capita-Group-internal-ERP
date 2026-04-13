import { expect, test, type Page } from '@playwright/test';

const baseSession = {
  tokenType: 'Bearer',
  accessToken: 'access-token',
  accessTokenExpiresAt: '2026-03-16T03:00:00.000Z',
  refreshToken: 'refresh-token',
  refreshTokenExpiresAt: '2026-03-23T03:00:00.000Z',
  user: {
    id: 'user-admin',
    email: 'admin@example.com',
    isActive: true,
    lastLoginAt: '2026-03-16T01:00:00.000Z',
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

const roles = [
  {
    id: 'role-1',
    code: 'company_admin',
    name: 'Company Administrator',
    description: null,
    isActive: true,
    createdAt: '2026-03-16T00:00:00.000Z',
    updatedAt: '2026-03-16T00:00:00.000Z',
  },
  {
    id: 'role-2',
    code: 'company_hr',
    name: 'Company HR',
    description: null,
    isActive: true,
    createdAt: '2026-03-16T00:00:00.000Z',
    updatedAt: '2026-03-16T00:00:00.000Z',
  },
  {
    id: 'role-3',
    code: 'company_member',
    name: 'Company Member',
    description: null,
    isActive: true,
    createdAt: '2026-03-16T00:00:00.000Z',
    updatedAt: '2026-03-16T00:00:00.000Z',
  },
];

const createApiError = (
  statusCode: number,
  message: string,
  details?: unknown,
) => ({
  statusCode,
  error: statusCode === 401 ? 'Unauthorized' : 'Bad Request',
  message,
  path: '/api/v1',
  timestamp: '2026-03-16T00:00:00.000Z',
  requestId: 'test-request-id',
  ...(details === undefined ? {} : { details }),
});

const fulfillJson = async (
  page: Page,
  route: Parameters<Page['route']>[1] extends (
    route: infer T,
  ) => unknown
    ? T
    : never,
  status: number,
  payload: unknown,
  headers?: Record<string, string>,
) => {
  await route.fulfill({
    status,
    contentType: 'application/json',
    ...(headers ? { headers } : {}),
    body: JSON.stringify(payload),
  });
};

const setupApiMocks = async (
  page: Page,
  {
    authenticated = false,
  }: {
    authenticated?: boolean;
  } = {},
) => {
  let isAuthenticated = authenticated;
  let companies = [
    {
      id: 'company-1',
      name: 'Real Capita Holdings',
      slug: 'real-capita-holdings',
      isActive: true,
      currentUserRoles: ['company_admin'],
      createdAt: '2026-03-16T00:00:00.000Z',
      updatedAt: '2026-03-16T00:00:00.000Z',
    },
  ];
  const locations = [
    {
      id: 'location-1',
      companyId: 'company-1',
      code: 'HQ',
      name: 'Head Office',
      description: 'Primary admin office',
      isActive: true,
      createdAt: '2026-03-16T00:00:00.000Z',
      updatedAt: '2026-03-16T00:00:00.000Z',
    },
  ];
  const departments = [
    {
      id: 'department-1',
      companyId: 'company-1',
      code: 'FIN',
      name: 'Finance',
      description: 'Accounting and treasury',
      isActive: true,
      createdAt: '2026-03-16T00:00:00.000Z',
      updatedAt: '2026-03-16T00:00:00.000Z',
    },
  ];
  let users = [
    {
      id: 'user-admin',
      email: 'admin@example.com',
      firstName: 'Amina',
      lastName: 'Rahman',
      identityIsActive: true,
      companyAccessIsActive: true,
      roles: ['company_admin'],
      lastLoginAt: '2026-03-16T01:00:00.000Z',
      createdAt: '2026-03-16T00:00:00.000Z',
      updatedAt: '2026-03-16T00:00:00.000Z',
    },
  ];
  const roleAssignmentsByUser: Record<string, Array<{
    id: string;
    companyId: string;
    userId: string;
    roleId: string;
    roleCode: string;
    roleName: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>> = {
    'user-admin': [
      {
        id: 'assignment-1',
        companyId: 'company-1',
        userId: 'user-admin',
        roleId: 'role-1',
        roleCode: 'company_admin',
        roleName: 'Company Administrator',
        isActive: true,
        createdAt: '2026-03-16T00:00:00.000Z',
        updatedAt: '2026-03-16T00:00:00.000Z',
      },
    ],
  };

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const { pathname } = url;
    const body = request.postDataJSON?.() ?? (() => {
      try {
        return JSON.parse(request.postData() || '{}');
      } catch {
        return {};
      }
    })();

    if (pathname.endsWith('/auth/me')) {
      if (!isAuthenticated) {
        await fulfillJson(
          page,
          route,
          401,
          createApiError(401, 'Access token verification failed.'),
        );
        return;
      }

      await fulfillJson(page, route, 200, baseSession.user);
      return;
    }

    if (pathname.endsWith('/auth/refresh')) {
      if (!isAuthenticated) {
        await fulfillJson(
          page,
          route,
          401,
          createApiError(401, 'Refresh token verification failed.'),
        );
        return;
      }

      await fulfillJson(page, route, 200, baseSession);
      return;
    }

    if (pathname.endsWith('/auth/login')) {
      if (!body.companyId) {
        await fulfillJson(
          page,
          route,
          400,
          createApiError(
            400,
            'companyId is required when multiple active company memberships exist.',
            {
              availableCompanies: baseSession.user.assignments.map(
                (assignment) => ({
                  id: assignment.company.id,
                  name: assignment.company.name,
                  slug: assignment.company.slug,
                  roles: assignment.roles,
                }),
              ),
            },
          ),
        );
        return;
      }

      isAuthenticated = true;
      await page.context().addCookies([
        {
          name: 'rc_access_token',
          value: 'access-token',
          url: 'http://localhost:3100',
        },
      ]);
      await fulfillJson(page, route, 200, baseSession);
      return;
    }

    if (pathname.endsWith('/auth/logout')) {
      isAuthenticated = false;
      await page.context().clearCookies();
      await fulfillJson(page, route, 200, {
        status: 'ok',
        message: 'Session revoked.',
      });
      return;
    }

    if (pathname.endsWith('/health')) {
      await fulfillJson(page, route, 200, {
        status: 'ok',
        service: 'api',
        version: '1.0.0-test',
        timestamp: '2026-03-16T00:00:00.000Z',
      });
      return;
    }

    if (pathname.endsWith('/companies') && request.method() === 'GET') {
      await fulfillJson(page, route, 200, {
        items: companies,
        meta: {
          page: 1,
          pageSize: 10,
          total: companies.length,
          totalPages: 1,
        },
      });
      return;
    }

    if (pathname.endsWith('/companies') && request.method() === 'POST') {
      const record = {
        id: `company-${companies.length + 1}`,
        name: body.name,
        slug: body.slug,
        isActive: true,
        currentUserRoles: ['company_admin'],
        createdAt: '2026-03-16T00:00:00.000Z',
        updatedAt: '2026-03-16T00:00:00.000Z',
      };
      companies = [record, ...companies];
      await fulfillJson(page, route, 201, record);
      return;
    }

    if (pathname.endsWith('/companies/company-1/locations')) {
      await fulfillJson(page, route, 200, {
        items: locations,
        meta: {
          page: 1,
          pageSize: 10,
          total: locations.length,
          totalPages: 1,
        },
      });
      return;
    }

    if (pathname.endsWith('/companies/company-1/departments')) {
      await fulfillJson(page, route, 200, {
        items: departments,
        meta: {
          page: 1,
          pageSize: 10,
          total: departments.length,
          totalPages: 1,
        },
      });
      return;
    }

    if (pathname.endsWith('/companies/company-1/users') && request.method() === 'GET') {
      await fulfillJson(page, route, 200, {
        items: users,
        meta: {
          page: 1,
          pageSize: 10,
          total: users.length,
          totalPages: 1,
        },
      });
      return;
    }

    if (pathname.endsWith('/companies/company-1/users') && request.method() === 'POST') {
      const record = {
        id: `user-${users.length + 1}`,
        email: body.email,
        firstName: body.firstName ?? null,
        lastName: body.lastName ?? null,
        identityIsActive: true,
        companyAccessIsActive: true,
        roles: body.roleCodes,
        lastLoginAt: null,
        createdAt: '2026-03-16T00:00:00.000Z',
        updatedAt: '2026-03-16T00:00:00.000Z',
      };
      users = [record, ...users];
      roleAssignmentsByUser[record.id] = body.roleCodes.map(
        (roleCode: string, index: number) => {
          const role = roles.find((item) => item.code === roleCode);

          return {
            id: `${record.id}-assignment-${index + 1}`,
            companyId: 'company-1',
            userId: record.id,
            roleId: role?.id ?? `role-${index + 10}`,
            roleCode,
            roleName: role?.name ?? roleCode,
            isActive: true,
            createdAt: '2026-03-16T00:00:00.000Z',
            updatedAt: '2026-03-16T00:00:00.000Z',
          };
        },
      );
      await fulfillJson(page, route, 201, record);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/users\/[^/]+\/roles$/u) &&
      request.method() === 'GET'
    ) {
      const userId = pathname.split('/').slice(-2)[0];
      const items = roleAssignmentsByUser[userId] ?? [];

      await fulfillJson(page, route, 200, {
        items,
        meta: {
          page: 1,
          pageSize: 20,
          total: items.length,
          totalPages: 1,
        },
      });
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/users\/[^/]+\/roles$/u) &&
      request.method() === 'POST'
    ) {
      const userId = pathname.split('/').slice(-2)[0];
      const role = roles.find((item) => item.code === body.roleCode);
      const existingAssignments = roleAssignmentsByUser[userId] ?? [];
      const record = {
        id: `${userId}-assignment-${existingAssignments.length + 1}`,
        companyId: 'company-1',
        userId,
        roleId: role?.id ?? 'role-new',
        roleCode: body.roleCode,
        roleName: role?.name ?? body.roleCode,
        isActive: true,
        createdAt: '2026-03-16T00:00:00.000Z',
        updatedAt: '2026-03-16T00:00:00.000Z',
      };
      roleAssignmentsByUser[userId] = [record, ...existingAssignments];
      users = users.map((recordUser) =>
        recordUser.id === userId
          ? { ...recordUser, roles: [body.roleCode, ...recordUser.roles] }
          : recordUser,
      );
      await fulfillJson(page, route, 200, record);
      return;
    }

    if (pathname === '/api/v1/roles' && request.method() === 'GET') {
      await fulfillJson(page, route, 200, {
        items: roles,
        meta: {
          page: 1,
          pageSize: 100,
          total: roles.length,
          totalPages: 1,
        },
      });
      return;
    }

    await route.continue();
  });
};

test('redirects protected routes to login when no browser session exists', async ({
  page,
}) => {
  await page.goto('/dashboard');

  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
  await expect(page.getByRole('heading', { name: 'Open the admin shell' })).toBeVisible();
});

test('redirects 127.0.0.1 requests onto the canonical localhost origin', async ({
  page,
}) => {
  await page.goto('http://127.0.0.1:3100/dashboard');

  await expect(page).toHaveURL('http://localhost:3100/login?next=%2Fdashboard');
});

test('supports company-aware login and enters the authenticated shell', async ({
  page,
}) => {
  await setupApiMocks(page);

  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('secure-admin-password');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByLabel('Company context')).toBeVisible();
  await page.getByLabel('Company context').selectOption('company-1');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText('Company snapshot')).toBeVisible();
  await expect(page.getByText('Operational home', { exact: true })).toBeVisible();
});

test('renders Org & Security pages and supports basic admin interactions', async ({
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
  await setupApiMocks(page, { authenticated: true });

  await page.goto('/dashboard');
  await page.getByRole('link', { name: 'Companies' }).click();
  await expect(page.getByRole('heading', { name: 'Companies' })).toBeVisible();
  await page.getByRole('button', { name: 'New company' }).click();
  await page.getByLabel('Company name').fill('Real Capita Assets');
  await page.getByLabel('Slug').fill('real-capita-assets');
  await page.getByRole('button', { name: 'Create company' }).click();
  await expect(page.getByText('Real Capita Assets')).toBeVisible();

  await page.getByRole('link', { name: 'Locations' }).click();
  await expect(page.getByRole('heading', { name: 'Locations' })).toBeVisible();
  await expect(page.getByText('Head Office')).toBeVisible();

  await page.getByRole('link', { name: 'Departments' }).click();
  await expect(page.getByRole('heading', { name: 'Departments' })).toBeVisible();
  await expect(page.getByText('Finance')).toBeVisible();

  await page.getByRole('link', { name: 'Users' }).click();
  await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
  await page.getByRole('button', { name: 'New user' }).click();
  await page.getByLabel('Email').fill('ops@example.com');
  await page.getByLabel('Temporary password').fill('secure-temp-password');
  await page.getByLabel('Company Member').check();
  await page.getByRole('button', { name: 'Create user' }).click();
  await expect(page.locator('tr', { hasText: 'ops@example.com' })).toBeVisible();

  await page
    .locator('tr', { hasText: 'ops@example.com' })
    .getByRole('link', { name: 'Manage roles' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Roles / Assignments' }),
  ).toBeVisible();
  await page.getByLabel('Role').selectOption('company_admin');
  await page.getByRole('button', { name: 'Assign role' }).click();
  await expect(
    page.locator('tr', { hasText: 'Company Administrator' }),
  ).toBeVisible();
});
