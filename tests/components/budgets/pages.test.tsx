import { NavigationGuardProvider } from '@nocobase/app-client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import enUS from '../../../client/locales/en-US.js';
import budgetLocale from '../../../client/locales/modules/budgets.en-US.js';
import BudgetsPage from '../../../client/pages/budgets/index.js';
import BudgetDetail from '../../../client/pages/budgets/detail.js';
import BudgetForm from '../../../client/pages/budgets/form-dialog.js';
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
  application: { namespace: 'nb3-oa', resources: { ...enUS, ...budgetLocale } },
});
const budget = {
  id: 'b1',
  departmentId: 'd1',
  year: 2026,
  subject: 'office',
  allocatedCents: 10001,
  heldCents: 0,
  usedCents: 0,
  availableCents: 10001,
  department: { id: 'd1', title: 'Finance HQ' },
  subjectLabel: { 'en-US': 'Office' },
};
type Request = {
  path: string;
  method?: string;
  query?: Record<string, string>;
  json?: Record<string, unknown>;
};
function reads(r: Request) {
  if (r.path === 'budgets/options')
    return Promise.resolve({
      data: {
        subjects: [
          { code: 'office', label: { 'en-US': 'Office' }, active: true },
        ],
      },
    });
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
  if (r.path === 'budgets/b1') return Promise.resolve({ data: budget });
  if (r.path.endsWith('/ledger'))
    return Promise.resolve({
      data: [],
      meta: { total: 0, page: 1, pageSize: 20 },
    });
  return Promise.resolve({
    data: [budget],
    meta: { total: 1, page: 1, pageSize: 20 },
  });
}
function show(path = '/budgets') {
  const router = createMemoryRouter(
    [
      {
        path: '/budgets',
        element: (
          <NavigationGuardProvider>
            <BudgetsPage />
          </NavigationGuardProvider>
        ),
        children: [
          { path: 'new', element: <BudgetForm /> },
          { path: 'adjust/:budgetId', element: <BudgetForm /> },
          {
            path: ':budgetId',
            element: <BudgetDetail />,
            children: [{ path: 'adjust', element: <BudgetForm /> }],
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
describe('budget management views', () => {
  it('keeps shared headers, pagination and a single toolbar creation action when empty', async () => {
    api.request.mockImplementation((r: Request) =>
      r.path === 'budgets'
        ? Promise.resolve({
            data: [],
            meta: { page: 1, pageSize: 20, total: 0 },
          })
        : reads(r),
    );
    show();
    await screen.findByText('No budgets yet');
    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('columnheader')).toHaveLength(8);
    expect(screen.getByRole('columnheader', { name: 'Year' })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
    const create = screen.getByRole('button', { name: 'New annual budget' });
    expect(create.closest('[data-slot=application-actions]')).not.toBeNull();
    expect(
      screen.getAllByRole('button', { name: 'New annual budget' }),
    ).toHaveLength(1);
    expect(
      screen.getByRole('button', { name: 'Go to next page' }),
    ).toBeDisabled();
  });
  it('uses the shared busy table and retains authorized toolbar actions during loading', () => {
    api.request.mockImplementation(() => new Promise(() => {}));
    show();
    const table = screen.getByRole('table', { name: 'Loading' });
    expect(table).toHaveAttribute('aria-busy', 'true');
    expect(within(table).getAllByRole('columnheader')).toHaveLength(8);
    expect(
      screen
        .getByRole('button', { name: 'New annual budget' })
        .closest('[data-slot=application-actions]'),
    ).not.toBeNull();
  });
  it('shows subject labels before opening the filter and after selection', async () => {
    const router = show();
    const user = userEvent.setup();
    const subject = screen.getByRole('combobox', { name: 'Subject' });
    expect(subject).toHaveTextContent('All subjects');
    await screen.findAllByText('100.01');
    await user.click(subject);
    await user.click(screen.getByRole('option', { name: 'Office' }));
    await waitFor(() =>
      expect(router.state.location.search).toContain('subject=office'),
    );
    expect(subject).toHaveTextContent('Office');
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    await user.click(subject);
    await user.click(
      await screen.findByRole('option', { name: 'All subjects' }),
    );
    await waitFor(() =>
      expect(router.state.location.search).not.toContain('subject='),
    );
    expect(subject).toHaveTextContent('All subjects');
  });
  it('resolves a subject restored from the URL without opening the filter', async () => {
    show('/budgets?subject=office');
    await waitFor(() =>
      expect(
        screen.getByRole('combobox', { name: 'Subject' }),
      ).toHaveTextContent('Office'),
    );
  });
  it('shows the selected subject label in the annual budget form', async () => {
    show('/budgets/new');
    const user = userEvent.setup();
    const subject = await screen.findByRole('combobox', { name: 'Subject *' });
    await user.click(subject);
    await user.click(await screen.findByRole('option', { name: 'Office' }));
    expect(subject).toHaveTextContent('Office');
  });
  it('uses server sorting/page filters and separates read-only actions', async () => {
    permission.can = false;
    show(
      '/budgets?year=2026&page=2&pageSize=10&orderBy=availableCents&direction=asc',
    );
    await screen.findAllByText('100.01');
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'budgets',
        query: expect.objectContaining({
          year: '2026',
          page: '2',
          pageSize: '10',
          orderBy: 'availableCents',
          direction: 'asc',
        }),
      }),
    );
    expect(
      screen.queryByRole('link', { name: 'New annual budget' }),
    ).toBeNull();
    expect(screen.queryByRole('button', { name: 'Adjust' })).toBeNull();
  });
  it('uses the server clamped page and writes it back to the URL', async () => {
    api.request.mockImplementation((r: Request) =>
      r.path === 'budgets'
        ? Promise.resolve({
            data: [budget],
            meta: { page: 1, pageSize: 20, total: 1 },
          })
        : reads(r),
    );
    const router = show('/budgets?page=999');
    await screen.findAllByText('100.01');
    await waitFor(() => expect(router.state.location.search).toBe('?page=1'));
    expect(screen.queryByText('No budgets yet')).toBeNull();
  });
  it('keeps failed adjustment input, reuses same payload key, and changes the key for corrected input', async () => {
    let writes = 0;
    api.request.mockImplementation((r: Request) => {
      if (r.method === 'POST') {
        writes++;
        if (writes < 3) return Promise.reject(new Error('offline'));
        return Promise.resolve({
          data: { ...budget, allocatedCents: 12000, availableCents: 12000 },
        });
      }
      return reads(r);
    });
    const router = show('/budgets/adjust/b1?year=2026');
    const user = userEvent.setup();
    await screen.findByLabelText('Allocation change *');
    await user.type(screen.getByLabelText('Allocation change *'), '19.99');
    await user.type(screen.getByLabelText('Reason *'), 'Revised allocation');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByText(
      'The budget could not be loaded or saved. Retry with the same input.',
    );
    expect(screen.getByLabelText('Allocation change *')).toHaveValue('19.99');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(writes).toBe(2));
    let commands = api.request.mock.calls
      .map(([r]) => r as Request)
      .filter((r) => r.method === 'POST');
    expect(commands[0].json!.requestKey).toBe(commands[1].json!.requestKey);
    await user.clear(screen.getByLabelText('Allocation change *'));
    await user.type(screen.getByLabelText('Allocation change *'), '20.00');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/budgets'),
    );
    commands = api.request.mock.calls
      .map(([r]) => r as Request)
      .filter((r) => r.method === 'POST');
    expect(commands[2].json!.requestKey).not.toBe(commands[1].json!.requestKey);
    expect(toaster.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success' }),
    );
    expect(router.state.location.search).toBe('?year=2026');
  });
  it('rejects excess fractional precision before any write', async () => {
    show('/budgets/adjust/b1');
    const user = userEvent.setup();
    await screen.findByLabelText('Allocation change *');
    await user.type(screen.getByLabelText('Allocation change *'), '0.001');
    await user.type(screen.getByLabelText('Reason *'), 'Exact cents only');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByText(
      'Enter a nonzero amount with at most two decimal places within the safe integer cents limit.',
    );
    expect(api.request.mock.calls.some(([r]) => r.method === 'POST')).toBe(
      false,
    );
  });
});
