export const ACCOUNTING_VOUCHER_TYPES = [
  'RECEIPT',
  'PAYMENT',
  'JOURNAL',
  'CONTRA',
] as const;

export const ACCOUNTING_VOUCHER_STATUSES = ['DRAFT', 'POSTED'] as const;

export const ACCOUNTING_NATURAL_BALANCES = ['DEBIT', 'CREDIT'] as const;

export type AccountingVoucherType =
  (typeof ACCOUNTING_VOUCHER_TYPES)[number];
export type AccountingVoucherStatus =
  (typeof ACCOUNTING_VOUCHER_STATUSES)[number];
export type AccountingNaturalBalance =
  (typeof ACCOUNTING_NATURAL_BALANCES)[number];

export const ACCOUNTING_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
export const ACCOUNTING_AMOUNT_PATTERN =
  /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/u;
