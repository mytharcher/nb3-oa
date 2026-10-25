import {
  useCallback,
  useEffect,
  useState,
  useMemo,
  useRef,
  createContext,
  createElement,
  useContext,
  type ReactNode,
} from 'react';
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
const SharedSnapshotContext = createContext<
  ReturnType<typeof useLoad<AccessSnapshot>> | undefined
>(undefined);
const SharedCatalogContext = createContext<
  | (ReturnType<
      typeof useLoad<
        import('../administration/authorization/authorization-client.js').AuthorizationOptionsResponse
      >
    > & { options?: AuthorizationOptions })
  | undefined
>(undefined);
export function AccessDataProvider({ children }: { children: ReactNode }) {
  const snapshot = useSnapshot();
  const catalog = useCatalog();
  return createElement(
    SharedSnapshotContext.Provider,
    { value: snapshot },
    createElement(SharedCatalogContext.Provider, { value: catalog }, children),
  );
}
export function useSnapshot(global = false) {
  const context = useContext(SharedSnapshotContext);
  const shared = global ? undefined : context;
  const api = useApiClient();
  const local = useLoad(
    useCallback(
      async () =>
        shared
          ? shared.data!
          : (
              await api.request<{ data: AccessSnapshot }>({
                path: 'access/snapshot',
              })
            ).data,
      [api, shared],
    ),
  );
  return shared ?? local;
}
export function useCatalog(surface = 'permissionSets', enabled = true) {
  const api = useApiClient();
  const shared = useContext(SharedCatalogContext);
  const client = useAuthorizationClient();
  const { t } = useTranslation();
  const state = useLoad(
    useCallback(
      () =>
        shared && surface === 'permissionSets'
          ? Promise.resolve(shared.data!)
          : !enabled
            ? Promise.resolve({
                sections: [],
                subjectTypes: [],
                recordAccess: [],
                collections: [],
              })
            : surface === 'permissionSets'
              ? api
                  .request<{
                    data: import('../administration/authorization/authorization-client.js').AuthorizationOptionsResponse;
                  }>({ path: 'access/options' })
                  .then((result) => result.data)
              : client.loadOptions(surface),
      [api, client, surface, shared, enabled],
    ),
  );
  const localized: AuthorizationOptions | undefined = useMemo(
    () => state.data && localizeOptions(state.data, t),
    [state.data, t],
  );
  const discovered = useResourceOptions(localized);
  const options = useMemo(
    () =>
      discovered && {
        ...discovered,
        sections: discovered.sections.map((section) => ({
          ...section,
          subsections: section.subsections.map((subsection) => ({
            ...subsection,
            resources: subsection.resources.map((resource) =>
              resource.type === 'page' &&
              resource.value === 'oa.approvals' &&
              resource.label === resource.value
                ? { ...resource, label: t('approvals.navigation.center') }
                : resource,
            ),
          })),
        })),
      },
    [discovered, t],
  );
  const namedOptions = useMemo(
    () =>
      options && {
        ...options,
        sections: options.sections.map((section) => ({
          ...section,
          subsections: section.subsections.map((subsection) => ({
            ...subsection,
            resources: subsection.resources.map((resource) => ({
              ...resource,
              ...(resource.dataScopes
                ? {
                    dataScopes: Object.fromEntries(
                      Object.entries(resource.dataScopes).map(
                        ([action, scopes]) => [
                          action,
                          scopes.map((scope, index) => ({
                            ...scope,
                            label:
                              scope.label !== scope.key
                                ? scope.label
                                : [
                                      'paymentRequests',
                                      'reimbursementRequests',
                                      'leaveRequests',
                                      'contractRequests',
                                      'certificateRequests',
                                      'sealRequests',
                                      'printTemplates',
                                      'printTemplateRevisions',
                                      'knowledgeDocuments',
                                      'knowledgeVersions',
                                      'knowledgeFolders',
                                      'sealLedger',
                                      'sealReceipts',
                                      'contracts',
                                      'contractVersions',
                                      'contractChanges',
                                      'contractPayments',
                                    ].includes(scope.key)
                                  ? t(`access.scopeLabels.${scope.key}`)
                                  : t('access.scopeNumber', {
                                      number: index + 1,
                                    }),
                          })),
                        ],
                      ),
                    ),
                  }
                : {}),
              ...(resource.type === 'page' && !resource.actions
                ? {
                    actions: [
                      { value: 'access', label: t('access.pageAccess') },
                    ],
                  }
                : {}),
            })),
          })),
        })),
      },
    [options, t],
  );
  return shared && surface === 'permissionSets'
    ? shared
    : { ...state, options: namedOptions };
}
export function useDirectory(_options: AuthorizationOptions | undefined) {
  const api = useApiClient();
  const { t } = useTranslation();
  return useLoad(
    useCallback(async (): Promise<SubjectRow[]> => {
      const result = await api.request<{
        data: (Omit<SubjectRow, 'title'> & {
          title: string | { key: string; ns: string };
        })[];
      }>({ path: 'access/directory' });
      return result.data.map((row) => ({
        ...row,
        title:
          row.type === 'authenticated'
            ? t('access.baseline')
            : titleText(row.title, t),
      }));
    }, [api, t]),
  );
}

export function useRoleSnapshot(type: string, id: string) {
  const api = useApiClient();
  return useLoad(
    useCallback(
      async () =>
        (
          await api.request<{ data: AccessSnapshot }>({
            path: `access/subjects/${encodeURIComponent(type)}/${encodeURIComponent(id)}`,
          })
        ).data,
      [api, type, id],
    ),
  );
}
export function useRoleDirectory(enabled = true) {
  const api = useApiClient();
  const { t } = useTranslation();
  return useLoad(
    useCallback(async (): Promise<SubjectRow[]> => {
      if (!enabled) return [];
      const result = await api.request<{
        data: (Omit<SubjectRow, 'title'> & {
          title: string | { key: string; ns?: string };
        })[];
      }>({ path: 'access/roles' });
      return result.data.map((row) => ({
        ...row,
        title:
          row.type === 'authenticated'
            ? t('access.baseline')
            : titleText(row.title, t),
      }));
    }, [api, t, enabled]),
  );
}
