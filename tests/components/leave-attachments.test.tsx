import { resolveLocalesContribution } from '@nocobase/i18n';
import filePlugin from '@nocobase/app-plugin-file/client';
import { ApiClientError } from '@nocobase/app-client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import enUS from '../../client/locales/en-US.js';
import {
  LeaveAttachmentEditor,
  LeaveAttachments,
} from '../../client/pages/approvals/attachments.js';
const { api } = vi.hoisted(() => ({ api: { request: vi.fn() } }));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
  namespaces: {
    '@nocobase/app-plugin-file': await resolveLocalesContribution(
      filePlugin().locales!,
    ),
  },
});
function show(id = 'l1', ids = ['f1']) {
  return render(
    <TestI18nProvider runtime={runtime}>
      <LeaveAttachments leaveId={id} ids={ids} />
    </TestI18nProvider>,
  );
}
beforeEach(() => vi.clearAllMocks());
describe('leave attachment display', () => {
  it('shows authorized selected files and preserves the server deployment path', async () => {
    api.request.mockResolvedValue({
      data: [
        {
          id: 'f1',
          filename: 'Proof',
          ext: 'pdf',
          contentUrl: '/custom/uploads/leave/f1.pdf',
        },
        {
          id: 'orphan',
          filename: 'Unused',
          ext: 'png',
          contentUrl: '/custom/uploads/leave/orphan.png',
        },
      ],
    });
    show();
    expect(
      await screen.findByRole('button', { name: 'Download Proof.pdf' }),
    ).toHaveAttribute('href', '/custom/uploads/leave/f1.pdf');
    expect(
      screen.queryByRole('button', { name: 'Download Unused.png' }),
    ).toBeNull();
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        headers: { 'x-leave-request-id': 'l1' },
        json: {
          filter: {
            kind: 'filter',
            version: 1,
            root: {
              kind: 'group',
              logic: 'or',
              items: [
                {
                  kind: 'condition',
                  path: ['id'],
                  operator: '$eq',
                  value: 'f1',
                },
              ],
            },
          },
          limit: 10,
        },
      }),
    );
  });
  it('clears links after access is refused and does not invite a forbidden retry', async () => {
    api.request.mockRejectedValue(
      new ApiClientError('private storage key', {
        status: 403,
        method: 'POST',
        url: '/leaveAttachments/findMany',
      }),
    );
    show();
    expect(await screen.findByRole('alert')).not.toHaveTextContent(
      'private storage key',
    );
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });
  it('reports a missing selected attachment rather than silently dropping it', async () => {
    api.request.mockResolvedValue({ data: [] });
    show();
    expect(
      await screen.findByText(enUS.approvals.attachmentMissing),
    ).toBeInTheDocument();
  });
  it('makes no metadata request for a record with no attachments', async () => {
    show('l1', []);
    await waitFor(() => expect(screen.getByText('—')).toBeInTheDocument());
    expect(api.request).not.toHaveBeenCalled();
  });
});

