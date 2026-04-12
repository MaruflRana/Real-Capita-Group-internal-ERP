export const resolveSortField = <T extends string>(
  requestedSortField: string | undefined,
  allowedSortFields: readonly T[],
  defaultSortField: T,
): T => {
  if (!requestedSortField) {
    return defaultSortField;
  }

  return allowedSortFields.includes(requestedSortField as T)
    ? (requestedSortField as T)
    : defaultSortField;
};
