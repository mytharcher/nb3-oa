import { NavigationGuardProvider } from '@nocobase/app-client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import enUS from '../../../client/locales/en-US.js';
import financeLocale from '../../../client/locales/modules/finance-assignments.en-US.js';
import FinancePage from '../../../client/pages/finance-assignments/index.js';
import FinanceDetail from '../../../client/pages/finance-assignments/detail.js';
import FinanceForm from '../../../client/pages/finance-assignments/form-dialog.js';
const { api, toaster, permission } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  toaster: { show: vi.fn() },
  permission: { can: true },
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => toaster,
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useCan: () => ({ can: permission.can, isPending: false }),
}));
const runtime = await createTestI18nRuntime({
  application: {
    namespace: 'nb3-oa',
    resources: { ...enUS, ...financeLocale },
  },
});
const assignment = {
  id: 'f1',
  departmentId: 'd1',
  accountantId: 'u1',
  department: { id: 'd1', title: 'Finance HQ' },
  accountant: { id: 'u1', name: 'Alice' },
  active: true,
  version: 1,
  updatedAt: '2026-01-01T00:00:00Z',
};
type Request = {
  path: string;
  method?: string;
  query?: Record<string, string>;
  json?: Record<string, unknown>;
};
function reads(r: Request) {
  if (r.path === 'financeAssignments/options')
    return Promise.resolve({ data: { accountants: [assignment.accountant] } });
  if (r.path === 'departments/options')
    return Promise.resolve({
      data: [
        {
          id: 'd1',
          title: 'Finance HQ',
          parentId: null,
          code: null,
          active: true,
        },
      ],
    });
  if (r.path === 'financeAssignments/f1')
    return Promise.resolve({ data: assignment });
  return Promise.resolve({
    data: [assignment],
    meta: { total: 1, page: 1, pageSize: 20 },
  });
}
function show(path = '/financeAssignments') {
  const router = createMemoryRouter(
    [
      {
        path: '/financeAssignments',
        element: (
          <NavigationGuardProvider>
            <FinancePage />
          </NavigationGuardProvider>
        ),
        children: [
          { path: 'new', element: <FinanceForm /> },
          { path: 'edit/:assignmentId', element: <FinanceForm /> },
          {
            path: ':assignmentId',
            element: <FinanceDetail />,
            children: [{ path: 'edit', element: <FinanceForm /> }],
          },
        ],
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
beforeEach(() => {
  vi.clearAllMocks();
  permission.can = true;
  api.request.mockImplementation(reads);
});
describe('finance assignment views', () => {
  it('clamps URL pagination and hides update controls from read-only users', async () => {
    permission.can = false;
    const router = show('/financeAssignments?page=999');
    await screen.findAllByText('Alice');
    await waitFor(() => expect(router.state.location.search).toBe('?page=1'));
    expect(
      screen.queryByRole('link', { name: 'Assign accountant' }),
    ).toBeNull();
    expect(screen.queryByRole('link', { name: 'Edit assignment' })).toBeNull();
  });
  it('reports required fields and focuses the first invalid input', async () => {
    show('/financeAssignments/new');
    const user = userEvent.setup();
    await screen.findByRole('button', { name: 'Save' });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled(),
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findAllByText('This field is required.')).toHaveLength(
      3,
    );
    expect(document.activeElement).toBe(
      document.getElementById('finance-form-department'),
    );
  });
  it('keeps input on conflict, shows latest facts and adopts the new version only explicitly', async () => {
    const { ApiClientError } = await import('@nocobase/app-client');
    let writes = 0,
      readsCount = 0;
    api.request.mockImplementation((r: Request) => {
      if (r.method === 'PATCH') {
        writes++;
        return writes === 1
          ? Promise.reject(
              new ApiClientError('Version changed', {
                status: 409,
                method: 'PATCH',
                url: '/api/financeAssignments/f1',
                reason: 'FINANCE_ASSIGNMENT_VERSION_CONFLICT',
              } as ConstructorParameters<typeof ApiClientError>[1]),
            )
          : Promise.resolve({ data: assignment });
      }
      if (r.path === 'financeAssignments/f1') {
        readsCount++;
        return Promise.resolve({
          data: {
            ...assignment,
            version: readsCount === 1 ? 1 : 2,
            accountant: {
              id: 'u1',
              name: readsCount === 1 ? 'Alice' : 'Latest Alice',
            },
          },
        });
      }
      return reads(r);
    });
    show('/financeAssignments/edit/f1');
    const user = userEvent.setup();
    await screen.findByLabelText('Reason');
    await user.type(screen.getByLabelText('Reason'), 'Reviewed change');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await user.click(
      await screen.findByRole('button', { name: 'Load latest assignment' }),
    );
    await screen.findByText(/Latest: Latest Alice/);
    expect(screen.getByLabelText('Reason')).toHaveValue('Reviewed change');
    await user.click(
      screen.getByRole('button', { name: 'Use this version with my changes' }),
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(writes).toBe(2));
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        json: expect.objectContaining({
          version: 2,
          reason: 'Reviewed change',
        }),
      }),
    );
  });
  it('queries the original department after an uncertain create even when the user changes the current selection', async () => {
    api.request.mockImplementation((r: Request) => {
      if (r.method === 'POST')
        return Promise.reject(new Error('connection lost'));
      if (r.path === 'departments/options')
        return Promise.resolve({
          data: [
            {
              id: 'd1',
              title: 'Finance HQ',
              parentId: null,
              code: null,
              active: true,
            },
            {
              id: 'd2',
              title: 'Other department',
              parentId: null,
              code: null,
              active: true,
            },
          ],
        });
      if (r.path === 'financeAssignments' && r.query?.departmentId)
        return Promise.resolve({
          data: [assignment],
          meta: { page: 1, total: 1, pageSize: 20 },
        });
      return reads(r);
    });
    show('/financeAssignments/new');
    const user = userEvent.setup();
    const dept = await screen.findByLabelText('Department', {
      selector: '#finance-form-department',
    });
    await user.click(dept);
    await user.type(dept, 'Finance HQ');
    await user.click(await screen.findByRole('option', { name: /Finance HQ/ }));
    const accountant = screen.getByLabelText('Accountant');
    await user.click(accountant);
    await user.type(accountant, 'Alice');
    await user.click(await screen.findByRole('option', { name: 'Alice' }));
    await user.type(screen.getByLabelText('Reason'), 'Configure');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByText(/The creation result is uncertain/);
    await user.clear(dept);
    await user.type(dept, 'Other department');
    await user.click(
      await screen.findByRole('option', { name: /Other department/ }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Check department assignment' }),
    );
    await screen.findByRole('link', { name: 'Open existing assignment' });
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'financeAssignments',
        query: { departmentId: 'd1' },
      }),
    );
    expect(
      api.request.mock.calls.filter(([r]) => r.method === 'POST'),
    ).toHaveLength(1);
  });
});
