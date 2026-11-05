import demoMode from '@nocobase/app-plugin-demo-mode/client';
import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import locales from '../../client/locales/index.js';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';

import { HeaderActions } from '../../client/layouts/components/header-actions.js';

vi.mock('../../client/theme/index.js', () => ({ ThemeSettings: () => null }));
vi.mock('../../client/layouts/components/user-menu.js', () => ({
  UserMenu: () => null,
}));

it('mounts the plugin menu and allows retry after a failed switch', async () => {
  const requests: ApiCall[] = [];
  const view = await renderWithApp(<HeaderActions />, {
    route: '/leads?view=board#selected',
    namespace: 'nb3-oa',
    namespaces: { 'nb3-oa': locales },
    plugins: [demoMode()],
    fetch: answerApi((call) => {
      requests.push(call);
      switch (call.path) {
        case 'demoMode/status':
          return { data: { enabled: true } };
        case 'demoMode/accounts':
          return {
            data: [
              {
                username: 'admin',
                name: 'Super Admin',
                role: 'Administrator',
                current: true,
              },
              {
                username: 'sales',
                name: 'Sophie Bennett',
                role: 'Sales',
                current: false,
              },
            ],
          };
        case 'demoAccountRoles':
          return {
            data: [
              { username: 'admin', roles: ['administrator'] },
              { username: 'sales', roles: ['finance', 'hr'] },
            ],
          };
        case 'demoMode/accounts/sales/signIn':
          return Response.json(
            { error: { message: 'Unavailable' } },
            { status: 503 },
          );
        default:
          return new Response(null, { status: 404 });
      }
    }),
  });
  await userEvent.click(
    await screen.findByRole('button', { name: 'Demo mode · Switch account' }),
  );
  expect(
    await screen.findByRole('menuitemradio', { name: /Super Admin/ }),
  ).toHaveAttribute('aria-checked', 'true');
  expect(
    screen.getByText(
      'Changes are saved. Switch accounts to try each role’s permissions.',
      { exact: false },
    ),
  ).toBeVisible();
  const sales = screen.getByRole('menuitemradio', { name: /Sophie Bennett/ });
  expect(await within(sales).findByText('Accountant')).toHaveAttribute(
    'data-slot',
    'badge',
  );
  expect(within(sales).getByText('HR specialist')).toHaveAttribute(
    'data-slot',
    'badge',
  );
  await userEvent.click(sales);
  await waitFor(() =>
    expect(view.toasts()).toEqual([
      expect.objectContaining({
        type: 'error',
        title: 'Could not enter this account.',
      }),
    ]),
  );
  expect(requests).toContainEqual({
    method: 'POST',
    path: 'demoMode/accounts/sales/signIn',
  });
  expect(sales).not.toHaveAttribute('aria-disabled', 'true');
  await userEvent.click(sales);
  await waitFor(() =>
    expect(requests.filter(({ method }) => method === 'POST')).toHaveLength(2),
  );
});

it('keeps ordinary application headers free of demo controls', async () => {
  const api = vi.fn(({ path }: ApiCall) =>
    path === 'demoMode/status'
      ? { data: { enabled: false } }
      : new Response(null, { status: 404 }),
  );
  await renderWithApp(<HeaderActions />, {
    route: '/leads',
    namespace: 'nb3-oa',
    namespaces: { 'nb3-oa': locales },
    plugins: [demoMode()],
    fetch: answerApi(api),
  });
  await waitFor(() =>
    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'demoMode/status',
    }),
  );
  expect(
    screen.queryByRole('button', { name: /Demo mode/ }),
  ).not.toBeInTheDocument();
});

it.each([
  { failure: false, label: 'No role label' },
  { failure: true, label: 'Roles unavailable' },
])(
  'shows $label without guessing roles from an account name',
  async ({ failure, label }) => {
    await renderWithApp(<HeaderActions />, {
      namespace: 'nb3-oa',
      namespaces: { 'nb3-oa': locales },
      plugins: [demoMode()],
      fetch: answerApi(({ path }) => {
        if (path === 'demoMode/status') return { data: { enabled: true } };
        if (path === 'demoMode/accounts')
          return {
            data: [
              {
                username: 'unknown',
                name: 'Finance Manager',
                role: '',
                current: true,
              },
            ],
          };
        if (path === 'demoAccountRoles')
          return failure ? new Response(null, { status: 503 }) : { data: [] };
        return new Response(null, { status: 404 });
      }),
    });
    await userEvent.click(
      await screen.findByRole('button', { name: /Switch account/u }),
    );
    const account = await screen.findByRole('menuitemradio', {
      name: /Finance Manager/u,
    });
    expect(await within(account).findByText(label)).toHaveAttribute(
      'data-slot',
      'badge',
    );
  },
);
