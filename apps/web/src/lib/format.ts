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

export const formatDateInputValue = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const formatBDT = (
  value: number | string | null | undefined,
  options?: { compact?: boolean },
  emptyLabel = '0.00',
) => {
  if (value === null || value === undefined || value === '') {
    return emptyLabel;
  }

  const amount = typeof value === 'number' ? value : Number(value);

  if (Number.isNaN(amount)) {
    return emptyLabel;
  }

  if (options?.compact) {
    if (amount >= 10_000_000) {
      const crores = amount / 10_000_000;
      return `৳${crores.toFixed(1)}C`;
    }
    if (amount >= 100_000) {
      const lakhs = amount / 100_000;
      return `৳${lakhs.toFixed(1)}L`;
    }
    if (amount >= 1_000) {
      const thousands = amount / 1_000;
      return `৳${thousands.toFixed(1)}K`;
    }
    return `৳${amount.toFixed(0)}`;
  }

  return `৳${new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
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

  return `৳${new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
};

export const formatName = (
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  fallback: string,
) => {
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

  return fullName.length > 0 ? fullName : fallback;
};
