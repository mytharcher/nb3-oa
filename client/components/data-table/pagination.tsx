import { useTranslation } from '@nocobase/i18n/client';
import type { Table } from '@tanstack/react-table';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from 'lucide-react';
import type { ReactElement } from 'react';

import { Button } from '#components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';

const DEFAULT_PAGE_SIZE_OPTIONS: readonly number[] = [10, 20, 30, 40, 50];

export interface DataTablePaginationProps<TData> {
  readonly table: Table<TData>;
  /** The selectable rows-per-page values. Defaults to 10, 20, 30, 40 and 50. */
  readonly pageSizeOptions?: readonly number[];
  /** "N of M row(s) selected"; pass `false` on a table without row selection. Defaults to `true`. */
  readonly showSelectedCount?: boolean;
}

/** The pagination bar below a table. Reads the page and page count from the table instance, so it serves browser- and server-paginated tables alike. */
export function DataTablePagination<TData>({
  table,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  showSelectedCount = true,
}: DataTablePaginationProps<TData>): ReactElement {
  const { t } = useTranslation();
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = Math.max(1, table.getPageCount());
  const sizeItems = pageSizeOptions.map((size) => ({
    value: String(size),
    label: String(size),
  }));

  return (
    <div
      data-slot='table-pagination'
      className='flex min-w-0 flex-col gap-3 px-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between'
    >
      {showSelectedCount ? (
        <div className='text-sm text-muted-foreground sm:flex-1'>
          {t('dataTable.selectedCount', {
            selected: table.getFilteredSelectedRowModel().rows.length,
            total: table.getFilteredRowModel().rows.length,
          })}
        </div>
      ) : null}
      <div className='grid min-w-0 grid-cols-[1fr_auto] items-center gap-3 sm:ml-auto sm:flex sm:flex-wrap sm:gap-x-6 lg:gap-x-8'>
        <div className='flex items-center gap-2'>
          <p className='text-sm font-medium'>{t('dataTable.rowsPerPage')}</p>
          <Select
            items={sizeItems}
            value={String(pageSize)}
            onValueChange={(value) => {
              if (value !== null) table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger
              size='sm'
              className='w-18'
              aria-label={t('dataTable.rowsPerPage')}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent side='top' className='w-auto min-w-(--anchor-width)'>
              <SelectGroup>
                {sizeItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className='order-3 col-span-2 flex items-center justify-center text-sm font-medium sm:order-none'>
          {t('dataTable.pageOf', { page: pageIndex + 1, pageCount })}
        </div>
        <div className='flex items-center justify-end gap-2'>
          <Button
            variant='outline'
            size='icon-sm'
            className='hidden lg:flex'
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            aria-label={t('dataTable.firstPage')}
          >
            <ChevronsLeftIcon />
          </Button>
          <Button
            variant='outline'
            size='icon-sm'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label={t('dataTable.previousPage')}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant='outline'
            size='icon-sm'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label={t('dataTable.nextPage')}
          >
            <ChevronRightIcon />
          </Button>
          <Button
            variant='outline'
            size='icon-sm'
            className='hidden lg:flex'
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            aria-label={t('dataTable.lastPage')}
          >
            <ChevronsRightIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
