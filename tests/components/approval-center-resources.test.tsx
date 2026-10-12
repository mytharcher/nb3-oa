import { act, cleanup, render, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useCenterResource } from '../../client/pages/approvals/use-center-resource.js';
import { CenterEntry } from '../../client/pages/approvals/center-entry.js';
import { useResource } from '../../client/pages/approvals/use-resource.js';
const state = vi.hoisted(() => ({
  canAccess: false,
  pending: false,
  actor: 'hr',
  revision: 0,
  request: vi.fn(),
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
  useCan: () => ({ can: state.canAccess, isPending: state.pending }),
}));
vi.mock('@nocobase/i18n/client', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
afterEach(() => {
  cleanup();
  state.request.mockReset();
  state.canAccess = false;
  state.pending = false;
  state.actor = 'hr';
  state.revision = 0;
});
function deferred() {
  let resolve!: (value: unknown) => void;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
}
it('clears center records, amounts and authorized totals on actor changes and ignores delayed old responses', async () => {
  const old = deferred(),
    next = deferred();
  state.request.mockReturnValueOnce(old.promise).mockReturnValue(next.promise);
  const { result, rerender } = renderHook(() =>
    useCenterResource({ view: 'pending' }),
  );
  state.actor = 'employee';
  rerender();
  await act(async () =>
    old.resolve({ data: [{ amount: 90000 }], meta: { total: 20 } }),
  );
  expect(result.current.data).toBeUndefined();
  expect(result.current.meta).toBeUndefined();
  await act(async () => next.resolve({ data: [], meta: { total: 0 } }));
  expect(result.current.data).toEqual([]);
  expect(result.current.meta?.total).toBe(0);
});
it('removes current HR initiation capability immediately after a permission revision', async () => {
  const first = deferred(),
    stale = deferred(),
    current = deferred();
  state.request
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(stale.promise)
    .mockReturnValue(current.promise);
  const { result, rerender } = renderHook(() =>
    useResource<{ canCreateAsHR: boolean }>('transferRequests/capabilities'),
  );
  await act(async () => first.resolve({ data: { canCreateAsHR: true } }));
  expect(result.current.data?.canCreateAsHR).toBe(true);
  act(() => result.current.reload());
  state.revision++;
  rerender();
  expect(result.current.data).toBeUndefined();
  await act(async () => stale.resolve({ data: { canCreateAsHR: true } }));
  expect(result.current.data).toBeUndefined();
  await act(async () => current.resolve({ data: { canCreateAsHR: false } }));
  expect(result.current.data?.canCreateAsHR).toBe(false);
});

it('checks the center page grant before mounting an independently authorized home business child', () => {
  const mounted = vi.fn();
  function Business() {
    mounted();
    return <span>business</span>;
  }
  const { rerender } = render(
    <CenterEntry>
      <Business />
    </CenterEntry>,
  );
  expect(mounted).not.toHaveBeenCalled();
  state.canAccess = true;
  state.pending = true;
  rerender(
    <CenterEntry>
      <Business />
    </CenterEntry>,
  );
  expect(mounted).not.toHaveBeenCalled();
  state.pending = false;
  rerender(
    <CenterEntry>
      <Business />
    </CenterEntry>,
  );
  expect(mounted).toHaveBeenCalledTimes(1);
  state.canAccess = false;
  rerender(
    <CenterEntry>
      <Business />
    </CenterEntry>,
  );
  expect(mounted).toHaveBeenCalledTimes(1);
});

it('retains first-read completion on refresh and resets it on a permission revision', async () => {
  const first = deferred(),
    refresh = deferred(),
    revised = deferred();
  state.request
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(refresh.promise)
    .mockReturnValue(revised.promise);
  const { result, rerender } = renderHook(() =>
    useCenterResource({ view: 'mine' }),
  );
  expect(result.current.settled).toBe(false);
  await act(async () => first.resolve({ data: [], meta: { total: 0 } }));
  expect(result.current.settled).toBe(true);
  act(() => result.current.reload());
  expect(result.current.loading).toBe(true);
  expect(result.current.settled).toBe(true);
  state.revision++;
  rerender();
  expect(result.current.settled).toBe(false);
  await act(async () => refresh.resolve({ data: [], meta: { total: 0 } }));
  expect(result.current.settled).toBe(false);
  await act(async () => revised.resolve({ data: [], meta: { total: 0 } }));
  expect(result.current.settled).toBe(true);
});
