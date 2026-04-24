const assert = require('node:assert/strict');
const test = require('node:test');

const { RolesGuard } = require('./roles.guard');

const createExecutionContext = (user) => ({
  getHandler: () => 'handler',
  getClass: () => 'class',
  switchToHttp: () => ({
    getRequest: () => ({
      user,
    }),
  }),
});

test('roles guard allows requests when no role metadata is applied', () => {
  const guard = new RolesGuard({
    getAllAndOverride: () => undefined,
  });

  assert.equal(guard.canActivate(createExecutionContext(undefined)), true);
});

test('roles guard enforces the required roles', () => {
  const guard = new RolesGuard({
    getAllAndOverride: () => ['company_admin'],
  });

  assert.equal(
    guard.canActivate(
      createExecutionContext({
        roles: ['company_admin'],
      }),
    ),
    true,
  );
  assert.throws(
    () =>
      guard.canActivate(
        createExecutionContext({
          roles: ['company_member'],
        }),
      ),
    /required role scope/u,
  );
});
