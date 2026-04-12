export const PAYROLL_RUN_STATUSES = [
  'DRAFT',
  'FINALIZED',
  'CANCELLED',
  'POSTED',
] as const;

export type PayrollRunStatus = (typeof PAYROLL_RUN_STATUSES)[number];

export const PAYROLL_YEAR_MIN = 2000;
export const PAYROLL_YEAR_MAX = 9999;
