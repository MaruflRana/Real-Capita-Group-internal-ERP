import assert from 'node:assert/strict';
import test from 'node:test';

import { buildVoucherDetailCsv } from './voucher-exports';

test('voucher detail export keeps stable voucher and line columns', () => {
  const csv = buildVoucherDetailCsv({
    id: 'voucher-1',
    companyId: 'company-1',
    voucherType: 'JOURNAL',
    status: 'POSTED',
    voucherDate: '2026-01-31',
    description: 'Month-end adjustment',
    reference: 'JV-1001',
    createdById: 'user-1',
    postedById: 'user-2',
    postedAt: '2026-01-31T10:00:00.000Z',
    lineCount: 1,
    totalDebit: '10.00',
    totalCredit: '10.00',
    createdAt: '2026-01-31T09:00:00.000Z',
    updatedAt: '2026-01-31T10:00:00.000Z',
    lines: [
      {
        id: 'voucher-line-1',
        voucherId: 'voucher-1',
        lineNumber: 1,
        particularAccountId: 'posting-1',
        particularAccountCode: 'BANK_MAIN',
        particularAccountName: 'Main Bank',
        ledgerAccountId: 'ledger-1',
        ledgerAccountCode: 'CASH',
        ledgerAccountName: 'Cash',
        description: 'Cash movement',
        debitAmount: '10.00',
        creditAmount: '0.00',
        createdAt: '2026-01-31T09:00:00.000Z',
        updatedAt: '2026-01-31T10:00:00.000Z',
      },
    ],
  });

  assert.match(csv, /^Voucher ID,Reference,Voucher Type,Status,/u);
  assert.match(csv, /voucher-1,JV-1001,JOURNAL,POSTED,2026-01-31/u);
  assert.match(csv, /1,BANK_MAIN,Main Bank,CASH,Cash,Cash movement,10.00,0.00/u);
});
