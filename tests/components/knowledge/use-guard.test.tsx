import { act, renderHook } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useKnowledgeGuard } from '../../../client/pages/knowledge/use-guard.js';
const { navigation } = vi.hoisted(() => ({
  navigation: { current: null as null | (() => boolean) },
}));
vi.mock('@nocobase/app-client', () => ({
  useNavigationGuard: (guard: () => boolean) => {
    navigation.current = guard;
  },
}));
vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ search: '' }),
}));
it('acknowledged publication exits before busy state commits; further edits and new pending writes reset the acknowledgement', () => {
  const { result, rerender } = renderHook(
    ({ busy, dirty }) => useKnowledgeGuard(busy, dirty),
    { initialProps: { busy: true, dirty: true } },
  );
  expect(result.current.beforeClose()).toBe(false);
  expect(navigation.current?.()).toBe(false);
  act(() => result.current.markSaved());
  expect(result.current.beforeClose()).toBe(true);
  expect(navigation.current?.()).toBe(true);
  rerender({ busy: false, dirty: true });
  act(() => result.current.markUnsaved());
  act(() => {
    expect(navigation.current?.()).toBe(false);
  });
  expect(result.current.confirm).toBe(true);
  act(() => result.current.stay());
  act(() => result.current.markSaved());
  rerender({ busy: true, dirty: true });
  expect(result.current.beforeClose()).toBe(false);
  expect(navigation.current?.()).toBe(false);
});
it('unacknowledged failure retains dirty close confirmation until explicitly discarded', async () => {
  const { result, rerender } = renderHook(
    ({ busy }) => useKnowledgeGuard(busy, true),
    { initialProps: { busy: true } },
  );
  expect(result.current.beforeClose()).toBe(false);
  rerender({ busy: false });
  let closing: boolean | Promise<boolean> = false;
  act(() => {
    closing = result.current.beforeClose();
  });
  expect(result.current.confirm).toBe(true);
  act(() => result.current.stay());
  expect(await closing).toBe(false);
  act(() => {
    closing = result.current.beforeClose();
  });
  act(() => result.current.discard());
  expect(await closing).toBe(true);
});
