import { useCallback, useRef, useState } from 'react';
import { useNavigationGuard } from '@nocobase/app-client';
import { useNavigate, useLocation } from 'react-router';
/** Route close and browser navigation share the same unsaved-input decision. */
export function useCloseGuard(busy: boolean) {
  const [dirty, setDirty] = useState(false),
    [confirm, setConfirm] = useState(false);
  const resolveRef = useRef<((value: boolean) => void) | null>(null),
    savedRef = useRef(false);
  const beforeClose = useCallback(() => {
    if (busy) return false;
    if (savedRef.current || !dirty) return true;
    setConfirm(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, [busy, dirty]);
  const navigate = useNavigate(),
    location = useLocation();
  useNavigationGuard(() => {
    if (busy) return false;
    if (savedRef.current || !dirty) return true;
    setConfirm(true);
    return false;
  });
  const changed = useCallback(() => {
    savedRef.current = false;
    setDirty(true);
  }, []);
  const saved = useCallback(() => {
    savedRef.current = true;
    setDirty(false);
  }, []);
  return {
    beforeClose,
    changed,
    saved,
    confirm,
    stay: () => {
      setConfirm(false);
      resolveRef.current?.(false);
      resolveRef.current = null;
    },
    discard: () => {
      saved();
      setConfirm(false);
      if (resolveRef.current) resolveRef.current(true);
      else void navigate({ pathname: '..', search: location.search });
      resolveRef.current = null;
    },
  };
}
