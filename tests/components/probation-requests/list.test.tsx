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
import probationCopy from '../../../client/locales/modules/probation.en-US.js';
const enUS = {
  ...base,
  probationRequests: { ...probationCopy.probationRequests },
};
import ProbationsPage from '../../../client/pages/probation-requests/index.js';
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
    selfEvaluation: `Evidence ${index}`,
    probationEndDate: '2026-11-01',
    conclusion: null,
    status: 'draft',
    createdAt: new Date(Date.UTC(2026, 9, 10, 0, index)).toISOString(),
  };
}
function show(path = '/probationRequests') {
  const router = createMemoryRouter(
    [
      {
        path: '/probationRequests',
        element: (
          <NavigationGuardProvider>
            <ProbationsPage />
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
describe('probation list complete-result navigation', () => {
  it('keeps one toolbar create action and table headers in the empty state', async () => {
    api.request.mockImplementation(({ path }: { path: string }) =>
      Promise.resolve({
        data: path.endsWith('/options')
          ? { timeZone: 'Asia/Shanghai', canCreateManualDraft: true }
          : [],
      }),
    );
    const first = show();
    await screen.findByText('No probation requests yet');
    expect(
      screen.getAllByRole('button', { name: 'New probation request' }),
    ).toHaveLength(1);
    expect(
      screen
        .getByRole('button', { name: 'New probation request' })
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
          ? { timeZone: 'Asia/Shanghai', canCreateManualDraft: true }
          : Array.from({ length: 101 }, (_, index) => row(index)),
      }),
    );
    const router = show(
      '/probationRequests?search=Evidence+100&page=999&sort=probationEndDate&order=asc',
    );
    await screen.findByRole('link', { name: 'R-100' });
    await waitFor(() =>
      expect(router.state.location.search).toContain('page=1'),
    );
    expect(
      screen.queryByRole('button', { name: 'New probation request' }),
    ).toBeNull();
    const selected = screen.getByRole('link', { name: 'R-100' });
    expect(selected.isConnected).toBe(true);
    expect(selected.getAttribute('href')).toContain(
      '/probationRequests/r100?search=Evidence+100',
    );
    await userEvent.setup().click(selected);
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/probationRequests/r100'),
    );
    await screen.findByText('Record opened');
    expect(router.state.location.pathname).toBe('/probationRequests/r100');
    expect(router.state.location.search).toContain('search=Evidence+100');
  });
});

it('does not expose edit for a view-only draft and requests offers only after opening its menu', async () => {
  api.request.mockImplementation(({ path }: { path: string }) =>
    Promise.resolve(
      path === 'probationRequests/r1'
        ? { data: { view: { available: [] } } }
        : path.endsWith('/options')
          ? { data: { timeZone: 'Asia/Shanghai', canCreateManualDraft: true } }
          : { data: [row(1)] },
    ),
  );
  show();
  await screen.findByRole('link', { name: 'R-1' });
  expect(
    api.request.mock.calls.some(([arg]) => arg.path === 'probationRequests/r1'),
  ).toBe(false);
  await userEvent.setup().click(screen.getByRole('button', { name: /R-1/ }));
  await screen.findByRole('menuitem', { name: 'View details' });
  await waitFor(() =>
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'probationRequests/r1' }),
    ),
  );
  expect(screen.queryByRole('menuitem', { name: 'Edit' })).toBeNull();
});

it('keeps the number anchor alive through pointer events while canonical pagination updates', async () => {
  api.request.mockImplementation(({ path }: { path: string }) =>
    Promise.resolve({
      data: path.endsWith('/options')
        ? { timeZone: 'Asia/Shanghai', canCreateManualDraft: true }
        : [row(7)],
    }),
  );
  const router = show('/probationRequests?search=Evidence+7&page=999');
  const user = userEvent.setup();
  const number = await screen.findByRole('link', { name: 'R-7' });
  await user.pointer({ target: number, keys: '[MouseLeft>]' });
  await waitFor(() => expect(router.state.location.search).toContain('page=1'));
  expect(number.isConnected).toBe(true);
  await user.pointer({ target: number, keys: '[/MouseLeft]' });
  await waitFor(() =>
    expect(router.state.location.pathname).toBe('/probationRequests/r7'),
  );
  expect(router.state.location.search).toContain('search=Evidence+7');
  const listQuery = api.request.mock.calls.find(
    ([arg]) => arg.path === 'probationRequests',
  )?.[0].query;
  expect(listQuery).toEqual({ view: 'mine' });
});

it('does not expose manual creation to an employee even when a broad delegate grant is present', async () => {
  api.request.mockImplementation(({ path }: { path: string }) =>
    Promise.resolve({
      data: path.endsWith('/options')
        ? { timeZone: 'Asia/Shanghai', canCreateManualDraft: false }
        : [],
    }),
  );
  show();
  await screen.findByText('No probation requests yet');
  expect(
    screen.queryByRole('button', { name: 'New probation request' }),
  ).toBeNull();
});
