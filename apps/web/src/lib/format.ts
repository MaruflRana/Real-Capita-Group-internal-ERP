export const formatDateTime = (
  value: string | null | undefined,
  emptyLabel = 'Never',
): string => {
  if (!value) {
    return emptyLabel;
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

export const formatDate = (
  value: string | null | undefined,
  emptyLabel = 'N/A',
): string => {
  if (!value) {
    return emptyLabel;
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
  }).format(new Date(value));
};

export const formatAccountingAmount = (
  value: number | string | null | undefined,
  emptyLabel = '0.00',
) => {
  if (value === null || value === undefined || value === '') {
    return emptyLabel;
  }

  const amount = typeof value === 'number' ? value : Number(value);

  if (Number.isNaN(amount)) {
    return emptyLabel;
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatName = (
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  fallback: string,
) => {
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

  return fullName.length > 0 ? fullName : fallback;
};
