import { BadRequestException } from '@nestjs/common';

export const normalizeOptionalString = (
  value?: string | null,
): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : null;
};

export const normalizeRequiredString = (value: string): string => value.trim();

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

export const parseDateTime = (value: string, fieldName: string): Date => {
  if (!value.includes('T')) {
    throw new BadRequestException(
      `${fieldName} must be a valid ISO 8601 date-time value.`,
    );
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new BadRequestException(
      `${fieldName} must be a valid ISO 8601 date-time value.`,
    );
  }

  return parsedDate;
};

export const buildCalendarDateRangeFilter = (
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

export const buildDateTimeDateRangeFilter = (
  dateFrom: string | undefined,
  dateTo: string | undefined,
  fieldNamePrefix: string,
) => {
  if (!dateFrom && !dateTo) {
    return undefined;
  }

  const startDate = dateFrom
    ? parseCalendarDate(dateFrom, `${fieldNamePrefix}From`)
    : undefined;
  const endDate = dateTo
    ? parseCalendarDate(dateTo, `${fieldNamePrefix}To`)
    : undefined;

  if (startDate && endDate && startDate > endDate) {
    throw new BadRequestException(
      `${fieldNamePrefix}From must be less than or equal to ${fieldNamePrefix}To.`,
    );
  }

  return {
    ...(startDate ? { gte: startDate } : {}),
    ...(endDate
      ? {
          lte: new Date(`${dateTo}T23:59:59.999Z`),
        }
      : {}),
  };
};
