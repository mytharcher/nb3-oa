import { useApiClient } from '@nocobase/app-client';
import { useEffect, useState } from 'react';

export interface CatalogOption {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly active: boolean;
}

/**
 * Active positions or grades for the archive form, from the organisation module's `GET /api/positions/options` and
 * `GET /api/grades/options` (open to every signed-in user). `undefined` while loading.
 */
export function useCatalogOptions(kind: 'positions' | 'grades'): {
  readonly options: CatalogOption[] | undefined;
  readonly error: unknown;
  readonly retry: () => void;
} {
  const api = useApiClient();
  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState<{
    readonly key: string;
    readonly options?: CatalogOption[];
    readonly error?: unknown;
  }>();
  const key = `${kind}:${reloadCount}`;

  useEffect(() => {
    const controller = new AbortController();
    const requestKey = `${kind}:${reloadCount}`;
    api
      .request<{ data: CatalogOption[] }>({
        path: `${kind}/options`,
        signal: controller.signal,
      })
      .then(
        ({ data }) => {
          if (!controller.signal.aborted)
            setResult({ key: requestKey, options: data });
        },
        (error: unknown) => {
          if (!controller.signal.aborted) setResult({ key: requestKey, error });
        },
      );
    return () => controller.abort();
  }, [api, kind, reloadCount]);

  return {
    options: result?.key === key ? result.options : undefined,
    error: result?.key === key ? result.error : undefined,
    retry: () => setReloadCount((count) => count + 1),
  };
}
