import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import enUS from '../../client/locales/en-US.js';
const mocks = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => ({ request: mocks.request }),
}));
const { RecoverRoutingButton } =
  await import('../../client/pages/it-repairs/groups.js');
const runtime = await createTestI18nRuntime({
  locale: 'en-US',
  application: { namespace: '@nocobase/app-template-default', resources: enUS },
});
it('retries a failed batch with the same request key, then advances to a new batch', async () => {
  mocks.request
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValueOnce({ data: { processed: 100, hasMore: true } })
    .mockResolvedValueOnce({ data: { processed: 1, hasMore: false } });
  const user = userEvent.setup();
  render(
    <TestI18nProvider runtime={runtime}>
      <RecoverRoutingButton group={{ id: 'it', version: 3 }} />
    </TestI18nProvider>,
  );
  await user.click(
    screen.getByRole('button', { name: 'Recover unassigned repairs' }),
  );
  await screen.findByRole('alert');
  await user.click(
    screen.getByRole('button', { name: 'Recover unassigned repairs' }),
  );
  await screen.findByText(
    'Recovered 100 repairs. More remain; run another batch.',
  );
  expect(mocks.request.mock.calls[0][0]).toEqual(
    mocks.request.mock.calls[1][0],
  );
  await user.click(
    screen.getByRole('button', { name: 'Recover unassigned repairs' }),
  );
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent(
      'Recovered 1 repairs. No matching unassigned repairs remain.',
    ),
  );
  expect(mocks.request.mock.calls[2][0].json.requestKey).not.toBe(
    mocks.request.mock.calls[1][0].json.requestKey,
  );
});
