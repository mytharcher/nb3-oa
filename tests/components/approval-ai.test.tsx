import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import {
  render,
  screen,
  cleanup,
  waitFor,
  fireEvent,
  act,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { ApprovalAiReviewPanel } from '../../client/components/approval-ai/index.js';
import type { ApprovalSuggestionView } from '../../shared/approval-ai.js';
import enUS from '../../client/locales/en-US.js';

const { api, toaster, refreshes, identity } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  toaster: { show: vi.fn() },
  refreshes: new Map<string, (signal?: AbortSignal) => Promise<void>>(),
  identity: { user: 'handler', revision: 0 },
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => toaster,
  useRealtimeRefresh: (
    topic: string,
    refresh: (signal?: AbortSignal) => Promise<void>,
  ) => {
    refreshes.set(topic, refresh);
  },
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: identity.user } } }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useAuthorizationRevision: () => identity.revision,
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
function panel(recordId = 'record') {
  return (
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter>
        <ApprovalAiReviewPanel lifecycle='oa.contract' recordId={recordId} />
      </MemoryRouter>
    </TestI18nProvider>
  );
}
const ready: ApprovalSuggestionView = {
  taskId: 'task',
  title: 'Contract',
  stage: 'legalFinance',
  state: 'ready',
  canGenerate: true,
  advice: null,
  currentGenerationId: null,
  versions: [],
  attempts: [],
};
const report = {
  nextStep: 'Verify the payment schedule before deciding.',
  findings: [
    {
      checkId: 'payment',
      title: 'Payment schedule',
      verdict: 'needs_verification' as const,
      summary: 'Confirm the payment deadline.',
      evidence: [],
    },
  ],
  coverage: [
    {
      kind: 'knowledge' as const,
      ref: 'policy',
      label: 'Payment policy',
      text: 'not returned',
      status: 'read' as const,
      truncated: true,
      range: { start: 0, end: 20, total: 100 },
    },
  ],
  basis: 'Submitted fields',
  generatedAt: '2026-11-05T00:00:00Z',
  model: { modelService: 'gateway', model: 'model' },
};
const generated: ApprovalSuggestionView = {
  ...ready,
  state: 'generated',
  canGenerate: false,
  canRegenerate: true,
  currentGenerationId: 'generation-1',
  advice: { report },
  versions: [{ id: 'generation-1', report }],
  attempts: [
    {
      id: 'generation-1',
      status: 'succeeded',
      createdAt: report.generatedAt,
      finishedAt: report.generatedAt,
      errorCode: null,
    },
  ],
};
beforeEach(() => {
  api.request.mockReset();
  toaster.show.mockReset();
  refreshes.clear();
  identity.user = 'handler';
  identity.revision = 0;
});
afterEach(cleanup);
async function refresh() {
  await act(async () => {
    await refreshes.get('oa:approval-suggestions:task')!().catch(() => {});
  });
}
async function generationButton(
  status = 'Not generated',
  label = 'Generate suggestion',
) {
  fireEvent.click(
    await screen.findByRole('button', { name: status, exact: true }),
  );
  return (
    await screen.findAllByRole('button', { name: label, exact: true })
  )[0];
}

it('reads on open and realtime refresh without generating, and hides tasks outside actionable access', async () => {
  api.request.mockResolvedValue({ data: [ready] });
  render(panel());
  await screen.findByRole('region', { name: 'AI approval assistance' });
  await refresh();
  expect(
    api.request.mock.calls.every(([input]) => input.method !== 'POST'),
  ).toBe(true);
  api.request.mockResolvedValue({ data: [] });
  await refresh();
  expect(screen.queryByRole('region')).toBeNull();
});

