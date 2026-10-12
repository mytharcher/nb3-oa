import { useEffect, useRef, useState } from 'react';
import { useNavigationGuard } from '@nocobase/app-client';
import { useLocation, useNavigate } from 'react-router';
export function useKnowledgeGuard(busy: boolean, dirty: boolean) {
  const [confirm, setConfirm] = useState(false),
    savedRef = useRef(false),
    resolverRef = useRef<((v: boolean) => void) | null>(null),
    navigate = useNavigate(),
    location = useLocation();
  useEffect(
    () => () => {
      resolverRef.current?.(false);
      resolverRef.current = null;
    },
    [],
  );
  useEffect(() => {
    if (busy) savedRef.current = false;
  }, [busy]);
  // Acknowledged saves may navigate before React commits busy=false.
  const beforeClose = () =>
    savedRef.current
      ? true
      : busy
        ? false
        : !dirty
          ? true
          : new Promise<boolean>((r) => {
              resolverRef.current = r;
              setConfirm(true);
            });
  useNavigationGuard(() => {
    if (savedRef.current) return true;
    if (busy) return false;
    if (!dirty) return true;
    setConfirm(true);
    return false;
  });
  return {
    beforeClose,
    confirm,
    markUnsaved: () => {
      savedRef.current = false;
    },
    markSaved: () => {
      savedRef.current = true;
    },
    stay: () => {
      setConfirm(false);
      resolverRef.current?.(false);
      resolverRef.current = null;
    },
    discard: () => {
      savedRef.current = true;
      setConfirm(false);
      if (resolverRef.current) {
        resolverRef.current(true);
        resolverRef.current = null;
      } else
        void navigate(
          { pathname: '..', search: location.search },
          { replace: true },
        );
    },
  };
}
