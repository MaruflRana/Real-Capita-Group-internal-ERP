export const FIXED_UNIT_STATUSES = [
  {
    code: 'AVAILABLE',
    name: 'Available',
    sortOrder: 1,
  },
  {
    code: 'BOOKED',
    name: 'Booked',
    sortOrder: 2,
  },
  {
    code: 'ALLOTTED',
    name: 'Allotted',
    sortOrder: 3,
  },
  {
    code: 'SOLD',
    name: 'Sold',
    sortOrder: 4,
  },
  {
    code: 'TRANSFERRED',
    name: 'Transferred',
    sortOrder: 5,
  },
  {
    code: 'CANCELLED',
    name: 'Cancelled',
    sortOrder: 6,
  },
] as const;

export type FixedUnitStatusCode = (typeof FIXED_UNIT_STATUSES)[number]['code'];
