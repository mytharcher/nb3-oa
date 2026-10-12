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
import copy from '../../../client/locales/modules/reimbursement-forms.en-US.js';
import {
  ReimbursementAttachmentEditor,
  ReimbursementAttachments,
} from '../../../client/pages/reimbursement-requests/attachments.js';
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
      reimbursementRequests: { ...en.reimbursementRequests, ...copy },
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
        contentUrl: '/custom/uploads/reimbursement/f1.pdf',
      },
    ],
  });
  render(
    <TestI18nProvider runtime={runtime}>
      <ReimbursementAttachmentEditor
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
    screen.getByRole('button', { name: 'Choose stored evidence' }),
  );
  fireEvent.click(await screen.findByRole('checkbox', { name: 'Proof.pdf' }));
  await waitFor(() => expect(change).toHaveBeenCalledWith(['f1']));
  expect(ensure).toHaveBeenCalledOnce();
  expect(api.request).toHaveBeenCalledWith(
    expect.objectContaining({
      path: 'reimbursementAttachments/findMany',
      headers: { 'x-reimbursement-request-id': 'r1' },
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
      <ReimbursementAttachmentEditor
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
  fireEvent.change(screen.getByLabelText('Evidence files *'), {
    target: { files: [file] },
  });
  await screen.findByText('Choose a nonempty file up to 5 MiB.');
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
      <ReimbursementAttachments
        recordId='r1'
        ids={ids}
        refreshKey={refreshKey}
      />
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
