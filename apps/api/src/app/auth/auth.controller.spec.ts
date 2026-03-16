const assert = require('node:assert/strict');
const test = require('node:test');
const { GUARDS_METADATA } = require('@nestjs/common/constants');

const { AuthController } = require('./auth.controller');
const { AccessTokenGuard } = require('./guards/access-token.guard');

test('auth controller delegates login and current-user lookups', async () => {
  const controller = new AuthController({
    login: async (loginDto) => ({
      accessToken: `token-for:${loginDto.email}`,
    }),
    getCurrentUserProfile: async (authenticatedUser) => ({
      id: authenticatedUser.id,
      email: authenticatedUser.email,
    }),
  });

  const loginResponse = await controller.login({
    email: 'admin@example.com',
    password: 'secure-password',
  });
  const currentUserResponse = await controller.getCurrentUser({
    id: 'user-1',
    email: 'admin@example.com',
    companyId: 'company-1',
    companyName: 'Real Capita',
    companySlug: 'real-capita',
    roles: ['company_admin'],
  });

  assert.deepEqual(loginResponse, {
    accessToken: 'token-for:admin@example.com',
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
