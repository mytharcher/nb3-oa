// The same loader the platform pages use (`pages/platform/shared/use-resource.ts`), kept module-local.
import { useApiClient } from '@nocobase/app-client';
import { useEffect, useReducer, useState } from 'react';

export interface Resource<T> {
  /** The latest loaded value; kept while reloading, so a reload shows old data with a spinner (guideline I4). */
  readonly data: T | undefined;
  /** The error of the current request, once it failed. */
  readonly error: unknown;
  /** Whether the current request has not answered yet. */
  readonly loading: boolean;
  readonly reload: () => void;
  /** Replaces the loaded value with what a write returned (guideline R2). */
  readonly replace: (data: T) => void;
}

/**
 * Loads `{ data }` from a GET endpoint and reloads when the path, the query or `reload()` changes. State is set only in
 * the request callbacks, never synchronously in the effect; "loading" is derived from whether the result belongs to
 * the current request.
 */
export function useResource<T>(
  path: string | null,
  query?: Readonly<Record<string, string | number | boolean | undefined>>,
): Resource<T> {
  const api = useApiClient();
  const [reloadCount, reload] = useReducer((count: number) => count + 1, 0);
  const queryKey = JSON.stringify(query ?? {});
  const requestKey = JSON.stringify([path, queryKey, reloadCount]);
  const [result, setResult] = useState<{
    readonly key: string;
    readonly data?: T;
    readonly error?: unknown;
  }>();

  useEffect(() => {
    if (path === null) return;
    const controller = new AbortController();
    const key = JSON.stringify([path, queryKey, reloadCount]);
    api
      .request<{ data: T }>({
        path,
        query: JSON.parse(queryKey) as Record<string, string>,
        signal: controller.signal,
      })
      .then(
        ({ data }) => {
          if (!controller.signal.aborted) setResult({ key, data });
        },
        (error: unknown) => {
          if (!controller.signal.aborted)
            setResult((previous) => ({ ...previous, key, error }));
        },
      );
    return () => controller.abort();
  }, [api, path, queryKey, reloadCount]);

  const loading = path !== null && result?.key !== requestKey;
  return {
    data: result?.data,
    error: loading ? undefined : result?.error,
    loading,
    reload,
    replace: (data) => setResult({ key: requestKey, data }),
  };
}

/** A list endpoint's `{ data, meta }`. */
export interface ListBody<T, M = { total: number }> {
  readonly data: T[];
  readonly meta: M;
}

/** Like `useResource`, for list endpoints whose `meta` the page needs (paged lists). */
export function useListResource<T, M = { total: number }>(
  path: string | null,
  query?: Readonly<Record<string, string | number | boolean | undefined>>,
): Omit<Resource<ListBody<T, M>>, 'replace'> & {
  /** The path the shown data was loaded from, to tell another path's data apart while it reloads. */
  readonly dataPath: string | undefined;
} {
  const api = useApiClient();
  const [reloadCount, reload] = useReducer((count: number) => count + 1, 0);
  const queryKey = JSON.stringify(query ?? {});
  const requestKey = JSON.stringify([path, queryKey, reloadCount]);
  const [result, setResult] = useState<{
    readonly key: string;
    readonly path?: string;
    readonly data?: ListBody<T, M>;
    readonly error?: unknown;
  }>();

  useEffect(() => {
    if (path === null) return;
    const controller = new AbortController();
    const key = JSON.stringify([path, queryKey, reloadCount]);
    api
      .request<ListBody<T, M>>({
        path,
        query: JSON.parse(queryKey) as Record<string, string>,
        signal: controller.signal,
      })
      .then(
        (body) => {
          if (!controller.signal.aborted) setResult({ key, path, data: body });
        },
        (error: unknown) => {
          if (!controller.signal.aborted)
            setResult((previous) => ({ ...previous, key, error }));
        },
      );
    return () => controller.abort();
  }, [api, path, queryKey, reloadCount]);

  const loading = path !== null && result?.key !== requestKey;
  return {
    data: result?.data,
    dataPath: result?.path,
    error: loading ? undefined : result?.error,
    loading,
    reload,
  };
}
