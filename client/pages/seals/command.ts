import { createRequestKey } from '#lib/request-key';
import { useEffect, useRef, useState } from 'react';
import { useApiClient } from '@nocobase/app-client';
/** Keys bind the exact payload; private income stays in component memory only. */
export function useSealCommand() {
  const api = useApiClient(),
    pendingRef = useRef<{ body: string; key: string } | undefined>(undefined),
    workingRef = useRef(false),
    lastErrorRef = useRef<unknown>(undefined),
    controllerRef = useRef(new AbortController());
  useEffect(() => {
    controllerRef.current = new AbortController();
    return () => controllerRef.current.abort();
  }, []);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>();
  async function execute<T>(
    path: string,
    method: 'POST' | 'PUT',
    body: Record<string, unknown>,
    keyField = 'requestKey',
    raise = false,
  ) {
    if (workingRef.current) return;
    const serialized = JSON.stringify([path, method, body]);
    if (pendingRef.current?.body !== serialized)
      pendingRef.current = { body: serialized, key: createRequestKey() };
    workingRef.current = true;
    setBusy(true);
    setError(undefined);
    lastErrorRef.current = undefined;
    try {
      const result = await api.request<T>({
        path,
        method,
        signal: controllerRef.current.signal,
        json: {
          ...body,
          ...(keyField ? { [keyField]: pendingRef.current.key } : {}),
        },
      });
      if (controllerRef.current.signal.aborted) return;
      pendingRef.current = undefined;
      return result;
    } catch (e) {
      lastErrorRef.current = e;
      if (!controllerRef.current.signal.aborted) setError(e);
      if (raise) throw e;
      return undefined;
    } finally {
      workingRef.current = false;
      if (!controllerRef.current.signal.aborted) setBusy(false);
    }
  }
  return { busy, error, execute, lastErrorRef };
}
