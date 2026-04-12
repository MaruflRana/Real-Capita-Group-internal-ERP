const assert = require('node:assert/strict');
const test = require('node:test');

const { BadRequestException } = require('@nestjs/common');
const { Prisma } = require('@prisma/client');

const { VouchersService } = require('./vouchers.service');

const makeVoucherDetail = ({
  id = 'voucher-1',
  companyId = 'company-1',
  status = 'DRAFT',
  voucherType = 'JOURNAL',
  voucherDate = '2026-03-16',
  lines = [],
  postedById = null,
  postedAt = null,
} = {}) => ({
  id,
  companyId,
  createdById: 'user-1',
  postedById,
  voucherType,
  status,
  voucherDate: new Date(`${voucherDate}T00:00:00.000Z`),
  description: 'Voucher description',
  reference: 'REF-001',
  postedAt,
  createdAt: new Date('2026-03-16T00:00:00.000Z'),
  updatedAt: new Date('2026-03-16T00:00:00.000Z'),
  voucherLines: lines,
});

const makeVoucherLine = ({
  id = 'line-1',
  voucherId = 'voucher-1',
  lineNumber = 1,
  particularAccountId = 'particular-1',
  particularAccountCode = 'CASH',
  particularAccountName = 'Cash On Hand',
  ledgerAccountId = 'ledger-1',
  ledgerAccountCode = 'LEDGER-CASH',
  ledgerAccountName = 'Cash Ledger',
  debitAmount = '100.00',
  creditAmount = '0.00',
  description = 'Voucher line',
} = {}) => ({
  id,
  voucherId,
  lineNumber,
  particularAccountId,
  description,
  debitAmount: new Prisma.Decimal(debitAmount),
  creditAmount: new Prisma.Decimal(creditAmount),
  createdAt: new Date('2026-03-16T00:00:00.000Z'),
  updatedAt: new Date('2026-03-16T00:00:00.000Z'),
  particularAccount: {
    id: particularAccountId,
    code: particularAccountCode,
    name: particularAccountName,
    ledgerAccountId,
    ledgerAccount: {
      id: ledgerAccountId,
      code: ledgerAccountCode,
      name: ledgerAccountName,
    },
  },
});

const createService = ({
  prismaOverrides = {},
  transactionOverrides = {},
} = {}) => {
  const prisma = {
    company: {
      findUnique: async () => ({ id: 'company-1' }),
    },
    voucher: {
      findFirst: async () => makeVoucherDetail(),
      create: async ({ data }) => ({
        id: 'voucher-1',
        companyId: data.companyId,
      }),
      update: async () => ({
        id: 'voucher-1',
      }),
    },
    ...prismaOverrides,
  };
  const transaction = {
    voucher: {
      findFirst: async () => ({
        id: 'voucher-1',
        companyId: 'company-1',
        status: 'DRAFT',
      }),
      update: async () => ({
        id: 'voucher-1',
        voucherType: 'JOURNAL',
        voucherDate: new Date('2026-03-16T00:00:00.000Z'),
        reference: 'REF-001',
      }),
    },
    particularAccount: {
      findFirst: async () => ({
        id: 'particular-1',
        isActive: true,
      }),
    },
    voucherLine: {
      findFirst: async () => null,
      create: async () => undefined,
      update: async () => undefined,
      delete: async () => undefined,
    },
    ...transactionOverrides,
  };
  const databaseService = {
    withTransaction: async (operation) => operation(transaction),
  };
  const auditService = {
    recordEvent: async () => undefined,
  };

  return {
    service: new VouchersService(prisma, databaseService, auditService),
    prisma,
    transaction,
  };
};

