import { useTranslation } from '@nocobase/i18n/client';
import type { Column, Table } from '@tanstack/react-table';
import { Settings2Icon } from 'lucide-react';
import type { ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface DataTableViewOptionsProps<TData> {
  readonly table: Table<TData>;
  /** The translated name of a column in the menu; without it the menu lists raw column ids. */
  readonly getColumnLabel?: (column: Column<TData, unknown>) => string;
}

/** The "Toggle columns" menu. Its trigger shows from `lg` up only. */
export function DataTableViewOptions<TData>({
  table,
  getColumnLabel,
}: DataTableViewOptionsProps<TData>): ReactElement {
  const { t } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant='outline'
            size='sm'
            className='ml-auto hidden lg:flex'
          />
        }
      >
        <Settings2Icon />
        {t('dataTable.view')}
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-40'>
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t('dataTable.toggleColumns')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {table
            .getAllColumns()
            .filter(
              (column) =>
                typeof column.accessorFn !== 'undefined' && column.getCanHide(),
            )
            .map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {getColumnLabel ? getColumnLabel(column) : column.id}
              </DropdownMenuCheckboxItem>
            ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
