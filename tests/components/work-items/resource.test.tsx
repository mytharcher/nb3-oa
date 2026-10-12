import { ApiClientError } from '@nocobase/app-client';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useWorkResource } from '../../../client/pages/work-items/resource.js';
const state = vi.hoisted(() => ({
  request: vi.fn(),
  actor: 'hr',
  revision: 0,
}));
const api = { request: state.request };
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: state.actor } } }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useAuthorizationRevision: () => state.revision,
}));
afterEach(() => {
  cleanup();
  state.request.mockReset();
  state.actor = 'hr';
  state.revision = 0;
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}
describe('work-item authorized resources', () => {
  it('clears immediately on source mode change and ignores old responses', async () => {
    const a = deferred<{ name: string }>(),
      b = deferred<{ name: string }>();
    state.request.mockReturnValueOnce(a.promise).mockReturnValue(b.promise);
    const { result, rerender } = renderHook(
      ({ department }) =>
        useWorkResource<{ name: string }>('workItems', {
          mode: department,
        }),
      { initialProps: { department: 'a' } },
    );
    rerender({ department: 'b' });
    await act(async () => a.resolve({ name: 'old private department' }));
    expect(result.current.data).toBeUndefined();
    await act(async () => b.resolve({ name: 'new department' }));
    expect(result.current.data?.name).toBe('new department');
  });
  it('retains authorized content during refresh but clears it after denial', async () => {
    const pending = deferred<{ name: string }>();
    state.request
      .mockResolvedValueOnce({ name: 'authorized' })
      .mockReturnValue(pending.promise);
    const { result } = renderHook(() =>
      useWorkResource<{ name: string }>('workItems/t1'),
    );
    await waitFor(() => expect(result.current.data?.name).toBe('authorized'));
    act(() => result.current.reload());
    expect(result.current.data?.name).toBe('authorized');
    state.request.mockRejectedValue(
      new ApiClientError('private diagnostic', {
        status: 403,
        method: 'GET',
        url: '/api/workItems/t1',
      }),
    );
    act(() => result.current.reload());
    await waitFor(() =>
      expect(result.current.error).toBeInstanceOf(ApiClientError),
    );
    expect(result.current.data).toBeUndefined();
  });
  it('drops loaded data when actor or authorization revision changes', async () => {
    const pending = deferred<{ name: string }>();
    state.request
      .mockResolvedValueOnce({ name: 'former actor' })
      .mockReturnValue(pending.promise);
    const { result, rerender } = renderHook(() =>
      useWorkResource<{ name: string }>('workItems/t1'),
    );
    await waitFor(() => expect(result.current.data).toBeDefined());
    state.actor = 'other';
    rerender();
    expect(result.current.data).toBeUndefined();
    await act(async () => pending.resolve({ name: 'other actor' }));
    expect(result.current.data?.name).toBe('other actor');
    state.revision++;
    state.request.mockReturnValue(new Promise(() => {}));
    rerender();
    expect(result.current.data).toBeUndefined();
  });
});