test('vouchers service creates a voucher draft', async () => {
  let voucherFindFirstCalls = 0;
  const { service } = createService({
    prismaOverrides: {
      voucher: {
        create: async ({ data }) => ({
          id: 'voucher-1',
          companyId: data.companyId,
        }),
        findFirst: async () => {
          voucherFindFirstCalls += 1;

          return makeVoucherDetail({
            lines: [],
          });
        },
      },
    },
  });

  const voucher = await service.createVoucherDraft(
    'company-1',
    {
      id: 'user-1',
      email: 'admin@example.com',
      companyId: 'company-1',
      companyName: 'Real Capita',
      companySlug: 'real-capita',
      roles: ['company_admin'],
    },
    {
      voucherType: 'JOURNAL',
      voucherDate: '2026-03-16',
      description: 'Opening voucher',
      reference: 'JV-001',
    },
  );

  assert.equal(voucher.status, 'DRAFT');
  assert.equal(voucher.lineCount, 0);
  assert.equal(voucherFindFirstCalls, 1);
});

test('vouchers service adds a voucher line to a draft voucher', async () => {
  let createdLineData;
  const { service } = createService({
    prismaOverrides: {
      voucher: {
        findFirst: async () =>
          makeVoucherDetail({
            lines: [
              makeVoucherLine({
                id: 'line-1',
                lineNumber: 1,
              }),
              makeVoucherLine({
                id: 'line-2',
                lineNumber: 2,
                debitAmount: '0.00',
                creditAmount: '100.00',
                description: 'Credit line',
              }),
            ],
          }),
      },
    },
    transactionOverrides: {
      voucherLine: {
        findFirst: async () => ({
          lineNumber: 1,
        }),
        create: async ({ data }) => {
          createdLineData = data;
        },
      },
    },
  });

  const voucher = await service.addVoucherLine('company-1', 'voucher-1', {
    particularAccountId: 'particular-1',
    description: 'Debit line',
    debitAmount: '100.00',
    creditAmount: '0.00',
  });

  assert.equal(createdLineData.lineNumber, 2);
  assert.equal(voucher.lineCount, 2);
});

test('vouchers service updates a voucher line on a draft voucher', async () => {
  let updatedLineData;
  const { service } = createService({
    prismaOverrides: {
      voucher: {
        findFirst: async () =>
          makeVoucherDetail({
            lines: [
              makeVoucherLine({
                id: 'line-1',
                description: 'Updated line',
                debitAmount: '250.00',
                creditAmount: '0.00',
              }),
            ],
          }),
      },
    },
    transactionOverrides: {
      voucherLine: {
        findFirst: async () => ({
          id: 'line-1',
          voucherId: 'voucher-1',
          lineNumber: 1,
          particularAccountId: 'particular-1',
          description: 'Old line',
          debitAmount: new Prisma.Decimal('100.00'),
          creditAmount: new Prisma.Decimal('0.00'),
        }),
        update: async ({ data }) => {
          updatedLineData = data;
        },
      },
    },
  });

  const voucher = await service.updateVoucherLine(
    'company-1',
    'voucher-1',
    'line-1',
    {
      description: 'Updated line',
      debitAmount: '250.00',
      creditAmount: '0.00',
    },
  );

  assert.equal(updatedLineData.description, 'Updated line');
  assert.equal(voucher.lines[0].debitAmount, '250.00');
});

test('vouchers service removes a voucher line from a draft voucher', async () => {
  let deletedLineId;
  const { service } = createService({
    prismaOverrides: {
      voucher: {
        findFirst: async () =>
          makeVoucherDetail({
            lines: [],
          }),
      },
    },
    transactionOverrides: {
      voucherLine: {
        findFirst: async () => ({
          id: 'line-1',
        }),
        delete: async ({ where }) => {
          deletedLineId = where.id;
        },
      },
    },
  });

  const voucher = await service.removeVoucherLine(
    'company-1',
    'voucher-1',
    'line-1',
  );

  assert.equal(deletedLineId, 'line-1');
  assert.equal(voucher.lineCount, 0);
});

