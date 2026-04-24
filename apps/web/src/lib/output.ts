import { apiRequestText } from './api/client';
import type { ListQueryParams, PaginatedResponse } from './api/types';

export type CsvValue =
  | string
  | number
  | boolean
  | null
  | undefined;

export interface CsvColumn<TRecord> {
  header: string;
  value: (record: TRecord) => CsvValue;
}

// Keep paginated CSV exports within the backend list-query contract.
const EXPORT_PAGE_SIZE = 100;

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

const sanitizeFileNameSegment = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const serializeCsv = <TRecord>(
  records: TRecord[],
  columns: CsvColumn<TRecord>[],
): string => {
  const headerRow = columns.map((column) => escapeCsvValue(column.header));
  const dataRows = records.map((record) =>
    columns.map((column) => escapeCsvValue(column.value(record))),
  );

  return [headerRow, ...dataRows].map((row) => row.join(',')).join('\r\n');
};

export const downloadTextFile = (
  content: string,
  fileName: string,
  mimeType = 'text/csv;charset=utf-8',
) => {
  if (typeof window === 'undefined') {
    return;
  }

  const blob = new Blob([`\uFEFF${content}`], { type: mimeType });
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = blobUrl;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};

export const buildExportFileName = (
  segments: string[],
  extension = 'csv',
): string => {
  const normalizedSegments = segments
    .map((segment) => sanitizeFileNameSegment(segment))
    .filter((segment) => segment.length > 0);

  return `${normalizedSegments.join('-')}.${extension}`;
};

export const getExportDateStamp = () =>
  new Date().toISOString().slice(0, 10);

export const downloadApiCsv = async (
  resource: string,
  fileName: string,
) => {
  const csvContent = await apiRequestText(resource, {
    headers: {
      Accept: 'text/csv',
    },
  });

  downloadTextFile(csvContent, fileName);
};

export const fetchAllPaginatedItems = async <
  TItem,
  TQuery extends ListQueryParams,
>(
  listFn: (
    companyId: string,
    query: TQuery,
  ) => Promise<PaginatedResponse<TItem>>,
  companyId: string,
  query: TQuery,
): Promise<TItem[]> => {
  const items: TItem[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const response = await listFn(companyId, {
      ...query,
      page,
      pageSize: EXPORT_PAGE_SIZE,
    });

    items.push(...response.items);
    totalPages = response.meta.totalPages;
    page += 1;
  }

  return items;
};

export const exportPaginatedCsv = async <
  TItem,
  TQuery extends ListQueryParams,
>({
  columns,
  companyId,
  fileName,
  listFn,
  query,
}: {
  columns: CsvColumn<TItem>[];
  companyId: string;
  fileName: string;
  listFn: (
    companyId: string,
    query: TQuery,
  ) => Promise<PaginatedResponse<TItem>>;
  query: TQuery;
}) => {
  const items = await fetchAllPaginatedItems(listFn, companyId, query);

  downloadTextFile(serializeCsv(items, columns), fileName);
};

export const printCurrentPage = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.print();
};
