import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { beforeEach, it, expect, vi } from 'vitest';
import { ApiClientError } from '@nocobase/app-client';
import enUS from '../../../client/locales/en-US.js';
import locale from '../../../client/locales/modules/template-print.en-US.js';
import Form from '../../../client/pages/template-print/form-dialog.js';
import Upload from '../../../client/pages/template-print/upload-dialog.js';
import {
  readPending,
  fileHash,
} from '../../../client/pages/template-print/command.js';
const { api, reload, toaster, auth } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  reload: vi.fn(),
  toaster: { show: vi.fn() },
  auth: { actor: 'alice' },
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => toaster,
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useCan: () => ({ can: true, isPending: false }),
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: auth.actor } } }),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: { ...enUS, ...locale } },
});
const record = {
  id: 't1',
  name: 'Original',
  source: 'leave',
  active: true,
  currentRevisionId: null,
  version: 1,
};
function show(path: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <Outlet context={{ reload, onSaved: reload }} />,
        children: [
          { path: 'new', element: <Form /> },
          { path: 'edit/:templateId', element: <Form /> },
          { path: 'upload/:templateId', element: <Upload /> },
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
  cleanup();
  sessionStorage.clear();
  api.request.mockReset();
  reload.mockReset();
  toaster.show.mockReset();
  auth.actor = 'alice';
});
it('validates on submit and focuses the required name before a write', async () => {
  const user = userEvent.setup();
  show('/new');
  await user.click(
    await screen.findByRole('button', { name: 'Create', exact: true }),
  );
  expect(screen.getByLabelText('Name *')).toHaveFocus();
  expect(api.request).not.toHaveBeenCalled();
  await user.type(screen.getByLabelText('Name *'), '公司单据');
  expect(screen.queryByText('Enter 1–120 characters')).toBeNull();
});
it('replays the original create body and key after unknown result and remount', async () => {
  const user = userEvent.setup();
  api.request.mockRejectedValue(new Error('network'));
  show('/new');
  await user.type(screen.getByLabelText('Name *'), 'First template');
  await user.click(screen.getByRole('button', { name: 'Create', exact: true }));
  await screen.findByText('Result unconfirmed. Retry the original submission');
  const first = api.request.mock.calls[0]![0];
  expect(screen.getByLabelText('Name *')).toBeDisabled();
  cleanup();
  show('/new');
  expect(await screen.findByDisplayValue('First template')).toBeDisabled();
  api.request.mockResolvedValue({ data: { record } });
  await user.click(screen.getByRole('button', { name: 'Retry', exact: true }));
  await waitFor(() => expect(reload).toHaveBeenCalled());
  expect(api.request.mock.calls.at(-1)![0]).toEqual(first);
  expect(readPending('alice', 'new:')).toBeNull();
});
it('loads fresh edit data and refuses to write hidden dependencies', async () => {
  api.request.mockResolvedValue({
    data: {
      record: { id: 't1', name: 'Visible', version: 1 },
      revisions: [],
      sourceReady: true,
    },
  });
  show('/edit/t1');
  await screen.findByDisplayValue('Visible');
  expect(
    screen.getByRole('button', { name: 'Save', exact: true }),
  ).toBeDisabled();
  expect(api.request.mock.calls[0]![0]).toMatchObject({
    path: 'printTemplates/t1',
    query: { mode: 'manage' },
  });
});
it('does not retain old input or authorized upload data after a 403 write', async () => {
  const user = userEvent.setup();
  api.request.mockImplementation(async (o) => {
    if (o.method)
      throw new ApiClientError('secret', {
        status: 403,
        method: 'PATCH',
        url: '/x',
      });
    return { data: { record, revisions: [], sourceReady: true } };
  });
  show('/edit/t1');
  await screen.findByDisplayValue('Original');
  await user.click(screen.getByRole('button', { name: 'Save', exact: true }));
  await screen.findByText('Access denied. Contact an administrator');
  expect(screen.queryByDisplayValue('Original')).toBeNull();
  expect(
    screen.getByRole('button', { name: 'Save', exact: true }),
  ).toBeDisabled();
  expect(readPending('alice', 'edit:t1')).toBeNull();
});
it('disables upload for metadata-only unsupported sources', async () => {
  api.request.mockResolvedValue({
    data: {
      record: { ...record, source: 'sealRegistration' },
      revisions: [],
      sourceReady: false,
    },
  });
  show('/upload/t1');
  await screen.findByText(
    'Template printing is not available for this business yet',
  );
  expect(screen.getByLabelText('DOCX file *')).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Upload revision', exact: true }),
  ).toBeDisabled();
});
it('uses FormData and requires the exact file fingerprint when resuming unknown upload', async () => {
  const user = userEvent.setup();
  const f = new File(['original'], 'original.docx', {
    type: 'application/octet-stream',
  });
  api.request.mockImplementation(async (o) => {
    if (o.method) throw new Error('network');
    return { data: { record, revisions: [], sourceReady: true } };
  });
  show('/upload/t1');
  await waitFor(() =>
    expect(screen.getByLabelText('DOCX file *')).not.toBeDisabled(),
  );
  await user.upload(screen.getByLabelText('DOCX file *'), f);
  await user.click(
    screen.getByRole('button', { name: 'Upload revision', exact: true }),
  );
  await screen.findByText(/Result unconfirmed/);
  const first = api.request.mock.calls.find((c) => c[0].method)![0];
  expect(first.body).toBeInstanceOf(FormData);
  expect(first.body.get('version')).toBe('1');
  const key = first.body.get('requestKey');
  cleanup();
  show('/upload/t1');
  await waitFor(() =>
    expect(screen.getByLabelText('DOCX file *')).not.toBeDisabled(),
  );
  await user.upload(
    screen.getByLabelText('DOCX file *'),
    new File(['different'], 'original.docx', {
      type: 'application/octet-stream',
    }),
  );
  await user.click(screen.getByRole('button', { name: 'Retry', exact: true }));
  await screen.findByText('Choose the same file as the original operation');
  expect(api.request.mock.calls.filter((c) => c[0].method)).toHaveLength(1);
  await user.upload(screen.getByLabelText('DOCX file *'), f);
  await user.click(screen.getByRole('button', { name: 'Retry', exact: true }));
  await waitFor(() =>
    expect(api.request.mock.calls.filter((c) => c[0].method)).toHaveLength(2),
  );
  const retry = api.request.mock.calls.filter((c) => c[0].method)[1]![0];
  expect(retry.body.get('requestKey')).toBe(key);
  expect(retry.body.get('version')).toBe('1');
  expect(await fileHash(retry.body.get('file'))).toBe(await fileHash(f));
});
it('requires explicit confirmation before abandoning an unknown submission', async () => {
  const user = userEvent.setup();
  api.request.mockRejectedValue(new Error('network'));
  show('/new');
  await user.type(screen.getByLabelText('Name *'), 'Unconfirmed');
  await user.click(screen.getByRole('button', { name: 'Create', exact: true }));
  await screen.findByText(/Result unconfirmed/);
  await user.click(
    screen.getByRole('button', { name: 'Abandon submission', exact: true }),
  );
  expect(readPending('alice', 'new:')).not.toBeNull();
  await user.click(
    screen
      .getAllByRole('button', { name: 'Abandon submission', exact: true })
      .at(-1)!,
  );
  await waitFor(() => expect(readPending('alice', 'new:')).toBeNull());
  expect(screen.getByLabelText('Name *')).not.toBeDisabled();
});
it('keeps upload controls and closing disabled through deferred hashing and readback', async () => {
  const user = userEvent.setup();
  const file = new File(['original'], 'busy.docx', {
    type: 'application/octet-stream',
  });
  const bytes = await file.arrayBuffer();
  let resolveHash!: (bytes: ArrayBuffer) => void;
  vi.spyOn(file, 'arrayBuffer').mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveHash = resolve;
      }),
  );
  let resolveReadback!: (value: unknown) => void;
  let reads = 0;
  api.request.mockImplementation((o) => {
    if (o.method)
      return Promise.resolve({
        data: { record, revision: { id: 'rev', contentHash: 'hash' } },
      });
    if (++reads === 1)
      return Promise.resolve({
        data: { record, revisions: [], sourceReady: true },
      });
    return new Promise((resolve) => {
      resolveReadback = resolve;
    });
  });
  show('/upload/t1');
  await waitFor(() =>
    expect(screen.getByLabelText('DOCX file *')).not.toBeDisabled(),
  );
  await user.upload(screen.getByLabelText('DOCX file *'), file);
  await user.click(
    screen.getByRole('button', { name: 'Upload revision', exact: true }),
  );
  expect(screen.getByLabelText('DOCX file *')).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Cancel', exact: true }),
  ).toBeDisabled();
  expect(api.request.mock.calls.filter((c) => c[0].method)).toHaveLength(0);
  resolveHash(bytes);
  await waitFor(() => expect(reads).toBe(2));
  expect(screen.getByLabelText('DOCX file *')).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Cancel', exact: true }),
  ).toBeDisabled();
  expect(
    document.querySelector('button[form="print-template-form"]'),
  ).toBeDisabled();
  resolveReadback({
    data: {
      record,
      sourceReady: true,
      revisions: [{ id: 'rev', contentHash: 'hash' }],
    },
  });
  await waitFor(() =>
    expect(toaster.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success' }),
    ),
  );
  expect(api.request.mock.calls.filter((c) => c[0].method)).toHaveLength(1);
});
it('reports hash preparation failures and restores controls without a write', async () => {
  const user = userEvent.setup();
  const file = new File(['original'], 'broken.docx', {
    type: 'application/octet-stream',
  });
  vi.spyOn(file, 'arrayBuffer').mockRejectedValue(
    new Error('hash read failure'),
  );
  api.request.mockResolvedValue({
    data: { record, sourceReady: true, revisions: [] },
  });
  show('/upload/t1');
  await waitFor(() =>
    expect(screen.getByLabelText('DOCX file *')).not.toBeDisabled(),
  );
  await user.upload(screen.getByLabelText('DOCX file *'), file);
  await user.click(
    screen.getByRole('button', { name: 'Upload revision', exact: true }),
  );
  await screen.findByText('Unable to load templates. Retry');
  expect(screen.getByLabelText('DOCX file *')).not.toBeDisabled();
  expect(api.request.mock.calls.filter((c) => c[0].method)).toHaveLength(0);
});
