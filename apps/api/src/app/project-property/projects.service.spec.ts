const assert = require('node:assert/strict');
const test = require('node:test');

const { ConflictException } = require('@nestjs/common');

const { ProjectMastersService } = require('./projects.service');

const ISO_DATE = new Date('2026-03-16T00:00:00.000Z');

test('project masters service creates a project linked to a same-company location', async () => {
  const service = new ProjectMastersService({
    company: {
      findUnique: async () => ({ id: 'company-1' }),
    },
    location: {
      findFirst: async () => ({ id: 'location-1' }),
    },
    project: {
      findFirst: async () => null,
      create: async ({ data }) => ({
        id: 'project-1',
        companyId: data.companyId,
        locationId: data.locationId,
        code: data.code,
        name: data.name,
        description: data.description,
        isActive: true,
        createdAt: ISO_DATE,
        updatedAt: ISO_DATE,
      }),
    },
  });

  service.getProjectDetail = async () => ({
    id: 'project-1',
    companyId: 'company-1',
    locationId: 'location-1',
    locationCode: 'DHK',
    locationName: 'Dhaka HQ',
    code: 'PRJ-001',
    name: 'Tower A',
    description: 'Primary project',
    isActive: true,
    createdAt: ISO_DATE.toISOString(),
    updatedAt: ISO_DATE.toISOString(),
  });

  const project = await service.createProject('company-1', {
    locationId: 'location-1',
    code: 'prj-001',
    name: 'Tower A',
    description: 'Primary project',
  });

  assert.equal(project.code, 'PRJ-001');
  assert.equal(project.locationCode, 'DHK');
});

test('project masters service rejects duplicate project codes within a company', async () => {
  let projectFindFirstCalls = 0;
  const service = new ProjectMastersService({
    company: {
      findUnique: async () => ({ id: 'company-1' }),
    },
    project: {
      findFirst: async () => {
        projectFindFirstCalls += 1;

        return projectFindFirstCalls === 1 ? { id: 'project-existing' } : null;
      },
    },
  });

  await assert.rejects(
    () =>
      service.createProject('company-1', {
        code: 'prj-001',
        name: 'Tower A',
      }),
    ConflictException,
  );
});

test('project masters service lists projects with pagination metadata', async () => {
  const service = new ProjectMastersService({
    company: {
      findUnique: async () => ({ id: 'company-1' }),
    },
    project: {
      findMany: async () => [
        {
          id: 'project-1',
          companyId: 'company-1',
          locationId: 'location-1',
          code: 'PRJ-001',
          name: 'Tower A',
          description: null,
          isActive: true,
          createdAt: ISO_DATE,
          updatedAt: ISO_DATE,
          location: {
            id: 'location-1',
            companyId: 'company-1',
            code: 'DHK',
            name: 'Dhaka HQ',
            description: null,
            isActive: true,
            createdAt: ISO_DATE,
            updatedAt: ISO_DATE,
          },
        },
      ],
      count: async () => 1,
    },
  });

  const result = await service.listProjects('company-1', {
    page: 1,
    pageSize: 20,
    sortOrder: 'asc',
  });

  assert.equal(result.items[0].locationName, 'Dhaka HQ');
  assert.equal(result.meta.total, 1);
});

test('project masters service activates and deactivates a project', async () => {
  const service = new ProjectMastersService({
    company: {
      findUnique: async () => ({ id: 'company-1' }),
    },
    project: {
      findFirst: async () => ({
        id: 'project-1',
        companyId: 'company-1',
        locationId: null,
        code: 'PRJ-001',
        name: 'Tower A',
        description: null,
        isActive: true,
        createdAt: ISO_DATE,
        updatedAt: ISO_DATE,
        location: null,
      }),
      update: async ({ data }) => ({
        id: 'project-1',
        companyId: 'company-1',
        locationId: null,
        code: 'PRJ-001',
        name: 'Tower A',
        description: null,
        isActive: data.isActive,
        createdAt: ISO_DATE,
        updatedAt: ISO_DATE,
      }),
    },
  });

  service.getProjectDetail = async (_companyId, _projectId) => ({
    id: 'project-1',
    companyId: 'company-1',
    locationId: null,
    locationCode: null,
    locationName: null,
    code: 'PRJ-001',
    name: 'Tower A',
    description: null,
    isActive: false,
    createdAt: ISO_DATE.toISOString(),
    updatedAt: ISO_DATE.toISOString(),
  });

  const project = await service.setProjectActiveState('company-1', 'project-1', false);

  assert.equal(project.isActive, false);
});

test('project masters service creates and updates a cost center within company scope', async () => {
  const service = new ProjectMastersService({
    company: {
      findUnique: async () => ({ id: 'company-1' }),
    },
    project: {
      findFirst: async () => ({ id: 'project-1' }),
    },
    costCenter: {
      findFirst: async ({ where }) => {
        if (where.id === 'cost-center-1') {
          return {
            id: 'cost-center-1',
            companyId: 'company-1',
            projectId: 'project-1',
            code: 'CC-001',
            name: 'Tower Cost Center',
            description: null,
            isActive: true,
            createdAt: ISO_DATE,
            updatedAt: ISO_DATE,
            project: {
              id: 'project-1',
              companyId: 'company-1',
              locationId: null,
              code: 'PRJ-001',
              name: 'Tower A',
              description: null,
              isActive: true,
              createdAt: ISO_DATE,
              updatedAt: ISO_DATE,
            },
          };
        }

        return null;
      },
      create: async ({ data }) => ({
        id: 'cost-center-1',
        companyId: data.companyId,
        projectId: data.projectId,
        code: data.code,
        name: data.name,
        description: data.description,
        isActive: true,
        createdAt: ISO_DATE,
        updatedAt: ISO_DATE,
      }),
      update: async ({ data }) => ({
        id: 'cost-center-1',
        companyId: 'company-1',
        projectId: data.projectId,
        code: data.code,
        name: data.name,
        description: data.description,
        isActive: true,
        createdAt: ISO_DATE,
        updatedAt: ISO_DATE,
      }),
    },
  });

  service.getCostCenterDetail = async () => ({
    id: 'cost-center-1',
    companyId: 'company-1',
    projectId: null,
    projectCode: null,
    projectName: null,
    code: 'CC-001',
    name: 'Tower Cost Center',
    description: null,
    isActive: true,
    createdAt: ISO_DATE.toISOString(),
    updatedAt: ISO_DATE.toISOString(),
  });

  const created = await service.createCostCenter('company-1', {
    projectId: 'project-1',
    code: 'cc-001',
    name: 'Tower Cost Center',
  });
  const updated = await service.updateCostCenter('company-1', 'cost-center-1', {
    projectId: null,
  });

  assert.equal(created.code, 'CC-001');
  assert.equal(updated.projectId, null);
});
