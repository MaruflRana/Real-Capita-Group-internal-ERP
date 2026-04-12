type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number | boolean>;

export const buildQueryString = (
  query: object,
): string => {
  const searchParams = new URLSearchParams();

  for (const [key, rawValue] of Object.entries(
    query as Record<string, QueryValue>,
  )) {
    if (rawValue === undefined || rawValue === null || rawValue === '') {
      continue;
    }

    if (Array.isArray(rawValue)) {
      for (const value of rawValue) {
        searchParams.append(key, String(value));
      }

      continue;
    }

    searchParams.set(key, String(rawValue));
  }

  const serialized = searchParams.toString();

  return serialized.length > 0 ? `?${serialized}` : '';
};
