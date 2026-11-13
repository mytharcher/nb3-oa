import { refreshPersonalWork } from '#lib/personal-work-refresh';
import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useAuthorizationRevision } from '@nocobase/app-plugin-authorization/client';
import { useCallback, useEffect, useReducer, useState } from 'react';
/** A changed actor, scope, department/date or revision clears content immediately; old promises cannot restore it. */
export function useBusinessResource<T>(
  path: string | null,
  query: Record<string, string> = {},
  refreshToken = 0,
) {
  const api = useApiClient(),
    { session } = useAuthentication(),
    authorizationRevision = useAuthorizationRevision();
  const [epoch, reloadLocal] = useReducer((n) => n + 1, 0);
  const reload = useCallback(() => {
    reloadLocal();
    refreshPersonalWork();
  }, []);
  const queryKey = JSON.stringify(query),
    source = JSON.stringify([
      session?.user.id,
      authorizationRevision,
      path,
      queryKey,
    ]),
    identity = JSON.stringify([source, refreshToken, epoch]);
  const [result, setResult] = useState<{
    source: string;
    identity: string;
    data?: T;
    error?: unknown;
  }>();
  useEffect(() => {
    if (!path || !session?.user.id) return;
    const controller = new AbortController();
    api
      .request<T>({
        path,
        query: JSON.parse(queryKey) as Record<string, string>,
        signal: controller.signal,
      })
      .then(
        (data) => {
          if (!controller.signal.aborted) setResult({ source, identity, data });
        },
        (error: unknown) => {
          if (!controller.signal.aborted)
            setResult((previous) => ({
              source,
              identity,
              error,
              data:
                error instanceof ApiClientError &&
                [401, 403, 404].includes(error.status)
                  ? undefined
                  : previous?.source === source
                    ? previous.data
                    : undefined,
            }));
        },
      );
    return () => controller.abort();
  }, [api, source, identity, path, queryKey, session?.user.id]);
  const current = result?.identity === identity ? result : undefined;
  const update = useCallback(
    (data: T) => setResult({ source, identity, data }),
    [source, identity],
  );
  return {
    data: path && result?.source === source ? result.data : undefined,
    error: path ? current?.error : undefined,
    loading: !!path && !!session?.user.id && !current,
    reload,
    update,
  };
}
