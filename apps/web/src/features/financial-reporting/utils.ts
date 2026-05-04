import type {
  AccountingVoucherType,
  FinancialStatementSectionRecord,
  ParticularAccountRecord,
} from '../../lib/api/types';
import { formatAccountingAmount, formatDateInputValue } from '../../lib/format';
import { buildExportFileName } from '../../lib/output';

export const REPORTING_OPTION_PAGE_SIZE = 100;

export const getDefaultReportDateRange = () => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  return {
    dateFrom: formatDateInputValue(startOfMonth),
    dateTo: formatDateInputValue(today),
  };
};

export const getDefaultAsOfDate = () => formatDateInputValue(new Date());

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

export const formatReportDateRangeLabel = (
  dateFrom: string,
  dateTo: string,
) => `${dateFrom} to ${dateTo}`;

export const buildFinancialReportCsvFileName = ({
  companySlug,
  reportSlug,
  segments,
}: {
  companySlug: string;
  reportSlug: string;
  segments: string[];
}) =>
  buildExportFileName([companySlug, reportSlug, ...segments], 'csv');
