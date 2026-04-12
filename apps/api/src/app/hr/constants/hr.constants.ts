export const HR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;

export const HR_ATTENDANCE_LOG_DIRECTIONS = [
  'IN',
  'OUT',
  'UNKNOWN',
] as const;

export const HR_LEAVE_REQUEST_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
] as const;
