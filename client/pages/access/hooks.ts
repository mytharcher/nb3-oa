import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useAuthorizationClient } from '../administration/authorization/use-authorization-client.js';
import { localizeOptions } from '../administration/authorization/components/localized-options.js';
import { useResourceOptions } from '../administration/authorization/components/use-resource-options.js';
import type {
  AccessSnapshot,
  AuthorizationOptions,
  SubjectRow,
} from './types.js';
import { titleText } from '../administration/authorization/i18n.js';

export function useLoad<T>(load: () => Promise<T>, retainData = false) {
  const [attempt, setAttempt] = useState(0);
  const request = useMemo(() => ({ load, attempt }), [load, attempt]);
  const activeRequestRef = useRef(request);
  const [refreshing, setRefreshing] = useState<typeof request>();
  const [state, setState] = useState<{
    request: typeof request;
    data?: T;
    error?: unknown;
  }>();
  const reload = useCallback(() => setAttempt((value) => value + 1), []);
  const replace = useCallback(
    (data: T) => setState({ request, data }),
    [request],
  );
  const refresh = useCallback(async () => {
    setRefreshing(request);
    try {
      const data = await load();
      if (activeRequestRef.current === request) setState({ request, data });
      return data;
    } finally {
      setRefreshing((value) => (value === request ? undefined : value));
    }
  }, [load, request]);
  useEffect(() => {
    activeRequestRef.current = request;
    let current = true;
    void load().then(
      (data) => {
        if (current) setState({ request, data });
      },
      (error: unknown) => {
        if (current)
          setState((value) => ({
            request,
            data: value?.request.load === load ? value.data : undefined,
            error,
          }));
      },
    );
    return () => {
      current = false;
    };
  }, [request, load]);
  return {
    data: retainData || state?.request.load === load ? state?.data : undefined,
    error: state?.request === request ? state.error : undefined,
    busy: state?.request !== request || refreshing === request,
    reload,
    replace,
    refresh,
  };
}
export function useSnapshot() {
  const api = useApiClient();
  return useLoad(
    useCallback(
      async () =>
        (
          await api.request<{ data: AccessSnapshot }>({
            path: 'access/snapshot',
          })
        ).data,
      [api],
    ),
  );
}
export function useCatalog(surface = 'permissionSets') {
  const client = useAuthorizationClient();
  const { t } = useTranslation();
  const state = useLoad(
    useCallback(() => client.loadOptions(surface), [client, surface]),
  );
  const localized: AuthorizationOptions | undefined = useMemo(
    () => state.data && localizeOptions(state.data, t),
    [state.data, t],
  );
  return { ...state, options: useResourceOptions(localized) };
}
export function useDirectory(options: AuthorizationOptions | undefined) {
  const client = useAuthorizationClient();
  const { t } = useTranslation();

  return useLoad(
    useCallback(async (): Promise<SubjectRow[]> => {
      if (!options) return [];
      const rows: SubjectRow[] = [];
      for (const type of options.subjectTypes.filter((type) =>
        [
          'org.dutyRole',
          'org.position',
          'org.department',
          'authenticated',
          'org.reportingManager',
          'org.departmentHead',
        ].includes(type.value),
      )) {
        if (type.selection?.type === 'fixed')
          rows.push({
            type: type.value,
            id: type.selection.id,
            title:
              type.value === 'authenticated'
                ? t('access.baseline')
                : type.label,
          });
        else {
          for (let page = 1; page <= 100; page += 1) {
            const result = await client.listSubjects(
              'permissionSets',
              type.value,
              { page, pageSize: 100 },
            );
            rows.push(
              ...result.items.map((entry) => ({
                type: type.value,
                id: entry.id,
                title: titleText(entry.title, t),
                ...(entry.description
                  ? { description: titleText(entry.description, t) }
                  : {}),
              })),
            );
            if (page * 100 >= result.total) break;
            if (page === 100) throw new Error('DIRECTORY_LIMIT');
          }
        }
      }
      return rows;
    }, [client, options, t]),
  );
}
