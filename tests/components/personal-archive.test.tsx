import { ApiClientError } from '@nocobase/app-client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import packageMetadata from '../../package.json' with { type: 'json' };
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
import PersonalArchivePage from '../../client/pages/employees/personal/index.js';
import { UserMenu } from '../../client/layouts/components/user-menu.js';
vi.mock('../../client/hooks/use-enterprise-identity.js', () => ({
  useEnterpriseIdentity: () => ({ enabled: false, error: false }),
}));

const { api, auth } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  auth: {
    session: {
      user: { id: 'u1', name: 'Test employee', email: 'person@example.test' },
    },
    refresh: vi.fn(),
    client: { signOut: vi.fn() },
  },
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => ({ show: vi.fn() }),
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => auth,
}));
vi.mock('@nocobase/app-plugin-i18n/client', () => ({
  useAppLocale: () => ({ locale: 'en-US', locales: [], switching: false }),
}));

const runtimes = {
  en: await createTestI18nRuntime({
    application: { namespace: packageMetadata.name, resources: enUS },
  }),
  zh: await createTestI18nRuntime({
    locale: 'zh-CN',
    application: { namespace: packageMetadata.name, resources: zhCN },
  }),
};
const employee = {
  id: 'e1',
  userId: 'u1',
  name: 'Test employee',
  code: 'E001',
  status: 'regular',
  hireDate: '2025-01-01',
  primaryDepartment: { id: 'd1', title: 'Test department' },
  position: null,
  grade: null,
  manager: null,
  emergencyContact: 'First line\nSecond line',
};
const profile = {
  employeeId: 'e1',
  access: 'full',
  bankName: 'Test bank',
  bankAccount: '6222000000000000001',
  bankAccountName: 'Test employee',
  idNumber: 'synthetic-id',
  address: 'Address line one\nAddress line two',
};
const error = (status: number) =>
  new ApiClientError('Private raw error', {
    status,
    method: 'GET',
    url: '/api/test',
  });

