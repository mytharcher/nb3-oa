import {
  type ColumnDef,
  getCoreRowModel,
  type PaginationState,
  type Row,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { cn } from 'cn';
import type { ReactElement, ReactNode } from 'react';

import { DataTablePagination } from './pagination.js';
import { DataTableView } from './table-view.js';

export interface DataTableServerProps<TData> {
  readonly columns: ColumnDef<TData, unknown>[];
  /** The rows of the current page, as the endpoint returned them. */
  readonly rows: TData[];
  /** The number of matching records on all pages, from the endpoint's `meta.total`. */
  readonly total: number;
  readonly getRowId: (row: TData, index: number) => string;
  /** The page read from the URL; `pageIndex` starts at 0. */
  readonly pagination: PaginationState;
  /** Writes the new page to the URL; the list request follows the URL. */
  readonly onPaginationChange: (pagination: PaginationState) => void;
  /** The sort read from the URL, which the endpoint applied. Omit for a table without sortable columns. */
  readonly sorting?: SortingState;
  /** Writes the new sort to the URL (and resets the page). */
  readonly onSortingChange?: (sorting: SortingState) => void;
  /** Shown when the page has no rows. */
  readonly emptyMessage: ReactNode;
  /** Rows-per-page choices; the page should accept only these from the URL. */
  readonly pageSizeOptions: readonly number[];
  readonly onRowClick?: (row: Row<TData>) => void;
  readonly className?: string;
}

const NO_SORTING: SortingState = [];

/**
 * The markup of `DataTable`, paginated and sorted by the server instead of the browser
 * (`example/server-table.md`'s `ProjectsServerTable`, made generic).
 */
export function DataTableServer<TData>({
  columns,
  rows,
  total,
  getRowId,
  pagination,
  onPaginationChange,
  sorting = NO_SORTING,
  onSortingChange,
  emptyMessage,
  pageSizeOptions,
  onRowClick,
  className,
}: DataTableServerProps<TData>): ReactElement {
  // TanStack Table returns a mutable instance the React Compiler cannot memoize.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rows,
    columns,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    // The server already paginated and sorted; the header only shows and changes the URL's sort.
    manualPagination: true,
    manualSorting: true,
    enableSorting: onSortingChange !== undefined,
    rowCount: total,
    state: { pagination, sorting },
    onPaginationChange: (updater) => {
      onPaginationChange(
        typeof updater === 'function' ? updater(pagination) : updater,
      );
    },
    onSortingChange: (updater) => {
      onSortingChange?.(
        typeof updater === 'function' ? updater(sorting) : updater,
      );
    },
  });

  return (
    <div className={cn('flex min-w-0 flex-col gap-4', className)}>
      <DataTableView
        table={table}
        emptyMessage={emptyMessage}
        onRowClick={onRowClick}
      />
      <DataTablePagination
        table={table}
        pageSizeOptions={pageSizeOptions}
        showSelectedCount={false}
      />
    </div>
  );
}
