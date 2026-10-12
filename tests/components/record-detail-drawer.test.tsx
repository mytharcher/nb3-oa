import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { useState, type ReactNode } from 'react';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { expect, it } from 'vitest';
import { RecordDetailDrawer } from '../../client/components/record-detail-drawer.js';
import { RouteFormPage } from '../../client/components/route-form-page.js';
import { PageContainer } from '../../client/components/page-container.js';
import { PageHeader } from '../../client/components/page-header.js';
import { BackButton } from '../../client/components/back-button.js';
import enUS from '../../client/locales/en-US.js';

const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
function I18n({ children }: { children: ReactNode }) {
  return <TestI18nProvider runtime={runtime}>{children}</TestI18nProvider>;
}
function Form({
  presentation = 'drawer',
}: {
  presentation?: 'drawer' | 'page';
}) {
  const [saved, setSaved] = useState(false);
  return (
    <RouteFormPage title='Edit order' presentation={presentation}>
      <PageContainer>
        <BackButton />
        <PageHeader
          title='Edit order'
          actions={
            <button type='submit' form='order-form'>
              Save
            </button>
          }
        />
        <form
          id='order-form'
          onSubmit={(event) => {
            event.preventDefault();
            setSaved(true);
          }}
        >
          <label>
            Reason
            <input aria-label='Reason' defaultValue='Original' />
          </label>
          {saved ? <p>Saved</p> : null}
        </form>
      </PageContainer>
    </RouteFormPage>
  );
}
function open(path: string, busy = false) {
  const router = createMemoryRouter(
    [
      {
        path: '/orders',
        element: (
          <>
            <h1>Orders</h1>
            <Outlet />
          </>
        ),
        children: [
          { path: 'new', element: <Form /> },
          { path: 'configure', element: <Form presentation='page' /> },
          {
            path: ':id',
            element: (
              <RecordDetailDrawer
                title='Order 42'
                beforeClose={() => !busy}
                footer={<button>Submit</button>}
              >
                <p>Draft reason</p>
                <Outlet />
              </RecordDetailDrawer>
            ),
            children: [
              {
                path: 'history',
                element: (
                  <>
                    <p>Order history</p>
                    <Outlet />
                  </>
                ),
                children: [{ path: 'edit', element: <Form /> }],
              },
            ],
          },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />, { wrapper: I18n });
  return router;
}
it('shows record actions in a fixed drawer footer and closes a nondefault tab to its source', async () => {
  const router = open('/orders/42/history?q=Alice#rows');
  const drawer = await screen.findByRole('dialog', { name: 'Order 42' });
  expect(within(drawer).getByText('Draft reason')).toBeVisible();
  expect(
    within(drawer)
      .getByRole('button', { name: 'Submit' })
      .closest('[data-slot=route-overlay-footer]'),
  ).not.toBeNull();
  await userEvent.click(within(drawer).getByRole('button', { name: 'Close' }));
  await waitFor(() => expect(router.state.location.pathname).toBe('/orders'));
  expect(router.state.location.search).toBe('?q=Alice');
  expect(router.state.location.hash).toBe('#rows');
});
it('keeps a complex edit inside a child drawer and closes each layer to the matching view', async () => {
  const router = open('/orders/42/history/edit?q=Alice#rows');
  const form = await screen.findByRole('dialog', { name: 'Edit order' });
  expect(
    within(form).getAllByRole('heading', { name: 'Edit order' }),
  ).toHaveLength(1);
  expect(within(form).queryByRole('link', { name: 'Back' })).toBeNull();
  const reason = within(form).getByRole('textbox', { name: 'Reason' });
  await userEvent.type(reason, ' amended');
  expect(reason).toHaveValue('Original amended');
  await userEvent.click(within(form).getByRole('button', { name: 'Close' }));
  await waitFor(() =>
    expect(router.state.location.pathname).toBe('/orders/42/history'),
  );
  const detail = await screen.findByRole('dialog', { name: 'Order 42' });
  expect(within(detail).getByText('Order history')).toBeVisible();
  await userEvent.click(within(detail).getByRole('button', { name: 'Close' }));
  await waitFor(() => expect(router.state.location.pathname).toBe('/orders'));
});
it('keeps the record open during its write', async () => {
  const router = open('/orders/42', true);
  const drawer = await screen.findByRole('dialog', { name: 'Order 42' });
  await userEvent.click(within(drawer).getByRole('button', { name: 'Close' }));
  expect(router.state.location.pathname).toBe('/orders/42');
  expect(drawer).toBeVisible();
});
it('keeps configuration forms at their list entry in the existing page presentation', async () => {
  open('/orders/configure');
  expect(
    await screen.findByRole('heading', { name: 'Edit order' }),
  ).toBeVisible();
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.getByRole('link', { name: 'Back' })).toBeVisible();
});

it('opens a root create form as a drawer and keeps its native submit action in the fixed footer', async () => {
  const router = open('/orders/new?q=leave#list');
  const drawer = await screen.findByRole('dialog', { name: 'Edit order' });
  expect(
    within(drawer).getAllByRole('heading', { name: 'Edit order' }),
  ).toHaveLength(1);
  const save = within(drawer).getByRole('button', { name: 'Save' });
  expect(save.closest('[data-slot=route-overlay-footer]')).not.toBeNull();
  await userEvent.click(save);
  expect(within(drawer).getByText('Saved')).toBeVisible();
  await userEvent.click(within(drawer).getByRole('button', { name: 'Close' }));
  await waitFor(() => expect(router.state.location.pathname).toBe('/orders'));
  expect(router.state.location.search).toBe('?q=leave');
  expect(router.state.location.hash).toBe('#list');
});
