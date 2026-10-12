import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { beforeEach, expect, it, vi } from 'vitest';
import { ApiClientError } from '@nocobase/app-client';
import enUS from '../../../client/locales/en-US.js';
import locale from '../../../client/locales/modules/template-print.en-US.js';
import Detail from '../../../client/pages/template-print/detail.js';
import Print from '../../../client/pages/template-print/print-dialog.js';
const { api, close, reload, toaster, denyResource } = vi.hoisted(() => ({
  api: { request: vi.fn(), stream: vi.fn() },
  denyResource: { id: '' },
  close: vi.fn().mockResolvedValue(undefined),
  reload: vi.fn(),
  toaster: { show: vi.fn() },
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => toaster,
  usePageBreadcrumb: () => undefined,
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: 'alice' } } }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useCan: ({ resource }: { resource: { id: string } }) => ({
    can: resource.id !== denyResource.id,
    isPending: false,
  }),
}));
vi.mock('../../../client/components/route-child-page.js', () => ({
  RouteChildPage: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('../../../client/components/route-dialog.js', () => ({
  RouteDialog: ({
    children,
    footer,
  }: {
    children: React.ReactNode;
    footer: React.ReactNode;
  }) => (
    <div>
      {children}
      {footer}
    </div>
  ),
}));
vi.mock(
  '../../../client/components/use-route-overlay.js',
  async (original) => ({
    ...(await original<
      typeof import('../../../client/components/use-route-overlay.js')
    >()),
    useRouteOverlay: () => ({ close }),
  }),
);
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: { ...enUS, ...locale } },
});
const record = {
  id: 't1',
  name: 'Private template',
  source: 'leave',
  active: false,
  version: 1,
  currentRevisionId: 'rev',
};
const detail = {
  data: {
    record,
    sourceReady: true,
    revisions: [
      {
        id: 'rev',
        number: 1,
        contentHash: 'Private fingerprint',
        paths: ['Private field'],
        createdAt: '2026-01-01',
      },
    ],
  },
};
const denied = (method: string, status = 403) =>
  new ApiClientError('denied', { status, method, url: '/x' });
function show(print = false, source = 'leave') {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: (
          <Outlet
            context={{
              reload,
              printSource: source,
              printRecordId: 'record1',
              printRecordName: 'Business record',
              printRefresh: reload,
            }}
          />
        ),
        children: [
          { path: ':templateId', element: print ? <Print /> : <Detail /> },
        ],
      },
    ],
    { initialEntries: ['/t1'] },
  );
  render(
    <TestI18nProvider runtime={runtime}>
      <RouterProvider router={router} />
    </TestI18nProvider>,
  );
}
beforeEach(() => {
  cleanup();
  denyResource.id = '';
  sessionStorage.clear();
  api.request.mockReset();
  api.stream.mockReset();
  reload.mockReset();
  close.mockClear();
  toaster.show.mockClear();
});
it.each(['GET', 'PATCH'])(
  'removes loaded metadata/history after a denied active-action %s',
  async (method) => {
    const user = userEvent.setup();
    let reads = 0;
    api.request.mockImplementation(async (o) => {
      if (o.method) throw denied('PATCH');
      if (++reads > 1 && method === 'GET') throw denied('GET');
      return detail;
    });
    show();
    await screen.findByText('Private fingerprint');
    await user.click(
      screen.getByRole('button', {
        name: 'Actions for template "Private template"',
      }),
    );
    await user.click(await screen.findByRole('menuitem', { name: 'Enable' }));
    await waitFor(() =>
      expect(screen.queryByText('Private fingerprint')).toBeNull(),
    );
    expect(
      screen.queryByRole('heading', { name: 'Private template' }),
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Download', exact: true }),
    ).toBeNull();
  },
);
it('removes loaded metadata/history and journals after denied revision content', async () => {
  const user = userEvent.setup();
  api.request.mockResolvedValue(detail);
  api.stream.mockRejectedValue(denied('GET'));
  sessionStorage.setItem('oa:templatePrint:pending:alice:new:', '{}');
  show();
  await screen.findByText('Private fingerprint');
  await user.click(
    screen.getByRole('button', { name: 'Download', exact: true }),
  );
  await waitFor(() =>
    expect(screen.queryByText('Private fingerprint')).toBeNull(),
  );
  expect(
    screen.queryByRole('heading', { name: 'Private template' }),
  ).toBeNull();
  expect(sessionStorage.length).toBe(0);
});
it('removes selected detail, choices and download eligibility after denied render', async () => {
  const user = userEvent.setup();
  api.request.mockImplementation(async (o) =>
    o.path === 'printTemplates'
      ? {
          data: [{ ...record, active: true }],
          meta: { total: 1, page: 1, pageSize: 20 },
        }
      : { data: { ...detail.data, record: { ...record, active: true } } },
  );
  api.stream.mockRejectedValue(denied('POST'));
  show(true);
  await user.click(await screen.findByRole('combobox'));
  await user.click(
    await screen.findByRole('option', { name: 'Private template' }),
  );
  expect(screen.getByRole('combobox')).toHaveTextContent('Private template');
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Download', exact: true }),
    ).not.toBeDisabled(),
  );
  await user.click(
    screen.getByRole('button', { name: 'Download', exact: true }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Download', exact: true }),
    ).toBeDisabled(),
  );
  expect(screen.queryByRole('combobox')).toBeNull();
  expect(screen.queryByText(/Current revision:/)).toBeNull();
});
it('returns missing selected templates to the actual source and refreshes it', async () => {
  const user = userEvent.setup();
  api.request.mockImplementation(async (o) => {
    if (o.path === 'printTemplates')
      return {
        data: [{ ...record, active: true }],
        meta: { total: 1, page: 1, pageSize: 20 },
      };
    throw denied('GET', 404);
  });
  show(true);
  await user.click(await screen.findByRole('combobox'));
  await user.click(
    await screen.findByRole('option', { name: 'Private template' }),
  );
  await waitFor(() => expect(close).toHaveBeenCalled());
  expect(reload).toHaveBeenCalled();
  expect(toaster.show).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'info' }),
  );
});

it('contract printing depends on contract viewing rather than payment viewing', async () => {
  const user = userEvent.setup();
  denyResource.id = 'oa.payment';
  api.request.mockImplementation(async (o) =>
    o.path === 'printTemplates'
      ? {
          data: [{ ...record, source: 'contracts', active: true }],
          meta: { total: 1, page: 1, pageSize: 20 },
        }
      : {
          data: {
            ...detail.data,
            record: { ...record, source: 'contracts', active: true },
          },
        },
  );
  show(true, 'contracts');
  await user.click(await screen.findByRole('combobox'));
  await user.click(
    await screen.findByRole('option', { name: 'Private template' }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Download', exact: true }),
    ).not.toBeDisabled(),
  );
  cleanup();
  api.request.mockClear();
  denyResource.id = 'oa.contract';
  show(true, 'contracts');
  await screen.findByText('Access denied. Contact an administrator');
  expect(api.request).not.toHaveBeenCalled();
  expect(screen.queryByRole('combobox')).toBeNull();
});
