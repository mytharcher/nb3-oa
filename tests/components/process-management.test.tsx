import { ApiClientError } from '@nocobase/app-client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import {
  render,
  screen,
  renderHook,
  waitFor,
  act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { it, expect, vi, beforeEach } from 'vitest';
import enUS from '../../client/locales/en-US.js';
import { Failure } from '../../client/pages/process-management/shared.js';
import { useProcessResource } from '../../client/pages/process-management/resource.js';
const { api, identity } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  identity: { id: 'manager', revision: 1 },
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: identity.id } } }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useAuthorizationRevision: () => identity.revision,
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
beforeEach(() => {
  api.request.mockReset();
  identity.id = 'manager';
  identity.revision = 1;
});
it.each([403, 404])(
  'does not offer retry or reveal raw errors on %s',
  (status) => {
    render(
      <TestI18nProvider runtime={runtime}>
        <Failure
          error={
            new ApiClientError('private record details', {
              status,
              method: 'GET',
              url: '/api/processManagement/executions',
            })
          }
          retry={vi.fn()}
        />
      </TestI18nProvider>,
    );
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
    expect(screen.getByRole('alert')).not.toHaveTextContent(
      'private record details',
    );
  },
);
it('offers explicit retry for temporary failures', async () => {
  const retry = vi.fn();
  render(
    <TestI18nProvider runtime={runtime}>
      <Failure error={new Error('private details')} retry={retry} />
    </TestI18nProvider>,
  );
  await userEvent.setup().click(screen.getByRole('button', { name: 'Retry' }));
  expect(retry).toHaveBeenCalledOnce();
});
it('clears retained data on permission revocation and discards a response from the prior identity', async () => {
  api.request.mockResolvedValueOnce({ private: 'old history' });
  const { result, rerender } = renderHook(() =>
    useProcessResource<{ private: string }>('processManagement/executions'),
  );
  await waitFor(() => expect(result.current.data?.private).toBe('old history'));
  let finish!: (value: { private: string }) => void;
  api.request.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  act(() => result.current.reload());
  await waitFor(() => expect(api.request).toHaveBeenCalledTimes(2));
  identity.id = 'another';
  identity.revision++;
  api.request.mockResolvedValueOnce({ private: 'new history' });
  rerender();
  expect(result.current.data).toBeUndefined();
  await waitFor(() => expect(result.current.data?.private).toBe('new history'));
  await act(async () => {
    finish({ private: 'stale private history' });
  });
  expect(result.current.data?.private).toBe('new history');
  api.request.mockRejectedValueOnce(
    new ApiClientError('revoked', {
      status: 403,
      method: 'GET',
      url: '/api/processManagement/executions',
    }),
  );
  act(() => result.current.reload());
  await waitFor(() => expect(result.current.error).toBeTruthy());
  expect(result.current.data).toBeUndefined();
});
