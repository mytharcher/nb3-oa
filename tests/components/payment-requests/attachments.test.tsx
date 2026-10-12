import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import { afterEach, expect, it, vi, beforeEach } from 'vitest';
import en from '../../../client/locales/en-US.js';
import copy from '../../../client/locales/modules/payment-requests-form.en-US.js';
import {
  PaymentAttachmentEditor,
  PaymentAttachments,
} from '../../../client/pages/payment-requests/attachments.js';
const { api } = vi.hoisted(() => ({ api: { request: vi.fn() } }));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
}));
const runtime = await createTestI18nRuntime({
  application: {
    namespace: 'nb3-oa',
    resources: {
      ...en,
      ...copy,
    },
  },
});
beforeEach(() => vi.clearAllMocks());
it('selects authorized stored evidence without deleting storage when deselected', async () => {
  const change = vi.fn(),
    ensure = vi.fn().mockResolvedValue('r1');
  api.request.mockResolvedValue({
    data: [
      {
        id: 'f1',
        filename: 'Proof',
        ext: 'pdf',
        contentUrl: '/custom/uploads/payment/f1.pdf',
      },
    ],
  });
  render(
    <TestI18nProvider runtime={runtime}>
      <PaymentAttachmentEditor
        id='files'
        ids={[]}
        onChange={change}
        ensureDraft={ensure}
        disabled={false}
        onBusyChange={vi.fn()}
      />
    </TestI18nProvider>,
  );
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Select stored evidence / reconcile upload',
    }),
  );
  fireEvent.click(await screen.findByRole('checkbox', { name: 'Proof.pdf' }));
  await waitFor(() => expect(change).toHaveBeenCalledWith(['f1']));
  expect(ensure).toHaveBeenCalledOnce();
  expect(api.request).toHaveBeenCalledWith(
    expect.objectContaining({
      path: 'paymentAttachments/findMany',
      headers: {
        'x-payment-request-id': 'r1',
        'x-payment-file-purpose': 'invoice',
      },
    }),
  );
  expect(api.request.mock.calls.every(([arg]) => arg.method === 'POST')).toBe(
    true,
  );
});
it('blocks oversize files before creating a draft', async () => {
  const ensure = vi.fn();
  render(
    <TestI18nProvider runtime={runtime}>
      <PaymentAttachmentEditor
        id='files'
        ids={[]}
        onChange={vi.fn()}
        ensureDraft={ensure}
        disabled={false}
        onBusyChange={vi.fn()}
      />
    </TestI18nProvider>,
  );
  const file = new File(['x'], 'proof.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 });
  fireEvent.change(screen.getByLabelText('Invoice evidence *'), {
    target: { files: [file] },
  });
  await screen.findByText('Choose a nonempty file up to 5 MB.');
  expect(ensure).not.toHaveBeenCalled();
});

afterEach(cleanup);

it('refreshes guarded metadata when the detail refresh key changes with unchanged file ids', async () => {
  api.request
    .mockResolvedValueOnce({
      data: [
        { id: 'f1', filename: 'Old', ext: 'pdf', contentUrl: '/secure/old' },
      ],
    })
    .mockResolvedValueOnce({
      data: [
        {
          id: 'f1',
          filename: 'Current',
          ext: 'pdf',
          contentUrl: '/secure/current',
        },
      ],
    });
  const ids = ['f1'];
  const content = (refreshKey: number) => (
    <TestI18nProvider runtime={runtime}>
      <PaymentAttachments recordId='r1' ids={ids} refreshKey={refreshKey} />
    </TestI18nProvider>
  );
  const view = render(content(0));
  await screen.findByRole('link', { name: 'Old.pdf' });
  view.rerender(content(1));
  const current = await screen.findByRole('link', { name: 'Current.pdf' });
  expect(current.getAttribute('href')).toBe('/secure/current');
  expect(screen.queryByRole('link', { name: 'Old.pdf' })).toBeNull();
  expect(api.request).toHaveBeenCalledTimes(2);
});
it('reconciles an uncertain upload before allowing another upload and never repeats the file POST automatically', async () => {
  const change = vi.fn();
  api.request.mockImplementation(({ path }) =>
    path.endsWith('/uploadOne')
      ? Promise.reject(new TypeError('Network'))
      : Promise.resolve({
          data: [
            {
              id: 'existing',
              filename: 'Stored uncertain proof',
              ext: 'pdf',
              contentUrl: '/base/uploads/payment/proof.pdf',
            },
          ],
        }),
  );
  render(
    <TestI18nProvider runtime={runtime}>
      <PaymentAttachmentEditor
        id='proof'
        recordId='r1'
        purpose='voucher'
        ids={[]}
        onChange={change}
        ensureDraft={vi.fn()}
        disabled={false}
        onBusyChange={vi.fn()}
      />
    </TestI18nProvider>,
  );
  fireEvent.change(screen.getByLabelText('Payment evidence *'), {
    target: {
      files: [
        new File(['%PDF-proof'], 'proof.pdf', { type: 'application/pdf' }),
      ],
    },
  });
  await screen.findByText(/upload result is unconfirmed/);
  expect(screen.getByLabelText('Payment evidence *')).toBeDisabled();
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Select stored evidence / reconcile upload',
    }),
  );
  await screen.findByRole('checkbox', { name: 'Stored uncertain proof.pdf' });
  expect(screen.getByLabelText('Payment evidence *')).toBeEnabled();
  expect(change).not.toHaveBeenCalled();
  expect(
    api.request.mock.calls.filter(([v]) => v.path.endsWith('/uploadOne')),
  ).toHaveLength(1);
  expect(
    api.request.mock.calls.every(
      ([v]) =>
        v.headers['x-payment-request-id'] === 'r1' &&
        v.headers['x-payment-file-purpose'] === 'voucher',
    ),
  ).toBe(true);
});
it('hides the previous record stored filenames synchronously when the editor changes records', async () => {
  api.request.mockResolvedValue({
    data: [
      {
        id: 'secret',
        filename: 'Previous private proof',
        ext: 'pdf',
        contentUrl: '/base/uploads/payment/old.pdf',
      },
    ],
  });
  const view = (recordId: string) => (
    <TestI18nProvider runtime={runtime}>
      <PaymentAttachmentEditor
        id='files'
        recordId={recordId}
        ids={[]}
        onChange={vi.fn()}
        ensureDraft={vi.fn()}
        disabled={false}
        onBusyChange={vi.fn()}
      />
    </TestI18nProvider>
  );
  const rendered = render(view('r1'));
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Select stored evidence / reconcile upload',
    }),
  );
  await screen.findByRole('checkbox', { name: 'Previous private proof.pdf' });
  rendered.rerender(view('r2'));
  expect(
    screen.queryByRole('checkbox', { name: 'Previous private proof.pdf' }),
  ).not.toBeInTheDocument();
});
