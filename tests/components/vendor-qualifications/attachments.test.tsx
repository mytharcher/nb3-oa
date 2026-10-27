import { resolveLocalesContribution } from '@nocobase/i18n';
import filePlugin from '@nocobase/app-plugin-file/client';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import base from '../../../client/locales/en-US.js';
import copy from '../../../client/locales/modules/vendor-qualification.en-US.js';
import {
  QualificationAttachmentEditor,
  QualificationAttachments,
} from '../../../client/pages/vendor-qualifications/attachments.js';
const { api } = vi.hoisted(() => ({ api: { request: vi.fn() } }));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: { ...base, ...copy } },
  namespaces: {
    '@nocobase/app-plugin-file': await resolveLocalesContribution(
      filePlugin().locales!,
    ),
  },
});
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);
it('creates a real draft before upload and sends only the qualification wrapper header', async () => {
  const order: string[] = [],
    change = vi.fn(),
    draft = vi.fn(async () => {
      order.push('draft');
      return 'real-draft';
    });
  api.request.mockImplementation(({ path }: { path: string }) => {
    order.push(path);
    return Promise.resolve({
      data: {
        record: {
          id: 'file-1',
          filename: 'Evidence',
          ext: 'pdf',
          contentUrl: '/secure/evidence',
        },
      },
    });
  });
  render(
    <TestI18nProvider runtime={runtime}>
      <QualificationAttachmentEditor
        id='proof'
        ids={[]}
        ensureDraft={draft}
        disabled={false}
        onChange={change}
        onBusyChange={vi.fn()}
      />
    </TestI18nProvider>,
  );
  fireEvent.change(screen.getByLabelText('Qualification evidence *'), {
    target: {
      files: [
        new File(['%PDF-proof'], 'proof.pdf', { type: 'application/pdf' }),
      ],
    },
  });
  await waitFor(() => expect(change).toHaveBeenCalledWith(['file-1']));
  expect(order.slice(0, 2)).toEqual([
    'draft',
    'vendorQualificationAttachments/uploadOne',
  ]);
  expect(api.request).toHaveBeenCalledWith(
    expect.objectContaining({
      headers: { 'x-vendor-qualification-id': 'real-draft' },
    }),
  );
});
it('queries secure metadata with maxLimit10 and uses only returned guarded content URL', async () => {
  api.request.mockResolvedValue({
    data: [
      {
        id: 'e1',
        filename: 'Company evidence',
        ext: 'pdf',
        contentUrl: '/secure/qualification/e1.pdf',
      },
    ],
  });
  render(
    <TestI18nProvider runtime={runtime}>
      <QualificationAttachments recordId='request-1' ids={['e1']} />
    </TestI18nProvider>,
  );
  const link = await screen.findByRole('button', {
    name: 'Download Company evidence.pdf',
  });
  expect(link.getAttribute('href')).toBe('/secure/qualification/e1.pdf');
  expect(api.request).toHaveBeenCalledWith(
    expect.objectContaining({
      path: 'vendorQualificationAttachments/findMany',
      json: expect.objectContaining({ limit: 10 }),
      headers: { 'x-vendor-qualification-id': 'request-1' },
    }),
  );
});
it('locks an uncertain upload and reconciles uploaded evidence without repeating POST', async () => {
  const change = vi.fn();
  api.request.mockImplementation(({ path }: { path: string }) =>
    path.endsWith('uploadOne')
      ? Promise.reject(new TypeError('offline'))
      : Promise.resolve({
          data: [
            {
              id: 'stored',
              filename: 'Stored evidence',
              ext: 'pdf',
              contentUrl: '/secure/stored',
            },
          ],
        }),
  );
  render(
    <TestI18nProvider runtime={runtime}>
      <QualificationAttachmentEditor
        id='proof'
        recordId='request-1'
        ids={[]}
        ensureDraft={vi.fn()}
        disabled={false}
        onChange={change}
        onBusyChange={vi.fn()}
      />
    </TestI18nProvider>,
  );
  fireEvent.change(screen.getByLabelText('Qualification evidence *'), {
    target: {
      files: [
        new File(['%PDF-proof'], 'proof.pdf', { type: 'application/pdf' }),
      ],
    },
  });
  await screen.findByText(
    'Upload result unconfirmed. Check uploaded evidence.',
  );
  expect(screen.getByLabelText('Qualification evidence *')).toBeDisabled();
  fireEvent.click(
    screen.getByRole('button', { name: 'Select uploaded evidence' }),
  );
  const box = await screen.findByRole('checkbox', {
    name: 'Stored evidence.pdf',
  });
  fireEvent.click(box);
  await waitFor(() => expect(change).toHaveBeenCalledWith(['stored']));
  expect(
    api.request.mock.calls.filter(([call]) => call.path.endsWith('uploadOne')),
  ).toHaveLength(1);
});
