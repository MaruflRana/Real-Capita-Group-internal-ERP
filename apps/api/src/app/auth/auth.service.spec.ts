const assert = require('node:assert/strict');
const test = require('node:test');

const { AuthService } = require('./auth.service');

const createAssignment = (companyId, companySlug, roleCodes) =>
  roleCodes.map((roleCode) => ({
    company: {
      id: companyId,
      name: companySlug.replace(/-/g, ' '),
      slug: companySlug,
    },
    role: {
      code: roleCode,
    },
  }));

const createUserRecord = ({
  id = 'user-1',
  email = 'admin@example.com',
  passwordHash = 'hashed-password',
  isActive = true,
  lastLoginAt = new Date('2026-03-16T00:00:00.000Z'),
  userRoles = createAssignment('company-1', 'real-capita', ['company_admin']),
} = {}) => ({
  id,
  email,
  passwordHash,
  isActive,
  lastLoginAt,
  userRoles,
});

const createTokenSet = (overrides = {}) => ({
  accessToken: 'access-token',
  refreshToken: 'refresh-token-value',
  accessTokenExpiresAt: new Date('2030-03-16T01:00:00.000Z'),
  refreshTokenExpiresAt: new Date('2030-03-23T01:00:00.000Z'),
  refreshTokenId: 'refresh-token-id',
  familyId: 'refresh-family-id',
  ...overrides,
});

test('auth service logs in with a single active company assignment', async () => {
  const refreshTokenCreates = [];
  const lastLoginUpdates = [];
  const transaction = { id: 'tx-1' };
  const authRepository = {
    findUserByEmail: async () => createUserRecord(),
    createRefreshToken: async (data, activeTransaction) => {
      refreshTokenCreates.push({ data, activeTransaction });
    },
    updateUserLastLogin: async (userId, activeTransaction) => {
      lastLoginUpdates.push({ userId, activeTransaction });
    },
    findUserById: async () => createUserRecord(),
  };
  const authTokenService = {
    issueTokenSet: async () => createTokenSet(),
    hashToken: (token) => `hashed:${token}`,
  };
  const passwordService = {
    verifyPassword: async () => true,
  };
  const databaseService = {
    withTransaction: async (operation) => operation(transaction),
  };
  const auditService = {
    recordEvent: async () => undefined,
  };
  const service = new AuthService(
    authRepository,
    authTokenService,
    passwordService,
    databaseService,
    auditService,
  );

  const response = await service.login({
    email: 'ADMIN@example.com',
    password: 'correct-password',
  });

  assert.equal(response.tokenType, 'Bearer');
  assert.equal(response.user.email, 'admin@example.com');
  assert.equal(response.user.currentCompany.id, 'company-1');
  assert.deepEqual(response.user.assignments, [
    {
      company: {
        id: 'company-1',
        name: 'real capita',
        slug: 'real-capita',
      },
      roles: ['company_admin'],
    },
  ]);
  assert.equal(refreshTokenCreates.length, 1);
  assert.equal(
    refreshTokenCreates[0].data.tokenHash,
    'hashed:refresh-token-value',
  );
  assert.equal(refreshTokenCreates[0].activeTransaction, transaction);
  assert.deepEqual(lastLoginUpdates, [
    {
      userId: 'user-1',
      activeTransaction: transaction,
    },
  ]);
});

test('auth service rejects login when the password is invalid', async () => {
  const service = new AuthService(
    {
      findUserByEmail: async () => createUserRecord(),
    },
    {
      issueTokenSet: async () => createTokenSet(),
      hashToken: (token) => token,
    },
    {
      verifyPassword: async () => false,
    },
    {
      withTransaction: async (operation) => operation({}),
    },
    {
      recordEvent: async () => undefined,
    },
  );

  await assert.rejects(
    () =>
      service.login({
        email: 'admin@example.com',
        password: 'wrong-password',
      }),
    /Invalid email or password/,
  );
});

test('auth service returns available companies when login requires a company selection', async () => {
  const service = new AuthService(
    {
      findUserByEmail: async () =>
        createUserRecord({
          userRoles: [
            ...createAssignment('company-1', 'real-capita', ['company_admin']),
            ...createAssignment('company-2', 'real-capita-holdings', ['company_admin']),
          ],
        }),
    },
    {
      issueTokenSet: async () => createTokenSet(),
      hashToken: (token) => token,
    },
    {
      verifyPassword: async () => true,
    },
    {
      withTransaction: async (operation) => operation({}),
    },
    {
      recordEvent: async () => undefined,
    },
  );

  await assert.rejects(
    () =>
      service.login({
        email: 'admin@example.com',
        password: 'correct-password',
      }),
    (error) => {
      assert.equal(error.getStatus(), 400);
      assert.equal(
        error.getResponse().message,
        'companyId is required when multiple active company memberships exist.',
      );
      assert.deepEqual(error.getResponse().details.availableCompanies, [
        {
          id: 'company-1',
          name: 'real capita',
          slug: 'real-capita',
          roles: ['company_admin'],
        },
        {
          id: 'company-2',
          name: 'real capita holdings',
          slug: 'real-capita-holdings',
          roles: ['company_admin'],
        },
      ]);

      return true;
    },
  );
});

