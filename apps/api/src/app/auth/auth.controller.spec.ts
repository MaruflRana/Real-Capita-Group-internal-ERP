const assert = require('node:assert/strict');
const test = require('node:test');
const { GUARDS_METADATA } = require('@nestjs/common/constants');

const { AuthController } = require('./auth.controller');
const { AccessTokenGuard } = require('./guards/access-token.guard');

test('auth controller delegates login and current-user lookups', async () => {
  const response = {
    getHeader: () => undefined,
    setHeader: () => undefined,
  };
  const controller = new AuthController({
    login: async (loginDto) => ({
      accessTokenExpiresAt: '2026-03-16T01:00:00.000Z',
      accessToken: `token-for:${loginDto.email}`,
      refreshToken: 'refresh-token-value',
      refreshTokenExpiresAt: '2026-03-23T01:00:00.000Z',
    }),
    getCurrentUserProfile: async (authenticatedUser) => ({
      id: authenticatedUser.id,
      email: authenticatedUser.email,
    }),
  }, {
    setSessionCookies: () => undefined,
  });

  const loginResponse = await controller.login(undefined, {
    email: 'admin@example.com',
    password: 'secure-password',
  }, response);
  const currentUserResponse = await controller.getCurrentUser({
    id: 'user-1',
    email: 'admin@example.com',
    companyId: 'company-1',
    companyName: 'Real Capita',
    companySlug: 'real-capita',
    roles: ['company_admin'],
  });

  assert.deepEqual(loginResponse, {
    accessTokenExpiresAt: '2026-03-16T01:00:00.000Z',
    accessToken: 'token-for:admin@example.com',
    refreshToken: 'refresh-token-value',
    refreshTokenExpiresAt: '2026-03-23T01:00:00.000Z',
  });
  assert.deepEqual(currentUserResponse, {
    id: 'user-1',
    email: 'admin@example.com',
  });
});

test('auth controller protects the current-user endpoint with the access token guard', () => {
  const guards =
    Reflect.getMetadata(
      GUARDS_METADATA,
      AuthController.prototype.getCurrentUser,
    ) ?? [];

  assert.ok(guards.includes(AccessTokenGuard));
});
