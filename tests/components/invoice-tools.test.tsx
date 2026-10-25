import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import enUS from '../../client/locales/en-US.js';
import { InvoiceTools } from '../../client/pages/reimbursement-requests/invoice-tools.js';
const state = vi.hoisted(() => ({
  can: true,
  read: true,
  user: 'owner',
  revision: 1,
  request: vi.fn(),
}));
vi.mock('@nocobase/app-client', () => ({ useApiClient: () => api }));
const api = { request: state.request };
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: state.user } } }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useCan: ({ action }: { action: string }) => ({
    can: action === 'read' ? state.read : state.can,
  }),
  useAuthorizationRevision: () => state.revision,
}));
vi.mock('../../client/pages/reimbursement-requests/attachments.js', () => ({
  ReimbursementAttachments: () => <p>Original attachment</p>,
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
const facts = { number: 'OCR-123', date: '2026-10-25', amountCents: 4567 };
beforeEach(() => {
  state.can = true;
  state.read = true;
  state.user = 'owner';
  state.revision = 1;
  state.request.mockReset().mockResolvedValue({
    data: {
      enabled: true,
      state: 'recognized',
      busy: false,
      result: { state: 'recognized', facts },
    },
  });
});
afterEach(cleanup);
function mount(operation: 'recognize' | 'verify' = 'recognize') {
  const apply = vi.fn();
  const element = (version = 'original') => (
    <TestI18nProvider runtime={runtime}>
      <InvoiceTools
        recordId='record'
        lineId='line'
        fileIds={['file']}
        version={version}
        operation={operation}
        onApply={apply}
      />
    </TestI18nProvider>
  );
  const view = render(element());
  return {
    apply,
    update: (version = 'original') => view.rerender(element(version)),
  };
}
it('requires explicit review before changing the unsaved line', async () => {
  const view = mount();
  await userEvent.click(
    screen.getByRole('button', { name: 'Recognize attachment 1' }),
  );
  expect(await screen.findByRole('dialog')).toBeVisible();
  expect(screen.getByText('OCR-123')).toBeVisible();
  expect(view.apply).not.toHaveBeenCalled();
  await userEvent.click(
    screen.getByRole('button', { name: 'Apply to this line' }),
  );
  expect(view.apply).toHaveBeenCalledWith(facts);
  expect(state.request).toHaveBeenCalledWith({
    path: 'invoiceRecognition/record/line/file/recognize',
    method: 'POST',
    json: {},
  });
});
it('does not overwrite a line edited while recognition was in flight', async () => {
  let finish!: (value: object) => void;
  state.request.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const view = mount();
  await userEvent.click(
    screen.getByRole('button', { name: 'Recognize attachment 1' }),
  );
  view.update('manually-edited');
  finish({ data: { enabled: true, state: 'recognized', result: { facts } } });
  await screen.findByRole('dialog');
  expect(
    screen.getByRole('button', { name: 'Apply to this line' }),
  ).toBeDisabled();
  expect(view.apply).not.toHaveBeenCalled();
});
it('preserves manual input on failure and hides an old user result after identity change', async () => {
  state.request.mockRejectedValue(new Error('private upstream detail'));
  const view = mount();
  await userEvent.click(
    screen.getByRole('button', { name: 'Recognize attachment 1' }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Your entered values are unchanged',
  );
  expect(view.apply).not.toHaveBeenCalled();
  state.user = 'other';
  view.update();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  state.can = false;
  view.update();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});
it('reloads stored verification and clears a current result when line facts change', async () => {
  state.request.mockResolvedValue({
    data: { enabled: true, state: 'valid', result: { reference: 'CHECK-1' } },
  });
  const view = mount('verify');
  expect(
    await screen.findByText(
      'External verification matched the current invoice facts.',
    ),
  ).toBeVisible();
  state.request.mockResolvedValue({
    data: { enabled: true, state: 'not_checked', result: null },
  });
  view.update('changed-facts');
  expect(await screen.findByText('Not checked')).toBeVisible();
  expect(
    screen.queryByText('Verification reference: CHECK-1'),
  ).not.toBeInTheDocument();
});

it('allows an authorized reader to see shared verification without a verify action', async () => {
  state.can = false;
  state.request.mockResolvedValue({
    data: {
      enabled: true,
      state: 'valid',
      result: { reference: 'SHARED-CHECK' },
    },
  });
  mount('verify');
  expect(
    await screen.findByText('Verification reference: SHARED-CHECK'),
  ).toBeVisible();
  expect(
    screen.queryByRole('button', { name: 'Verify invoice · attachment 1' }),
  ).not.toBeInTheDocument();
  await userEvent.click(
    screen.getByRole('button', { name: 'Refresh saved result' }),
  );
  expect(state.request.mock.calls.at(-1)?.[0].method).toBe('GET');
});
