import { ApiClientError, NavigationGuardProvider } from '@nocobase/app-client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
import LeaveBalancesPage, {
  BalancePage,
} from '../../client/pages/leave-balances/index.js';
import AdjustDialog from '../../client/pages/leave-balances/adjust-dialog.js';
import { adjustmentUnits } from '../../client/pages/leave-balances/types.js';
const { api, toaster, permission, navigation } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  toaster: { show: vi.fn() },
  permission: { can: true },
  navigation: { guard: null as (() => boolean) | null },
}));
vi.mock('@nocobase/app-client', async (original) => {
  const actual = await original<typeof import('@nocobase/app-client')>();
  return {
    ...actual,
    useApiClient: () => api,
    useToaster: () => toaster,
    useNavigationGuard: (guard: () => boolean) => {
      actual.useNavigationGuard(guard);
      navigation.guard = guard;
    },
  };
});
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useCan: () => ({ can: permission.can, isPending: false }),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
const chinese = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: zhCN },
  locale: 'zh-CN',
});
const annual = {
  employeeId: 'e1',
  leaveType: 'annual',
  availableUnits: 5,
  heldUnits: 1,
};
const options = {
  leaveTypes: [
    {
      code: 'annual',
      label: { 'en-US': 'Annual leave', 'zh-CN': '年假' },
      active: true,
      extra: { deductsBalance: true },
    },
    {
      code: 'compensatory',
      label: { 'en-US': 'Compensatory leave', 'zh-CN': '调休' },
      active: true,
      extra: { deductsBalance: true },
    },
  ],
};
type Request = {
  path: string;
  method?: string;
  query?: Record<string, string>;
  json?: Record<string, unknown>;
};
function reads({ path }: Request) {
  if (path === 'leaveRequests/options')
    return Promise.resolve({ data: options });
  if (path === 'employees')
    return Promise.resolve({
      data: [{ id: 'e1', name: 'Alice', code: 'A1' }],
      meta: { total: 1 },
    });
  if (path === 'employees/e1')
    return Promise.resolve({ data: { id: 'e1', name: 'Alice', code: 'A1' } });
  if (path.endsWith('/ledger'))
    return Promise.resolve({
      data: [],
      meta: { total: 0, page: 1, pageSize: 20 },
    });
  return Promise.resolve({ data: [annual] });
}
function NavigationAttempt() {
  return (
    <button
      onClick={() => {
        navigation.guard?.();
      }}
    >
      Try navigation
    </button>
  );
}
function show(path = '/leaveBalances', hr = false, lang = runtime) {
  const router = createMemoryRouter(
    [
      {
        path: hr ? '/leaveBalanceAdministration' : '/leaveBalances',
        element: (
          <NavigationGuardProvider>
            <NavigationAttempt />
            {hr ? <BalancePage administration /> : <LeaveBalancesPage />}
          </NavigationGuardProvider>
        ),
        children: hr
          ? [
              {
                path: 'adjust/:employeeId/:leaveType',
                element: <AdjustDialog />,
              },
            ]
          : [],
      },
    ],
    { initialEntries: [path] },
  );
  render(
    <TestI18nProvider runtime={lang}>
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
describe('leave balance pages', () => {
  it('formats half days and only reads the signed-in employee account', async () => {
    show();
    await screen.findByText('2.5');
    expect(screen.getByText('0.5')).toBeInTheDocument();
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'leaveBalances/me' }),
    );
    expect(api.request.mock.calls.some(([r]) => r.path === 'employees')).toBe(
      false,
    );
    expect(screen.queryByRole('button', { name: 'Adjust balance' })).toBeNull();
  });
  it('loads ledger sorting from the URL and server pagination without sorting only one page', async () => {
    show(
      '/leaveBalances?leaveType=annual&page=2&pageSize=10&sortBy=heldDelta&sortDirection=asc',
    );
    await waitFor(() =>
      expect(api.request).toHaveBeenCalledWith(
        expect.objectContaining({
          path: 'leaveBalances/me/ledger',
          query: {
            leaveType: 'annual',
            page: '2',
            pageSize: '10',
            sortBy: 'heldDelta',
            sortDirection: 'asc',
          },
        }),
      ),
    );
  });
  it('offers a zero account for a missing compensatory balance even when annual leave already exists', async () => {
    show(
      '/leaveBalanceAdministration?employeeId=e1&leaveType=compensatory',
      true,
    );
    await screen.findByText(/has no account yet/);
    expect(
      screen.getByRole('button', { name: 'Adjust balance' }),
    ).toHaveAttribute(
      'href',
      expect.stringContaining('/adjust/e1/compensatory'),
    );
  });
  it('hides every adjustment action for a read-only HR user', async () => {
    permission.can = false;
    show('/leaveBalanceAdministration?employeeId=e1', true);
    await screen.findByText('2.5');
    expect(screen.queryByRole('button', { name: 'Adjust balance' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Actions for/ })).toBeNull();
  });
  it('does not expose raw permission errors or invite a forbidden retry', async () => {
    api.request.mockImplementation((r: Request) =>
      r.path === 'leaveBalances/me'
        ? Promise.reject(
            new ApiClientError('private SQL', {
              status: 403,
              method: 'GET',
              url: r.path,
            }),
          )
        : reads(r),
    );
    show();
    const alert = await screen.findByRole('alert');
    expect(alert).not.toHaveTextContent('private SQL');
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });
  it('has real Chinese translations for the page, balances and ledger', async () => {
    show('/leaveBalances', false, chinese);
    await screen.findByText('2.5');
    expect(
      screen.getByRole('heading', { name: '假期余额' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '年假 · 余额流水' }),
    ).toBeInTheDocument();
  });
  it('opens a direct adjustment URL without depending on optional list query parameters', async () => {
    show('/leaveBalanceAdministration/adjust/e1/compensatory', true);
    const dialog = await screen.findByRole('dialog');
    expect(
      await within(dialog).findByLabelText('Adjustment days *'),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(/Currently 0 available/),
    ).toBeInTheDocument();
  });
  it('keeps pending writes single and prevents cancellation until the server responds', async () => {
    const user = userEvent.setup();
    let resolveWrite: (value: unknown) => void = () => {};
    api.request.mockImplementation((r: Request) =>
      r.method === 'POST'
        ? new Promise((resolve) => {
            resolveWrite = resolve;
          })
        : reads(r),
    );
    show('/leaveBalanceAdministration/adjust/e1/annual?employeeId=e1', true);
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('Adjustment days *'), '1');
    await user.type(within(dialog).getByLabelText('Reason *'), 'Correction');
    await user.click(within(dialog).getByRole('button', { name: 'Adjust' }));
    expect(
      within(dialog).getByRole('button', { name: 'Cancel' }),
    ).toBeDisabled();
    expect(
      within(dialog).getByRole('button', { name: /Adjust/ }),
    ).toBeDisabled();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      api.request.mock.calls.filter(([r]) => r.method === 'POST'),
    ).toHaveLength(1);
    resolveWrite({ data: { ...annual, availableUnits: 7 } });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
  it('shows no-types guidance and disables initialization when all types are unavailable', async () => {
    api.request.mockImplementation((r: Request) =>
      r.path === 'leaveRequests/options'
        ? Promise.resolve({ data: { leaveTypes: [] } })
        : reads(r),
    );
    show('/leaveBalanceAdministration?employeeId=e1', true);
    await screen.findByText(/No balance-backed leave types are available/);
    expect(
      screen.getByRole('button', { name: 'Adjust balance' }),
    ).toBeDisabled();
  });
  it.each(['unknown', 'disabled', 'changed'])(
    'keeps HR history readable for %s leave types without allowing adjustments',
    async (code) => {
      api.request.mockImplementation((r: Request) => {
        if (r.path === 'leaveRequests/options')
          return Promise.resolve({
            data: {
              leaveTypes: [
                ...options.leaveTypes,
                {
                  code: 'disabled',
                  label: { 'en-US': 'Retired leave' },
                  active: false,
                  extra: { deductsBalance: true },
                },
                {
                  code: 'changed',
                  label: { 'en-US': 'Changed leave' },
                  active: true,
                  extra: { deductsBalance: false },
                },
              ],
            },
          });
        if (r.path === 'leaveBalances/e1')
          return Promise.resolve({ data: [{ ...annual, leaveType: code }] });
        return reads(r);
      });
      show(`/leaveBalanceAdministration?employeeId=e1&leaveType=${code}`, true);
      await waitFor(() =>
        expect(api.request).toHaveBeenCalledWith(
          expect.objectContaining({
            path: 'leaveBalances/e1/ledger',
            query: expect.objectContaining({ leaveType: code }),
          }),
        ),
      );
      expect(screen.queryByRole('button', { name: /Actions for/ })).toBeNull();
      expect(
        screen.getByRole('button', { name: 'Adjust balance' }),
      ).toBeDisabled();
    },
  );
  it('gives read-only HR a feasible next step when balances are empty', async () => {
    permission.can = false;
    api.request.mockImplementation((r: Request) =>
      r.path === 'leaveBalances/e1' ? Promise.resolve({ data: [] }) : reads(r),
    );
    show('/leaveBalanceAdministration?employeeId=e1', true);
    expect(
      await screen.findByText(
        'Ask an authorized HR administrator to grant leave balances.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        'Select a leave type and add a balance through an adjustment.',
      ),
    ).toBeNull();
  });
  it('clears employee and type filters together', async () => {
    const user = userEvent.setup();
    const router = show(
      '/leaveBalanceAdministration?employeeId=e1&leaveType=compensatory&page=2',
      true,
    );
    await screen.findByText(/has no account yet/);
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    await waitFor(() => expect(router.state.location.search).toBe(''));
    expect(await screen.findByText('Select an employee')).toBeInTheDocument();
  });
  it('puts insufficient-balance errors under the days field and preserves editable values', async () => {
    const user = userEvent.setup();
    api.request.mockImplementation((r: Request) =>
      r.method === 'POST'
        ? Promise.reject(
            new ApiClientError('private exception', {
              status: 412,
              reason: 'LEAVE_BALANCE_INSUFFICIENT',
              method: 'POST',
              url: r.path,
            }),
          )
        : reads(r),
    );
    show('/leaveBalanceAdministration/adjust/e1/annual?employeeId=e1', true);
    const dialog = await screen.findByRole('dialog');
    const days = within(dialog).getByLabelText('Adjustment days *');
    await user.type(days, '-9');
    await user.type(within(dialog).getByLabelText('Reason *'), 'Correction');
    await user.click(within(dialog).getByRole('button', { name: 'Adjust' }));
    await screen.findByText(
      'The available balance is insufficient. Reduce the deduction.',
    );
    expect(days).toHaveAttribute('aria-invalid', 'true');
    expect(days).toBeEnabled();
    expect(days.closest('[data-slot=field]')).toHaveTextContent(
      'The available balance is insufficient. Reduce the deduction.',
    );
    expect(screen.getByRole('alert').closest('[data-slot=field]')).toBe(
      days.closest('[data-slot=field]'),
    );
  });
  it('uses the same AlertDialog for dirty navigation and explicitly returns to balances after discard', async () => {
    const user = userEvent.setup();
    const native = vi.spyOn(window, 'confirm').mockReturnValue(false);
    show('/leaveBalanceAdministration/adjust/e1/annual?employeeId=e1', true);
    const dialog = await screen.findByRole('dialog');
    await user.type(
      within(dialog).getByLabelText('Reason *'),
      'Unsaved changes',
    );
    await user.click(screen.getByText('Try navigation'));
    const confirmation = await screen.findByRole('alertdialog');
    expect(confirmation).toHaveTextContent(
      'The original navigation will not continue.',
    );
    expect(native).not.toHaveBeenCalled();
    await user.click(
      within(confirmation).getByRole('button', { name: 'Keep editing' }),
    );
    expect(within(dialog).getByLabelText('Reason *')).toHaveValue(
      'Unsaved changes',
    );
    await user.click(screen.getByText('Try navigation'));
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', {
        name: 'Discard and return to balances',
      }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    native.mockRestore();
  });
  it('maps server reason field violations to the reason input', async () => {
    const user = userEvent.setup();
    api.request.mockImplementation((r: Request) =>
      r.method === 'POST'
        ? Promise.reject(
            new ApiClientError('private validator', {
              status: 400,
              method: 'POST',
              url: r.path,
              payload: { error: { fieldViolations: [{ field: 'reason' }] } },
            }),
          )
        : reads(r),
    );
    show('/leaveBalanceAdministration/adjust/e1/annual?employeeId=e1', true);
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('Adjustment days *'), '1');
    const reason = within(dialog).getByLabelText('Reason *');
    await user.type(reason, 'Correction');
    await user.click(within(dialog).getByRole('button', { name: 'Adjust' }));
    await screen.findByText('Enter a reason for the adjustment.');
    expect(reason).toHaveAttribute('aria-invalid', 'true');
    expect(reason.closest('[data-slot=field]')).toHaveTextContent(
      'Enter a reason for the adjustment.',
    );
    expect(screen.queryByText('private validator')).toBeNull();
  });
  it('offers a functional clear action for an unmatched employee search with no selection', async () => {
    const user = userEvent.setup();
    api.request.mockImplementation((r: Request) =>
      r.path === 'employees'
        ? Promise.resolve({ data: [], meta: { total: 0 } })
        : reads(r),
    );
    show('/leaveBalanceAdministration', true);
    const input = screen.getByRole('combobox', { name: 'Employee' });
    await user.type(input, 'Nobody');
    await screen.findByText('No matching employees. Change your search.');
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(screen.getByRole('combobox', { name: 'Employee' })).toHaveValue('');
    await waitFor(() =>
      expect(api.request).toHaveBeenCalledWith(
        expect.objectContaining({
          path: 'employees',
          query: { q: '', pageSize: '20' },
        }),
      ),
    );
  });
  it('requires reason and half-day increments, then initializes an account with audited request metadata', async () => {
    const user = userEvent.setup();
    show(
      '/leaveBalanceAdministration/adjust/e1/compensatory?employeeId=e1&leaveType=compensatory',
      true,
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Adjust leave balance',
    });
    const submit = within(dialog).getByRole('button', { name: 'Adjust' });
    await user.click(submit);
    expect(
      await screen.findByText('Enter a reason for the adjustment.'),
    ).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText('Adjustment days *'), '0.25');
    await user.type(
      within(dialog).getByLabelText('Reason *'),
      'Imported entitlement',
    );
    await user.click(submit);
    expect(
      screen.getByText(
        'Enter a nonzero number of days in half-day increments.',
      ),
    ).toBeInTheDocument();
    await user.clear(within(dialog).getByLabelText('Adjustment days *'));
    await user.type(within(dialog).getByLabelText('Adjustment days *'), '1.5');
    api.request.mockImplementation((r: Request) =>
      r.method === 'POST'
        ? Promise.resolve({
            data: {
              employeeId: 'e1',
              leaveType: 'compensatory',
              availableUnits: 3,
              heldUnits: 0,
            },
          })
        : reads(r),
    );
    await user.click(submit);
    await waitFor(() =>
      expect(api.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          json: expect.objectContaining({
            leaveType: 'compensatory',
            units: 3,
            reason: 'Imported entitlement',
            expiresAt: null,
            requestKey: expect.any(String),
            reference: expect.stringMatching(/^hr:/),
          }),
        }),
      ),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(toaster.show).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Adjusted the balance for "Alice".' }),
    );
  });
  it('retries an uncertain write with exactly the same payload and locks edited values', async () => {
    const user = userEvent.setup();
    let attempt = 0;
    api.request.mockImplementation((r: Request) => {
      if (r.method === 'POST') {
        attempt++;
        return attempt === 1
          ? Promise.reject(new Error('network'))
          : Promise.resolve({ data: { ...annual, availableUnits: 7 } });
      }
      return reads(r);
    });
    show(
      '/leaveBalanceAdministration/adjust/e1/annual?employeeId=e1&leaveType=annual',
      true,
    );
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('Adjustment days *'), '1');
    await user.type(within(dialog).getByLabelText('Reason *'), 'Correction');
    await user.click(within(dialog).getByRole('button', { name: 'Adjust' }));
    await screen.findByText(/The result is uncertain/);
    expect(within(dialog).getByLabelText('Adjustment days *')).toBeDisabled();
    await user.click(
      within(dialog).getByRole('button', { name: 'Retry adjustment' }),
    );
    await waitFor(() => expect(attempt).toBe(2));
    const writes = api.request.mock.calls.filter(([r]) => r.method === 'POST');
    expect(writes[0][0].json).toEqual(writes[1][0].json);
  });
});
it('uses integer half-days without truncating fractional days', () => {
  expect(adjustmentUnits('1.5')).toBe(3);
  expect(adjustmentUnits('-0.5')).toBe(-1);
  for (const invalid of ['', '0', '0.25', 'NaN', 'Infinity', '1000000000.5'])
    expect(adjustmentUnits(invalid)).toBeNull();
});
