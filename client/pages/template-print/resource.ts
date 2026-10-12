import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { clearActor } from './command.js';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
/** Identity changes and denied refreshes never retain previously authorized content. */
export function useResource<T>(
  path: string | null,
  query?: Record<string, string>,
) {
  const api = useApiClient();
  const { session } = useAuthentication();
  const actor = session?.user.id ?? '';
  const epochRef = useRef(0);
  const [generation, reload] = useReducer((v: number) => v + 1, 0);
  const source = JSON.stringify([path, query ?? {}, actor]);
  const key = source + ':' + generation;
  const [result, setResult] = useState<{
    source: string;
    key: string;
    data?: T;
    error?: unknown;
  }>();
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    const current = epochRef.current;
    const [, q] = JSON.parse(source) as [string, Record<string, string>];
    api.request<T>({ path, query: q, signal: controller.signal }).then(
      (data) => {
        if (!controller.signal.aborted && current === epochRef.current)
          setResult({ source, key, data });
      },
      (error: unknown) => {
        if (controller.signal.aborted || current !== epochRef.current) return;
        const denied =
          error instanceof ApiClientError &&
          [401, 403, 404].includes(error.status);
        if (denied) clearActor(actor);
        setResult((old) => ({
          source,
          key,
          error,
          data: !denied && old?.source === source ? old.data : undefined,
        }));
      },
    );
    return () => controller.abort();
  }, [api, path, source, key, actor]);
  const update = useCallback(
    (data: T) => setResult({ source, key, data }),
    [source, key],
  );
  const invalidate = useCallback(
    (error: unknown) => {
      epochRef.current++;
      clearActor(actor);
      setResult({ source, key, error });
    },
    [actor, source, key],
  );
  return {
    data: result?.source === source ? result.data : undefined,
    error: result?.key === key ? result.error : undefined,
    loading: !!path && result?.key !== key,
    reload,
    invalidate,
    update,
  };
}

export function isDenied(error: unknown) {
  return (
    error instanceof ApiClientError && [401, 403, 404].includes(error.status)
  );
}
