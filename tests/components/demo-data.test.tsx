import { ApiClientError } from '@nocobase/app-client';
import { act } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
import Page from '../../client/pages/demo-data/index.js';
import type { DemoStatus } from '../../client/pages/demo-data/types.js';
const { api, grants, toaster } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  grants: new Set(['import', 'remove', 'credentials']),
  toaster: { show: vi.fn() },
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => toaster,
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useCan: ({ action }: { action: string }) => ({
    can: grants.has(action),
    isPending: false,
    error: undefined,
  }),
}));
const empty: DemoStatus = {
  state: 'absent',
  version: 0,
  timeZone: 'Asia/Singapore',
  completedSteps: 0,
  totalSteps: 0,
  moduleCoverage: [],
  safeFailures: [],
  accounts: [],
};
const ready: DemoStatus = {
  ...empty,
  state: 'ready',
  version: 1,
  datasetId: 'demo-test',
  locale: 'en-US',
  baseDate: '2026-10-19',
  completedSteps: 80,
  accounts: [
    {
      role: 'sales',
      id: 'sales',
      name: 'Olivia Bennett',
      username: 'demo.sales',
      email: 'olivia@example.test',
    },
  ],
};
function ExternalNavigation() {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate('?q=Daniel&page=99')}>
      External search
    </button>
  );
}
async function mount(locale = 'en-US') {
  const runtime = await createTestI18nRuntime({
    locale,
    application: {
      namespace: 'nb3-oa',
      resources: locale === 'zh-CN' ? zhCN : enUS,
    },
  });
  return render(
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter>
        <ExternalNavigation />
        <Page />
      </MemoryRouter>
    </TestI18nProvider>,
  );
}
beforeEach(() => {
  api.request.mockReset();
  toaster.show.mockReset();
  grants.clear();
  for (const a of ['import', 'remove', 'credentials']) grants.add(a);
});
it.each(['en-US', 'zh-CN'])(
  'imports selected data language and immediately renders background progress (%s)',
  async (locale) => {
    api.request.mockImplementation(async (r) =>
      r.method ? { data: { ...ready, state: 'importing' } } : { data: empty },
    );
    await mount(locale);
    const name = locale === 'zh-CN' ? '导入' : 'Import';
    await userEvent.click(
      await screen.findByRole('button', { name, exact: true }),
    );
    await waitFor(() =>
      expect(api.request).toHaveBeenCalledWith(
        expect.objectContaining({
          path: 'demoData/import',
          json: expect.objectContaining({
            locale: locale === 'zh-CN' ? 'zh-CN' : 'en-US',
            expectedVersion: 0,
            requestKey: expect.any(String),
          }),
        }),
      ),
    );
    expect(
      await screen.findByText(
        locale === 'zh-CN'
          ? '操作正在进行，请等待完成。'
          : 'An operation is in progress. Wait for it to finish.',
      ),
    ).toBeVisible();
  },
);
it('previews removal, cancellation makes no deletion request, and blocked references have no confirm action', async () => {
  api.request.mockImplementation(async (r) =>
    r.path === 'demoData/removePreview'
      ? {
          data: {
            previewToken: 'preview',
            records: 20,
            accounts: 1,
            blocked: true,
            version: 1,
          },
        }
      : { data: ready },
  );
  await mount();
  await userEvent.click(
    await screen.findByRole('button', { name: 'Remove', exact: true }),
  );
  const dialog = await screen.findByRole('alertdialog');
  expect(
    within(dialog).getByText(
      'User records reference demo data. Remove those links first.',
    ),
  ).toBeVisible();
  expect(
    within(dialog).queryByRole('button', { name: 'Remove', exact: true }),
  ).toBeNull();
  await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
  expect(
    api.request.mock.calls.some(([r]) => r.path === 'demoData/remove'),
  ).toBe(false);
});
it('fetches credentials only after explicit action and clears them when closed', async () => {
  api.request.mockImplementation(async (r) =>
    r.path === 'demoData/credentials'
      ? {
          data: {
            accounts: [
              { ...ready.accounts[0], password: 'UniqueDemoPassword!' },
            ],
          },
        }
      : { data: ready },
  );
  await mount();
  await screen.findByText('Olivia Bennett');
  expect(screen.queryByText('UniqueDemoPassword!')).toBeNull();
  await userEvent.click(
    screen.getByRole('button', { name: 'View sign-in details' }),
  );
  const panel = await screen.findByRole('dialog');
  expect(await within(panel).findByText('UniqueDemoPassword!')).toBeVisible();
  await userEvent.click(
    within(panel).getByRole('button', { name: 'Close', exact: true }),
  );
  await waitFor(() =>
    expect(screen.queryByText('UniqueDemoPassword!')).toBeNull(),
  );
});
it('hides all management actions when their distinct grants are missing', async () => {
  grants.clear();
  api.request.mockResolvedValue({ data: ready });
  await mount();
  await screen.findByText('Olivia Bennett');
  for (const name of ['Import', 'Remove', 'View sign-in details'])
    expect(screen.queryByRole('button', { name, exact: true })).toBeNull();
});

