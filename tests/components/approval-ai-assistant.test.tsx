import { afterEach, expect, it, vi } from 'vitest';
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
import { ApprovalAssistantProvider } from '../../client/components/approval-ai/assistant-provider.js';
import {
  ApprovalAssistantButton,
  ApprovalAssistantPanel,
} from '../../client/components/approval-ai/assistant.js';
import type { ReviewConversationTarget } from '../../client/components/approval-ai/assistant-context.js';
import enUS from '../../client/locales/en-US.js';
const { createConversation } = vi.hoisted(() => ({
  createConversation: vi.fn(async () => ({ id: 'conversation' })),
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: 'alice' } } }),
}));
vi.mock('@nocobase/app-plugin-agents/client/chat', () => ({
  ChatProvider: ({ children }: { children: React.ReactNode }) => children,
  useChatApi: () => ({ createConversation }),
  useChatModels: () => ({
    data: [
      {
        name: 'test',
        title: 'Test',
        models: [{ value: 'chat', label: 'Chat' }],
      },
    ],
  }),
  useConversation: () => ({ data: {} }),
  useConversationMessages: () => ({
    items: [],
    pending: [],
    dispatch: vi.fn(),
  }),
  useSendMessage: () => vi.fn(),
  useConversationActions: () => ({}),
}));
vi.mock('../../client/components/agent-composer/index.js', () => ({
  AgentComposer: () => <div>Composer</div>,
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
const target: ReviewConversationTarget = {
  lifecycle: 'oa.contract',
  recordId: 'contract',
  taskId: 'task',
  generatedAt: '2026-10-28T00:00:00Z',
  title: 'Legal review',
  model: { modelService: 'test', model: 'chat' },
};
afterEach(cleanup);
it('keeps a reopened review conversation but resets it for a different task or generated result', async () => {
  function tree(current: ReviewConversationTarget) {
    return (
      <TestI18nProvider runtime={runtime}>
        <ApprovalAssistantProvider>
          <ApprovalAssistantButton target={current} />
          <ApprovalAssistantPanel />
        </ApprovalAssistantProvider>
      </TestI18nProvider>
    );
  }
  const view = render(tree(target));
  fireEvent.click(screen.getByRole('button', { name: 'Ask about suggestion' }));
  expect(
    await screen.findByText(/Legal review · Record Current record/),
  ).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Start conversation' }));
  await waitFor(() =>
    expect(
      screen.queryByRole('button', { name: 'Start conversation' }),
    ).toBeNull(),
  );
  expect(createConversation).toHaveBeenLastCalledWith(
    expect.objectContaining({
      config: {
        scope: ['oa-approval-review'],
        context: {
          variable: {
            lifecycle: target.lifecycle,
            recordId: target.recordId,
            taskId: target.taskId,
            generatedAt: target.generatedAt,
          },
        },
      },
    }),
  );
  fireEvent.click(
    screen.getAllByRole('button', { name: 'Close', exact: true })[0],
  );
  fireEvent.click(screen.getByRole('button', { name: 'Ask about suggestion' }));
  expect(
    screen.queryByRole('button', { name: 'Start conversation' }),
  ).toBeNull();
  fireEvent.click(
    screen.getAllByRole('button', { name: 'Close', exact: true })[0],
  );
  view.rerender(tree({ ...target, taskId: 'other-task' }));
  fireEvent.click(screen.getByRole('button', { name: 'Ask about suggestion' }));
  fireEvent.click(
    await screen.findByRole('button', { name: 'Start conversation' }),
  );
  await waitFor(() => expect(createConversation).toHaveBeenCalledTimes(2));
  expect(createConversation.mock.calls[1]).toEqual([
    expect.objectContaining({
      config: expect.objectContaining({
        context: {
          variable: expect.objectContaining({ taskId: 'other-task' }),
        },
      }),
    }),
  ]);
  await waitFor(() =>
    expect(
      screen.queryByRole('button', { name: 'Start conversation' }),
    ).toBeNull(),
  );
  fireEvent.click(
    screen.getAllByRole('button', { name: 'Close', exact: true })[0],
  );
  view.rerender(
    tree({
      ...target,
      taskId: 'other-task',
      generatedAt: '2026-10-28T01:00:00Z',
    }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Ask about suggestion' }));
  expect(
    await screen.findByRole('button', { name: 'Start conversation' }),
  ).toBeVisible();
});
