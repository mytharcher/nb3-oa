import { ApiClientError } from '@nocobase/app-client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import metadata from '../../package.json' with { type: 'json' };
import enUS from '../../client/locales/en-US.js';
import DelegationsPage from '../../client/pages/approval-delegations/index.js';
import DelegationFormDialog from '../../client/pages/approval-delegations/form-dialog.js';
import {
  wallTimeToInstant,
  type Delegation,
} from '../../client/pages/approval-delegations/types.js';

const { api, toaster, permission } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  toaster: { show: vi.fn(), close: vi.fn() },
  permission: { update: true, people: true },
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => toaster,
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ refresh: vi.fn() }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useAuthorizationRevision: () => 0,
  useCan: ({ resource }: { resource: { type: string } }) => ({
    can: resource.type === 'user' ? permission.people : permission.update,
    isPending: false,
    error: undefined,
  }),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: metadata.name, resources: enUS },
});
const copy = enUS.approvals;
const row: Delegation = {
  id: 'd1',
  principalId: 'alice',
  delegateId: 'bob',
  principal: { id: 'alice', name: 'Alice' },
  delegate: { id: 'bob', name: 'Bob' },
  scope: 'all',
  from: '2026-10-12T01:00:00.000Z',
  to: '2026-10-12T10:00:00.000Z',
  source: 'manual',
  sourceApplication: null,
  active: true,
  createdAt: '2026-10-10T00:00:00.000Z',
  updatedAt: '2026-10-10T00:00:00.000Z',
};
interface RequestOptions {
  path: string;
  method?: string;
  json?: Record<string, unknown>;
}
function serve(rows: Delegation[] = [row]) {
  api.request.mockImplementation(async ({ path, method }: RequestOptions) => {
    if (path === 'leaveRequests/options')
      return { data: { timeZone: 'Asia/Shanghai' } };
    if (path === 'users')
      return {
        data: [row.principal, row.delegate],
        meta: { total: 2, page: 1, pageSize: 20 },
      };
    if (path === 'approvalDelegations' && !method)
      return { data: rows, meta: { total: rows.length } };
    throw new Error(`Unexpected request ${method ?? 'GET'} ${path}`);
  });
}
function mount(url = '/delegations') {
  const router = createMemoryRouter(
    [
      {
        path: '/delegations',
        element: <DelegationsPage />,
        children: [
          { path: 'new', element: <DelegationFormDialog /> },
          { path: 'edit/:delegationId', element: <DelegationFormDialog /> },
        ],
      },
    ],
    { initialEntries: [url] },
  );
  render(
    <TestI18nProvider runtime={runtime} namespace={metadata.name}>
      <RouterProvider router={router} />
    </TestI18nProvider>,
  );
  return router;
}
beforeEach(() => {
  api.request.mockReset();
  toaster.show.mockReset();
  permission.update = true;
  permission.people = true;
});

