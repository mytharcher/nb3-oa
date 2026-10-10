import { useApiClient } from '@nocobase/app-client';
import { useEffect, useState } from 'react';

/** A department as `GET /api/departments/options` returns it. */
export interface DepartmentOption {
  readonly id: string;
  readonly title: string;
  readonly code: string | null;
  readonly parentId: string | null;
  /** Whether the department and every ancestor are active. */
  readonly active: boolean;
}

/** A department with the titles of its ancestors, for display and search. */
export interface DepartmentPathOption extends DepartmentOption {
  /** Ancestor titles from the top, ending with the department's own: `总公司 / 研发中心 / 平台组`. */
  readonly path: string;
}

interface OptionsResult {
  readonly key: string;
  readonly departments?: DepartmentPathOption[];
  readonly error?: unknown;
}

function withPaths(
  departments: readonly DepartmentOption[],
): DepartmentPathOption[] {
  const byId = new Map(
    departments.map((department) => [department.id, department]),
  );
  return departments.map((department) => {
    const titles: string[] = [];
    const seen = new Set<string>();
    let current: DepartmentOption | undefined = department;
    // A cycle written by mistake ends the walk instead of looping.
    while (current && !seen.has(current.id)) {
      seen.add(current.id);
      titles.unshift(current.title);
      current =
        current.parentId === null ? undefined : byId.get(current.parentId);
    }
    return { ...department, path: titles.join(' / ') };
  });
}

/**
 * Loads the department tree for pickers: `GET /api/departments/options`, open to every signed-in user. Each option
 * carries its path of ancestor titles. Re-rendering does not refetch; `retry` does.
 */
export function useDepartmentOptions(includeInactive = false): {
  readonly departments: DepartmentPathOption[] | undefined;
  readonly error: unknown;
  readonly retry: () => void;
} {
  const api = useApiClient();
  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState<OptionsResult>();
  const key = `${String(includeInactive)}:${reloadCount}`;

  useEffect(() => {
    const controller = new AbortController();
    const requestKey = `${String(includeInactive)}:${reloadCount}`;
    api
      .request<{ data: DepartmentOption[] }>({
        path: 'departments/options',
        query: { includeInactive: includeInactive ? 'true' : undefined },
        signal: controller.signal,
      })
      .then(
        ({ data }) => {
          if (!controller.signal.aborted)
            setResult({ key: requestKey, departments: withPaths(data) });
        },
        (error: unknown) => {
          if (!controller.signal.aborted)
            setResult((previous) => ({ ...previous, key: requestKey, error }));
        },
      );
    return () => controller.abort();
  }, [api, includeInactive, reloadCount]);

  return {
    departments: result?.departments,
    error: result?.key === key ? result.error : undefined,
    retry: () => setReloadCount((count) => count + 1),
  };
}
