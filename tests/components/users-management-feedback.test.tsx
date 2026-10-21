import { ApiClientError } from '@nocobase/app-client';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import enUS from '../../client/locales/en-US.js';
import usersLocale from '../../client/locales/administration/users/en-US.js';
import authorizationLocale from '../../client/locales/administration/authorization/en-US.js';
import UsersPage from '../../client/pages/administration/users/pages/users-page.js';
const state = vi.hoisted(() => ({
  viewer: 'admin',
  revision: 1,
  api: {},
  refresh: undefined as (() => void) | undefined,
  client: {
    options: vi.fn(),
    list: vi.fn(),
    listInvitations: vi.fn(),
    revokeSessions: vi.fn(),
    create: vi.fn(),
    resetPassword: vi.fn(),
  },
  authorization: { can: vi.fn(), onInvalidated: vi.fn(), invalidate: vi.fn() },
  toaster: { show: vi.fn() },
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => state.api,
  useToaster: () => state.toaster,
  useService: () => state.authorization,
  useClientApplication: () => ({ runtime: { routes: [] } }),
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: state.viewer } } }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', async (original) => ({
  ...(await original<
    typeof import('@nocobase/app-plugin-authorization/client')
  >()),
  useCan: () => ({ can: false }),
  useAuthorizationRevision: () => state.revision,
}));
vi.mock(
  '../../client/pages/administration/users/user-client.js',
  async (original) => ({
    ...(await original<
      typeof import('../../client/pages/administration/users/user-client.js')
    >()),
    UsersClient: class {
      constructor() {
        return state.client;
      }
    },
  }),
);
const ns = '@nocobase/app-plugin-users';
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
  namespaces: {
    [ns]: usersLocale,
    '@nocobase/app-plugin-authorization': authorizationLocale,
  },
});
const user = {
  id: 'u1',
  name: 'Alice',
  username: 'alice',
  email: 'alice@example.com',
  disabledAt: null,
  roleScopes: {},
};
beforeEach(() => {
  vi.clearAllMocks();
  state.viewer = 'admin';
  state.revision = 1;
  state.client.options.mockResolvedValue({ roleScopes: [] });
  state.client.list.mockResolvedValue({
    items: [user],
    total: 1,
    page: 1,
    pageSize: 20,
  });
  state.client.listInvitations.mockResolvedValue([]);
  state.authorization.can.mockResolvedValue(true);
  state.authorization.onInvalidated.mockImplementation(
    (listener: () => void) => {
      state.refresh = listener;
      return () => {};
    },
  );
  state.client.revokeSessions.mockResolvedValue(undefined);
});
function mount() {
  return render(
    <TestI18nProvider runtime={runtime} namespace={ns}>
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>
    </TestI18nProvider>,
  );
}
it('confirms session revocation by user name and shows success only after confirmation', async () => {
  mount();
  await userEvent.click(
    await screen.findByRole('button', { name: 'Actions for Alice' }),
  );
  await userEvent.click(
    await screen.findByRole('menuitem', {
      name: usersLocale.page.actions.revokeSessions,
    }),
  );
  const confirm = screen.getByRole('alertdialog');
  expect(confirm).toHaveTextContent('Alice');
  expect(state.client.revokeSessions).not.toHaveBeenCalled();
  await userEvent.click(
    within(confirm).getByRole('button', { name: usersLocale.sessions.confirm }),
  );
  await waitFor(() =>
    expect(state.client.revokeSessions).toHaveBeenCalledWith('u1'),
  );
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
  expect(state.toaster.show).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'success',
      title: 'Revoked sessions for "Alice"',
    }),
  );
});
it('retains a rejected create form and its input with the error inside the dialog', async () => {
  state.client.create.mockRejectedValue(new Error('private create failure'));
  mount();
  await userEvent.click(
    await screen.findByRole('button', { name: usersLocale.page.add }),
  );
  const dialog = screen.getByRole('dialog');
  const name = within(dialog).getByRole('textbox', { name: /Name/ });
  const email = within(dialog).getByRole('textbox', { name: /Email/ });
  await userEvent.type(name, 'New employee');
  await userEvent.type(email, 'new@example.com');
  await userEvent.type(
    within(dialog).getByLabelText(/Password/),
    'a-password-for-fixture',
  );
  await userEvent.click(
    within(dialog).getByRole('button', { name: usersLocale.form.create }),
  );
  await within(dialog).findByRole('alert');
  expect(name).toHaveValue('New employee');
  expect(email).toHaveValue('new@example.com');
  expect(within(dialog).getByRole('alert')).toHaveTextContent(
    usersLocale.errors.operationFailed,
  );
  expect(screen.queryByText('private create failure')).toBeNull();
});