function show(language: 'en' | 'zh' = 'en', menu = false) {
  return render(
    <TestI18nProvider
      runtime={runtimes[language]}
      namespace={packageMetadata.name}
    >
      <MemoryRouter>
        {menu ? <UserMenu /> : <PersonalArchivePage />}
      </MemoryRouter>
    </TestI18nProvider>,
  );
}
function answer(bank: unknown = { data: profile }) {
  api.request.mockImplementation(async ({ path }: { path: string }) => {
    if (path === 'employees/me') return { data: employee };
    if (path === 'employees/me/profile') {
      if (bank instanceof Error) throw bank;
      return bank;
    }
    throw new Error('Unexpected endpoint');
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  auth.session.user.id = 'u1';
  answer();
});

describe('personal archive', () => {
  it.each(['en', 'zh'] as const)(
    'shows full own payment details using strict %s translations',
    async (language) => {
      show(language);
      expect(await screen.findByText(profile.bankAccount)).toBeInTheDocument();
      expect(screen.getByText('Test employee · E001')).toBeInTheDocument();
      expect(screen.getByText('Test department')).toBeInTheDocument();
      expect(screen.getByText(profile.idNumber)).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /edit|修改|申请/i }),
      ).not.toBeInTheDocument();
      expect(api.request.mock.calls.map(([options]) => options.path)).toEqual([
        'employees/me',
        'employees/me/profile',
      ]);
    },
  );

  it('provides the account-menu link within a deployment basename', async () => {
    render(
      <TestI18nProvider runtime={runtimes.en} namespace={packageMetadata.name}>
        <MemoryRouter basename='/main' initialEntries={['/main']}>
          <UserMenu />
        </MemoryRouter>
      </TestI18nProvider>,
    );
    await userEvent.click(
      screen.getByRole('button', { name: enUS.account.openMenu }),
    );
    expect(
      await screen.findByRole('menuitem', {
        name: enUS.employees.personal.title,
      }),
    ).toHaveAttribute('href', '/main/personal-archive');
  });

  it.each([403, 404, 401])(
    'handles unrecoverable archive %i without retry or controlled reads',
    async (status) => {
      api.request.mockRejectedValue(error(status));
      show();
      await waitFor(() =>
        expect(screen.queryByRole('status')).not.toBeInTheDocument(),
      );
      expect(
        screen.queryByRole('button', { name: enUS['status.retry'] }),
      ).not.toBeInTheDocument();
      expect(api.request).toHaveBeenCalledTimes(1);
      expect(screen.queryByText('Private raw error')).not.toBeInTheDocument();
      if (status === 404)
        expect(
          screen.getByText(enUS.employees.personal.emptyTitle),
        ).toBeInTheDocument();
      if (status === 401)
        expect(
          screen.getByRole('button', { name: enUS.actions.signInAgain }),
        ).toBeInTheDocument();
    },
  );

  it('retains basic data on profile failure and retries only that block, restoring focus', async () => {
    answer(error(500));
    show();
    const retry = await screen.findByRole('button', {
      name: enUS['status.retry'],
    });
    expect(screen.getByText('Test department')).toBeInTheDocument();
    answer();
    await userEvent.click(retry);
    expect(await screen.findByText(profile.bankAccount)).toBeInTheDocument();
    expect(api.request.mock.calls.map(([options]) => options.path)).toEqual([
      'employees/me',
      'employees/me/profile',
      'employees/me/profile',
    ]);
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole('heading', { name: enUS.employees.personal.profile }),
      ),
    );
  });

  it('refreshes both blocks and removes old bank data when the profile session expires', async () => {
    show();
    await screen.findByText(profile.bankAccount);
    answer(error(401));
    await userEvent.click(
      screen.getByRole('button', { name: enUS.employees.personal.refresh }),
    );
    await screen.findByRole('button', { name: enUS.actions.signInAgain });
    expect(screen.queryByText(profile.bankAccount)).not.toBeInTheDocument();
    expect(screen.getByText('Test department')).toBeInTheDocument();
    expect(api.request).toHaveBeenCalledTimes(4);
  });

  it('shows retry progress and focuses the page heading after a basic archive retry', async () => {
    api.request.mockRejectedValue(error(500));
    show();
    const retry = await screen.findByRole('button', {
      name: enUS['status.retry'],
    });
    let finish!: (value: unknown) => void;
    answer();
    api.request.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    await userEvent.click(retry);
    expect(retry).toBeDisabled();
    expect(retry).toHaveAttribute('aria-busy', 'true');
    expect(retry.querySelector('.animate-spin')).not.toBeNull();
    await act(async () => finish({ data: employee }));
    await screen.findByText(profile.bankAccount);
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: enUS.employees.personal.title }),
      ).toHaveFocus(),
    );
  });

  it('preserves previous data during a refresh and on a temporary profile failure', async () => {
    show();
    await screen.findByText(profile.bankAccount);
    let finish!: (value: unknown) => void;
    api.request.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: enUS.employees.personal.refresh }),
    );
    expect(screen.getByText(profile.bankAccount)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: enUS.employees.personal.refresh }),
    ).toBeDisabled();
    answer(error(500));
    await act(async () => finish({ data: employee }));
    await screen.findByRole('button', { name: enUS['status.retry'] });
    expect(screen.getByText(profile.bankAccount)).toBeInTheDocument();
  });

  it('clears state on an identity change and ignores an obsolete response', async () => {
    const view = show();
    await screen.findByText(profile.bankAccount);
    let finish!: (value: unknown) => void;
    let oldSignal!: AbortSignal;
    api.request.mockImplementationOnce(({ signal }) => {
      oldSignal = signal;
      return new Promise((resolve) => {
        finish = resolve;
      });
    });
    await userEvent.click(
      screen.getByRole('button', { name: enUS.employees.personal.refresh }),
    );
    auth.session.user.id = 'u2';
    api.request.mockRejectedValue(error(404));
    // A mounted parent rerenders when the authentication provider changes identity.
    view.rerender(
      <TestI18nProvider runtime={runtimes.en} namespace={packageMetadata.name}>
        <MemoryRouter>
          <PersonalArchivePage />
        </MemoryRouter>
      </TestI18nProvider>,
    );
    expect(screen.queryByText(profile.bankAccount)).not.toBeInTheDocument();
    expect(oldSignal.aborted).toBe(true);
    await screen.findByText(enUS.employees.personal.emptyTitle);
    await act(async () =>
      finish({ data: { ...employee, name: 'Obsolete identity' } }),
    );
    expect(screen.queryByText('Obsolete identity')).not.toBeInTheDocument();
    expect(screen.queryByText(profile.bankAccount)).not.toBeInTheDocument();
  });
});