it('invalidates an expired removal preview and reloads current status', async () => {
  api.request.mockImplementation(async (r) => {
    if (r.path === 'demoData/removePreview')
      return {
        data: {
          previewToken: 'expired',
          version: 1,
          records: 20,
          accounts: 1,
          blocked: false,
        },
      };
    if (r.path === 'demoData/remove')
      throw new ApiClientError('private', {
        status: 409,
        reason: 'DEMO_CHANGED',
      });
    return { data: ready };
  });
  await mount();
  await userEvent.click(
    await screen.findByRole('button', { name: 'Remove', exact: true }),
  );
  const panel = await screen.findByRole('alertdialog');
  await userEvent.click(
    within(panel).getByRole('button', { name: 'Remove', exact: true }),
  );
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
  expect(
    screen.getByText('Data has changed. Review it before continuing.'),
  ).toBeVisible();
  expect(
    api.request.mock.calls.filter(([r]) => r.path === 'demoData/remove'),
  ).toHaveLength(1);
});
it('clears visible credentials when polling finds the batch removed elsewhere', async () => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
  let current = ready;
  api.request.mockImplementation(async (r) =>
    r.path === 'demoData/credentials'
      ? {
          data: {
            accounts: [{ ...ready.accounts[0], password: 'TransientSecret!' }],
          },
        }
      : { data: current },
  );
  try {
    await mount();
    await userEvent.click(
      await screen.findByRole('button', { name: 'View sign-in details' }),
    );
    expect(await screen.findByText('TransientSecret!')).toBeVisible();
    current = { ...empty, version: 2 };
    await act(() => vi.advanceTimersByTimeAsync(15000));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.queryByText('TransientSecret!')).toBeNull();
  } finally {
    vi.useRealTimers();
  }
});
it.each([401, 403, 404])(
  'offers navigation without a Retry for status %i',
  async (status) => {
    api.request.mockRejectedValue(
      new ApiClientError('private', { status, reason: 'ACCESS_DENIED' }),
    );
    await mount();
    expect(
      await screen.findByRole('link', {
        name: status === 401 ? 'Sign in again' : 'Back to workbench',
      }),
    ).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  },
);

it('synchronizes account search after external URL navigation and clamps stale pages', async () => {
  api.request.mockResolvedValue({
    data: {
      ...ready,
      accounts: [
        ...ready.accounts,
        {
          role: 'manager',
          id: 'manager',
          name: 'Daniel Brooks',
          username: 'demo.manager',
          email: 'daniel@example.test',
        },
      ],
    },
  });
  await mount();
  await screen.findByText('Olivia Bennett');
  await userEvent.click(
    screen.getByRole('button', { name: 'External search' }),
  );
  await waitFor(() =>
    expect(screen.getByRole('textbox')).toHaveValue('Daniel'),
  );
  expect(await screen.findByText('Daniel Brooks')).toBeVisible();
  expect(screen.queryByText('Olivia Bennett')).not.toBeInTheDocument();
});
