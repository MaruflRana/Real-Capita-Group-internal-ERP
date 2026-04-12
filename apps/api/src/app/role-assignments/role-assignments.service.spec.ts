const assert = require('node:assert/strict');
const test = require('node:test');

const { BadRequestException } = require('@nestjs/common');

const { RoleAssignmentsService } = require('./role-assignments.service');

test('role assignments service assigns a role to an active user', async () => {
  const service = new RoleAssignmentsService(
    {
      company: {
        findUnique: async () => ({
          id: 'company-1',
        }),
      },
      user: {
        findUnique: async () => ({
          id: 'user-1',
          isActive: true,
        }),
      },
      role: {
        findUnique: async () => ({
          id: 'role-admin',
          code: 'company_admin',
          name: 'Company Administrator',
          isActive: true,
        }),
      },
      userRole: {
        upsert: async () => ({
          id: 'assignment-1',
          companyId: 'company-1',
          userId: 'user-1',
          roleId: 'role-admin',
          isActive: true,
          createdAt: new Date('2026-03-16T00:00:00.000Z'),
          updatedAt: new Date('2026-03-16T00:00:00.000Z'),
          role: {
            code: 'company_admin',
            name: 'Company Administrator',
          },
        }),
      },
    },
    {
      recordEvent: async () => undefined,
    },
  );

  const assignment = await service.assignRole(
    'company-1',
    'user-1',
    'actor-1',
    undefined,
    {
      roleCode: 'company_admin',
    },
  );

  assert.equal(assignment.roleCode, 'company_admin');
  assert.equal(assignment.isActive, true);
});

test('role assignments service rejects assignment when the target user identity is inactive', async () => {
  const service = new RoleAssignmentsService(
    {
      company: {
        findUnique: async () => ({
          id: 'company-1',
        }),
      },
      user: {
        findUnique: async () => ({
          id: 'user-1',
          isActive: false,
        }),
      },
    },
    {
      recordEvent: async () => undefined,
    },
  );

  await assert.rejects(
    () =>
      service.assignRole('company-1', 'user-1', 'actor-1', undefined, {
        roleCode: 'company_admin',
      }),
    BadRequestException,
  );
});

test('role assignments service removes a role by deactivating the assignment', async () => {
  const service = new RoleAssignmentsService(
    {
      company: {
        findUnique: async () => ({
          id: 'company-1',
        }),
      },
      role: {
        findUnique: async () => ({
          id: 'role-admin',
          code: 'company_admin',
        }),
      },
      userRole: {
        findUnique: async () => ({
          id: 'assignment-1',
        }),
        update: async () => ({
          id: 'assignment-1',
          companyId: 'company-1',
          userId: 'user-1',
          roleId: 'role-admin',
          isActive: false,
          createdAt: new Date('2026-03-16T00:00:00.000Z'),
          updatedAt: new Date('2026-03-16T01:00:00.000Z'),
          role: {
            code: 'company_admin',
            name: 'Company Administrator',
          },
        }),
      },
    },
    {
      recordEvent: async () => undefined,
    },
  );

  const assignment = await service.removeRole(
    'company-1',
    'user-1',
    'company_admin',
    'actor-1',
    undefined,
  );

  assert.equal(assignment.isActive, false);
});
