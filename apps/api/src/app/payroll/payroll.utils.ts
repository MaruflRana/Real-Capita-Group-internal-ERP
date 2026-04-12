import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export const normalizeRequiredString = (value: string): string => value.trim();

export const normalizeOptionalString = (
  value?: string | null,
): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : null;
};

export const normalizeCode = (value: string): string =>
  normalizeRequiredString(value).toUpperCase();

export const parseCalendarDate = (value: string, fieldName: string): Date => {
  const parsedDate = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== value
  ) {
    throw new BadRequestException(
      `${fieldName} must be a valid calendar date.`,
    );
  }

  return parsedDate;
};

type PayrollAmountStrings = {
  basicAmount: string;
  allowanceAmount: string;
  deductionAmount: string;
  netAmount: string;
};

export const normalizePayrollAmounts = ({
  basicAmount,
  allowanceAmount,
  deductionAmount,
  netAmount,
}: PayrollAmountStrings) => {
  const normalizedBasicAmount = new Prisma.Decimal(basicAmount);
  const normalizedAllowanceAmount = new Prisma.Decimal(allowanceAmount);
  const normalizedDeductionAmount = new Prisma.Decimal(deductionAmount);
  const normalizedNetAmount = new Prisma.Decimal(netAmount);
  const grossAmount = normalizedBasicAmount.plus(normalizedAllowanceAmount);
  const expectedNetAmount = grossAmount.minus(normalizedDeductionAmount);

  if (grossAmount.lte(0)) {
    throw new BadRequestException(
      'Payroll amounts must include a positive gross amount.',
    );
  }

  if (normalizedDeductionAmount.gt(grossAmount)) {
    throw new BadRequestException(
      'deductionAmount cannot exceed basicAmount plus allowanceAmount.',
    );
  }

  if (!expectedNetAmount.eq(normalizedNetAmount)) {
    throw new BadRequestException(
      'netAmount must equal basicAmount plus allowanceAmount minus deductionAmount.',
    );
  }

  return {
    basicAmount: normalizedBasicAmount,
    allowanceAmount: normalizedAllowanceAmount,
    deductionAmount: normalizedDeductionAmount,
    netAmount: normalizedNetAmount,
    grossAmount,
  };
};

export const formatPayrollReference = (
  payrollYear: number,
  payrollMonth: number,
): string => `PAYROLL-${payrollYear}-${String(payrollMonth).padStart(2, '0')}`;
