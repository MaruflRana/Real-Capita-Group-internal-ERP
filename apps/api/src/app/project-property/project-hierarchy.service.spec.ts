const assert = require('node:assert/strict');
const test = require('node:test');

const { BadRequestException, NotFoundException } = require('@nestjs/common');

const { ProjectHierarchyService } = require('./project-hierarchy.service');

const ISO_DATE = new Date('2026-03-16T00:00:00.000Z');

test('project hierarchy service creates a project phase under an active project', async () => {
  const service = new ProjectHierarchyService({
    company: {
      findUnique: async () => ({ id: 'company-1' }),
    },
    project: {
      findFirst: async () => ({
        id: 'project-1',
        companyId: 'company-1',
        code: 'PRJ-001',
        name: 'Tower A',
        description: null,
        locationId: null,
        isActive: true,
        createdAt: ISO_DATE,
        updatedAt: ISO_DATE,
      }),
    },
    projectPhase: {
      findFirst: async () => null,
      create: async ({ data }) => ({
        id: 'phase-1',
        projectId: data.projectId,
        code: data.code,
        name: data.name,
        description: data.description,
        isActive: true,
        createdAt: ISO_DATE,
        updatedAt: ISO_DATE,
        project: {
          id: 'project-1',
          companyId: 'company-1',
          code: 'PRJ-001',
          name: 'Tower A',
          description: null,
          locationId: null,
          isActive: true,
          createdAt: ISO_DATE,
          updatedAt: ISO_DATE,
        },
      }),
    },
  });

  const projectPhase = await service.createProjectPhase('company-1', {
    projectId: 'project-1',
    code: 'phase-a',
    name: 'Phase A',
  });

  assert.equal(projectPhase.code, 'PHASE-A');
  assert.equal(projectPhase.projectCode, 'PRJ-001');
});

test('project hierarchy service rejects block creation when the selected phase is inactive', async () => {
  const service = new ProjectHierarchyService({
    company: {
      findUnique: async () => ({ id: 'company-1' }),
    },
    project: {
      findFirst: async () => ({
        id: 'project-1',
        companyId: 'company-1',
        code: 'PRJ-001',
        name: 'Tower A',
        description: null,
        locationId: null,
        isActive: true,
        createdAt: ISO_DATE,
        updatedAt: ISO_DATE,
      }),
    },
    projectPhase: {
      findFirst: async () => ({
        id: 'phase-1',
        isActive: false,
      }),
    },
  });

  await assert.rejects(
    () =>
      service.createBlock('company-1', {
        projectId: 'project-1',
        phaseId: 'phase-1',
        code: 'block-a',
        name: 'Block A',
      }),
    BadRequestException,
  );
});

test('project hierarchy service rejects zone creation when the selected block is outside the project scope', async () => {
  const service = new ProjectHierarchyService({
    company: {
      findUnique: async () => ({ id: 'company-1' }),
    },
    project: {
      findFirst: async () => ({
        id: 'project-1',
        companyId: 'company-1',
        code: 'PRJ-001',
        name: 'Tower A',
        description: null,
        locationId: null,
        isActive: true,
        createdAt: ISO_DATE,
        updatedAt: ISO_DATE,
      }),
    },
    block: {
      findFirst: async () => null,
    },
  });

  await assert.rejects(
    () =>
      service.createZone('company-1', {
        projectId: 'project-1',
        blockId: 'block-other-project',
        code: 'zone-a',
        name: 'Zone A',
      }),
    NotFoundException,
  );
});

test('project hierarchy service lists blocks with their parent phase mapping', async () => {
  const service = new ProjectHierarchyService({
    company: {
      findUnique: async () => ({ id: 'company-1' }),
    },
    block: {
      findMany: async () => [
        {
          id: 'block-1',
          projectId: 'project-1',
          phaseId: 'phase-1',
          code: 'BLOCK-A',
          name: 'Block A',
          description: null,
          isActive: true,
          createdAt: ISO_DATE,
          updatedAt: ISO_DATE,
          project: {
            id: 'project-1',
            companyId: 'company-1',
            code: 'PRJ-001',
            name: 'Tower A',
            description: null,
            locationId: null,
            isActive: true,
            createdAt: ISO_DATE,
            updatedAt: ISO_DATE,
          },
          phase: {
            id: 'phase-1',
            projectId: 'project-1',
            code: 'PHASE-A',
            name: 'Phase A',
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

  const result = await service.listBlocks('company-1', {
    page: 1,
    pageSize: 20,
    sortOrder: 'asc',
  });

  assert.equal(result.items[0].phaseCode, 'PHASE-A');
  assert.equal(result.meta.total, 1);
});
