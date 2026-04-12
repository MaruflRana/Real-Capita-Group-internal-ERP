const assert = require('node:assert/strict');
const test = require('node:test');

const {
  BadRequestException,
  ConflictException,
  NotFoundException,
} = require('@nestjs/common');

const { ChartOfAccountsService } = require('./chart-of-accounts.service');

test('chart of accounts service creates an account group when identifiers are unique', async () => {
  const service = new ChartOfAccountsService({
    company: {
      findUnique: async () => ({ id: 'company-1' }),
    },
    accountClass: {
      findUnique: async () => ({
        id: 'class-asset',
        isActive: true,
      }),
    },
    accountGroup: {
      findFirst: async () => null,
      create: async ({ data }) => ({
        id: 'group-1',
        companyId: data.companyId,
        accountClassId: data.accountClassId,
        code: data.code,
        name: data.name,
        description: data.description,
        isActive: true,
        createdAt: new Date('2026-03-16T00:00:00.000Z'),
        updatedAt: new Date('2026-03-16T00:00:00.000Z'),
        accountClass: {
          id: 'class-asset',
          code: 'ASSET',
          name: 'Assets',
        },
      }),
    },
  });

  const accountGroup = await service.createAccountGroup('company-1', {
    accountClassId: 'class-asset',
    code: 'cash',
    name: 'Cash Group',
    description: 'Cash and bank equivalents',
  });

  assert.equal(accountGroup.code, 'CASH');
  assert.equal(accountGroup.accountClassCode, 'ASSET');
});

test('chart of accounts service rejects duplicate account group codes within the same company', async () => {
  let accountGroupFindFirstCalls = 0;
  const service = new ChartOfAccountsService({
    company: {
      findUnique: async () => ({ id: 'company-1' }),
    },
    accountClass: {
      findUnique: async () => ({
        id: 'class-asset',
        isActive: true,
      }),
    },
    accountGroup: {
      findFirst: async () => {
        accountGroupFindFirstCalls += 1;

        return accountGroupFindFirstCalls === 1 ? { id: 'existing-group' } : null;
      },
    },
  });

  await assert.rejects(
    () =>
      service.createAccountGroup('company-1', {
        accountClassId: 'class-asset',
        code: 'cash',
        name: 'Cash Group',
      }),
    ConflictException,
  );
});

test('chart of accounts service rejects ledger account creation when the parent group is inactive', async () => {
  const service = new ChartOfAccountsService({
    company: {
      findUnique: async () => ({ id: 'company-1' }),
    },
    accountGroup: {
      findFirst: async () => ({
        id: 'group-1',
        isActive: false,
      }),
    },
  });

  await assert.rejects(
    () =>
      service.createLedgerAccount('company-1', {
        accountGroupId: 'group-1',
        code: 'cash-ledger',
        name: 'Cash Ledger',
      }),
    BadRequestException,
  );
});

test('chart of accounts service creates a particular account under an active ledger account', async () => {
  const service = new ChartOfAccountsService({
    company: {
      findUnique: async () => ({ id: 'company-1' }),
    },
    ledgerAccount: {
      findFirst: async () => ({
        id: 'ledger-1',
        isActive: true,
      }),
    },
    particularAccount: {
      findFirst: async () => null,
      create: async ({ data }) => ({
        id: 'particular-1',
        companyId: data.companyId,
        ledgerAccountId: data.ledgerAccountId,
        code: data.code,
        name: data.name,
        description: data.description,
        isActive: true,
        createdAt: new Date('2026-03-16T00:00:00.000Z'),
        updatedAt: new Date('2026-03-16T00:00:00.000Z'),
        ledgerAccount: {
          id: 'ledger-1',
          code: 'LEDGER-CASH',
          name: 'Cash Ledger',
          accountGroupId: 'group-1',
          accountGroup: {
            id: 'group-1',
            code: 'GROUP-CASH',
            name: 'Cash Group',
            accountClassId: 'class-asset',
            accountClass: {
              id: 'class-asset',
              code: 'ASSET',
              name: 'Assets',
            },
          },
        },
      }),
    },
  });

  const particularAccount = await service.createParticularAccount('company-1', {
    ledgerAccountId: 'ledger-1',
    code: 'cash-on-hand',
    name: 'Cash On Hand',
  });

  assert.equal(particularAccount.code, 'CASH-ON-HAND');
  assert.equal(particularAccount.ledgerAccountCode, 'LEDGER-CASH');
});

test('chart of accounts service rejects particular account creation when the ledger account is outside the company scope', async () => {
  const service = new ChartOfAccountsService({
    company: {
      findUnique: async () => ({ id: 'company-1' }),
    },
    ledgerAccount: {
      findFirst: async () => null,
    },
  });

  await assert.rejects(
    () =>
      service.createParticularAccount('company-1', {
        ledgerAccountId: 'ledger-other-company',
        code: 'cash-on-hand',
        name: 'Cash On Hand',
      }),
    NotFoundException,
  );
});
