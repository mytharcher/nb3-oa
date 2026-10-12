import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { ApiClientError } from '@nocobase/app-client';
import { useResource } from '../../../client/pages/template-print/resource.js';
const { api, auth } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  auth: { actor: 'alice' },
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: auth.actor } } }),
}));
beforeEach(() => {
  cleanup();
  api.request.mockReset();
  sessionStorage.clear();
  auth.actor = 'alice';
});
it.each([401, 403, 404])(
  'clears loaded data and journals on denied refresh %s',
  async (status) => {
    api.request
      .mockResolvedValueOnce({ name: 'Secret' })
      .mockRejectedValueOnce(
        new ApiClientError('denied', { status, method: 'GET', url: '/x' }),
      );
    sessionStorage.setItem('oa:templatePrint:pending:alice:new:', '{}');
    const { result } = renderHook(() => useResource('printTemplates/t1'));
    await waitFor(() =>
      expect(result.current.data).toEqual({ name: 'Secret' }),
    );
    act(() => result.current.reload());
    await waitFor(() =>
      expect(result.current.error).toBeInstanceOf(ApiClientError),
    );
    expect(result.current.data).toBeUndefined();
    expect(sessionStorage.length).toBe(0);
  },
);
it('invalidates loaded content and refuses an outstanding response after denied action', async () => {
  let resolve!: (value: unknown) => void;
  api.request.mockResolvedValueOnce({ name: 'Secret' }).mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const { result } = renderHook(() => useResource('printTemplates/t1'));
  await waitFor(() => expect(result.current.data).toEqual({ name: 'Secret' }));
  act(() => result.current.reload());
  act(() =>
    result.current.invalidate(
      new ApiClientError('denied', { status: 403, method: 'PATCH', url: '/x' }),
    ),
  );
  await act(async () => resolve({ name: 'Stale secret' }));
  expect(result.current.data).toBeUndefined();
});
it('isolates actor changes and discards the previous actor late response', async () => {
  let resolve!: (value: unknown) => void;
  api.request
    .mockImplementationOnce(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    )
    .mockResolvedValueOnce({ name: 'Bob content' });
  const { result, rerender } = renderHook(() =>
    useResource('printTemplates/t1'),
  );
  auth.actor = 'bob';
  rerender();
  expect(result.current.data).toBeUndefined();
  await waitFor(() =>
    expect(result.current.data).toEqual({ name: 'Bob content' }),
  );
  await act(async () => resolve({ name: 'Alice secret' }));
  expect(result.current.data).toEqual({ name: 'Bob content' });
});