it.each([401, 403, 404])(
  'clears retained user data and capabilities after terminal refresh status %s',
  async (status) => {
    mount();
    await screen.findByText('Alice');
    state.client.list.mockRejectedValueOnce(
      new ApiClientError('private denied detail', {
        status,
        method: 'GET',
        url: '/api/users',
      }),
    );
    act(() => state.refresh?.());
    await waitFor(() => expect(screen.queryByText('Alice')).toBeNull());
    expect(
      screen.queryByRole('button', { name: usersLocale.page.add }),
    ).toBeNull();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(
      status === 401
        ? enUS['status.sessionExpired']
        : status === 403
          ? usersLocale.errors.loadForbidden
          : usersLocale.errors.loadNotFound,
    );
    expect(
      within(alert).queryByRole('button', { name: usersLocale.page.retry }),
    ).toBeNull();
    expect(screen.queryByText('private denied detail')).toBeNull();
  },
);

it('retains user rows and offers retry for a temporary refresh failure', async () => {
  mount();
  await screen.findByText('Alice');
  state.client.list.mockRejectedValueOnce(new Error('private network detail'));
  act(() => state.refresh?.());
  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent(usersLocale.errors.loadFailed);
  expect(screen.getByText('Alice')).toBeInTheDocument();
  expect(
    within(alert).getByRole('button', { name: usersLocale.page.retry }),
  ).toBeInTheDocument();
  expect(screen.queryByText('private network detail')).toBeNull();
});

it('validates translated create fields on submit and focuses the first invalid control', async () => {
  mount();
  await userEvent.click(
    await screen.findByRole('button', { name: usersLocale.page.add }),
  );
  const dialog = screen.getByRole('dialog');
  await userEvent.click(
    within(dialog).getByRole('button', { name: usersLocale.form.create }),
  );
  expect(within(dialog).getByRole('textbox', { name: /Name/ })).toHaveFocus();
  expect(
    await within(dialog).findByText(usersLocale.form.nameRequired),
  ).toBeInTheDocument();
  expect(state.client.create).not.toHaveBeenCalled();
  await userEvent.type(
    within(dialog).getByRole('textbox', { name: /Name/ }),
    'New employee',
  );
  await userEvent.type(
    within(dialog).getByRole('textbox', { name: /Email/ }),
    'invalid-email',
  );
  await userEvent.click(
    within(dialog).getByRole('button', { name: usersLocale.form.create }),
  );
  expect(within(dialog).getByRole('textbox', { name: /Email/ })).toHaveFocus();
  expect(
    within(dialog).getByText(usersLocale.form.emailInvalid),
  ).toBeInTheDocument();
});
it('reuses metadata and row capabilities while searching but isolates the cache by viewer and authorization revision', async () => {
  const rendered = mount();
  await screen.findByText('Alice');
  const capabilityReads = state.authorization.can.mock.calls.length;
  await userEvent.type(
    screen.getByRole('textbox', { name: usersLocale.page.search }),
    'Alice',
  );
  await waitFor(() =>
    expect(state.client.list.mock.calls.length).toBeGreaterThan(1),
  );
  await waitFor(() =>
    expect(screen.queryByLabelText(usersLocale.page.loading)).toBeNull(),
  );
  expect(state.client.options).toHaveBeenCalledTimes(1);
  expect(state.authorization.can).toHaveBeenCalledTimes(capabilityReads);
  state.revision++;
  rendered.rerender(
    <TestI18nProvider runtime={runtime} namespace={ns}>
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>
    </TestI18nProvider>,
  );
  expect(screen.queryByText('Alice')).toBeNull();
  await screen.findByText('Alice');
  expect(state.client.options).toHaveBeenCalledTimes(2);
  expect(state.authorization.can.mock.calls.length).toBeGreaterThan(
    capabilityReads,
  );
  state.viewer = 'other-admin';
  rendered.rerender(
    <TestI18nProvider runtime={runtime} namespace={ns}>
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>
    </TestI18nProvider>,
  );
  expect(screen.queryByText('Alice')).toBeNull();
  await screen.findByText('Alice');
  expect(state.client.options).toHaveBeenCalledTimes(3);
});

it('validates a reset password inline and reports a successful named reset', async () => {
  state.client.resetPassword.mockResolvedValue(undefined);
  mount();
  await userEvent.click(
    await screen.findByRole('button', { name: 'Actions for Alice' }),
  );
  await userEvent.click(
    await screen.findByRole('menuitem', {
      name: usersLocale.page.actions.resetPassword,
    }),
  );
  const dialog = screen.getByRole('dialog');
  await userEvent.click(
    within(dialog).getByRole('button', { name: usersLocale.password.submit }),
  );
  expect(within(dialog).getByLabelText(/New password/)).toHaveFocus();
  expect(state.client.resetPassword).not.toHaveBeenCalled();
  await userEvent.type(
    within(dialog).getByLabelText(/New password/),
    'fixture-password',
  );
  await userEvent.click(
    within(dialog).getByRole('button', { name: usersLocale.password.submit }),
  );
  await waitFor(() =>
    expect(state.client.resetPassword).toHaveBeenCalledWith(
      'u1',
      'fixture-password',
    ),
  );
  expect(state.toaster.show).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'success',
      title: 'Reset password for "Alice"',
    }),
  );
});
