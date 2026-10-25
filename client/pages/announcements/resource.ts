import { refreshPersonalWork } from '#lib/personal-work-refresh';
import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useAuthorizationRevision } from '@nocobase/app-plugin-authorization/client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useCallback, useEffect, useReducer, useState } from 'react';
/** Resource identities include every filter; only refreshing the same resource keeps old authorized content. */
export function useAnnouncementResource<T>(
  path: string | null,
  query?: Record<string, string>,
) {
  const api = useApiClient();
  const { session } = useAuthentication();
  const [generation, reloadLocal] = useReducer((n: number) => n + 1, 0);
  const reload = useCallback(() => {
    reloadLocal();
    refreshPersonalWork();
  }, []);
  const queryKey = JSON.stringify(query ?? {});
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
    const controller = new AbortController();
    api
      .request<T>({
        path,
        query: JSON.parse(queryKey) as Record<string, string>,
        signal: controller.signal,
      })
      .then(
        (data) => {
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
  const update = useCallback(
    (data: T) => setResult({ source, key, data }),
    [source, key],
  );
  return {
    data: path && result?.source === source ? result.data : undefined,
    error: result?.key === key ? result.error : undefined,
    loading: !!path && result?.key !== key,
    reload,
    invalidate: useCallback(() => {
      setResult(undefined);
      reload();
    }, [reload]),
    update,
  };
}

export function isDenied(error: unknown) {
  return (
    error instanceof ApiClientError && [401, 403, 404].includes(error.status)
  );
}
