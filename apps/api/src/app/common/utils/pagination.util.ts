import type { PaginationMetaDto } from '../dto/pagination-meta.dto';

export interface PaginationInput {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMetaDto;
}

export const getPaginationSkip = (input: PaginationInput): number =>
  (input.page - 1) * input.pageSize;

export const buildPaginationMeta = (
  input: PaginationInput,
  total: number,
): PaginationMetaDto => ({
  page: input.page,
  pageSize: input.pageSize,
  total,
  totalPages: total === 0 ? 0 : Math.ceil(total / input.pageSize),
});
