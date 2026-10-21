import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import enUS from '../../client/locales/en-US.js';
import { TerminateProcess } from '../../client/pages/process-management/terminate.js';
const state = vi.hoisted(() => ({
  api: { request: vi.fn() },
  resource: {
    data: {
      data: {
        record: { kind: 'oa.leave', id: 'leave-1', number: 'LV-1' },
        actions: [{ action: 'terminate', allowed: true }],
      },
    },
    loading: false,
    update: vi.fn(),
    reload: vi.fn(),
  },
  toaster: { show: vi.fn() },
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => state.api,
  useToaster: () => state.toaster,
}));
vi.mock('../../client/pages/process-management/execution-context.js', () => ({
  useExecution: () => state.resource,
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
it('retries a failed termination preparation in the same confirmation without discarding the reason', async () => {
  state.api.request
    .mockRejectedValueOnce(new Error('private failure'))
    .mockResolvedValueOnce({ data: { version: 7 } });
  render(
    <TestI18nProvider runtime={runtime}>
      <TerminateProcess />
    </TestI18nProvider>,
  );
  await userEvent.click(
    screen.getByRole('button', { name: enUS.processManagement.terminate }),
  );
  const dialog = screen.getByRole('alertdialog');
  const reason = within(dialog).getByRole('textbox');
  await userEvent.type(reason, 'No longer needed');
  expect(
    within(dialog).getByRole('button', {
      name: enUS.processManagement.terminate,
    }),
  ).toBeDisabled();
  await userEvent.click(
    within(dialog).getByRole('button', { name: enUS.processManagement.retry }),
  );
  expect(
    await within(dialog).findByRole('button', {
      name: enUS.processManagement.terminate,
    }),
  ).toBeEnabled();
  expect(reason).toHaveValue('No longer needed');
  expect(screen.queryByText('private failure')).toBeNull();
  expect(state.api.request).toHaveBeenCalledTimes(2);
});
