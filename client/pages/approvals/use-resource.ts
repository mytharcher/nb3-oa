import { sharedRead } from './shared-read.js';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useAuthorizationRevision } from '@nocobase/app-plugin-authorization/client';
import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useEffect, useReducer, useState } from 'react';
/** Only a refresh of the same authorized resource retains content. Changing record/view or a final refusal clears it. */
export function useResource<T>(
  path: string | null,
  query?: Record<string, string>,
) {
  const api = useApiClient();
  const [generation, reload] = useReducer((v: number) => v + 1, 0);
  const queryKey = JSON.stringify(query ?? {});
  const { session } = useAuthentication();
  const revision = useAuthorizationRevision();
  const source = JSON.stringify([path, queryKey, session?.user.id, revision]);
  const key = JSON.stringify([source, generation]);
  const [result, setResult] = useState<{
    source: string;
    key: string;
    data?: T;
    error?: unknown;
  }>();
  useEffect(() => {
    if (!path) return;
    let active = true;
    const read = sharedRead(api, key, (signal) =>
      api.request<{ data: T }>({
        path,
        query: JSON.parse(queryKey) as Record<string, string>,
        signal,
      }),
    );
    read.promise.then(
      ({ data }) => {
        if (active) setResult({ source, key, data });
      },
      (error: unknown) => {
        if (!active) return;
        const final =
          error instanceof ApiClientError &&
          [401, 403, 404].includes(error.status);
        setResult((old) => ({
          source,
          key,
          data: !final && old?.source === source ? old.data : undefined,
          error,
        }));
      },
    );
    return () => {
      active = false;
      read.release();
    };
  }, [api, path, queryKey, source, key]);
  return {
    data: result?.source === source ? result.data : undefined,
    error: result?.key === key ? result.error : undefined,
    loading: !!path && result?.key !== key,
    // Initial completion survives refresh; a new identity/query resets it.
    settled: !path || result?.source === source,
    reload,
    update: (data: T) => setResult({ source, key, data }),
  };
}
