const assert = require('node:assert/strict');
const test = require('node:test');

const {
  BadRequestException,
  ConflictException,
  NotFoundException,
} = require('@nestjs/common');

const { UnitsService } = require('./units.service');

const ISO_DATE = new Date('2026-03-16T00:00:00.000Z');

const makeProject = () => ({
  id: 'project-1',
  companyId: 'company-1',
  code: 'PRJ-001',
  name: 'Tower A',
  description: null,
  locationId: null,
  isActive: true,
  createdAt: ISO_DATE,
  updatedAt: ISO_DATE,
});

const makeUnitRecord = ({
  phaseId = 'phase-1',
  blockId = 'block-1',
  zoneId = 'zone-1',
  unitTypeId = 'unit-type-1',
  unitStatusId = 'status-available',
} = {}) => ({
  id: 'unit-1',
  projectId: 'project-1',
  phaseId,
  blockId,
  zoneId,
  unitTypeId,
  unitStatusId,
  code: 'UNIT-001',
  name: 'Unit 001',
  description: null,
  isActive: true,
  createdAt: ISO_DATE,
  updatedAt: ISO_DATE,
  project: makeProject(),
  phase: phaseId
    ? {
        id: phaseId,
        projectId: 'project-1',
        code: 'PHASE-A',
        name: 'Phase A',
        description: null,
        isActive: true,
        createdAt: ISO_DATE,
        updatedAt: ISO_DATE,
      }
    : null,
  block: blockId
    ? {
        id: blockId,
        projectId: 'project-1',
        phaseId: 'phase-1',
        code: 'BLOCK-A',
        name: 'Block A',
        description: null,
        isActive: true,
        createdAt: ISO_DATE,
        updatedAt: ISO_DATE,
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
      }
    : null,
  zone: zoneId
    ? {
        id: zoneId,
        projectId: 'project-1',
        blockId: 'block-1',
        code: 'ZONE-A',
        name: 'Zone A',
        description: null,
        isActive: true,
        createdAt: ISO_DATE,
        updatedAt: ISO_DATE,
        block: {
          id: 'block-1',
          projectId: 'project-1',
          phaseId: 'phase-1',
          code: 'BLOCK-A',
          name: 'Block A',
          description: null,
          isActive: true,
          createdAt: ISO_DATE,
          updatedAt: ISO_DATE,
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
      }
    : null,
  unitType: {
    id: unitTypeId,
    companyId: 'company-1',
    code: 'APT',
    name: 'Apartment',
    description: null,
    isActive: true,
    createdAt: ISO_DATE,
    updatedAt: ISO_DATE,
  },
  unitStatus: {
    id: unitStatusId,
    code: 'AVAILABLE',
    name: 'Available',
    sortOrder: 1,
    isActive: true,
    createdAt: ISO_DATE,
    updatedAt: ISO_DATE,
  },
});

test('units service creates a unit with valid hierarchy and lookups', async () => {
  const service = new UnitsService({
    company: {
      findUnique: async () => ({ id: 'company-1' }),
    },
    project: {
      findFirst: async () => makeProject(),
    },
    unitType: {
      findFirst: async () => ({
        id: 'unit-type-1',
        isActive: true,
      }),
    },
    unitStatus: {
      findUnique: async () => ({
        id: 'status-available',
        isActive: true,
      }),
    },
    projectPhase: {
      findFirst: async () => ({
        id: 'phase-1',
        isActive: true,
      }),
    },
    block: {
      findFirst: async () => ({
        id: 'block-1',
        isActive: true,
        phaseId: 'phase-1',
      }),
    },
    zone: {
      findFirst: async () => ({
        id: 'zone-1',
        isActive: true,
        blockId: 'block-1',
        block: {
          id: 'block-1',
          phaseId: 'phase-1',
        },
      }),
    },
    unit: {
      findFirst: async () => null,
      create: async () => makeUnitRecord(),
    },
  });

  const unit = await service.createUnit('company-1', {
    projectId: 'project-1',
    phaseId: 'phase-1',
    blockId: 'block-1',
    zoneId: 'zone-1',
    unitTypeId: 'unit-type-1',
    unitStatusId: 'status-available',
    code: 'unit-001',
    name: 'Unit 001',
  });

  assert.equal(unit.code, 'UNIT-001');
  assert.equal(unit.zoneCode, 'ZONE-A');
});

test('units service rejects a hierarchy mismatch when block and phase do not align', async () => {
  const service = new UnitsService({
    company: {
      findUnique: async () => ({ id: 'company-1' }),
    },
    project: {
      findFirst: async () => makeProject(),
    },
    unitType: {
      findFirst: async () => ({
        id: 'unit-type-1',
        isActive: true,
      }),
    },
    unitStatus: {
      findUnique: async () => ({
        id: 'status-available',
        isActive: true,
      }),
    },
    projectPhase: {
      findFirst: async () => ({
        id: 'phase-2',
        isActive: true,
      }),
    },
    block: {
      findFirst: async () => ({
        id: 'block-1',
        isActive: true,
        phaseId: 'phase-1',
      }),
    },
  });

  await assert.rejects(
    () =>
      service.createUnit('company-1', {
        projectId: 'project-1',
        phaseId: 'phase-2',
        blockId: 'block-1',
        unitTypeId: 'unit-type-1',
        unitStatusId: 'status-available',
        code: 'unit-001',
        name: 'Unit 001',
      }),
    BadRequestException,
  );
});

test('units service rejects a duplicate unit type code within a company', async () => {
  let unitTypeFindFirstCalls = 0;
  const service = new UnitsService({
    company: {
      findUnique: async () => ({ id: 'company-1' }),
    },
    unitType: {
      findFirst: async () => {
        unitTypeFindFirstCalls += 1;

        return unitTypeFindFirstCalls === 1 ? { id: 'unit-type-existing' } : null;
      },
    },
  });

  await assert.rejects(
    () =>
      service.createUnitType('company-1', {
        code: 'apt',
        name: 'Apartment',
      }),
    ConflictException,
  );
});

test('units service lists fixed unit statuses', async () => {
  const service = new UnitsService({
    company: {
      findUnique: async () => ({ id: 'company-1' }),
    },
    unitStatus: {
      findMany: async () => [
        {
          id: 'status-available',
          code: 'AVAILABLE',
          name: 'Available',
          sortOrder: 1,
          isActive: true,
          createdAt: ISO_DATE,
          updatedAt: ISO_DATE,
        },
      ],
      count: async () => 1,
    },
  });

  const result = await service.listUnitStatuses('company-1', {
    page: 1,
    pageSize: 20,
    sortOrder: 'asc',
  });

  assert.equal(result.items[0].code, 'AVAILABLE');
  assert.equal(result.meta.total, 1);
});

test('units service lists units with company-scoped filters', async () => {
  let capturedWhere;
  const service = new UnitsService({
    company: {
      findUnique: async () => ({ id: 'company-1' }),
    },
    unit: {
      findMany: async ({ where }) => {
        capturedWhere = where;
        return [makeUnitRecord()];
      },
      count: async () => 1,
    },
  });

  const result = await service.listUnits('company-1', {
    page: 1,
    pageSize: 20,
    sortOrder: 'asc',
    projectId: 'project-1',
    unitStatusId: 'status-available',
    unitTypeId: 'unit-type-1',
    isActive: true,
  });

  assert.equal(capturedWhere.projectId, 'project-1');
  assert.equal(capturedWhere.unitStatusId, 'status-available');
  assert.equal(result.items[0].unitTypeCode, 'APT');
});

test('units service rejects detail requests outside the company scope', async () => {
  const service = new UnitsService({
    company: {
      findUnique: async () => ({ id: 'company-1' }),
    },
    unit: {
      findFirst: async () => null,
    },
  });

  await assert.rejects(
    () => service.getUnitDetail('company-1', 'unit-other-company'),
    NotFoundException,
  );
});
