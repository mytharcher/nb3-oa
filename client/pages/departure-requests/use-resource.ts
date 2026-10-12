import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useEffect, useReducer, useState } from 'react';
/** Include the signed-in viewer in the local cache key, without sending a fake API parameter. */
export function useDepartureResource<T>(
  path: string | null,
  query?: Record<string, string>,
) {
  const api = useApiClient(),
    { session } = useAuthentication();
  const [generation, reload] = useReducer((n: number) => n + 1, 0);
  const queryKey = JSON.stringify(query ?? {}),
    source = JSON.stringify([session?.user.id ?? '', path, queryKey]),
    key = `${source}:${generation}`;
  const [result, setResult] = useState<{
    source: string;
    key: string;
    data?: T;
    error?: unknown;
  }>();
  useEffect(() => {
    if (!path || !session?.user.id) return;
    const controller = new AbortController();
    api
      .request<{ data: T }>({
        path,
        query: JSON.parse(queryKey) as Record<string, string>,
        signal: controller.signal,
      })
      .then(
        ({ data }) => {
          if (!controller.signal.aborted) setResult({ source, key, data });
        },
        (error: unknown) => {
          if (controller.signal.aborted) return;
          const final =
            error instanceof ApiClientError &&
            [401, 403, 404].includes(error.status);
          setResult((old) => ({
            source,
            key,
            error,
            data: !final && old?.source === source ? old.data : undefined,
          }));
        },
      );
    return () => controller.abort();
  }, [api, path, session?.user.id, queryKey, source, key]);
  return {
    data: result?.source === source ? result.data : undefined,
    error: result?.key === key ? result.error : undefined,
    loading: !!path && !!session?.user.id && result?.key !== key,
    reload,
    update: (data: T) => setResult({ source, key, data }),
  };
}