test('auth service rotates refresh tokens and preserves the token family', async () => {
  const rotatedTokens = [];
  const createdTokens = [];
  const transaction = { id: 'tx-2' };
  const authRepository = {
    findRefreshTokenByTokenId: async () => ({
      id: 'refresh-row-1',
      tokenId: 'refresh-token-id',
      userId: 'user-1',
      companyId: 'company-1',
      familyId: 'family-1',
      tokenHash: 'hashed:refresh-token-value',
      expiresAt: new Date('2030-03-23T01:00:00.000Z'),
      revokedAt: null,
    }),
    findUserCompanyAccess: async () => [
      {
        user: {
          id: 'user-1',
          email: 'admin@example.com',
        },
        company: {
          id: 'company-1',
          name: 'Real Capita',
          slug: 'real-capita',
        },
        role: {
          code: 'company_admin',
        },
      },
    ],
    markRefreshTokenRotated: async (
      refreshTokenRowId,
      replacedByTokenId,
      activeTransaction,
    ) => {
      rotatedTokens.push({
        refreshTokenRowId,
        replacedByTokenId,
        activeTransaction,
      });
    },
    createRefreshToken: async (data, activeTransaction) => {
      createdTokens.push({ data, activeTransaction });
    },
    revokeRefreshTokenFamily: async () => {
      throw new Error('refresh family should not be revoked during a valid rotation');
    },
    findUserById: async () =>
      createUserRecord({
        userRoles: createAssignment('company-1', 'real-capita', ['company_admin']),
      }),
  };
  const authTokenService = {
    verifyRefreshToken: async () => ({
      sub: 'user-1',
      companyId: 'company-1',
      familyId: 'family-1',
      type: 'refresh',
      jti: 'refresh-token-id',
    }),
    matchesTokenHash: () => true,
    issueTokenSet: async (_user, familyId) =>
      createTokenSet({
        familyId,
        refreshTokenId: 'refresh-token-id-2',
        refreshToken: 'refresh-token-value-2',
      }),
    hashToken: (token) => `hashed:${token}`,
  };
  const service = new AuthService(
    authRepository,
    authTokenService,
    {
      verifyPassword: async () => true,
    },
    {
      withTransaction: async (operation) => operation(transaction),
    },
    {
      recordEvent: async () => undefined,
    },
  );

  const response = await service.refresh({
    refreshToken: 'refresh-token-value',
  });

  assert.equal(response.refreshToken, 'refresh-token-value-2');
  assert.deepEqual(rotatedTokens, [
    {
      refreshTokenRowId: 'refresh-row-1',
      replacedByTokenId: 'refresh-token-id-2',
      activeTransaction: transaction,
    },
  ]);
  assert.equal(createdTokens.length, 1);
  assert.equal(createdTokens[0].data.familyId, 'family-1');
  assert.equal(createdTokens[0].data.parentTokenId, 'refresh-token-id');
  assert.equal(
    createdTokens[0].data.tokenHash,
    'hashed:refresh-token-value-2',
  );
});

test('auth service revokes the refresh token family during logout', async () => {
  const revocations = [];
  const transaction = { id: 'tx-3' };
  const service = new AuthService(
    {
      findRefreshTokenByTokenId: async () => ({
        familyId: 'family-logout',
      }),
      revokeRefreshTokenFamily: async (familyId, reason, activeTransaction) => {
        revocations.push({ familyId, reason, activeTransaction });
      },
    },
    {
      verifyRefreshToken: async () => ({
        jti: 'refresh-token-id',
      }),
    },
    {
      verifyPassword: async () => true,
    },
    {
      withTransaction: async (operation) => operation(transaction),
    },
    {
      recordEvent: async () => undefined,
    },
  );

  const response = await service.logout({
    refreshToken: 'refresh-token-value',
  });

  assert.deepEqual(response, {
    status: 'ok',
    message: 'Session revoked.',
  });
  assert.deepEqual(revocations, [
    {
      familyId: 'family-logout',
      reason: 'User requested logout.',
      activeTransaction: transaction,
    },
  ]);
});
