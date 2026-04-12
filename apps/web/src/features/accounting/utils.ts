import type {
  AccountingVoucherStatus,
  AccountingVoucherType,
  ParticularAccountRecord,
  VoucherLineRecord,
} from '../../lib/api/types';

export const formatVoucherTypeLabel = (
  voucherType: AccountingVoucherType,
) => {
  switch (voucherType) {
    case 'RECEIPT':
      return 'Receipt';
    case 'PAYMENT':
      return 'Payment';
    case 'JOURNAL':
      return 'Journal';
    case 'CONTRA':
      return 'Contra';
    default:
      return voucherType;
  }
};

export const formatVoucherStatusLabel = (
  status: AccountingVoucherStatus,
) => {
  switch (status) {
    case 'DRAFT':
      return 'Draft';
    case 'POSTED':
      return 'Posted';
    default:
      return status;
  }
};

export const parseAccountingAmount = (
  value: number | string | null | undefined,
) => {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  const parsed = typeof value === 'number' ? value : Number(value);

  return Number.isNaN(parsed) ? 0 : parsed;
};

export const calculateVoucherTotals = (
  lines: Array<{
    debitAmount: number | string;
    creditAmount: number | string;
  }>,
) => {
  const totals = lines.reduce(
    (current, line) => ({
      totalDebit: current.totalDebit + parseAccountingAmount(line.debitAmount),
      totalCredit:
        current.totalCredit + parseAccountingAmount(line.creditAmount),
    }),
    {
      totalDebit: 0,
      totalCredit: 0,
    },
  );

  const difference = totals.totalDebit - totals.totalCredit;

  return {
    ...totals,
    difference,
    isBalanced: Math.abs(difference) < 0.0001,
  };
};

export const buildVoucherTotalsPreview = (
  lines: VoucherLineRecord[],
  options: {
    voucherLineId?: string | null;
    debitAmount: string;
    creditAmount: string;
  },
) => {
  const nextLines = lines
    .filter((line) => line.id !== options.voucherLineId)
    .concat({
      id: options.voucherLineId ?? 'draft-line',
      debitAmount: options.debitAmount,
      creditAmount: options.creditAmount,
    } as VoucherLineRecord);

  return calculateVoucherTotals(nextLines);
};

export const buildPostingAccountOptionLabel = (
  account: ParticularAccountRecord,
) =>
  `${account.code} · ${account.name} (${account.ledgerAccountCode} / ${account.accountGroupCode})`;
