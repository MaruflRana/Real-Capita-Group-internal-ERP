const assert = require('node:assert/strict');
const test = require('node:test');

const { AuthBootstrapService } = require('./auth-bootstrap.service');

test('bootstrap service creates the initial company admin context', async () => {
  const ensuredRoles = [];
  const ensuredAssignments = [];
  const transaction = { id: 'tx-bootstrap-1' };
  const service = new AuthBootstrapService(
    {
      findCompanyBySlug: async () => null,
      createCompany: async () => ({
        id: 'company-1',
        name: 'Real Capita',
        slug: 'real-capita',
      }),
      updateCompanyName: async () => {
        throw new Error('updateCompanyName should not run for a new company');
      },
      upsertRole: async (role) => {
        ensuredRoles.push(role.code);
      },
      findRoleByCode: async () => ({
        id: 'role-admin',
        code: 'company_admin',
      }),
      findAnyUserByEmail: async () => null,
      createUser: async () => ({
        id: 'user-1',
        email: 'admin@example.com',
      }),
      findUserRoleAssignment: async () => null,
      ensureUserRole: async (userId, companyId, roleId) => {
        ensuredAssignments.push({ userId, companyId, roleId });
      },
    },
    {
      hashPassword: async () => 'hashed-password',
    },
    {
      withTransaction: async (operation) => operation(transaction),
    },
  );

  const result = await service.bootstrapAdmin({
    companyName: 'Real Capita',
    companySlug: 'real-capita',
    adminEmail: 'admin@example.com',
    adminPassword: 'secure-password-123',
  });

  assert.equal(result.createdCompany, true);
  assert.equal(result.createdUser, true);
  assert.equal(result.reusedExistingUser, false);
  assert.deepEqual(ensuredRoles.sort(), [
    'company_accountant',
    'company_admin',
    'company_hr',
    'company_member',
    'company_payroll',
    'company_sales',
  ]);
  assert.deepEqual(ensuredAssignments, [
    {
      userId: 'user-1',
      companyId: 'company-1',
      roleId: 'role-admin',
    },
  ]);
});

test('bootstrap service reuses an existing active company admin safely', async () => {
  const createdUsers = [];
  const service = new AuthBootstrapService(
    {
      findCompanyBySlug: async () => ({
        id: 'company-1',
        name: 'Real Capita',
        slug: 'real-capita',
        isActive: true,
      }),
      createCompany: async () => {
        throw new Error('createCompany should not run when the company already exists');
      },
      updateCompanyName: async () => {
        throw new Error('updateCompanyName should not run when the company name is unchanged');
      },
      upsertRole: async () => undefined,
      findRoleByCode: async () => ({
        id: 'role-admin',
        code: 'company_admin',
      }),
      findAnyUserByEmail: async () => ({
        id: 'user-1',
        email: 'admin@example.com',
        isActive: true,
      }),
      createUser: async () => {
        createdUsers.push('called');
      },
      findUserRoleAssignment: async () => ({
        id: 'assignment-1',
      }),
      ensureUserRole: async () => undefined,
    },
    {
      hashPassword: async () => 'hashed-password',
    },
    {
      withTransaction: async (operation) => operation({ id: 'tx-bootstrap-2' }),
    },
  );

  const result = await service.bootstrapAdmin({
    companyName: 'Real Capita',
    companySlug: 'real-capita',
    adminEmail: 'admin@example.com',
    adminPassword: 'secure-password-123',
  });

  assert.equal(result.createdCompany, false);
  assert.equal(result.createdUser, false);
  assert.equal(result.reusedExistingUser, true);
  assert.equal(result.attachedAdminRole, false);
  assert.deepEqual(createdUsers, []);
});

test('bootstrap service rejects weak admin passwords', async () => {
  const service = new AuthBootstrapService(
    {},
    {
      hashPassword: async () => 'hashed-password',
    },
    {
      withTransaction: async (operation) => operation({}),
    },
  );

  await assert.rejects(
    () =>
      service.bootstrapAdmin({
        companyName: 'Real Capita',
        companySlug: 'real-capita',
        adminEmail: 'admin@example.com',
        adminPassword: 'shortpwd',
      }),
    /adminPassword must be at least 12 characters long/,
  );
});
