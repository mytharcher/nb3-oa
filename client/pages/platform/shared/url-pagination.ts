import type { PaginationState } from '@tanstack/react-table';

export const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;

/** The page in `?page=` and `?pageSize=`, accepting only the offered sizes. */
export function paginationOf(params: URLSearchParams): PaginationState {
  const page = Number(params.get('page'));
  const size = Number(params.get('pageSize'));
  return {
    pageIndex: Number.isInteger(page) && page > 1 ? page - 1 : 0,
    pageSize: (PAGE_SIZE_OPTIONS as readonly number[]).includes(size)
      ? size
      : PAGE_SIZE_OPTIONS[0],
  };
}

/** Writes a page to the parameters, leaving the defaults out of the URL. */
export function writePagination(
  params: URLSearchParams,
  pagination: PaginationState,
): void {
  if (pagination.pageIndex > 0)
    params.set('page', String(pagination.pageIndex + 1));
  else params.delete('page');
  if (pagination.pageSize !== PAGE_SIZE_OPTIONS[0])
    params.set('pageSize', String(pagination.pageSize));
  else params.delete('pageSize');
}
