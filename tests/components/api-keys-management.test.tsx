import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import enUS from '../../client/locales/en-US.js';
import keysLocale from '../../client/locales/administration/api-keys/en-US.js';
import ApiKeysPage from '../../client/pages/administration/api-keys/pages/api-keys-page.js';
const toaster = vi.hoisted(() => ({ show: vi.fn() }));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useToaster: () => toaster,
}));
const auth = vi.hoisted(() => ({
  apiKey: { list: vi.fn(), create: vi.fn(), delete: vi.fn() },
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthenticationClient: () => auth,
}));
const ns = '@nocobase/app-plugin-api-keys';
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
  namespaces: { [ns]: keysLocale },
});
const records = [
  {
    id: 'old',
    name: 'Old key',
    enabled: true,
    lastRequest: '2026-01-01T00:00:00Z',
    expiresAt: null,
    start: 'old_',
    prefix: null,
  },
  {
    id: 'new',
    name: 'New key',
    enabled: true,
    lastRequest: '2026-10-01T00:00:00Z',
    expiresAt: null,
    start: 'new_',
    prefix: null,
  },
];
beforeEach(() => {
  vi.clearAllMocks();
  auth.apiKey.list.mockResolvedValue({ data: { apiKeys: records } });
});
function mount() {
  render(
    <TestI18nProvider runtime={runtime} namespace={ns}>
      <ApiKeysPage />
    </TestI18nProvider>,
  );
}
it('sorts dates, distinguishes no results and restores rows when filters clear', async () => {
  mount();
  await screen.findByText('New key');
  let rows = screen.getAllByRole('row');
  expect(rows[1]).toHaveTextContent('New key');
  await userEvent.click(
    screen.getByRole('button', { name: keysLocale.page.columns.lastUsed }),
  );
  rows = screen.getAllByRole('row');
  expect(rows[1]).toHaveTextContent('Old key');
  await userEvent.type(
    screen.getByRole('textbox', { name: keysLocale.page.search }),
    'no-match',
  );
  expect(screen.getByText(keysLocale.page.noResults)).toBeInTheDocument();
  await userEvent.click(
    screen.getByRole('button', { name: keysLocale.page.clear }),
  );
  expect(screen.getByText('Old key')).toBeInTheDocument();
});
it('opens revocation from a named menu and retains the confirmation when it fails', async () => {
  auth.apiKey.delete.mockResolvedValue({
    error: { message: 'private backend detail' },
  });
  mount();
  await userEvent.click(
    await screen.findByRole('button', { name: 'Actions for "New key"' }),
  );
  await userEvent.click(
    await screen.findByRole('menuitem', {
      name: keysLocale.page.actions.revoke,
    }),
  );
  const dialog = screen.getByRole('alertdialog');
  expect(auth.apiKey.delete).not.toHaveBeenCalled();
  await userEvent.click(
    within(dialog).getByRole('button', { name: keysLocale.revoke.confirm }),
  );
  await within(dialog).findByText(keysLocale.errors.revokeFailed);
  expect(dialog).toBeInTheDocument();
  expect(screen.queryByText('private backend detail')).toBeNull();
});
it('validates the name inline before creating a key', async () => {
  mount();
  await userEvent.click(
    screen.getByRole('button', { name: keysLocale.page.add }),
  );
  const dialog = screen.getByRole('dialog');
  await userEvent.click(
    within(dialog).getByRole('button', { name: keysLocale.form.create }),
  );
  expect(within(dialog).getByRole('textbox')).toHaveFocus();
  expect(
    await within(dialog).findByText(keysLocale.errors.nameRequired),
  ).toBeInTheDocument();
  expect(auth.apiKey.create).not.toHaveBeenCalled();
  await waitFor(() => expect(auth.apiKey.list).toHaveBeenCalledOnce());
});

it('reports the revoked key by name after a successful request', async () => {
  auth.apiKey.delete.mockResolvedValue({});
  mount();
  await userEvent.click(
    await screen.findByRole('button', { name: 'Actions for "New key"' }),
  );
  await userEvent.click(
    await screen.findByRole('menuitem', {
      name: keysLocale.page.actions.revoke,
    }),
  );
  await userEvent.click(
    within(screen.getByRole('alertdialog')).getByRole('button', {
      name: keysLocale.revoke.confirm,
    }),
  );
  await waitFor(() =>
    expect(toaster.show).toHaveBeenCalledWith({
      type: 'success',
      title: 'Revoked key "New key"',
    }),
  );
});

it('keeps a newly issued key in a right drawer until copied and closed', async () => {
  const user = userEvent.setup();
  auth.apiKey.create.mockResolvedValue({ data: { key: 'synthetic-test-key' } });
  mount();
  await user.click(screen.getByRole('button', { name: keysLocale.page.add }));
  const create = screen.getByRole('dialog');
  expect(create).toHaveAttribute('data-presentation', 'drawer');
  await user.type(within(create).getByRole('textbox'), 'Fixture integration');
  await user.click(
    within(create).getByRole('button', { name: keysLocale.form.create }),
  );
  const reveal = await screen.findByRole('dialog', {
    name: keysLocale.reveal.title,
  });
  expect(reveal).toHaveAttribute('data-presentation', 'drawer');
  expect(within(reveal).getByText('synthetic-test-key')).toBeInTheDocument();
  await user.click(
    within(reveal).getByRole('button', { name: keysLocale.reveal.copy }),
  );
  expect(await navigator.clipboard.readText()).toBe('synthetic-test-key');
  await user.click(
    within(reveal).getByRole('button', { name: keysLocale.reveal.done }),
  );
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(auth.apiKey.create).toHaveBeenCalledOnce();
});
