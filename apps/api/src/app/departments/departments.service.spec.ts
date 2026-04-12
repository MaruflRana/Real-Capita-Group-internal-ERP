const assert = require('node:assert/strict');
const test = require('node:test');

const { ConflictException } = require('@nestjs/common');

const { DepartmentsService } = require('./departments.service');

test('departments service creates a department when code and name are unique within the company', async () => {
  const service = new DepartmentsService(
    {
      company: {
        findUnique: async () => ({
          id: 'company-1',
        }),
      },
      department: {
        findFirst: async () => null,
        create: async ({ data }) => ({
          id: 'department-1',
          companyId: data.companyId,
          code: data.code,
          name: data.name,
          description: data.description,
          isActive: true,
          createdAt: new Date('2026-03-16T00:00:00.000Z'),
          updatedAt: new Date('2026-03-16T00:00:00.000Z'),
        }),
      },
    },
    {
      recordEvent: async () => undefined,
    },
  );

  const department = await service.createDepartment(
    'company-1',
    'user-1',
    undefined,
    {
      code: 'ops',
      name: 'Operations',
      description: 'Operations team',
    },
  );

  assert.equal(department.code, 'OPS');
  assert.equal(department.name, 'Operations');
});

test('departments service rejects duplicate department names within the same company', async () => {
  let departmentFindFirstCall = 0;
  const service = new DepartmentsService(
    {
      company: {
        findUnique: async () => ({
          id: 'company-1',
        }),
      },
      department: {
        findFirst: async () => {
          departmentFindFirstCall += 1;

          return departmentFindFirstCall === 2
            ? {
                id: 'department-existing',
              }
            : null;
        },
      },
    },
    {
      recordEvent: async () => undefined,
    },
  );

  await assert.rejects(
    () =>
      service.createDepartment('company-1', 'user-1', undefined, {
        code: 'ops',
        name: 'Operations',
      }),
    ConflictException,
  );
});
