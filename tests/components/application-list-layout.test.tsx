import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { createMemoryRouter, Link, Outlet, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { ApplicationToolbar } from '#components/application-toolbar';
import { ApplicationTableSkeleton } from '#components/application-table-skeleton';
import { DataTableServer } from '#components/data-table';
import { RouteDialog } from '#components/route-dialog';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { useRouteOverlay } from '#components/use-route-overlay';
import enUS from '../../client/locales/en-US.js';

const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
function Cancel() {
  const { close } = useRouteOverlay();
  return (
    <Button variant='outline' onClick={() => void close()}>
      Cancel
    </Button>
  );
}
function EmptyRequestList() {
  return (
    <>
      <ApplicationToolbar
        actions={
          <Button nativeButton={false} render={<Link to='new?status=draft' />}>
            New request
          </Button>
        }
      >
        <Input aria-label='Search requests' placeholder='Search requests' />
      </ApplicationToolbar>
      <DataTableServer
        columns={[{ accessorKey: 'number', header: 'Reference' }]}
        rows={[]}
        total={0}
        getRowId={(row: { id: string }) => row.id}
        pagination={{ pageIndex: 0, pageSize: 20 }}
        onPaginationChange={() => {}}
        pageSizeOptions={[20]}
        emptyMessage='No requests yet'
      />
      <Outlet />
    </>
  );
}
describe('application list layout', () => {
  it('opens creation from the empty table toolbar and restores source filters and focus after closing', async () => {
    const router = createMemoryRouter(
      [
        {
          path: '/requests',
          element: <EmptyRequestList />,
          children: [
            {
              path: 'new',
              element: (
                <RouteDialog title='New request' footer={<Cancel />}>
                  <Input aria-label='Purpose' />
                </RouteDialog>
              ),
            },
          ],
        },
      ],
      { initialEntries: ['/requests?status=draft'] },
    );
    render(
      <TestI18nProvider runtime={runtime}>
        <RouterProvider router={router} />
      </TestI18nProvider>,
    );
    const launch = screen.getByRole('button', { name: 'New request' });
    expect(
      within(
        launch.closest('[data-slot=application-actions]') as HTMLElement,
      ).getByRole('button', { name: 'New request' }),
    ).toBe(launch);
    expect(
      screen.getByRole('columnheader', { name: 'Reference' }),
    ).toBeInTheDocument();
    await userEvent.setup().click(launch);
    const dialog = await screen.findByRole('dialog', { name: 'New request' });
    expect(within(dialog).getByLabelText('Purpose')).toBeInTheDocument();
    await userEvent
      .setup()
      .click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/requests'),
    );
    expect(router.state.location.search).toBe('?status=draft');
    await waitFor(() => expect(launch).toHaveFocus());
  });
  it('exposes a translated busy table while data loads', () => {
    render(
      <TestI18nProvider runtime={runtime}>
        <ApplicationTableSkeleton columns={7} />
      </TestI18nProvider>,
    );
    const table = screen.getByRole('table', { name: 'Loading' });
    expect(table).toHaveAttribute('aria-busy', 'true');
    expect(within(table).getAllByRole('columnheader')).toHaveLength(7);
    expect(table.querySelectorAll('tbody tr')).toHaveLength(5);
  });
});
