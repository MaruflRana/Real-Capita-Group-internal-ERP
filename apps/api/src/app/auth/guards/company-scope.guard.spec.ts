const assert = require('node:assert/strict');
const test = require('node:test');

const { CompanyScopeGuard } = require('./company-scope.guard');

const createExecutionContext = (request) => ({
  getHandler: () => 'handler',
  getClass: () => 'class',
  switchToHttp: () => ({
    getRequest: () => request,
  }),
});

test('company scope guard allows matching company-scoped requests', () => {
  const guard = new CompanyScopeGuard({
    getAllAndOverride: () => ({
      source: 'params',
      key: 'companyId',
    }),
  });

  assert.equal(
    guard.canActivate(
      createExecutionContext({
        user: {
          companyId: 'company-1',
        },
        params: {
          companyId: 'company-1',
        },
      }),
    ),
    true,
  );
});

test('company scope guard rejects mismatched company-scoped requests', () => {
  const guard = new CompanyScopeGuard({
    getAllAndOverride: () => ({
      source: 'headers',
      key: 'x-company-id',
    }),
  });

  assert.equal(
    guard.canActivate(
      createExecutionContext({
        user: {
          companyId: 'company-1',
        },
        headers: {
          'x-company-id': 'company-2',
        },
      }),
    ),
    false,
  );
});
