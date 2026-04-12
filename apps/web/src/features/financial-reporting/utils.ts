import type {
  AccountingVoucherType,
  FinancialStatementSectionRecord,
  ParticularAccountRecord,
} from '../../lib/api/types';
import { formatAccountingAmount } from '../../lib/format';

export const REPORTING_OPTION_PAGE_SIZE = 100;

const toDateInputString = (value: Date): string =>
  value.toISOString().slice(0, 10);

export const getDefaultReportDateRange = () => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  return {
    dateFrom: toDateInputString(startOfMonth),
    dateTo: toDateInputString(today),
  };
};

export const getDefaultAsOfDate = () => toDateInputString(new Date());

export const isDateRangeInvalid = (dateFrom: string, dateTo: string): boolean =>
  Boolean(dateFrom && dateTo && dateFrom > dateTo);

export const formatVoucherTypeLabel = (
  voucherType: AccountingVoucherType,
): string => {
  switch (voucherType) {
    case 'RECEIPT':
      return 'Receipt';
    case 'PAYMENT':
      return 'Payment';
    case 'JOURNAL':
      return 'Journal';
    case 'CONTRA':
      return 'Contra';
  }
};

export const formatSignedAmount = (value: string): string => {
  const amount = Number(value);

  return formatAccountingAmount(amount);
};

export const formatRunningBalance = (debit: string, credit: string): string => {
  const debitAmount = Number(debit);
  const creditAmount = Number(credit);

  if (debitAmount > 0) {
    return `${formatAccountingAmount(debitAmount)} Dr`;
  }

  if (creditAmount > 0) {
    return `${formatAccountingAmount(creditAmount)} Cr`;
  }

  return '0.00';
};

export const getPostingAccountOptionLabel = (
  account: ParticularAccountRecord,
): string =>
  `${account.code} - ${account.name} (${account.ledgerAccountCode} / ${account.accountGroupCode})`;

export const getStatementSectionCountLabel = (
  sections: FinancialStatementSectionRecord[],
): string =>
  `${sections.length} section${sections.length === 1 ? '' : 's'} returned`;
