const assert = require('node:assert/strict');
const test = require('node:test');

const { ConflictException } = require('@nestjs/common');

const { UsersService } = require('./users.service');

test('users service creates a company-scoped user with hashed password and initial roles', async () => {
  const createdUsers = [];
  const createdUserRoles = [];
  const service = new UsersService(
    {
      company: {
        findUnique: async () => ({
          id: 'company-1',
        }),
      },
      user: {
        findFirst: async () => ({
          id: 'user-2',
          email: 'new.user@example.com',
          firstName: 'New',
          lastName: 'User',
          isActive: true,
          lastLoginAt: null,
          createdAt: new Date('2026-03-16T00:00:00.000Z'),
          updatedAt: new Date('2026-03-16T00:00:00.000Z'),
          userRoles: [
            {
              isActive: true,
              role: {
                code: 'company_member',
                isActive: true,
              },
            },
          ],
        }),
        update: async () => undefined,
      },
    },
    {
      hashPassword: async (password) => `hashed:${password}`,
    },
    {
      withTransaction: async (operation) =>
        operation({
          user: {
            findUnique: async () => null,
            create: async ({ data }) => {
              createdUsers.push(data);

              return {
                id: 'user-2',
              };
            },
          },
          role: {
            findMany: async () => [
              {
                id: 'role-member',
                code: 'company_member',
              },
            ],
          },
          userRole: {
            createMany: async ({ data }) => {
              createdUserRoles.push(...data);
            },
          },
        }),
    },
    {
      recordEvent: async () => undefined,
    },
  );

  const user = await service.createUser(
    'company-1',
    'actor-1',
    undefined,
    {
      email: 'NEW.USER@example.com',
      password: 'secure-password-123',
      firstName: 'New',
      lastName: 'User',
      roleCodes: ['company_member'],
    },
  );

  assert.equal(user.email, 'new.user@example.com');
  assert.equal(createdUsers[0].passwordHash, 'hashed:secure-password-123');
  assert.equal(createdUserRoles[0].companyId, 'company-1');
});

test('users service rejects duplicate emails during user creation', async () => {
  const service = new UsersService(
    {
      company: {
        findUnique: async () => ({
          id: 'company-1',
        }),
      },
    },
    {
      hashPassword: async () => 'hashed-password',
    },
    {
      withTransaction: async (operation) =>
        operation({
          user: {
            findUnique: async () => ({
              id: 'user-existing',
            }),
          },
          role: {
            findMany: async () => [],
          },
          userRole: {
            createMany: async () => undefined,
          },
        }),
    },
    {
      recordEvent: async () => undefined,
    },
  );

  await assert.rejects(
    () =>
      service.createUser('company-1', 'actor-1', undefined, {
        email: 'existing@example.com',
        password: 'secure-password-123',
        roleCodes: ['company_member'],
      }),
    ConflictException,
  );
});

test('users service deactivates company-scoped access by updating all company assignments', async () => {
  const updates = [];
  const service = new UsersService(
    {
      company: {
        findUnique: async () => ({
          id: 'company-1',
        }),
      },
      user: {
        findFirst: async () => ({
          id: 'user-2',
          email: 'existing@example.com',
          firstName: null,
          lastName: null,
          isActive: true,
          lastLoginAt: null,
          createdAt: new Date('2026-03-16T00:00:00.000Z'),
          updatedAt: new Date('2026-03-16T00:00:00.000Z'),
          userRoles: [
            {
              isActive: false,
              role: {
                code: 'company_member',
                isActive: true,
              },
            },
          ],
        }),
        update: async () => undefined,
      },
      userRole: {
        updateMany: async (input) => {
          updates.push(input);
        },
      },
    },
    {
      hashPassword: async () => 'hashed-password',
    },
    {
      withTransaction: async (operation) =>
        operation({
          userRole: {
            updateMany: async (input) => {
              updates.push(input);
            },
          },
        }),
    },
    {
      recordEvent: async () => undefined,
    },
  );

  const user = await service.setUserCompanyAccessState(
    'company-1',
    'user-2',
    'actor-1',
    undefined,
    false,
  );

  assert.equal(updates.length, 1);
  assert.equal(updates[0].where.companyId, 'company-1');
  assert.equal(user.companyAccessIsActive, false);
});
