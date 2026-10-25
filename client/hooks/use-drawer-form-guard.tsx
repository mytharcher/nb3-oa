import { useContext, useLayoutEffect, useRef } from 'react';
import { DrawerCloseGuardsContext } from '#components/drawer-form-context';
import { useFormDiscardGuard } from './use-form-discard-guard.js';

/** Register actual form dirtiness, including picker changes, with its enclosing
 * drawer. Successful completion bypasses discard without changing cancel. */
export function useDrawerFormGuard(
  dirty: boolean,
  busy: boolean,
  onLeaveApproved?: () => void,
) {
  const guards = useContext(DrawerCloseGuardsContext);
  const savedRef = useRef(false);
  const { beforeClose, confirmation } = useFormDiscardGuard(dirty, busy);
  useLayoutEffect(() => {
    if (!guards) return;
    const check = async () => {
      const allowed = savedRef.current || (await beforeClose());
      if (allowed) onLeaveApproved?.();
      return allowed;
    };
    guards.add(check);
    return () => {
      guards.delete(check);
    };
  }, [guards, beforeClose, onLeaveApproved]);
  return {
    confirmation,
    markEditing: () => {
      savedRef.current = false;
    },
    markSaved: () => {
      savedRef.current = true;
    },
  };
}
