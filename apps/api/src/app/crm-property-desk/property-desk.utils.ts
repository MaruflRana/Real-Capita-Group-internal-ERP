import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export const normalizeOptionalString = (
  value?: string | null,
): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : null;
};

export const normalizeRequiredString = (value: string): string =>
  value.trim();

export const normalizeEmail = (
  value?: string | null,
): string | null | undefined => {
  const normalizedValue = normalizeOptionalString(value);

  if (normalizedValue === undefined) {
    return undefined;
  }

  return normalizedValue?.toLowerCase() ?? null;
};

export const normalizePhone = (
  value?: string | null,
): string | null | undefined => {
  const normalizedValue = normalizeOptionalString(value);

  if (normalizedValue === undefined) {
    return undefined;
  }

  if (normalizedValue === null) {
    return null;
  }

  const digits = normalizedValue.replace(/\D/gu, '');
  const prefix = normalizedValue.startsWith('+') ? '+' : '';

  return digits.length > 0 ? `${prefix}${digits}` : null;
};

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

export const parseDecimalAmount = (
  value: string,
  fieldName: string,
): Prisma.Decimal => {
  const normalizedAmount = new Prisma.Decimal(value);

  if (normalizedAmount.lte(0)) {
    throw new BadRequestException(`${fieldName} must be greater than zero.`);
  }

  return normalizedAmount;
};

export const buildDateRangeFilter = (
  dateFrom: string | undefined,
  dateTo: string | undefined,
  fieldNamePrefix: string,
) => {
  if (!dateFrom && !dateTo) {
    return undefined;
  }

  const gte = dateFrom
    ? parseCalendarDate(dateFrom, `${fieldNamePrefix}From`)
    : undefined;
  const lte = dateTo
    ? parseCalendarDate(dateTo, `${fieldNamePrefix}To`)
    : undefined;

  if (gte && lte && gte > lte) {
    throw new BadRequestException(
      `${fieldNamePrefix}From must be less than or equal to ${fieldNamePrefix}To.`,
    );
  }

  return {
    ...(gte ? { gte } : {}),
    ...(lte ? { lte } : {}),
  };
};

export const getTodayDateString = (): string =>
  new Date().toISOString().slice(0, 10);
