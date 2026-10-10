import {
  flexRender,
  type Row,
  type Table as TanstackTable,
} from '@tanstack/react-table';
import type { ReactElement, ReactNode } from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface DataTableViewProps<TData> {
  readonly table: TanstackTable<TData>;
  readonly emptyMessage: ReactNode;
  readonly onRowClick?: (row: Row<TData>) => void;
}

/** The bordered table markup shared by `DataTable` and `DataTableServer`. */
export function DataTableView<TData>({
  table,
  emptyMessage,
  onRowClick,
}: DataTableViewProps<TData>): ReactElement {
  const rows = table.getRowModel().rows;
  return (
    <div className='overflow-hidden rounded-lg border'>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} colSpan={header.colSpan}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? 'selected' : undefined}
                className={onRowClick ? 'cursor-pointer' : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={table.getVisibleLeafColumns().length || 1}
                className='h-24 text-center text-muted-foreground'
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
