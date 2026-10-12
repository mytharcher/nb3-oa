import { useEffect, useReducer, useState } from 'react';
import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import type { Page } from './types.js';
export function usePage<T>(path: string, query: Record<string, string>) {
  const api = useApiClient(),
    { session } = useAuthentication(),
    [generation, reload] = useReducer((v: number) => v + 1, 0);
  const queryKey = JSON.stringify(query),
    source = JSON.stringify([session?.user.id, path, queryKey]),
    key = JSON.stringify([source, generation]);
  const [result, setResult] = useState<{
    source: string;
    key: string;
    page?: Page<T>;
    error?: unknown;
  }>();
  useEffect(() => {
    const c = new AbortController();
    api
      .request<Page<T>>({
        path,
        query: JSON.parse(queryKey) as Record<string, string>,
        signal: c.signal,
      })
      .then(
        (page) => {
          if (!c.signal.aborted) setResult({ source, key, page });
        },
        (error: unknown) => {
          if (!c.signal.aborted)
            setResult((old) => ({
              source,
              key,
              error,
              page:
                error instanceof ApiClientError &&
                [401, 403, 404].includes(error.status)
                  ? undefined
                  : old?.source === source
                    ? old.page
                    : undefined,
            }));
        },
      );
    return () => c.abort();
  }, [api, path, queryKey, source, key]);
  return {
    data: result?.source === source ? result.page : undefined,
    error: result?.key === key ? result.error : undefined,
    loading: result?.key !== key,
    reload,
  };
}
