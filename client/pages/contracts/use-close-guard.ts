import { useState, useCallback, useRef } from 'react';
import { useNavigationGuard } from '@nocobase/app-client';
import { useNavigate, useLocation } from 'react-router';
export function useCloseGuard(busy: boolean) {
  const [dirty, setDirty] = useState(false),
    [confirm, setConfirm] = useState(false),
    resolveRef = useRef<((v: boolean) => void) | null>(null),
    savedRef = useRef(false),
    navigate = useNavigate(),
    location = useLocation();
  const beforeClose = useCallback(() => {
    if (busy) return false;
    if (savedRef.current || !dirty) return true;
    setConfirm(true);
    return new Promise<boolean>((r) => {
      resolveRef.current = r;
    });
  }, [busy, dirty]);
  useNavigationGuard(() => {
    if (busy) return false;
    if (savedRef.current || !dirty) return true;
    setConfirm(true);
    return false;
  });
  const saved = useCallback(() => {
      savedRef.current = true;
      setDirty(false);
    }, []),
    changed = useCallback(() => {
      savedRef.current = false;
      setDirty(true);
    }, []);
  return {
    changed,
    saved,
    beforeClose,
    dirty,
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
