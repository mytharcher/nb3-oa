import { useApiClient } from '@nocobase/app-client';
import { useCallback, useEffect, useState } from 'react';

/** Loads one of the employee's sub-lists (`compensation`, `history`), keeping the previous rows while reloading. */
export function useTabList<T>(
  employeeId: string,
  list: 'compensation' | 'history',
): {
  readonly rows: T[] | undefined;
  readonly error: unknown;
  readonly retry: () => void;
} {
  const api = useApiClient();
  const [reloadCount, setReloadCount] = useState(0);
  const requestKey = `${employeeId}:${list}:${reloadCount}`;
  const [result, setResult] = useState<{
    readonly key: string;
    readonly rows?: T[];
    readonly error?: unknown;
  }>();
  useEffect(() => {
    const controller = new AbortController();
    const key = `${employeeId}:${list}:${reloadCount}`;
    api
      .request<{ data: T[] }>({
        path: `employees/${encodeURIComponent(employeeId)}/${list}`,
        signal: controller.signal,
      })
      .then(
        ({ data }) => {
          if (!controller.signal.aborted) setResult({ key, rows: data });
        },
        (error: unknown) => {
          if (!controller.signal.aborted)
            setResult((previous) => ({ ...previous, key, error }));
        },
      );
    return () => controller.abort();
  }, [api, employeeId, list, reloadCount]);
  const loading = result?.key !== requestKey;
  const retry = useCallback(() => setReloadCount((count) => count + 1), []);
  return {
    rows: result?.rows,
    error: loading ? undefined : result?.error,
    retry,
  };
}