describe('approval delegation pages', () => {
  it('uses one primary action in the empty state and opens a URL dialog without losing filters', async () => {
    serve([]);
    const router = mount('/delegations?q=Alice');
    expect(await screen.findByText(copy.delegations.empty)).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: copy.delegations.new }),
    ).toHaveLength(1);
    await userEvent.click(
      screen.getByRole('button', { name: copy.delegations.new }),
    );
    expect(
      await screen.findByRole('dialog', { name: copy.delegations.new }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/delegations/new');
    expect(router.state.location.search).toBe('?q=Alice');
    expect(
      screen.queryByText(copy.delegations.invalid),
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: copy.cancel }));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/delegations'),
    );
    expect(router.state.location.search).toBe('?q=Alice');
  });
  it('hides all writes without update permission and protects automatic leave delegation even for managers', async () => {
    permission.update = false;
    serve();
    mount();
    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: copy.delegations.new }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Actions for/u }),
    ).not.toBeInTheDocument();
  });
  it('refuses editing a leave-owned delegation and gives a close action', async () => {
    serve([{ ...row, source: 'leave', sourceApplication: 'lv-1' }]);
    mount('/delegations/edit/d1');
    const dialog = await screen.findByRole('dialog', {
      name: copy.delegations.edit,
    });
    expect(
      await within(dialog).findByText(copy.delegations.sourceLeave),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByRole('button', { name: copy.save }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).getAllByRole('button', { name: copy.close })[0],
    ).toBeInTheDocument();
  });
  it('shows no retry for forbidden and missing data, and never displays the backend exception', async () => {
    serve();
    api.request.mockImplementation(async ({ path }: RequestOptions) => {
      if (path === 'leaveRequests/options')
        return { data: { timeZone: 'Asia/Shanghai' } };
      throw new ApiClientError('secret SQL exception', {
        status: 403,
        method: 'GET',
        url: '/api/approvalDelegations',
      });
    });
    mount();
    expect(await screen.findByText(copy.error.forbidden)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: copy.retry }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('secret SQL exception')).not.toBeInTheDocument();
  });
  it('requires confirmation before disabling and immediately keeps the returned disabled row', async () => {
    let rows = [row];
    serve(rows);
    api.request.mockImplementation(async ({ path, method }: RequestOptions) => {
      if (path === 'leaveRequests/options')
        return { data: { timeZone: 'Asia/Shanghai' } };
      if (path === 'approvalDelegations' && !method) return { data: rows };
      if (path === 'approvalDelegations/d1/disable') {
        rows = [{ ...row, active: false }];
        return { data: rows[0] };
      }
      throw new Error(`Unexpected ${path}`);
    });
    mount();
    await screen.findByText('Alice');
    await userEvent.click(
      screen.getByRole('button', {
        name: copy.actions.replace('{{name}}', 'Alice'),
      }),
    );
    await userEvent.click(
      await screen.findByRole('menuitem', { name: copy.delegations.disable }),
    );
    const confirmation = await screen.findByRole('alertdialog');
    expect(
      api.request.mock.calls.some(([request]: [RequestOptions]) =>
        request.path.endsWith('/disable'),
      ),
    ).toBe(false);
    expect(
      within(confirmation).getByText(copy.delegations.disableDescription),
    ).toBeInTheDocument();
    await userEvent.click(
      within(confirmation).getByRole('button', {
        name: copy.delegations.disable,
      }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(toaster.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success' }),
    );
  });
  it('edits from the latest data and saves wall-clock time using the company timezone', async () => {
    let current = row;
    serve();
    api.request.mockImplementation(
      async ({ path, method, json }: RequestOptions) => {
        if (path === 'leaveRequests/options')
          return { data: { timeZone: 'Asia/Shanghai' } };
        if (path === 'users')
          return {
            data: [row.principal, row.delegate],
            meta: { total: 2, page: 1, pageSize: 20 },
          };
        if (path === 'approvalDelegations' && !method)
          return { data: [current] };
        if (path === 'approvalDelegations/d1' && method === 'PATCH') {
          current = {
            ...row,
            ...json,
            updatedAt: '2026-10-10T01:00:00.000Z',
          } as Delegation;
          return { data: current };
        }
        throw new Error(`Unexpected ${path}`);
      },
    );
    const router = mount('/delegations/edit/d1?q=Alice');
    const input = await screen.findByLabelText(
      new RegExp(copy.delegations.fromTime.replace(/[()]/gu, '\\$&'), 'u'),
    );
    expect(input).toHaveValue('09:00');
    fireEvent.change(input, { target: { value: '10:00' } });
    await userEvent.click(screen.getByRole('button', { name: copy.save }));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/delegations'),
    );
    expect(router.state.location.search).toBe('?q=Alice');
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'PATCH',
        json: expect.objectContaining({
          principalId: 'alice',
          delegateId: 'bob',
          from: '2026-10-12T02:00:00.000Z',
          to: '2026-10-12T10:00:00.000Z',
        }),
      }),
    );
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
  it('does not search users or enable saving without the user picker grant', async () => {
    permission.people = false;
    serve();
    mount('/delegations/edit/d1');
    expect(
      await screen.findByText(copy.noPickerPermission),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: copy.save })).toBeDisabled();
    expect(
      api.request.mock.calls.some(
        ([request]: [RequestOptions]) => request.path === 'users',
      ),
    ).toBe(false);
  });
  it('focuses the first missing person and sends no write when local validation fails', async () => {
    serve([]);
    mount('/delegations/new');
    const principal = await screen.findByLabelText(
      new RegExp(copy.delegations.principal, 'u'),
    );
    await userEvent.click(screen.getByRole('button', { name: copy.save }));
    expect(principal).toHaveFocus();
    expect(
      api.request.mock.calls.some(
        ([request]: [RequestOptions]) => !!request.method,
      ),
    ).toBe(false);
  });
  it('focuses the invalid time after valid people and dates', async () => {
    serve();
    mount('/delegations/edit/d1');
    const fromTime = await screen.findByLabelText(
      new RegExp(copy.delegations.fromTime.replace(/[()]/gu, '\\$&'), 'u'),
    );
    fireEvent.change(fromTime, { target: { value: '24:00' } });
    await userEvent.click(screen.getByRole('button', { name: copy.save }));
    expect(fromTime).toHaveFocus();
    expect(
      await screen.findByText(copy.delegations.timeInvalid),
    ).toBeInTheDocument();
    expect(
      api.request.mock.calls.some(
        ([request]: [RequestOptions]) => !!request.method,
      ),
    ).toBe(false);
  });
  it('keeps conflicting edits open and reloads the latest record on request', async () => {
    serve();
    const read = api.request.getMockImplementation()!;
    api.request.mockImplementation(async (request: RequestOptions) => {
      if (request.method === 'PATCH')
        throw new ApiClientError('private conflict detail', {
          status: 409,
          method: 'PATCH',
          url: '/api/approvalDelegations/d1',
        });
      return read(request);
    });
    const router = mount('/delegations/edit/d1');
    await screen.findByLabelText(
      new RegExp(copy.delegations.fromTime.replace(/[()]/gu, '\\$&'), 'u'),
    );
    await userEvent.click(screen.getByRole('button', { name: copy.save }));
    expect(await screen.findByText(copy.error.conflict)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/delegations/edit/d1');
    expect(
      screen.queryByText('private conflict detail'),
    ).not.toBeInTheDocument();
    const before = api.request.mock.calls.filter(
      ([request]: [RequestOptions]) => request.path === 'approvalDelegations',
    ).length;
    await userEvent.click(
      screen.getByRole('button', { name: copy.loadLatest }),
    );
    await waitFor(() =>
      expect(
        api.request.mock.calls.filter(
          ([request]: [RequestOptions]) =>
            request.path === 'approvalDelegations',
        ).length,
      ).toBeGreaterThan(before),
    );
  });
  it('explains a missing edit record without retry and refreshes the parent', async () => {
    serve([]);
    mount('/delegations/edit/gone');
    const dialog = await screen.findByRole('dialog', {
      name: copy.delegations.edit,
    });
    expect(
      await within(dialog).findByText(copy.error.notFound),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByRole('button', { name: copy.retry }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).queryByRole('button', { name: copy.save }),
    ).not.toBeInTheDocument();
  });
  it('shows a session-expired action on 401 instead of retrying', async () => {
    api.request.mockImplementation(async ({ path }: RequestOptions) => {
      if (path === 'leaveRequests/options')
        return { data: { timeZone: 'Asia/Shanghai' } };
      throw new ApiClientError('expired', {
        status: 401,
        method: 'GET',
        url: '/api/approvalDelegations',
      });
    });
    mount();
    expect(
      await screen.findByRole('button', { name: enUS.actions.signInAgain }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: copy.retry }),
    ).not.toBeInTheDocument();
  });
  it('interprets clock times independently of the browser zone and rejects nonexistent daylight-saving times', () => {
    expect(wallTimeToInstant('2026-10-12', '09:30', 'Asia/Shanghai')).toBe(
      '2026-10-12T01:30:00.000Z',
    );
    expect(
      wallTimeToInstant('2026-03-08', '02:30', 'America/New_York'),
    ).toBeUndefined();
    expect(
      wallTimeToInstant('2026-10-12', '24:00', 'Asia/Shanghai'),
    ).toBeUndefined();
  });
});
