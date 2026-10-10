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
  const source = JSON.stringify([path, queryKey]);
  const key = JSON.stringify([source, generation]);
  const [result, setResult] = useState<{
    source: string;
    key: string;
    data?: T;
    error?: unknown;
  }>();
  useEffect(() => {
    if (!path) return;
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
            data: !final && old?.source === source ? old.data : undefined,
            error,
          }));
        },
      );
    return () => controller.abort();
  }, [api, path, queryKey, source, key]);
  return {
    data: result?.source === source ? result.data : undefined,
    error: result?.key === key ? result.error : undefined,
    loading: !!path && result?.key !== key,
    reload,
    update: (data: T) => setResult({ source, key, data }),
  };
}
