type CsvValue = string | number | boolean | null | undefined;

const escapeCsvValue = (value: CsvValue): string => {
  const normalizedValue =
    value === null || value === undefined ? '' : String(value);

  if (
    normalizedValue.includes(',') ||
    normalizedValue.includes('"') ||
    normalizedValue.includes('\n') ||
    normalizedValue.includes('\r')
  ) {
    return `"${normalizedValue.replace(/"/g, '""')}"`;
  }

  return normalizedValue;
};

export const createCsvString = (
  headers: string[],
  rows: CsvValue[][],
): string =>
  [headers, ...rows]
    .map((row) => row.map((value) => escapeCsvValue(value)).join(','))
    .join('\r\n');