test('vouchers service posts a balanced voucher successfully', async () => {
  let voucherFindFirstCalls = 0;
  const { service } = createService({
    prismaOverrides: {
      voucher: {
        findFirst: async () => {
          voucherFindFirstCalls += 1;

          return voucherFindFirstCalls === 1
            ? makeVoucherDetail({
                lines: [
                  makeVoucherLine({
                    id: 'line-1',
                    debitAmount: '100.00',
                    creditAmount: '0.00',
                  }),
                  makeVoucherLine({
                    id: 'line-2',
                    lineNumber: 2,
                    debitAmount: '0.00',
                    creditAmount: '100.00',
                  }),
                ],
              })
            : makeVoucherDetail({
                status: 'POSTED',
                postedById: 'user-1',
                postedAt: new Date('2026-03-16T01:00:00.000Z'),
                lines: [
                  makeVoucherLine({
                    id: 'line-1',
                    debitAmount: '100.00',
                    creditAmount: '0.00',
                  }),
                  makeVoucherLine({
                    id: 'line-2',
                    lineNumber: 2,
                    debitAmount: '0.00',
                    creditAmount: '100.00',
                  }),
                ],
              });
        },
        update: async () => ({
          id: 'voucher-1',
        }),
      },
    },
  });

  const voucher = await service.postVoucher('company-1', 'voucher-1', {
    id: 'user-1',
    email: 'accountant@example.com',
    companyId: 'company-1',
    companyName: 'Real Capita',
    companySlug: 'real-capita',
    roles: ['company_accountant'],
  });

  assert.equal(voucher.status, 'POSTED');
  assert.equal(voucher.totalDebit, '100.00');
  assert.equal(voucher.totalCredit, '100.00');
});

test('vouchers service surfaces the database-backed unbalanced posting error', async () => {
  const { service } = createService({
    prismaOverrides: {
      voucher: {
        findFirst: async () =>
          makeVoucherDetail({
            lines: [makeVoucherLine()],
          }),
      },
    },
    transactionOverrides: {
      voucher: {
        findFirst: async () => ({
          id: 'voucher-1',
          companyId: 'company-1',
          status: 'DRAFT',
        }),
        update: async () => {
          throw new Error(
            'ERROR: Voucher cannot be posted because total debit and total credit are not equal.',
          );
        },
      },
    },
  });

  await assert.rejects(
    () =>
      service.postVoucher('company-1', 'voucher-1', {
        id: 'user-1',
        email: 'accountant@example.com',
        companyId: 'company-1',
        companyName: 'Real Capita',
        companySlug: 'real-capita',
        roles: ['company_accountant'],
      }),
    BadRequestException,
  );
});

test('vouchers service surfaces the database-backed empty voucher posting error', async () => {
  const { service } = createService({
    prismaOverrides: {
      voucher: {
        findFirst: async () =>
          makeVoucherDetail({
            lines: [],
          }),
      },
    },
    transactionOverrides: {
      voucher: {
        findFirst: async () => ({
          id: 'voucher-1',
          companyId: 'company-1',
          status: 'DRAFT',
        }),
        update: async () => {
          throw new Error(
            'ERROR: Voucher cannot be posted without at least one line.',
          );
        },
      },
    },
  });

  await assert.rejects(
    () =>
      service.postVoucher('company-1', 'voucher-1', {
        id: 'user-1',
        email: 'accountant@example.com',
        companyId: 'company-1',
        companyName: 'Real Capita',
        companySlug: 'real-capita',
        roles: ['company_accountant'],
      }),
    BadRequestException,
  );
});

test('vouchers service rejects line mutation when the voucher is already posted', async () => {
  const { service } = createService({
    transactionOverrides: {
      voucher: {
        findFirst: async () => ({
          id: 'voucher-1',
          companyId: 'company-1',
          status: 'POSTED',
        }),
      },
    },
  });

  await assert.rejects(
    () =>
      service.addVoucherLine('company-1', 'voucher-1', {
        particularAccountId: 'particular-1',
        debitAmount: '100.00',
        creditAmount: '0.00',
      }),
    BadRequestException,
  );
});
