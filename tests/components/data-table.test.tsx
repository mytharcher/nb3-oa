import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import type { ColumnDef } from '@tanstack/react-table';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  DataTable,
  DataTableColumnHeader,
  DataTableServer,
} from '@/components/data-table';

import enUS from '../../client/locales/en-US.js';

const runtime = await createTestI18nRuntime({
  locale: 'en-US',
  application: { namespace: '@nocobase/app-template-default', resources: enUS },
});

function I18n({ children }: { readonly children: ReactNode }): ReactElement {
  return <TestI18nProvider runtime={runtime}>{children}</TestI18nProvider>;
}

interface Item {
  readonly id: string;
  readonly name: string;
  readonly amount: number;
}

const items: Item[] = Array.from({ length: 25 }, (_, index) => ({
  id: `item-${index + 1}`,
  name: `Item ${String(index + 1).padStart(2, '0')}`,
  amount: (index * 7) % 25,
}));

const columns: ColumnDef<Item, unknown>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Amount' />
    ),
    enableHiding: false,
  },
];

function bodyRows(): HTMLElement[] {
  const [, body] = screen.getAllByRole('rowgroup');
  return within(body!).getAllByRole('row');
}

describe('DataTable', () => {
  it('paginates in the browser', async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        data={items}
        getRowId={(row) => row.id}
        showSelectedCount={false}
      />,
      { wrapper: I18n },
    );

    expect(bodyRows()).toHaveLength(10);
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Go to previous page' }),
    ).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Go to next page' }));
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
    expect(screen.getByText('Item 11')).toBeInTheDocument();
    expect(screen.queryByText('Item 01')).not.toBeInTheDocument();
  });

  it('sorts through the column header menu', async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        data={items}
        pagination={false}
        showSelectedCount={false}
      />,
      { wrapper: I18n },
    );

    await user.click(screen.getByRole('button', { name: 'Amount' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Desc' }));
    expect(within(bodyRows()[0]!).getByText('24')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Amount' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Asc' }));
    expect(within(bodyRows()[0]!).getByText('0')).toBeInTheDocument();
  });

  it('starts from initialSorting', () => {
    render(
      <DataTable
        columns={columns}
        data={items}
        pagination={false}
        initialSorting={[{ id: 'amount', desc: true }]}
      />,
      { wrapper: I18n },
    );
    expect(within(bodyRows()[0]!).getByText('24')).toBeInTheDocument();
    expect(bodyRows()).toHaveLength(25);
    expect(screen.queryByText(/Page \d/u)).not.toBeInTheDocument();
  });

  it('shows the empty message', () => {
    const { rerender } = render(<DataTable columns={columns} data={[]} />, {
      wrapper: I18n,
    });
    expect(screen.getByText('No results.')).toBeInTheDocument();
    expect(screen.getByText('0 of 0 row(s) selected.')).toBeInTheDocument();

    rerender(
      <DataTable columns={columns} data={[]} emptyMessage='Nothing here' />,
    );
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });
});

describe('DataTableServer', () => {
  it('reports page and sort changes instead of applying them', async () => {
    const user = userEvent.setup();
    const onPaginationChange = vi.fn();
    const onSortingChange = vi.fn();
    render(
      <DataTableServer
        columns={columns}
        rows={items.slice(10, 20)}
        total={95}
        getRowId={(row) => row.id}
        pagination={{ pageIndex: 1, pageSize: 10 }}
        onPaginationChange={onPaginationChange}
        sorting={[{ id: 'amount', desc: true }]}
        onSortingChange={onSortingChange}
        emptyMessage='None'
        pageSizeOptions={[10, 20, 50]}
      />,
      { wrapper: I18n },
    );

    expect(screen.getByText('Page 2 of 10')).toBeInTheDocument();
    // The rows stay in the server's order.
    expect(within(bodyRows()[0]!).getByText('Item 11')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Go to next page' }));
    expect(onPaginationChange).toHaveBeenCalledWith({
      pageIndex: 2,
      pageSize: 10,
    });

    await user.click(screen.getByRole('button', { name: 'Amount' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Asc' }));
    expect(onSortingChange).toHaveBeenCalledWith([
      { id: 'amount', desc: false },
    ]);
  });

  it('shows the empty message on an empty page', () => {
    render(
      <DataTableServer
        columns={columns}
        rows={[]}
        total={0}
        getRowId={(row) => row.id}
        pagination={{ pageIndex: 0, pageSize: 10 }}
        onPaginationChange={() => {}}
        emptyMessage='No records match'
        pageSizeOptions={[10]}
      />,
      { wrapper: I18n },
    );
    expect(screen.getByText('No records match')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
  });
});
