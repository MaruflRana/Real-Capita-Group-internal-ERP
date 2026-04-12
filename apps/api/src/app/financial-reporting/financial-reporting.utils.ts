import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma, type AccountNature } from '@prisma/client';

export type DecimalLike =
  | Prisma.Decimal
  | string
  | number
  | null
  | undefined;

export const zeroDecimal = () => new Prisma.Decimal(0);

export const toDecimal = (value: DecimalLike): Prisma.Decimal => {
  if (value instanceof Prisma.Decimal) {
    return value;
  }

  if (value === null || value === undefined) {
    return zeroDecimal();
  }

  return new Prisma.Decimal(value);
};

export const formatDecimal = (value: DecimalLike): string =>
  toDecimal(value).toFixed(2);

export const parseReportDate = (value: string, fieldName: string): string => {
  const parsedDate = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== value
  ) {
    throw new BadRequestException(
      `${fieldName} must be a valid calendar date.`,
    );
  }

  return value;
};

export const assertValidDateRange = (
  dateFrom: string,
  dateTo: string,
): void => {
  if (dateFrom > dateTo) {
    throw new BadRequestException(
      'dateFrom must be less than or equal to dateTo.',
    );
  }
};

export const signedBalanceToDebitCredit = (amount: DecimalLike) => {
  const normalizedAmount = toDecimal(amount);

  return normalizedAmount.gte(0)
    ? {
        debit: normalizedAmount,
        credit: zeroDecimal(),
      }
    : {
        debit: zeroDecimal(),
        credit: normalizedAmount.abs(),
      };
};

export const totalsToSignedBalance = (
  debitAmount: DecimalLike,
  creditAmount: DecimalLike,
) => toDecimal(debitAmount).minus(toDecimal(creditAmount));

export const totalsToNaturalAmount = (
  naturalBalance: AccountNature | string,
  debitAmount: DecimalLike,
  creditAmount: DecimalLike,
) =>
  naturalBalance === 'DEBIT'
    ? toDecimal(debitAmount).minus(toDecimal(creditAmount))
    : toDecimal(creditAmount).minus(toDecimal(debitAmount));

export const isZeroAmount = (value: DecimalLike): boolean =>
  toDecimal(value).eq(0);

export const assertBalanced = (
  leftValue: DecimalLike,
  rightValue: DecimalLike,
  message: string,
): void => {
  const leftAmount = toDecimal(leftValue);
  const rightAmount = toDecimal(rightValue);

  if (!leftAmount.eq(rightAmount)) {
    throw new InternalServerErrorException({
      error: 'Internal Server Error',
      message,
      details: {
        leftAmount: leftAmount.toFixed(2),
        rightAmount: rightAmount.toFixed(2),
        difference: leftAmount.minus(rightAmount).toFixed(2),
      },
    });
  }
};