describe('leave attachment editor', () => {
  function editor(ids: string[] = [], leaveId?: string) {
    const ensureDraft = vi.fn().mockResolvedValue('new-draft');
    const onChange = vi.fn();
    const onBusyChange = vi.fn();
    render(
      <TestI18nProvider runtime={runtime}>
        <LeaveAttachmentEditor
          ids={ids}
          leaveId={leaveId}
          onChange={onChange}
          ensureDraft={ensureDraft}
          disabled={false}
          onBusyChange={onBusyChange}
        />
      </TestI18nProvider>,
    );
    return { ensureDraft, onChange, onBusyChange };
  }
  it('saves a draft before sending native multipart bytes and selecting the returned file', async () => {
    api.request.mockResolvedValue({ data: { record: { id: 'uploaded' } } });
    const callbacks = editor();
    fireEvent.change(screen.getByLabelText('Attachments'), {
      target: {
        files: [
          new File(['%PDF-test'], 'proof.pdf', { type: 'application/pdf' }),
        ],
      },
    });
    await waitFor(() =>
      expect(callbacks.onChange).toHaveBeenCalledWith(['uploaded']),
    );
    expect(callbacks.ensureDraft).toHaveBeenCalledOnce();
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'leaveAttachments/uploadOne',
        headers: { 'x-leave-request-id': 'new-draft' },
        body: expect.any(FormData),
      }),
    );
    expect(callbacks.onBusyChange.mock.calls).toEqual([[true], [false]]);
  });
  it('rejects an unsupported format before creating a draft or uploading', async () => {
    const callbacks = editor();
    fireEvent.change(screen.getByLabelText('Attachments'), {
      target: {
        files: [new File(['<svg/>'], 'proof.svg', { type: 'image/svg+xml' })],
      },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      enUS.approvals.attachmentType,
    );
    expect(callbacks.ensureDraft).not.toHaveBeenCalled();
    expect(api.request).not.toHaveBeenCalled();
  });
  it('rejects empty files without issuing a write', async () => {
    const callbacks = editor();
    fireEvent.change(screen.getByLabelText('Attachments'), {
      target: {
        files: [new File([], 'proof.pdf', { type: 'application/pdf' })],
      },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      enUS.approvals.attachmentSize,
    );
    expect(callbacks.ensureDraft).not.toHaveBeenCalled();
    expect(api.request).not.toHaveBeenCalled();
  });
  it('releases the upload lock on failure without exposing raw server errors', async () => {
    api.request.mockRejectedValue(new Error('private storage path'));
    const callbacks = editor();
    fireEvent.change(screen.getByLabelText('Attachments'), {
      target: {
        files: [
          new File(['%PDF-test'], 'proof.pdf', { type: 'application/pdf' }),
        ],
      },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      enUS.approvals.attachmentFailed,
    );
    expect(screen.getByRole('alert')).not.toHaveTextContent(
      'private storage path',
    );
    expect(screen.getByLabelText('Attachments')).not.toBeDisabled();
    expect(callbacks.onChange).not.toHaveBeenCalled();
    expect(callbacks.onBusyChange.mock.calls).toEqual([[true], [false]]);
  });
  it('blocks duplicate uploads while draft creation is pending', async () => {
    const callbacks = editor();
    callbacks.ensureDraft.mockImplementation(() => new Promise(() => {}));
    const file = new File(['%PDF-test'], 'proof.pdf', {
      type: 'application/pdf',
    });
    fireEvent.change(screen.getByLabelText('Attachments'), {
      target: { files: [file] },
    });
    fireEvent.change(screen.getByLabelText('Attachments'), {
      target: { files: [file] },
    });
    expect(callbacks.ensureDraft).toHaveBeenCalledOnce();
    expect(screen.getByLabelText('Attachments')).toBeDisabled();
  });
  it('removes the clicked attachment in place without deleting storage', async () => {
    api.request.mockResolvedValue({
      data: [
        {
          id: 'f1',
          filename: 'First.pdf',
          ext: 'pdf',
          contentUrl: '/uploads/leave/f1.pdf',
        },
        {
          id: 'f2',
          filename: 'Second.png',
          ext: 'png',
          contentUrl: '/uploads/leave/f2.png',
        },
      ],
    });
    const callbacks = editor(['f1', 'f2'], 'l1');
    const remove = await screen.findByRole('button', {
      name: 'Remove First.pdf',
    });
    expect(remove.closest('li')).toHaveTextContent('First.pdf');
    expect(
      screen.queryByRole('button', { name: 'Remove attachment 1' }),
    ).toBeNull();
    fireEvent.click(remove);
    expect(callbacks.onChange).toHaveBeenCalledWith(['f2']);
    expect(
      api.request.mock.calls.every(
        ([request]) => request.path === 'leaveAttachments/findMany',
      ),
    ).toBe(true);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
