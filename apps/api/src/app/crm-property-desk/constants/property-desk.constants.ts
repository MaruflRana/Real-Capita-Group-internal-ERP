export const PROPERTY_DESK_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
export const PROPERTY_DESK_AMOUNT_PATTERN =
  /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/u;

export const PROPERTY_DESK_LEAD_STATUSES = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'CLOSED',
] as const;

export const PROPERTY_DESK_BOOKING_STATUSES = [
  'ACTIVE',
  'CONTRACTED',
] as const;

export const PROPERTY_DESK_DUE_STATES = ['due', 'overdue'] as const;
