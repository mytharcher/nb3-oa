import userEvent from '@testing-library/user-event';
import { NavigationGuardProvider } from '@nocobase/app-client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import enUS from '../../../client/locales/en-US.js';
import ReimbursementsPage from '../../../client/pages/reimbursement-requests/index.js';
const { api, permission } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  permission: { can: true },
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: 'owner' } } }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useAuthorizationRevision: () => 0,
  useCan: () => ({ can: permission.can, isPending: false }),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
function row(index: number) {
  return {
    id: `r${index}`,
    number: `R-${index}`,
    applicant: { id: 'owner', name: 'Owner' },
    reason: `Evidence ${index}`,
    totalCents: index,
    status: 'draft',
    createdAt: new Date(Date.UTC(2026, 9, 10, 0, index)).toISOString(),
  };
}
function show(path = '/reimbursementRequests') {
  const router = createMemoryRouter(
    [
      {
        path: '/reimbursementRequests',
        element: (
          <NavigationGuardProvider>
            <ReimbursementsPage />
          </NavigationGuardProvider>
        ),
        children: [{ path: ':requestId', element: <div>Record opened</div> }],
      },
    ],
    { initialEntries: [path] },
  );
  render(
    <TestI18nProvider runtime={runtime}>
      <RouterProvider router={router} />
    </TestI18nProvider>,
  );
  return router;
}
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  permission.can = true;
});
describe('reimbursement list complete-result navigation', () => {
  it('keeps one toolbar create action and table headers in the empty state', async () => {
    api.request.mockResolvedValue({ data: [] });
    const first = show();
    await screen.findByText('No reimbursements yet');
    expect(
      screen.getAllByRole('button', { name: 'New reimbursement' }),
    ).toHaveLength(1);
    expect(
      screen
        .getByRole('button', { name: 'New reimbursement' })
        .closest('[data-slot=application-actions]'),
    ).not.toBeNull();
    expect(screen.getByRole('table')).toBeInTheDocument();
    first.dispose();
  });
  it('filters the full collection before pagination and preserves URL conditions when opening a record', async () => {
    permission.can = false;
    api.request.mockResolvedValue({
      data: Array.from({ length: 101 }, (_, index) => row(index)),
    });
    const router = show(
      '/reimbursementRequests?search=Evidence+100&page=999&sort=totalCents&order=asc',
    );
    await screen.findByRole('link', { name: 'R-100' });
    await waitFor(() =>
      expect(router.state.location.search).toContain('page=1'),
    );
    expect(
      screen.queryByRole('button', { name: 'New reimbursement' }),
    ).toBeNull();
    const selected = screen.getByRole('link', { name: 'R-100' });
    expect(selected.isConnected).toBe(true);
    expect(selected.getAttribute('href')).toContain(
      '/reimbursementRequests/r100?search=Evidence+100',
    );
    await userEvent.setup().click(selected);
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(
        '/reimbursementRequests/r100',
      ),
    );
    await screen.findByText('Record opened');
    expect(router.state.location.pathname).toBe('/reimbursementRequests/r100');
    expect(router.state.location.search).toContain('search=Evidence+100');
  });
});

it('does not expose edit for a view-only draft and requests offers only after opening its menu', async () => {
  api.request.mockImplementation(({ path }: { path: string }) =>
    Promise.resolve(
      path === 'reimbursementRequests/r1'
        ? { data: { view: { available: [] } } }
        : { data: [row(1)] },
    ),
  );
  show();
  await screen.findByRole('link', { name: 'R-1' });
  expect(
    api.request.mock.calls.some(
      ([arg]) => arg.path === 'reimbursementRequests/r1',
    ),
  ).toBe(false);
  await userEvent.setup().click(screen.getByRole('button', { name: /R-1/ }));
  await screen.findByRole('menuitem', { name: 'View details' });
  await waitFor(() =>
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'reimbursementRequests/r1' }),
    ),
  );
  expect(screen.queryByRole('menuitem', { name: 'Edit' })).toBeNull();
});
