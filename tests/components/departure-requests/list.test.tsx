import userEvent from '@testing-library/user-event';
import { NavigationGuardProvider } from '@nocobase/app-client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import base from '../../../client/locales/en-US.js';
import departureCopy from '../../../client/locales/modules/departure.en-US.js';
const enUS = {
  ...base,
  departureRequests: { ...departureCopy },
};
import DeparturesPage from '../../../client/pages/departure-requests/index.js';
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
    lastWorkingDay: '2026-11-01',
    conclusion: null,
    status: 'draft',
    createdAt: new Date(Date.UTC(2026, 9, 10, 0, index)).toISOString(),
  };
}
function show(path = '/departureRequests') {
  const router = createMemoryRouter(
    [
      {
        path: '/departureRequests',
        element: (
          <NavigationGuardProvider>
            <DeparturesPage />
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
describe('departure list complete-result navigation', () => {
  it('keeps one toolbar create action and table headers in the empty state', async () => {
    api.request.mockImplementation(({ path }: { path: string }) =>
      Promise.resolve({
        data: path.endsWith('/options')
          ? { timeZone: 'Asia/Shanghai', canCreateManualDraft: true }
          : [],
      }),
    );
    const first = show();
    await screen.findByText('No departure requests');
    expect(
      screen.getAllByRole('button', { name: 'New departure request' }),
    ).toHaveLength(1);
    expect(
      screen
        .getByRole('button', { name: 'New departure request' })
        .closest('[data-slot=application-actions]'),
    ).not.toBeNull();
    expect(screen.getByRole('table')).toBeInTheDocument();
    first.dispose();
  });
  it('filters the full collection before pagination and preserves URL conditions when opening a record', async () => {
    permission.can = false;
    api.request.mockImplementation(({ path }: { path: string }) =>
      Promise.resolve({
        data: path.endsWith('/options')
          ? { timeZone: 'Asia/Shanghai', canCreateManualDraft: false }
          : Array.from({ length: 101 }, (_, index) => row(index)),
      }),
    );
    const router = show(
      '/departureRequests?search=Evidence+100&page=999&sort=lastWorkingDay&order=asc',
    );
    await screen.findByRole('link', { name: 'R-100' });
    await waitFor(() =>
      expect(router.state.location.search).toContain('page=1'),
    );
    expect(
      screen.queryByRole('button', { name: 'New departure request' }),
    ).toBeNull();
    const selected = screen.getByRole('link', { name: 'R-100' });
    expect(selected.isConnected).toBe(true);
    expect(selected.getAttribute('href')).toContain(
      '/departureRequests/r100?search=Evidence+100',
    );
    await userEvent.setup().click(selected);
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/departureRequests/r100'),
    );
    await screen.findByText('Record opened');
    expect(router.state.location.pathname).toBe('/departureRequests/r100');
    expect(router.state.location.search).toContain('search=Evidence+100');
  });
});

it('filters by a historical type before pagination and preserves the type in the opened source URL', async () => {
  api.request.mockImplementation(({ path }: { path: string }) =>
    Promise.resolve({
      data: path.endsWith('/options')
        ? { timeZone: 'Asia/Shanghai', departureTypes: [] }
        : [
            {
              ...row(1),
              departureType: 'resignation',
              departureTypeLabel: { 'en-US': 'Historical resignation' },
            },
            {
              ...row(2),
              departureType: 'dismissal',
              departureTypeLabel: { 'en-US': 'Dismissal' },
            },
          ],
    }),
  );
  const router = show('/departureRequests?type=resignation&page=999');
  await screen.findByRole('link', { name: 'R-1' });
  expect(screen.queryByRole('link', { name: 'R-2' })).toBeNull();
  expect(
    screen.getByRole('combobox', { name: 'Departure type' }),
  ).toHaveTextContent('Historical resignation');
  await waitFor(() => expect(router.state.location.search).toContain('page=1'));
  expect(
    screen.getByRole('link', { name: 'R-1' }).getAttribute('href'),
  ).toContain('type=resignation');
  await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
  await screen.findByRole('link', { name: 'R-2' });
  expect(router.state.location.search).not.toContain('type=');
});
