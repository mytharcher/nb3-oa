import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useAuthorizationRevision } from '@nocobase/app-plugin-authorization/client';
import { useCallback, useEffect, useReducer, useState } from 'react';
/** Private data is scoped to actor and path; aborted/late requests cannot resurrect a previous actor's salary. */
export function useResource<T>(
  path: string | null,
  query?: Record<string, string>,
) {
  const api = useApiClient();
  const { session } = useAuthentication();
  const actor = session?.user.id ?? '';
  const authorizationRevision = useAuthorizationRevision();
  const [generation, reload] = useReducer((n: number) => n + 1, 0);
  const queryKey = JSON.stringify(query ?? {}),
    source = JSON.stringify([actor, authorizationRevision, path, queryKey]),
    key = JSON.stringify([source, generation]);
  const [result, setResult] = useState<{
    source: string;
    key: string;
    data?: T;
    error?: unknown;
  }>();
  useEffect(() => {
    if (!path || !actor) return;
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
  }, [api, actor, path, queryKey, source, key]);
  const update = useCallback(
    (data: T) => setResult({ source, key, data }),
    [source, key],
  );
  return {
    data: path && result?.source === source ? result.data : undefined,
    error: path && result?.key === key ? result.error : undefined,
    loading: !!path && !!actor && result?.key !== key,
    reload,
    update,
  };
}
