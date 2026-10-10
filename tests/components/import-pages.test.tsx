// Component tests of the import module's settings page: the history list, the check-then-import dialog and the
// detail drawer. Only what the pages reach outside themselves is mocked.
import { ApiClientError } from '@nocobase/app-client';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement, ReactNode } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import enUS from '../../client/locales/en-US.js';
import ImportRunDrawer from '../../client/pages/import/detail.js';
import ImportPage from '../../client/pages/import/index.js';
import NewImportDialog from '../../client/pages/import/new.js';

const { api, toaster, permission, refresh } = vi.hoisted(() => ({
  api: { request: vi.fn(), stream: vi.fn() },
  toaster: { show: vi.fn(), close: vi.fn() },
  permission: { can: true, isPending: false, error: undefined as unknown },
  refresh: vi.fn(),
}));

vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => toaster,
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ refresh }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useCan: () => ({
    can: permission.can,
    isPending: permission.isPending,
    error: permission.error,
    retry: vi.fn(),
  }),
}));

const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
const copy = enUS.import;

function I18n({ children }: { readonly children: ReactNode }): ReactElement {
  return <TestI18nProvider runtime={runtime}>{children}</TestI18nProvider>;
}

type Handler = (options: {
  path: string;
  method?: string;
  query?: Record<string, unknown>;
  body?: unknown;
}) => unknown;

function serve(handlers: Record<string, Handler>): void {
  api.request.mockImplementation(
    (options: { path: string; method?: string }) => {
      const key = `${options.method ?? 'GET'} ${options.path}`;
      const handler = handlers[key];
      if (!handler) return Promise.reject(new Error(`Unexpected ${key}`));
      try {
        return Promise.resolve(handler(options));
      } catch (error) {
        return Promise.reject(error);
      }
    },
  );
}

function apiError(status: number) {
  return new ApiClientError('failed', {
    status,
    method: 'GET',
    url: '/api/x',
    payload: { error: {} },
  } as ConstructorParameters<typeof ApiClientError>[1]);
}

function renderRoutes(url: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/import',
        element: <ImportPage />,
        children: [
          { path: 'new', element: <NewImportDialog /> },
          { path: ':runId', element: <ImportRunDrawer /> },
        ],
      },
    ],
    { initialEntries: [url] },
  );
  render(<RouterProvider router={router} />, { wrapper: I18n });
  return router;
}

const run = {
  id: 'r1',
  kind: 'employees',
  status: 'failed',
  filename: 'people.xlsx',
  file: { id: 'f1', size: 1024, contentUrl: '/main/uploads/imports/f1.xlsx' },
  actor: { id: 'u1', name: 'Alice' },
  rowCount: 3,
  createdCount: 0,
  updatedCount: 0,
  unchangedCount: 0,
  errorCount: 1,
  createdAt: '2026-10-10T08:00:00.000Z',
  finishedAt: '2026-10-10T08:00:01.000Z',
};

const workbook = () =>
  new File(['xlsx'], 'departments.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

beforeEach(() => {
  api.request.mockReset();
  api.stream.mockReset();
  toaster.show.mockReset();
  permission.can = true;
  permission.isPending = false;
  permission.error = undefined;
});

describe('import history', () => {
  it('lists attempts with the kind filter from the URL and opens one over the filtered list', async () => {
    serve({
      'GET imports': () => ({
        data: [run],
        meta: { total: 1, page: 1, pageSize: 20 },
      }),
      'GET imports/r1': () => ({
        data: {
          ...run,
          errors: [
            {
              row: 2,
              column: 'user',
              header: '登录账号',
              code: 'USER_NOT_FOUND',
              value: 'ghost@x.test',
            },
          ],
        },
      }),
    });
    const router = renderRoutes('/import?kind=employees');
    const link = await screen.findByRole('link', { name: /2026/ });
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'imports',
        query: expect.objectContaining({
          kind: 'employees',
          page: 1,
        }) as unknown,
      }),
    );
    expect(screen.getByText(copy.status.failed)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: copy.actions.downloadFile }),
    ).toHaveAttribute('href', '/main/uploads/imports/f1.xlsx');
    await userEvent.click(link);
    const drawer = await screen.findByRole('dialog');
    expect(router.state.location.pathname).toBe('/import/r1');
    expect(router.state.location.search).toBe('?kind=employees');
    expect(
      await within(drawer).findByText(
        'No account "ghost@x.test". Imports never create accounts: create it on the Users page first.',
      ),
    ).toBeInTheDocument();
    expect(within(drawer).getByText('登录账号')).toBeInTheDocument();
  });

  it('shows the empty state with the primary action, and without it for a reader', async () => {
    serve({
      'GET imports': () => ({
        data: [],
        meta: { total: 0, page: 1, pageSize: 20 },
      }),
    });
    renderRoutes('/import');
    expect(await screen.findByText(copy.empty.title)).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: copy.actions.new }),
    ).toHaveLength(1);
  });

  it('hides importing from a reader', async () => {
    permission.can = false;
    serve({
      'GET imports': () => ({
        data: [],
        meta: { total: 0, page: 1, pageSize: 20 },
      }),
    });
    renderRoutes('/import');
    expect(await screen.findByText(copy.empty.readOnly)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: copy.actions.new }),
    ).not.toBeInTheDocument();
  });

  it('offers retry on a server error', async () => {
    serve({
      'GET imports': () => {
        throw apiError(500);
      },
    });
    renderRoutes('/import');
    expect(await screen.findByText(copy.loadFailedTitle)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: enUS['status.retry'] }),
    ).toBeInTheDocument();
  });
});

