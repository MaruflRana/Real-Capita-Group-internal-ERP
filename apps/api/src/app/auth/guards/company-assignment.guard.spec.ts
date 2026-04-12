const assert = require('node:assert/strict');
const test = require('node:test');

const {
  AUTH_ROLES_KEY,
  COMPANY_SCOPE_KEY,
} = require('../constants/auth.constants');
const { CompanyAssignmentGuard } = require('./company-assignment.guard');

const createExecutionContext = (request) => ({
  getHandler: () => 'handler',
  getClass: () => 'class',
  switchToHttp: () => ({
    getRequest: () => request,
  }),
});

test('company assignment guard allows a matching admin assignment in the target company', async () => {
  const guard = new CompanyAssignmentGuard(
    {
      getAllAndOverride: (key) => {
        if (key === COMPANY_SCOPE_KEY) {
          return {
            source: 'params',
            key: 'companyId',
            allowInactiveCompany: false,
          };
        }

        if (key === AUTH_ROLES_KEY) {
          return ['company_admin'];
        }

        return undefined;
      },
    },
    {
      findCompanyById: async () => ({
        id: 'company-2',
      }),
      findUserCompanyAssignments: async () => [
        {
          role: {
            code: 'company_admin',
          },
        },
      ],
    },
  );

  const result = await guard.canActivate(
    createExecutionContext({
      user: {
        id: 'user-1',
      },
      params: {
        companyId: 'company-2',
      },
    }),
  );

  assert.equal(result, true);
});

test('company assignment guard rejects missing scoped roles', async () => {
  const guard = new CompanyAssignmentGuard(
    {
      getAllAndOverride: (key) => {
        if (key === COMPANY_SCOPE_KEY) {
          return {
            source: 'params',
            key: 'companyId',
            allowInactiveCompany: false,
          };
        }

        if (key === AUTH_ROLES_KEY) {
          return ['company_admin'];
        }

        return undefined;
      },
    },
    {
      findCompanyById: async () => ({
        id: 'company-2',
      }),
      findUserCompanyAssignments: async () => [
        {
          role: {
            code: 'company_member',
          },
        },
      ],
    },
  );

  const result = await guard.canActivate(
    createExecutionContext({
      user: {
        id: 'user-1',
      },
      params: {
        companyId: 'company-2',
      },
    }),
  );

  assert.equal(result, false);
});

test('company assignment guard defers missing companies to the service layer', async () => {
  const guard = new CompanyAssignmentGuard(
    {
      getAllAndOverride: (key) => {
        if (key === COMPANY_SCOPE_KEY) {
          return {
            source: 'params',
            key: 'companyId',
            allowInactiveCompany: false,
          };
        }

        return [];
      },
    },
    {
      findCompanyById: async () => null,
      findUserCompanyAssignments: async () => {
        throw new Error('findUserCompanyAssignments should not run when the company is missing');
      },
    },
  );

  const result = await guard.canActivate(
    createExecutionContext({
      user: {
        id: 'user-1',
      },
      params: {
        companyId: 'missing-company',
      },
    }),
  );

  assert.equal(result, true);
});