it('generates only explicitly and sends the current identity with the stable request key', async () => {
  api.request.mockImplementation(async (input) =>
    input.method === 'POST'
      ? {
          data: {
            ...ready,
            state: 'generating',
            currentGenerationId: 'new',
            canGenerate: false,
          },
        }
      : { data: [ready] },
  );
  render(panel());
  fireEvent.click(await generationButton());
  await waitFor(() => expect(toaster.show).toHaveBeenCalled());
  const post = api.request.mock.calls.find(
    ([input]) => input.method === 'POST',
  )![0];
  expect(post.path).toBe('approvalAi/reviews/task/generate');
  expect(post.json).toEqual({
    lifecycle: 'oa.contract',
    recordId: 'record',
    requestKey: expect.any(String),
    previousId: null,
  });
});

it('preserves request key and previous generation after uncertain enqueue response and failed revalidation', async () => {
  let unreadable = false;
  api.request.mockImplementation(async (input) => {
    if (input.method === 'POST') {
      unreadable = true;
      throw new Error('connection lost');
    }
    if (unreadable) throw new Error('offline');
    return { data: [ready] };
  });
  render(panel());
  fireEvent.click(await generationButton());
  await screen.findAllByText('Unable to load AI assistance. Please try again.');
  const first = api.request.mock.calls.find(
    ([input]) => input.method === 'POST',
  )![0].json;
  unreadable = false;
  await refresh();
  // The existing status popover can remain open across a failed read.
  const buttons = screen.queryAllByRole('button', {
    name: 'Generate suggestion',
    exact: true,
  });
  const button = buttons.length ? buttons[0] : await generationButton();
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
  await waitFor(() =>
    expect(
      api.request.mock.calls.filter(([input]) => input.method === 'POST'),
    ).toHaveLength(2),
  );
  expect(
    api.request.mock.calls.filter(([input]) => input.method === 'POST')[1][0]
      .json,
  ).toEqual(first);
});

