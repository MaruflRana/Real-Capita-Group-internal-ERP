import { formatAccountingAmount } from '../../lib/format';
import type {
  CostCenterRecord,
  EmployeeRecord,
  ParticularAccountRecord,
  PayrollRunRecord,
  PayrollRunStatus,
  ProjectRecord,
} from '../../lib/api/types';

export const PAGE_SIZE = 10;
export const OPTION_PAGE_SIZE = 100;
export const RUN_LINE_PAGE_SIZE = 20;

export const PAYROLL_MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
] as const;

export const normalizeOptionalText = (value: string | undefined) => {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
};

export const normalizeOptionalTextToNull = (value: string | undefined) =>
  normalizeOptionalText(value) ?? null;

export const normalizeNullableId = (value: string | undefined) => {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
};

export const getStatusQueryValue = (
  value: 'all' | 'active' | 'inactive',
): boolean | undefined => {
  if (value === 'all') {
    return undefined;
  }

  return value === 'active';
};

export const formatPayrollRunStatusLabel = (status: PayrollRunStatus) => {
  switch (status) {
    case 'DRAFT':
      return 'Draft';
    case 'FINALIZED':
      return 'Finalized';
    case 'CANCELLED':
      return 'Cancelled';
    case 'POSTED':
      return 'Posted';
    default:
      return status;
  }
};

export const getProjectLabel = (
  project: Pick<ProjectRecord, 'code' | 'name'>,
) => `${project.code} - ${project.name}`;

export const getCostCenterLabel = (
  costCenter: Pick<CostCenterRecord, 'code' | 'name'>,
) => `${costCenter.code} - ${costCenter.name}`;

export const getEmployeeLabel = (
  employee: Pick<EmployeeRecord, 'employeeCode' | 'fullName'>,
) => `${employee.employeeCode} - ${employee.fullName}`;

export const getParticularAccountLabel = (
  account: Pick<
    ParticularAccountRecord,
    'code' | 'name' | 'ledgerAccountCode' | 'accountGroupCode'
  >,
) =>
  `${account.code} - ${account.name} | ${account.ledgerAccountCode} / ${account.accountGroupCode}`;

export const formatPayrollPeriodLabel = (
  payrollYear: number,
  payrollMonth: number,
) => {
  const monthLabel =
    PAYROLL_MONTH_OPTIONS.find((option) => option.value === payrollMonth)?.label ??
    `Month ${payrollMonth}`;

  return `${monthLabel} ${payrollYear}`;
};

export const getPayrollRunScopeLabel = (
  payrollRun: Pick<
    PayrollRunRecord,
    'projectCode' | 'projectName' | 'costCenterCode' | 'costCenterName'
  >,
) => {
  const values = [
    payrollRun.projectCode && payrollRun.projectName
      ? `${payrollRun.projectCode} - ${payrollRun.projectName}`
      : null,
    payrollRun.costCenterCode && payrollRun.costCenterName
      ? `${payrollRun.costCenterCode} - ${payrollRun.costCenterName}`
      : null,
  ].filter((value): value is string => Boolean(value));

  return values.length > 0 ? values.join(' | ') : 'Company-wide payroll scope';
};

export const getPayrollVoucherReference = (
  payrollRun: Pick<
    PayrollRunRecord,
    'postedVoucherReference' | 'postedVoucherDate'
  >,
) =>
  payrollRun.postedVoucherReference
    ? [
        payrollRun.postedVoucherReference,
        payrollRun.postedVoucherDate ? `Dated ${payrollRun.postedVoucherDate}` : null,
      ]
        .filter(Boolean)
        .join(' | ')
    : 'Not posted';

export const parseAmount = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  const parsed = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
};

export const toFixedAmountString = (value: string | number | null | undefined) =>
  parseAmount(value).toFixed(2);

export const buildPayrollAmountPreview = ({
  basicAmount,
  allowanceAmount,
  deductionAmount,
}: {
  basicAmount: string | number | null | undefined;
  allowanceAmount: string | number | null | undefined;
  deductionAmount: string | number | null | undefined;
}) => {
  const basic = parseAmount(basicAmount);
  const allowance = parseAmount(allowanceAmount);
  const deduction = parseAmount(deductionAmount);
  const gross = basic + allowance;
  const net = gross - deduction;

  return {
    basic,
    allowance,
    deduction,
    gross,
    net,
    grossLabel: formatAccountingAmount(gross),
    netLabel: formatAccountingAmount(net),
    deductionLabel: formatAccountingAmount(deduction),
    hasPositiveGross: gross > 0,
    hasExcessDeduction: deduction > gross,
  };
};

export const getPayrollReferencePreview = (
  payrollYear: number,
  payrollMonth: number,
) => `PAYROLL-${payrollYear}-${String(payrollMonth).padStart(2, '0')}`;

export const buildPayrollYearOptions = (year: number) =>
  [year - 1, year, year + 1, year + 2].filter(
    (value, index, values) => values.indexOf(value) === index,
  );
