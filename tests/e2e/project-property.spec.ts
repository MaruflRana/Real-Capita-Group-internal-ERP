import { expect, test, type Page } from '@playwright/test';

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

const now = '2026-03-17T00:00:00.000Z';

const createApiError = (statusCode: number, message: string) => ({
  statusCode,
  error:
    statusCode === 401
      ? 'Unauthorized'
      : statusCode === 404
        ? 'Not Found'
        : 'Bad Request',
  message,
  path: '/api/v1',
  timestamp: now,
  requestId: 'project-property-test-request-id',
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

const matchesSearch = (
  value: string | null | undefined,
  search: string | null,
) => !search || (value ?? '').toLowerCase().includes(search.toLowerCase());

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

const setupProjectPropertyApiMocks = async (
  page: Page,
  {
    authenticated = false,
  }: {
    authenticated?: boolean;
  } = {},
) => {
  let isAuthenticated = authenticated;

  const locations = [
    {
      id: 'location-1',
      companyId: 'company-1',
      code: 'HQ',
      name: 'Head Office',
      description: 'Primary location',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  let projects = [
    {
      id: 'project-1',
      companyId: 'company-1',
      locationId: 'location-1',
      locationCode: 'HQ',
      locationName: 'Head Office',
      code: 'RCH-TOWER',
      name: 'Real Capita Tower',
      description: 'Primary tower project',
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
      projectCode: 'RCH-TOWER',
      projectName: 'Real Capita Tower',
      code: 'CC-TOWER',
      name: 'Tower Cost Center',
      description: 'Project-linked cost center',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const phases = [
    {
      id: 'phase-1',
      companyId: 'company-1',
      projectId: 'project-1',
      projectCode: 'RCH-TOWER',
      projectName: 'Real Capita Tower',
      code: 'PH-01',
      name: 'Structure',
      description: 'Structure phase',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const blocks = [
    {
      id: 'block-1',
      companyId: 'company-1',
      projectId: 'project-1',
      projectCode: 'RCH-TOWER',
      projectName: 'Real Capita Tower',
      phaseId: 'phase-1',
      phaseCode: 'PH-01',
      phaseName: 'Structure',
      code: 'BLK-A',
      name: 'Block A',
      description: 'North block',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const zones = [
    {
      id: 'zone-1',
      companyId: 'company-1',
      projectId: 'project-1',
      projectCode: 'RCH-TOWER',
      projectName: 'Real Capita Tower',
      blockId: 'block-1',
      blockCode: 'BLK-A',
      blockName: 'Block A',
      code: 'ZN-01',
      name: 'North Zone',
      description: 'North-facing zone',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const unitTypes = [
    {
      id: 'unit-type-1',
      companyId: 'company-1',
      code: 'APT',
      name: 'Apartment',
      description: 'Residential apartment',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'unit-type-2',
      companyId: 'company-1',
      code: 'SHOP',
      name: 'Shop',
      description: 'Retail unit',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const unitStatuses = [
    {
      id: 'unit-status-1',
      code: 'AVAILABLE',
      name: 'Available',
      sortOrder: 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'unit-status-2',
      code: 'BOOKED',
      name: 'Booked',
      sortOrder: 2,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  let units = [
    {
      id: 'unit-1',
      companyId: 'company-1',
      projectId: 'project-1',
      projectCode: 'RCH-TOWER',
      projectName: 'Real Capita Tower',
      phaseId: 'phase-1',
      phaseCode: 'PH-01',
      phaseName: 'Structure',
      blockId: 'block-1',
      blockCode: 'BLK-A',
      blockName: 'Block A',
      zoneId: 'zone-1',
      zoneCode: 'ZN-01',
      zoneName: 'North Zone',
      unitTypeId: 'unit-type-1',
      unitTypeCode: 'APT',
      unitTypeName: 'Apartment',
      unitStatusId: 'unit-status-1',
      unitStatusCode: 'AVAILABLE',
      unitStatusName: 'Available',
      code: 'T-10A',
      name: 'Tower 10A',
      description: 'Seeded unit',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const findProject = (projectId: string) =>
    projects.find((project) => project.id === projectId);
  const findPhase = (phaseId: string | null | undefined) =>
    phaseId ? phases.find((phase) => phase.id === phaseId) : undefined;
  const findBlock = (blockId: string | null | undefined) =>
    blockId ? blocks.find((block) => block.id === blockId) : undefined;
  const findZone = (zoneId: string | null | undefined) =>
    zoneId ? zones.find((zone) => zone.id === zoneId) : undefined;
  const findUnitType = (unitTypeId: string) =>
    unitTypes.find((unitType) => unitType.id === unitTypeId);
  const findUnitStatus = (unitStatusId: string) =>
    unitStatuses.find((unitStatus) => unitStatus.id === unitStatusId);

  const listBySearch = <T extends { code: string; name: string; description: string | null }>(
    items: T[],
    searchParams: URLSearchParams,
  ) =>
    items.filter(
      (item) =>
        matchesSearch(item.code, searchParams.get('search')) ||
        matchesSearch(item.name, searchParams.get('search')) ||
        matchesSearch(item.description, searchParams.get('search')),
    );

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

    if (pathname.endsWith('/companies/company-1/locations')) {
      await fulfillJson(route, 200, paginate(locations, searchParams, 100));
      return;
    }

    if (pathname.endsWith('/companies/company-1/projects') && request.method() === 'GET') {
      const items = listBySearch(projects, searchParams).filter(
        (project) =>
          (!searchParams.get('locationId') ||
            project.locationId === searchParams.get('locationId')) &&
          (searchParams.get('isActive') === null ||
            project.isActive === (searchParams.get('isActive') === 'true')),
      );
      await fulfillJson(route, 200, paginate(items, searchParams, 10));
      return;
    }

    if (pathname.endsWith('/companies/company-1/projects') && request.method() === 'POST') {
      const location = body.locationId
        ? locations.find((item) => item.id === body.locationId)
        : undefined;
      const record = {
        id: `project-${projects.length + 1}`,
        companyId: 'company-1',
        locationId: (body.locationId as string | null | undefined) ?? null,
        locationCode: location?.code ?? null,
        locationName: location?.name ?? null,
        code: String(body.code),
        name: String(body.name),
        description: (body.description as string | null | undefined) ?? null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      projects = [record, ...projects];
      await fulfillJson(route, 201, record);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/projects\/[^/]+$/u) &&
      request.method() === 'GET'
    ) {
      const projectId = pathname.split('/').pop()!;
      const project = findProject(projectId);

      if (!project) {
        await fulfillJson(route, 404, createApiError(404, 'Project not found.'));
        return;
      }

      await fulfillJson(route, 200, project);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/projects\/[^/]+$/u) &&
      request.method() === 'PATCH'
    ) {
      const projectId = pathname.split('/').pop()!;
      const existing = findProject(projectId);

      if (!existing) {
        await fulfillJson(route, 404, createApiError(404, 'Project not found.'));
        return;
      }

      const location = body.locationId
        ? locations.find((item) => item.id === body.locationId)
        : undefined;
      const updated = {
        ...existing,
        locationId:
          body.locationId === null
            ? null
            : ((body.locationId as string | undefined) ?? existing.locationId),
        locationCode:
          body.locationId === null
            ? null
            : location?.code ?? existing.locationCode,
        locationName:
          body.locationId === null
            ? null
            : location?.name ?? existing.locationName,
        code: (body.code as string | undefined) ?? existing.code,
        name: (body.name as string | undefined) ?? existing.name,
        description:
          body.description === null
            ? null
            : ((body.description as string | undefined) ?? existing.description),
        updatedAt: now,
      };
      projects = projects.map((project) => (project.id === projectId ? updated : project));
      await fulfillJson(route, 200, updated);
      return;
    }

    if (pathname.endsWith('/companies/company-1/cost-centers') && request.method() === 'GET') {
      const items = listBySearch(costCenters, searchParams).filter(
        (costCenter) =>
          (!searchParams.get('projectId') ||
            costCenter.projectId === searchParams.get('projectId')) &&
          (searchParams.get('isActive') === null ||
            costCenter.isActive === (searchParams.get('isActive') === 'true')),
      );
      await fulfillJson(route, 200, paginate(items, searchParams, 10));
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/cost-centers\/[^/]+$/u) &&
      request.method() === 'GET'
    ) {
      const costCenterId = pathname.split('/').pop()!;
      const costCenter = costCenters.find((item) => item.id === costCenterId);

      if (!costCenter) {
        await fulfillJson(route, 404, createApiError(404, 'Cost center not found.'));
        return;
      }

      await fulfillJson(route, 200, costCenter);
      return;
    }

    if (pathname.endsWith('/companies/company-1/project-phases') && request.method() === 'GET') {
      const items = listBySearch(phases, searchParams).filter(
        (phase) =>
          (!searchParams.get('projectId') ||
            phase.projectId === searchParams.get('projectId')) &&
          (searchParams.get('isActive') === null ||
            phase.isActive === (searchParams.get('isActive') === 'true')),
      );
      await fulfillJson(route, 200, paginate(items, searchParams, 10));
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/project-phases\/[^/]+$/u) &&
      request.method() === 'GET'
    ) {
      const phaseId = pathname.split('/').pop()!;
      const phase = findPhase(phaseId);

      if (!phase) {
        await fulfillJson(route, 404, createApiError(404, 'Phase not found.'));
        return;
      }

      await fulfillJson(route, 200, phase);
      return;
    }

    if (pathname.endsWith('/companies/company-1/blocks') && request.method() === 'GET') {
      const items = listBySearch(blocks, searchParams).filter(
        (block) =>
          (!searchParams.get('projectId') ||
            block.projectId === searchParams.get('projectId')) &&
          (!searchParams.get('phaseId') || block.phaseId === searchParams.get('phaseId')) &&
          (searchParams.get('isActive') === null ||
            block.isActive === (searchParams.get('isActive') === 'true')),
      );
      await fulfillJson(route, 200, paginate(items, searchParams, 10));
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/blocks\/[^/]+$/u) &&
      request.method() === 'GET'
    ) {
      const blockId = pathname.split('/').pop()!;
      const block = findBlock(blockId);

      if (!block) {
        await fulfillJson(route, 404, createApiError(404, 'Block not found.'));
        return;
      }

      await fulfillJson(route, 200, block);
      return;
    }

    if (pathname.endsWith('/companies/company-1/zones') && request.method() === 'GET') {
      const items = listBySearch(zones, searchParams).filter(
        (zone) =>
          (!searchParams.get('projectId') ||
            zone.projectId === searchParams.get('projectId')) &&
          (!searchParams.get('blockId') || zone.blockId === searchParams.get('blockId')) &&
          (searchParams.get('isActive') === null ||
            zone.isActive === (searchParams.get('isActive') === 'true')),
      );
      await fulfillJson(route, 200, paginate(items, searchParams, 10));
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/zones\/[^/]+$/u) &&
      request.method() === 'GET'
    ) {
      const zoneId = pathname.split('/').pop()!;
      const zone = findZone(zoneId);

      if (!zone) {
        await fulfillJson(route, 404, createApiError(404, 'Zone not found.'));
        return;
      }

      await fulfillJson(route, 200, zone);
      return;
    }

    if (pathname.endsWith('/companies/company-1/unit-types') && request.method() === 'GET') {
      const items = listBySearch(unitTypes, searchParams).filter(
        (unitType) =>
          searchParams.get('isActive') === null ||
          unitType.isActive === (searchParams.get('isActive') === 'true'),
      );
      await fulfillJson(route, 200, paginate(items, searchParams, 10));
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/unit-types\/[^/]+$/u) &&
      request.method() === 'GET'
    ) {
      const unitTypeId = pathname.split('/').pop()!;
      const unitType = findUnitType(unitTypeId);

      if (!unitType) {
        await fulfillJson(route, 404, createApiError(404, 'Unit type not found.'));
        return;
      }

      await fulfillJson(route, 200, unitType);
      return;
    }

    if (pathname.endsWith('/companies/company-1/unit-statuses') && request.method() === 'GET') {
      const items = unitStatuses.filter(
        (unitStatus) =>
          (searchParams.get('isActive') === null ||
            unitStatus.isActive === (searchParams.get('isActive') === 'true')) &&
          (matchesSearch(unitStatus.code, searchParams.get('search')) ||
            matchesSearch(unitStatus.name, searchParams.get('search'))),
      );
      await fulfillJson(route, 200, paginate(items, searchParams, 10));
      return;
    }

    if (pathname.endsWith('/companies/company-1/units') && request.method() === 'GET') {
      const items = units.filter(
        (unit) =>
          (!searchParams.get('projectId') ||
            unit.projectId === searchParams.get('projectId')) &&
          (!searchParams.get('phaseId') || unit.phaseId === searchParams.get('phaseId')) &&
          (!searchParams.get('blockId') || unit.blockId === searchParams.get('blockId')) &&
          (!searchParams.get('zoneId') || unit.zoneId === searchParams.get('zoneId')) &&
          (!searchParams.get('unitTypeId') ||
            unit.unitTypeId === searchParams.get('unitTypeId')) &&
          (!searchParams.get('unitStatusId') ||
            unit.unitStatusId === searchParams.get('unitStatusId')) &&
          (searchParams.get('isActive') === null ||
            unit.isActive === (searchParams.get('isActive') === 'true')) &&
          (matchesSearch(unit.code, searchParams.get('search')) ||
            matchesSearch(unit.name, searchParams.get('search')) ||
            matchesSearch(unit.description, searchParams.get('search'))),
      );
      await fulfillJson(route, 200, paginate(items, searchParams, 10));
      return;
    }

    if (pathname.endsWith('/companies/company-1/units') && request.method() === 'POST') {
      const project = findProject(String(body.projectId));
      const phase = findPhase(body.phaseId as string | null | undefined);
      const block = findBlock(body.blockId as string | null | undefined);
      const zone = findZone(body.zoneId as string | null | undefined);
      const unitType = findUnitType(String(body.unitTypeId));
      const unitStatus = findUnitStatus(String(body.unitStatusId));

      if (!project || !unitType || !unitStatus) {
        await fulfillJson(route, 400, createApiError(400, 'Invalid unit hierarchy.'));
        return;
      }

      const record = {
        id: `unit-${units.length + 1}`,
        companyId: 'company-1',
        projectId: project.id,
        projectCode: project.code,
        projectName: project.name,
        phaseId: phase?.id ?? null,
        phaseCode: phase?.code ?? null,
        phaseName: phase?.name ?? null,
        blockId: block?.id ?? null,
        blockCode: block?.code ?? null,
        blockName: block?.name ?? null,
        zoneId: zone?.id ?? null,
        zoneCode: zone?.code ?? null,
        zoneName: zone?.name ?? null,
        unitTypeId: unitType.id,
        unitTypeCode: unitType.code,
        unitTypeName: unitType.name,
        unitStatusId: unitStatus.id,
        unitStatusCode: unitStatus.code,
        unitStatusName: unitStatus.name,
        code: String(body.code),
        name: String(body.name),
        description: (body.description as string | null | undefined) ?? null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      units = [record, ...units];
      await fulfillJson(route, 201, record);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/units\/[^/]+$/u) &&
      request.method() === 'GET'
    ) {
      const unitId = pathname.split('/').pop()!;
      const unit = units.find((item) => item.id === unitId);

      if (!unit) {
        await fulfillJson(route, 404, createApiError(404, 'Unit not found.'));
        return;
      }

      await fulfillJson(route, 200, unit);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/units\/[^/]+$/u) &&
      request.method() === 'PATCH'
    ) {
      const unitId = pathname.split('/').pop()!;
      const existing = units.find((item) => item.id === unitId);

      if (!existing) {
        await fulfillJson(route, 404, createApiError(404, 'Unit not found.'));
        return;
      }

      const phase = findPhase(body.phaseId as string | null | undefined) ?? findPhase(existing.phaseId);
      const block = findBlock(body.blockId as string | null | undefined) ?? findBlock(existing.blockId);
      const zone = findZone(body.zoneId as string | null | undefined) ?? findZone(existing.zoneId);
      const unitType =
        findUnitType((body.unitTypeId as string | undefined) ?? existing.unitTypeId) ??
        findUnitType(existing.unitTypeId);
      const unitStatus =
        findUnitStatus((body.unitStatusId as string | undefined) ?? existing.unitStatusId) ??
        findUnitStatus(existing.unitStatusId);

      if (!unitType || !unitStatus) {
        await fulfillJson(route, 400, createApiError(400, 'Invalid unit update.'));
        return;
      }

      const updated = {
        ...existing,
        phaseId: body.phaseId === null ? null : phase?.id ?? existing.phaseId,
        phaseCode: body.phaseId === null ? null : phase?.code ?? existing.phaseCode,
        phaseName: body.phaseId === null ? null : phase?.name ?? existing.phaseName,
        blockId: body.blockId === null ? null : block?.id ?? existing.blockId,
        blockCode: body.blockId === null ? null : block?.code ?? existing.blockCode,
        blockName: body.blockId === null ? null : block?.name ?? existing.blockName,
        zoneId: body.zoneId === null ? null : zone?.id ?? existing.zoneId,
        zoneCode: body.zoneId === null ? null : zone?.code ?? existing.zoneCode,
        zoneName: body.zoneId === null ? null : zone?.name ?? existing.zoneName,
        unitTypeId: unitType.id,
        unitTypeCode: unitType.code,
        unitTypeName: unitType.name,
        unitStatusId: unitStatus.id,
        unitStatusCode: unitStatus.code,
        unitStatusName: unitStatus.name,
        code: (body.code as string | undefined) ?? existing.code,
        name: (body.name as string | undefined) ?? existing.name,
        description:
          body.description === null
            ? null
            : ((body.description as string | undefined) ?? existing.description),
        updatedAt: now,
      };
      units = units.map((unit) => (unit.id === unitId ? updated : unit));
      await fulfillJson(route, 200, updated);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/units\/[^/]+\/activate$/u) &&
      request.method() === 'POST'
    ) {
      const unitId = pathname.split('/').slice(-2)[0];
      const existing = units.find((item) => item.id === unitId);

      if (!existing) {
        await fulfillJson(route, 404, createApiError(404, 'Unit not found.'));
        return;
      }

      const updated = { ...existing, isActive: true, updatedAt: now };
      units = units.map((unit) => (unit.id === unitId ? updated : unit));
      await fulfillJson(route, 200, updated);
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/units\/[^/]+\/deactivate$/u) &&
      request.method() === 'POST'
    ) {
      const unitId = pathname.split('/').slice(-2)[0];
      const existing = units.find((item) => item.id === unitId);

      if (!existing) {
        await fulfillJson(route, 404, createApiError(404, 'Unit not found.'));
        return;
      }

      const updated = { ...existing, isActive: false, updatedAt: now };
      units = units.map((unit) => (unit.id === unitId ? updated : unit));
      await fulfillJson(route, 200, updated);
      return;
    }

    await route.continue();
  });
};

test('redirects project/property routes to login when no browser session exists', async ({
  page,
}) => {
  await page.goto('/project-property/projects');

  await expect(page).toHaveURL(/\/login\?next=%2Fproject-property%2Fprojects/);
});

test('renders project/property master pages and the read-only unit-status catalog', async ({
  page,
  context,
}) => {
  await context.addCookies([
    {
      name: 'rc_access_token',
      value: 'dummy-token',
      url: 'http://127.0.0.1:3100',
    },
  ]);
  await setupProjectPropertyApiMocks(page, { authenticated: true });

  await page.goto('/project-property/projects');
  await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
  await page.getByRole('button', { name: 'New project' }).click();
  const projectDialog = page.getByRole('dialog');
  await projectDialog.getByLabel('Project code').fill('RCH-VILLA');
  await projectDialog.getByLabel('Project name').fill('Real Capita Villas');
  await projectDialog.getByLabel('Description').fill('Villa project');
  await projectDialog.getByRole('button', { name: 'Create project' }).click();
  await expect(projectDialog).toBeHidden();
  await expect(page.locator('tr', { hasText: 'Real Capita Villas' })).toBeVisible();

  await page.getByRole('link', { name: 'Cost Centers' }).click();
  await expect(page.getByRole('heading', { name: 'Cost Centers' })).toBeVisible();
  await expect(page.getByText('Tower Cost Center')).toBeVisible();

  await page.getByRole('link', { name: 'Phases' }).click();
  await expect(page.getByRole('heading', { name: 'Phases' })).toBeVisible();
  await expect(page.locator('tr', { hasText: 'PH-01' })).toContainText('Structure');

  await page.getByRole('link', { name: 'Blocks' }).click();
  await expect(page.getByRole('heading', { name: 'Blocks' })).toBeVisible();
  await expect(page.getByText('Block A')).toBeVisible();

  await page.getByRole('link', { name: 'Zones' }).click();
  await expect(page.getByRole('heading', { name: 'Zones' })).toBeVisible();
  await expect(page.getByText('North Zone')).toBeVisible();

  await page.getByRole('link', { name: 'Unit Statuses' }).click();
  await expect(page.getByRole('heading', { name: 'Unit Statuses' })).toBeVisible();
  await expect(page.getByText('Controlled master data')).toBeVisible();
  await expect(
    page.getByText('does not expose create, edit, activate, or deactivate actions.'),
  ).toBeVisible();
});

test('supports unit create, edit, and filter flow with hierarchy context', async ({
  page,
  context,
}) => {
  await context.addCookies([
    {
      name: 'rc_access_token',
      value: 'dummy-token',
      url: 'http://127.0.0.1:3100',
    },
  ]);
  await setupProjectPropertyApiMocks(page, { authenticated: true });

  await page.goto('/project-property/units');
  await expect(page.getByRole('heading', { name: 'Units' })).toBeVisible();
  await expect(page.locator('tr', { hasText: 'Tower 10A' })).toBeVisible();

  await page.getByRole('button', { name: 'New unit' }).click();
  const createDialog = page.getByRole('dialog');
  await createDialog.getByLabel('Project').selectOption('project-1');
  await createDialog.getByLabel('Phase').selectOption('phase-1');
  await createDialog.getByLabel('Block').selectOption('block-1');
  await createDialog.getByLabel('Zone').selectOption('zone-1');
  await createDialog.getByLabel('Unit type').selectOption('unit-type-1');
  await createDialog.getByLabel('Unit status').selectOption('unit-status-1');
  await createDialog.getByLabel('Unit code').fill('A-1201');
  await createDialog.getByLabel('Unit name').fill('Apartment 1201');
  await createDialog.getByLabel('Description').fill('Corner unit');
  await createDialog.getByRole('button', { name: 'Create unit' }).click();
  await expect(createDialog).toBeHidden();

  await expect(page.locator('tr', { hasText: 'Apartment 1201' })).toContainText(
    'North Zone',
  );

  await page
    .locator('tr', { hasText: 'Apartment 1201' })
    .getByRole('button', { name: 'Edit' })
    .click();
  const editDialog = page.getByRole('dialog');
  await expect(editDialog.getByText('Real Capita Tower')).toBeVisible();
  await editDialog.getByLabel('Unit name').fill('Apartment 1201 Updated');
  await editDialog.getByLabel('Unit status').selectOption('unit-status-2');
  await editDialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(editDialog).toBeHidden();

  await expect(
    page.locator('tr', { hasText: 'Apartment 1201 Updated' }),
  ).toContainText('Booked');

  await page.getByLabel('Search').fill('A-1201');
  await page.getByLabel('Project').selectOption('project-1');
  await page.getByLabel('Phase').selectOption('phase-1');
  await page.getByLabel('Block').selectOption('block-1');
  await page.getByLabel('Zone').selectOption('zone-1');
  await page.getByLabel('Unit status').selectOption('unit-status-2');

  await expect(page.getByText('Apartment 1201 Updated')).toBeVisible();
  await expect(page.locator('tr', { hasText: 'Tower 10A' })).toHaveCount(0);
});