it('clears reports and versions after failed status reads and restores through realtime', async () => {
  let failed = false;
  api.request.mockImplementation(async () => {
    if (failed) throw new Error('offline');
    return { data: [generated] };
  });
  render(panel());
  expect(await screen.findByText(report.nextStep)).toBeVisible();
  failed = true;
  await refresh();
  expect(screen.queryByText(report.nextStep)).toBeNull();
  expect(screen.queryByText('Payment schedule')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Generate again' })).toBeNull();
  failed = false;
  await refresh();
  expect(await screen.findByText(report.nextStep)).toBeVisible();
});

it('keeps an authorized successful version after regeneration failure and shows partial coverage', async () => {
  api.request.mockResolvedValue({
    data: [
      {
        ...generated,
        state: 'failed',
        currentGenerationId: 'failed-2',
        attempts: [
          ...generated.attempts!,
          {
            id: 'failed-2',
            status: 'failed',
            createdAt: report.generatedAt,
            finishedAt: report.generatedAt,
            errorCode: 'network',
          },
        ],
      },
    ],
  });
  render(panel());
  expect(await screen.findByText(report.nextStep)).toBeVisible();
  fireEvent.click(screen.getByText('Expand details'));
  expect(await screen.findByText(/Payment policy \(0–20\/100\)/)).toBeVisible();
  expect(screen.getAllByText(/Partially read/).length).toBeGreaterThan(0);
  expect(
    screen.queryByRole('button', { name: /Ask about suggestion/ }),
  ).toBeNull();
});

it('cancels only the displayed current generation with record identity', async () => {
  const running: ApprovalSuggestionView = {
    ...generated,
    state: 'generating',
    canGenerate: false,
    canCancel: true,
    currentGenerationId: 'generation-2',
    attempts: [
      {
        id: 'generation-2',
        status: 'generating',
        createdAt: report.generatedAt,
        finishedAt: null,
        errorCode: null,
        phase: 'running',
      },
    ],
  };
  api.request.mockImplementation(async (input) =>
    input.method === 'POST'
      ? {
          data: {
            ...running,
            state: 'cancelled',
            canCancel: false,
            canGenerate: true,
          },
        }
      : { data: [running] },
  );
  render(panel());
  fireEvent.click(await generationButton('Generating', 'Cancel generation'));
  await waitFor(() =>
    expect(
      api.request.mock.calls.some(([input]) => input.path.endsWith('/cancel')),
    ).toBe(true),
  );
  expect(
    api.request.mock.calls.find(([input]) => input.path.endsWith('/cancel'))![0]
      .json,
  ).toEqual({
    lifecycle: 'oa.contract',
    recordId: 'record',
    generationId: 'generation-2',
  });
});

it('shows model prerequisites without invoking generation and clears previous user reports', async () => {
  api.request.mockResolvedValue({ data: [generated] });
  const view = render(panel());
  expect(await screen.findByText(report.nextStep)).toBeVisible();
  identity.user = 'another';
  api.request.mockResolvedValue({
    data: [{ ...ready, state: 'model_unconfigured', canGenerate: false }],
  });
  view.rerender(panel());
  expect(screen.queryByText(report.nextStep)).toBeNull();
  expect(
    await screen.findByText(/An administrator must configure a default model/),
  ).toBeVisible();
  expect(
    api.request.mock.calls.every(([input]) => input.method !== 'POST'),
  ).toBe(true);
});

it('selects authorized generation history locally without generating or reading again', async () => {
  const older = {
    ...report,
    nextStep: 'Older authorized recommendation.',
    generatedAt: '2026-11-04T00:00:00Z',
  };
  api.request.mockResolvedValue({
    data: [
      {
        ...generated,
        versions: [{ id: 'older', report: older }, ...generated.versions!],
        attempts: [
          {
            id: 'older',
            status: 'succeeded',
            createdAt: older.generatedAt,
            finishedAt: older.generatedAt,
            errorCode: null,
          },
          ...generated.attempts!,
        ],
      },
    ],
  });
  render(panel());
  expect(await screen.findByText(report.nextStep)).toBeVisible();
  const reads = api.request.mock.calls.length;
  fireEvent.click(screen.getByRole('button', { name: 'Generation history' }));
  const olderButton = await screen.findByRole('button', {
    name: 'Version 1',
    exact: true,
  });
  fireEvent.click(olderButton);
  expect(await screen.findByText(older.nextStep)).toBeVisible();
  expect(api.request.mock.calls).toHaveLength(reads);
});

it('uses the regeneration capability for successful reports', async () => {
  api.request.mockImplementation(async (input) =>
    input.method === 'POST'
      ? { data: { ...generated, state: 'generating', canRegenerate: false } }
      : { data: [generated] },
  );
  render(panel());
  fireEvent.click(await generationButton('Ready', 'Generate again'));
  await waitFor(() => expect(toaster.show).toHaveBeenCalled());
  expect(
    api.request.mock.calls.find(([input]) => input.method === 'POST')![0].json
      .previousId,
  ).toBe('generation-1');
});

it('does not restore protected reports from a mutation acknowledged after failed status revalidation', async () => {
  let unavailable = false;
  let acknowledge!: (value: { data: ApprovalSuggestionView }) => void;
  api.request.mockImplementation((input) => {
    if (input.method === 'POST')
      return new Promise((resolve) => {
        acknowledge = resolve;
      });
    if (unavailable)
      return Promise.reject(new Error('access cannot be revalidated'));
    return Promise.resolve({ data: [ready] });
  });
  render(panel());
  fireEvent.click(await generationButton());
  await waitFor(() => expect(acknowledge).toBeDefined());
  unavailable = true;
  await refresh();
  await act(async () => {
    acknowledge({ data: generated });
  });
  await screen.findAllByText('Unable to load AI assistance. Please try again.');
  expect(screen.queryByText(report.nextStep)).toBeNull();
  expect(screen.queryByText('Payment schedule')).toBeNull();
  expect(
    screen.queryByRole('button', { name: 'Version 1', exact: true }),
  ).toBeNull();
  unavailable = false;
  api.request.mockResolvedValue({ data: [generated] });
  await refresh();
  expect(await screen.findByText(report.nextStep)).toBeVisible();
});
