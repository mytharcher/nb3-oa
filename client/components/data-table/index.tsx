import { useTranslation } from '@nocobase/i18n/client';
import {
  type ColumnDef,
  type ColumnFiltersState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Row,
  type SortingState,
  type Table,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table';
import { cn } from 'cn';
import { type ReactElement, type ReactNode, useState } from 'react';

import { DataTablePagination } from './pagination.js';
import { DataTableView } from './table-view.js';

export { DataTableColumnHeader } from './column-header.js';
export { DataTablePagination } from './pagination.js';
export { DataTableServer } from './server-table.js';
export type { DataTableServerProps } from './server-table.js';
export { DataTableViewOptions } from './view-options.js';

export interface DataTableProps<TData> {
  /** Column definitions, created with `useMemo`. */
  readonly columns: ColumnDef<TData, unknown>[];
  readonly data: TData[];
  /** A stable row id, such as `(row) => row.id`, so selection follows records across reloads. */
  readonly getRowId?: (row: TData, index: number) => string;
  /** Shown when there are no rows. Defaults to "No results.". */
  readonly emptyMessage?: ReactNode;
  /** Rows per page. Defaults to 10. */
  readonly pageSize?: number;
  /** Rows-per-page choices. Defaults to 10, 20, 30, 40 and 50. */
  readonly pageSizeOptions?: readonly number[];
  /** `false` shows every row and no pagination bar. */
  readonly pagination?: boolean;
  /** Rendered above the table, with access to the table instance (browser-side filters, `DataTableViewOptions`, bulk actions). */
  readonly toolbar?: (table: Table<TData>) => ReactNode;
  /** Makes the whole row clickable. Do not combine with links, buttons or menus in the row. */
  readonly onRowClick?: (row: Row<TData>) => void;
  readonly className?: string;
  /** "N of M row(s) selected" in the pagination bar. Defaults to `true`; pass `false` without row selection. */
  readonly showSelectedCount?: boolean;
  /** The sort the table starts with, so the header shows the endpoint's default order. Added for the OA application. */
  readonly initialSorting?: SortingState;
  /** Return to page 1 when the data changes. Defaults to `true`. Added for the OA application. */
  readonly autoResetPageIndex?: boolean;
}

/** A list sorted and paginated in the browser, built from shadcn's Data Table guide. */
export function DataTable<TData>({
  columns,
  data,
  getRowId,
  emptyMessage,
  pageSize = 10,
  pageSizeOptions,
  pagination = true,
  toolbar,
  onRowClick,
  className,
  showSelectedCount = true,
  initialSorting = [],
  autoResetPageIndex = true,
}: DataTableProps<TData>): ReactElement {
  const { t } = useTranslation();
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>(initialSorting);

  // TanStack Table returns a mutable instance the React Compiler cannot memoize.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: { sorting, columnVisibility, rowSelection, columnFilters },
    initialState: {
      pagination: { pageIndex: 0, pageSize },
    },
    enableRowSelection: true,
    autoResetPageIndex,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(pagination ? { getPaginationRowModel: getPaginationRowModel() } : {}),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {toolbar ? toolbar(table) : null}
      <DataTableView
        table={table}
        emptyMessage={emptyMessage ?? t('dataTable.noResults')}
        onRowClick={onRowClick}
      />
      {pagination ? (
        <DataTablePagination
          table={table}
          pageSizeOptions={pageSizeOptions}
          showSelectedCount={showSelectedCount}
        />
      ) : null}
    </div>
  );
}
