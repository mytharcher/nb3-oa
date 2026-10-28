import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import {
  render,
  screen,
  cleanup,
  waitFor,
  fireEvent,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { ApiClientError } from '@nocobase/app-client';
import { ApprovalAiReviewPanel } from '../../client/components/approval-ai/index.js';
import enUS from '../../client/locales/en-US.js';
const { api, assistant } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  assistant: { setReview: vi.fn(), setOpen: vi.fn() },
}));
vi.mock('../../client/components/approval-ai/assistant-context.js', () => ({
  useApprovalAssistant: () => assistant,
}));
vi.mock('@nocobase/app-plugin-agents/client/chat', () => ({}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => ({ show: vi.fn() }),
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: 'handler' } } }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useAuthorizationRevision: () => 0,
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
function mount() {
  return render(
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter>
        <ApprovalAiReviewPanel lifecycle='oa.contract' recordId='contract' />
      </MemoryRouter>
    </TestI18nProvider>,
  );
}
const review = {
  taskId: 'task',
  via: 'assignee',
  definitionId: 'contracts.legal-review',
  title: 'Contract legal and finance review',
  stage: 'legalFinance',
  taskOpen: true,
  status: 'none',
  errorCode: null,
  canGenerate: true,
  generatedAt: null,
  model: null,
  findings: null,
  coverage: [],
  basis: null,
  feedback: null,
};
beforeEach(() => {
  api.request.mockReset();
});
afterEach(() => cleanup());
it('does not generate on read and hides the panel for no applicable task', async () => {
  api.request.mockResolvedValue({ data: [] });
  mount();
  await waitFor(() => expect(api.request).toHaveBeenCalled());
  expect(screen.queryByRole('region')).toBeNull();
  expect(
    api.request.mock.calls.every(
      ([request]) => !request.method || request.method === 'GET',
    ),
  ).toBe(true);
});
it('generates only on an explicit click and keeps server-managed request identity', async () => {
  api.request.mockImplementation(async (request) =>
    request.method === 'POST'
      ? { data: { taskId: 'task' } }
      : { data: [review] },
  );
  mount();
  fireEvent.click(
    await screen.findByRole('button', { name: 'Generate suggestion' }),
  );
  await waitFor(() =>
    expect(
      api.request.mock.calls.some(
        ([request]) =>
          request.method === 'POST' &&
          typeof request.json.requestKey === 'string',
      ),
    ).toBe(true),
  );
});
it('clears suggestions on final permission refusal and reports the access failure', async () => {
  api.request.mockResolvedValueOnce({
    data: [
      {
        ...review,
        status: 'succeeded',
        findings: [
          {
            checkId: 'x',
            title: 'Payment',
            verdict: 'needs_verification',
            summary: 'Private evidence',
            evidence: [],
          },
        ],
      },
    ],
  });
  mount();
  expect(await screen.findByText('Private evidence')).toBeVisible();
  api.request.mockRejectedValue(
    new ApiClientError('No access', { status: 404 }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  expect(
    await screen.findByText('Unavailable or no longer accessible'),
  ).toBeVisible();
  expect(screen.queryByText('Private evidence')).toBeNull();
});

it('renders uploaded material names literally instead of interpreting them as locale keys', async () => {
  api.request.mockResolvedValue({
    data: [
      {
        ...review,
        status: 'succeeded',
        coverage: [
          {
            kind: 'attachment',
            ref: 'file',
            label: 'approvalAi.customer-contract.pdf',
            status: 'not_supported',
          },
        ],
      },
    ],
  });
  mount();
  fireEvent.click(await screen.findByText('Material coverage'));
  expect(screen.getByText(/approvalAi.customer-contract.pdf/)).toBeVisible();
});

it('offers follow-up only for a generated review and binds its exact task/version without posting', async () => {
  api.request.mockResolvedValue({
    data: [
      {
        ...review,
        status: 'succeeded',
        generatedAt: '2026-10-28T00:00:00Z',
        findings: [],
      },
    ],
  });
  mount();
  fireEvent.click(
    await screen.findByRole('button', { name: 'Ask about suggestion' }),
  );
  expect(assistant.setReview).toHaveBeenCalledWith({
    lifecycle: 'oa.contract',
    recordId: 'contract',
    recordLabel: null,
    taskId: 'task',
    generatedAt: '2026-10-28T00:00:00Z',
    title: review.title,
    model: null,
  });
  expect(assistant.setOpen).toHaveBeenCalledWith(true);
  expect(
    api.request.mock.calls.every(
      ([request]) => !request.method || request.method === 'GET',
    ),
  ).toBe(true);
});
it.each(['none', 'queued', 'running', 'failed', 'skipped'])(
  'does not offer follow-up for %s reviews',
  async (status) => {
    api.request.mockResolvedValue({ data: [{ ...review, status }] });
    mount();
    await screen.findByRole('region');
    expect(
      screen.queryByRole('button', { name: 'Ask about suggestion' }),
    ).toBeNull();
  },
);