describe('new import', () => {
  const emptyList = () => ({
    data: [],
    meta: { total: 0, page: 1, pageSize: 20 },
  });

  it('validates on submit, then shows the problems of a file and sends nothing more', async () => {
    serve({
      'GET imports': emptyList,
      'POST imports/preview': () => ({
        data: {
          kind: 'departments',
          result: 'invalid',
          rowCount: 2,
          createdCount: 0,
          updatedCount: 0,
          unchangedCount: 0,
          errorCount: 2,
          errors: [
            {
              row: 3,
              column: 'parentCode',
              header: '上级部门编码',
              code: 'PARENT_CYCLE',
              value: 'A',
            },
            {
              row: 4,
              column: 'code',
              header: '部门编码',
              code: 'DUPLICATE_IN_FILE',
              value: 'A',
              params: { firstRow: 2 },
            },
          ],
        },
      }),
    });
    renderRoutes('/import/new');
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(
      within(dialog).getByRole('button', { name: copy.actions.check }),
    );
    expect(
      within(dialog).getByText(copy.validation.kindRequired),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(copy.validation.fileRequired),
    ).toBeInTheDocument();
    expect(api.request).not.toHaveBeenCalledWith(
      expect.objectContaining({ path: 'imports/preview' }),
    );

    await userEvent.click(within(dialog).getByRole('combobox'));
    await userEvent.click(
      await screen.findByRole('option', { name: copy.kinds.departments }),
    );
    expect(
      within(dialog).getByText(copy.kindHints.departments),
    ).toBeInTheDocument();
    const input = dialog.querySelector('input[type=file]') as HTMLInputElement;
    await userEvent.upload(input, workbook());
    expect(within(dialog).getByText('departments.xlsx')).toBeInTheDocument();
    await userEvent.click(
      within(dialog).getByRole('button', { name: copy.actions.check }),
    );

    expect(
      await within(dialog).findByText(
        'Problems found: 2. Nothing was imported.',
      ),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText('"A" already appears on row 2.'),
    ).toBeInTheDocument();
    const call = api.request.mock.calls.find(
      ([options]) => (options as { path: string }).path === 'imports/preview',
    )![0] as { body: FormData };
    expect(call.body.get('kind')).toBe('departments');
    expect((call.body.get('file') as File).name).toBe('departments.xlsx');
    // No "Import" on an invalid report; choosing again returns to the form with the file cleared.
    expect(
      within(dialog).queryByRole('button', { name: copy.actions.confirm }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      within(dialog).getByRole('button', { name: copy.actions.chooseAgain }),
    );
    expect(within(dialog).getByText(copy.noFile)).toBeInTheDocument();
  });

  it('imports a checked file, toasts, reloads the history and closes', async () => {
    let listed = 0;
    serve({
      'GET imports': () => {
        listed += 1;
        return emptyList();
      },
      'POST imports/preview': () => ({
        data: {
          kind: 'departments',
          result: 'ok',
          rowCount: 3,
          createdCount: 2,
          updatedCount: 1,
          unchangedCount: 0,
          errorCount: 0,
          errors: [],
        },
      }),
      'POST imports': () => ({
        data: {
          ...run,
          kind: 'departments',
          status: 'succeeded',
          filename: 'departments.xlsx',
          createdCount: 2,
          updatedCount: 1,
          errorCount: 0,
          errors: [],
        },
      }),
    });
    const router = renderRoutes('/import/new');
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('combobox'));
    await userEvent.click(
      await screen.findByRole('option', { name: copy.kinds.departments }),
    );
    await userEvent.upload(
      dialog.querySelector('input[type=file]') as HTMLInputElement,
      workbook(),
    );
    await userEvent.click(
      within(dialog).getByRole('button', { name: copy.actions.check }),
    );
    expect(
      await within(dialog).findByText(
        '3 rows read: 2 will be created, 1 updated and 0 left unchanged.',
      ),
    ).toBeInTheDocument();
    const before = listed;
    await userEvent.click(
      within(dialog).getByRole('button', { name: copy.actions.confirm }),
    );
    await waitFor(() =>
      expect(toaster.show).toHaveBeenCalledWith({
        type: 'success',
        title: 'Imported "departments.xlsx"',
      }),
    );
    await waitFor(() => expect(router.state.location.pathname).toBe('/import'));
    expect(listed).toBeGreaterThan(before);
  });

  it('keeps the dialog open with a message when the request fails', async () => {
    serve({
      'GET imports': emptyList,
      'POST imports/preview': () => {
        throw apiError(403);
      },
    });
    renderRoutes('/import/new');
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('combobox'));
    await userEvent.click(
      await screen.findByRole('option', { name: copy.kinds.positions }),
    );
    await userEvent.upload(
      dialog.querySelector('input[type=file]') as HTMLInputElement,
      workbook(),
    );
    await userEvent.click(
      within(dialog).getByRole('button', { name: copy.actions.check }),
    );
    expect(
      await within(dialog).findByText(copy.failure.forbidden),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('departments.xlsx')).toBeInTheDocument();
  });

  it('rejects a file that is not a workbook before sending it', async () => {
    serve({ 'GET imports': emptyList });
    renderRoutes('/import/new');
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('combobox'));
    await userEvent.click(
      await screen.findByRole('option', { name: copy.kinds.grades }),
    );
    await userEvent.upload(
      dialog.querySelector('input[type=file]') as HTMLInputElement,
      new File(['a,b'], 'grades.csv', { type: 'text/csv' }),
      { applyAccept: false },
    );
    await userEvent.click(
      within(dialog).getByRole('button', { name: copy.actions.check }),
    );
    expect(
      within(dialog).getByText(copy.validation.fileType),
    ).toBeInTheDocument();
    expect(api.request).not.toHaveBeenCalledWith(
      expect.objectContaining({ path: 'imports/preview' }),
    );
  });
});
