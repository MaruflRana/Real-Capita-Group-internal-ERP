const assert = require('node:assert/strict');
const test = require('node:test');

const { BadRequestException } = require('@nestjs/common');

const { CompaniesService } = require('./companies.service');

test('companies service creates a company and attaches the current user as company_admin', async () => {
  const userRoleUpserts = [];
  const service = new CompaniesService(
    {
      role: {
        findUnique: async () => ({
          id: 'role-admin',
          code: 'company_admin',
          name: 'Company Administrator',
          description: null,
          isActive: true,
          createdAt: new Date('2026-03-16T00:00:00.000Z'),
          updatedAt: new Date('2026-03-16T00:00:00.000Z'),
        }),
      },
    },
    {
      withTransaction: async (operation) =>
        operation({
          company: {
            create: async ({ data }) => ({
              id: 'company-2',
              name: data.name,
              slug: data.slug,
              isActive: true,
              createdAt: new Date('2026-03-16T00:00:00.000Z'),
              updatedAt: new Date('2026-03-16T00:00:00.000Z'),
            }),
          },
          userRole: {
            upsert: async (input) => {
              userRoleUpserts.push(input);
            },
          },
        }),
    },
    {
      recordEvent: async () => undefined,
    },
  );

  const company = await service.createCompany(
    {
      id: 'user-1',
    },
    undefined,
    {
      name: 'New Company',
      slug: 'new-company',
    },
  );

  assert.equal(company.id, 'company-2');
  assert.deepEqual(company.currentUserRoles, ['company_admin']);
  assert.equal(userRoleUpserts.length, 1);
  assert.equal(
    userRoleUpserts[0].where.userId_companyId_roleId.userId,
    'user-1',
  );
});

test('companies service rejects creation when the admin role baseline is unavailable', async () => {
  const service = new CompaniesService(
    {
      role: {
        findUnique: async () => null,
      },
    },
    {
      withTransaction: async (operation) =>
        operation({
          company: {
            update: async ({ data }) => ({
              id: 'company-1',
              name: 'Real Capita',
              slug: 'real-capita',
              isActive: data.isActive,
              createdAt: new Date('2026-03-16T00:00:00.000Z'),
              updatedAt: new Date('2026-03-16T01:00:00.000Z'),
            }),
          },
        }),
    },
    {
      recordEvent: async () => undefined,
    },
  );

  await assert.rejects(
    () =>
      service.createCompany(
        {
          id: 'user-1',
        },
        undefined,
        {
          name: 'New Company',
          slug: 'new-company',
        },
      ),
    BadRequestException,
  );
});

test('companies service updates company activation state', async () => {
  const service = new CompaniesService(
    {
      company: {
        findUnique: async ({ where }) => {
          if (where.id === 'company-1') {
            return {
              id: 'company-1',
              name: 'Real Capita',
              slug: 'real-capita',
              isActive: true,
              createdAt: new Date('2026-03-16T00:00:00.000Z'),
              updatedAt: new Date('2026-03-16T00:00:00.000Z'),
            };
          }

          return null;
        },
        update: async ({ data }) => ({
          id: 'company-1',
          name: 'Real Capita',
          slug: 'real-capita',
          isActive: data.isActive,
          createdAt: new Date('2026-03-16T00:00:00.000Z'),
          updatedAt: new Date('2026-03-16T01:00:00.000Z'),
        }),
      },
    },
    {
      withTransaction: async (operation) =>
        operation({
          company: {
            update: async ({ data }) => ({
              id: 'company-1',
              name: 'Real Capita',
              slug: 'real-capita',
              isActive: data.isActive,
              createdAt: new Date('2026-03-16T00:00:00.000Z'),
              updatedAt: new Date('2026-03-16T01:00:00.000Z'),
            }),
          },
        }),
    },
    {
      recordEvent: async () => undefined,
    },
  );

  service.getCompanyDetail = async () => ({
    id: 'company-1',
    name: 'Real Capita',
    slug: 'real-capita',
    isActive: false,
    currentUserRoles: ['company_admin'],
    createdAt: '2026-03-16T00:00:00.000Z',
    updatedAt: '2026-03-16T01:00:00.000Z',
  });

  const company = await service.setCompanyActiveState(
    'company-1',
    'user-1',
    undefined,
    false,
  );

  assert.equal(company.isActive, false);
});
