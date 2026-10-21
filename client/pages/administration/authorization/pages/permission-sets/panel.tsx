import { FormDrawerContent, FormDrawerHeader } from '#components/form-drawer';
import { Dialog, DialogTitle } from '#components/ui/dialog';
import { ApplicationTableSkeleton } from '#components/application-table-skeleton';
import { ApplicationTableEmpty } from '#components/application-table-empty';
import { IconAction } from '../../../components/icon-action.js';
import { AuthorizationFormError } from '../../components/validation-error.js';
import { useToaster } from '@nocobase/app-client';
import { TruncatedText } from '#components/truncated-text';
import { titleText } from '../../i18n.js';
import { useSettingsActions } from '../../components/use-settings-actions.js';
import {
  Outlet,
  useLocation,
  useNavigate,
  useParams,
  useResolvedPath,
} from 'react-router';
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { PanelLeftClose, PanelLeftOpen, Plus, Trash2 } from 'lucide-react';
import type {
  AuthorizationOptions,
  AuthorizationSubject,
  PermissionSet,
  PermissionSetAssignment,
} from '../../authorization-client.js';
import {
  canAssignSubjectType,
  permissionSetCapabilities,
  permissionSetErrorMessage as message,
} from '../../components/permission-set-access.js';
import { ConfirmDialog } from '../../components/confirm-dialog.js';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { useAuthorizationTranslation } from '../../i18n.js';
import { useAuthorizationClient } from '../../use-authorization-client.js';
import { empty, fromSet, hasEmptyCustomFilter, toInput } from './drafts.js';
import { PermissionSetEditor } from './editor.js';
import { Assignments } from './assignments-tab.js';
import type { Draft } from './types.js';

export interface PermissionWorkspaceContext {
  content: ReactElement;
}

export function PermissionSetsPanel({
  options,
}: {
  options: AuthorizationOptions;
}): ReactElement {
  const toaster = useToaster();
  const navigate = useNavigate();
  const location = useLocation();
  const base = useResolvedPath('.').pathname;
  const { permissionSetKey } = useParams();
  const isNew = location.pathname === `${base}/new`;
  const assignmentsTab = location.pathname.endsWith('/assignments');
  const authz = useAuthorizationClient();
  const t = useAuthorizationTranslation();
  const title = (set: PermissionSet) => titleText(set.title, t, set.key);
  const [sets, setSets] = useState<readonly PermissionSet[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState<Draft | undefined>(() =>
    isNew ? empty() : undefined,
  );
  const [baseline, setBaseline] = useState(() =>
    isNew ? JSON.stringify(empty()) : '',
  );
  const [revision, setRevision] = useState(0);
  const [assignments, setAssignments] = useState<
    readonly PermissionSetAssignment[]
  >([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const editingDetails = location.pathname.endsWith('/details');
  const section = assignmentsTab
    ? 'assignments'
    : editingDetails
      ? 'details'
      : 'permissions';
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorCause, setErrorCause] = useState<unknown>();
  const error = errorCause === undefined ? undefined : message(t, errorCause);
  const [pending, setPending] = useState<string>();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dismissedEditorPath, setDismissedEditorPath] = useState('');
  const current = sets.find((item) => item.key === permissionSetKey);
  const allowed = useSettingsActions('authorization.permission-sets');
  const protection = permissionSetCapabilities(current);
  const capabilities = {
    ...protection,
    canUpdate: protection.canUpdate && allowed.update,
    canDelete: protection.canDelete && allowed.delete,
    canAssign: protection.canAssign && allowed.assign,
    canRevoke: protection.canRevoke && allowed.assign,
  };
  const dirty = Boolean(draft && JSON.stringify(draft) !== baseline);
  const setPath = (key: string, tab = 'permissions'): string =>
    `${base}/edit/${encodeURIComponent(key)}${tab === 'permissions' ? '' : `/${tab}`}`;
  const load = useCallback(async (): Promise<void> => {
    try {
      setSets(await authz.listPermissionSets());
      setLoaded(true);
    } catch (cause) {
      setErrorCause(cause);
    }
  }, [authz]);
  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);
  useEffect(() => {
    if (loaded && location.pathname === base && sets[0])
      void navigate(
        `${base}/edit/${encodeURIComponent(sets[0].key)}${location.search}`,
        { replace: true },
      );
  }, [loaded, location.pathname, location.search, base, sets, navigate]);
  const [draftSource, setDraftSource] = useState({ current, isNew });
  if (draftSource.current !== current || draftSource.isNew !== isNew) {
    setDraftSource({ current, isNew });
    const next = isNew ? empty() : current ? fromSet(current, t) : undefined;
    setDraft(next);
    setBaseline(next ? JSON.stringify(next) : '');
    setRevision((value) => value + 1);
    setErrorCause(undefined);
  }
  useEffect(() => {
    if (!permissionSetKey || !assignmentsTab) return;
    let cancelled = false;
    void Promise.resolve()
      .then(() => {
        if (cancelled) return [];
        setAssignments([]);
        setAssignmentsLoading(true);
        return authz.listAssignments(permissionSetKey);
      })
      .then((items) => {
        if (!cancelled) setAssignments(items);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setErrorCause(cause);
      })
      .finally(() => {
        if (!cancelled) setAssignmentsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authz, permissionSetKey, assignmentsTab]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent): void => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  function go(path: string): void {
    if (busy) return;
    if (path === location.pathname) {
      setDismissedEditorPath('');
      return;
    }
    if (dirty) setPending(path);
    else
      void navigate({
        pathname: path,
        search: location.search,
        hash: location.hash,
      });
  }
  function closeEditor(): void {
    if (busy) return;
    if (dirty) setPending(location.pathname);
    else setDismissedEditorPath(location.pathname);
  }
  function discard(): void {
    const next = isNew ? empty() : current ? fromSet(current, t) : undefined;
    setDraft(next);
    setBaseline(next ? JSON.stringify(next) : '');
    setRevision((value) => value + 1);
  }
  async function save(): Promise<void> {
    if (!draft || (isNew ? !allowed.create : !capabilities.canUpdate)) return;
    setBusy(true);
    setErrorCause(undefined);
    try {
      const inputDraft =
        current && !isNew
          ? editingDetails
            ? { ...fromSet(current, t), title: draft.title }
            : {
                ...fromSet(current, t),
                grants: draft.grants,
              }
          : draft;
      const input = toInput(inputDraft);
      if (
        !input.key ||
        !draft.title.trim() ||
        input.grants.some(
          (grant) => !grant.resource.id || !grant.actions.length,
        ) ||
        hasEmptyCustomFilter(inputDraft)
      )
        throw new AuthorizationFormError('errors.completePermissions');
      const saved = draft.originalKey
        ? await authz.updatePermissionSet(draft.originalKey, input)
        : await authz.createPermissionSet(input);
      authz.invalidate();
      setSets((items) =>
        items.some((item) => item.key === saved.key)
          ? items.map((item) => (item.key === saved.key ? saved : item))
          : [...items, saved],
      );
      toaster.show({
        type: 'success',
        title: t('feedback.saved', { name: title(saved) }),
      });
      const next = fromSet(saved, t);
      setDraft(next);
      setBaseline(JSON.stringify(next));
      setRevision((value) => value + 1);
      const savedPath = isNew ? setPath(saved.key) : location.pathname;
      setDismissedEditorPath(savedPath);
      if (isNew)
        void navigate(
          { pathname: savedPath, search: location.search, hash: location.hash },
          { replace: true },
        );
    } catch (cause) {
      setErrorCause(cause);
    } finally {
      setBusy(false);
    }
  }
  async function remove(): Promise<void> {
    if (!current || !capabilities.canDelete) return;
    setBusy(true);
    try {
      await authz.deletePermissionSet(current.key);
      toaster.show({
        type: 'success',
        title: t('feedback.deleted', { name: title(current) }),
      });
      setConfirmDelete(false);
      authz.invalidate();
      setSets((items) => items.filter((item) => item.key !== current.key));
      setDraft(undefined);
      setBaseline('');
      void navigate(base, { replace: true });
    } catch (cause) {
      setErrorCause(cause);
    } finally {
      setBusy(false);
    }
  }
  async function assign(
    subjects: readonly AuthorizationSubject[],
  ): Promise<void> {
    if (!current || !capabilities.canAssign) return;
    setBusy(true);
    setErrorCause(undefined);
    try {
      await Promise.all(
        subjects.map((subject) => authz.assign(current.key, { subject })),
      );
      setAssignments(await authz.listAssignments(current.key));
      toaster.show({
        type: 'success',
        title: t('feedback.assigned', { name: title(current) }),
      });
    } catch (cause) {
      setErrorCause(cause);
      throw cause;
    } finally {
      setBusy(false);
    }
  }
  async function revoke(ids: readonly string[]): Promise<void> {
    if (!current || !capabilities.canRevoke) return;
    setBusy(true);
    setErrorCause(undefined);
    try {
      await Promise.all(ids.map((id) => authz.revoke(current.key, id)));
      setAssignments((items) => items.filter((item) => !ids.includes(item.id)));
      toaster.show({
        type: 'success',
        title: t('feedback.revoked', { name: title(current) }),
      });
    } catch (cause) {
      setErrorCause(cause);
      throw cause;
    } finally {
      setBusy(false);
    }
  }
  const content = !draft ? (
    loaded ? (
      <ApplicationTableEmpty title={t('permissionWorkspace.unavailableSet')} />
    ) : (
      <ApplicationTableSkeleton columns={3} />
    )
  ) : assignmentsTab ? (
    <div className='min-h-0 flex-1 overflow-auto p-4'>
      {assignmentsLoading ? (
        <ApplicationTableSkeleton columns={4} />
      ) : (
        <Assignments
          key={permissionSetKey}
          assignments={assignments}
          subjectTypes={options.subjectTypes}
          assignableTypes={options.subjectTypes.filter((type) =>
            canAssignSubjectType(capabilities, type.value),
          )}
          canAssign={capabilities.canAssign}
          canRevoke={capabilities.canRevoke}
          busy={busy}
          error={error}
          onAssign={assign}
          onRevoke={revoke}
        />
      )}
    </div>
  ) : capabilities.unrestricted && !editingDetails ? (
    <p className='p-6 text-sm text-muted-foreground'>
      {t('permissionSets.detail.unrestrictedBody')}
    </p>
  ) : (
    <>
      <div className='p-4'>
        <Button variant='outline' onClick={() => setDismissedEditorPath('')}>
          {isNew ? t('permissionSets.list.create') : t('common.edit')}
        </Button>
      </div>
      <Dialog
        open={dismissedEditorPath !== location.pathname}
        onOpenChange={(open) => {
          if (!open) closeEditor();
        }}
      >
        <FormDrawerContent className='sm:max-w-4xl'>
          <FormDrawerHeader>
            <DialogTitle>
              {current ? title(current) : t('permissionSets.editor.newTitle')}
            </DialogTitle>
          </FormDrawerHeader>
          <PermissionSetEditor
            key={`${permissionSetKey ?? 'new'}:${revision}`}
            dirty={dirty}
            error={error}
            showDetails={editingDetails}
            readOnly={isNew ? !allowed.create : !capabilities.canUpdate}
            options={options}
            draft={draft}
            busy={busy}
            onChange={setDraft}
            onSave={(event) => {
              event.preventDefault();
              return save();
            }}
            onClose={closeEditor}
          />
        </FormDrawerContent>
      </Dialog>
    </>
  );
  return (
    <div className='flex min-w-0 flex-col gap-3 sm:h-[calc(100dvh-15rem)] sm:min-h-96 sm:flex-row sm:overflow-hidden'>
      <aside
        className={`flex shrink-0 flex-col overflow-hidden rounded-xl border bg-card text-card-foreground ${collapsed ? 'w-full sm:w-14' : 'w-full sm:w-56'}`}
      >
        <div className='flex shrink-0 items-center justify-end gap-1 border-b p-2'>
          {!collapsed ? (
            <Input
              className='min-w-0 flex-1'
              aria-label={t('permissionSets.list.search')}
              placeholder={t('permissionSets.list.search')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          ) : null}
          <div
            className={`flex shrink-0 items-center gap-1 ${collapsed ? 'sm:flex-col' : ''}`}
          >
            <IconAction label={t('permissionSets.list.create')}>
              <Button
                size='icon'
                variant='ghost'
                aria-label={t('permissionSets.list.create')}
                disabled={busy || !allowed.create}
                onClick={() => go(`${base}/new`)}
              >
                <Plus className='size-4' />
              </Button>
            </IconAction>
            <IconAction
              label={t(
                collapsed
                  ? 'permissionWorkspace.expandSets'
                  : 'permissionWorkspace.collapseSets',
              )}
            >
              <Button
                size='icon'
                variant='ghost'
                aria-label={t(
                  collapsed
                    ? 'permissionWorkspace.expandSets'
                    : 'permissionWorkspace.collapseSets',
                )}
                aria-expanded={!collapsed}
                onClick={() => setCollapsed(!collapsed)}
              >
                {collapsed ? (
                  <PanelLeftOpen className='size-4' />
                ) : (
                  <PanelLeftClose className='size-4' />
                )}
              </Button>
            </IconAction>
          </div>
        </div>
        {!collapsed ? (
          <nav
            className='max-h-48 min-h-0 flex-1 flex flex-col gap-1 overflow-y-auto p-2 sm:max-h-none'
            aria-label={t('permissionSets.page.title')}
          >
            {sets
              .filter((item) =>
                `${title(item)} ${item.key}`
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              )
              .map((item) => (
                <button
                  key={item.key}
                  type='button'
                  aria-label={title(item)}
                  disabled={busy}
                  aria-current={
                    item.key === permissionSetKey ? 'page' : undefined
                  }
                  className='block min-h-11 w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted aria-[current=page]:bg-primary/10 aria-[current=page]:font-medium aria-[current=page]:text-primary'
                  onClick={() => go(setPath(item.key, section))}
                >
                  <TruncatedText text={title(item)} />
                  <span className='block text-xs text-muted-foreground'>
                    <TruncatedText text={item.key} />
                  </span>
                </button>
              ))}
          </nav>
        ) : null}
      </aside>
      <section className='flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card text-card-foreground'>
        <header className='flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3'>
          <h2 className='truncate text-base font-medium'>
            {(current ? title(current) : draft?.title) ||
              (isNew
                ? t('permissionSets.editor.newTitle')
                : t('permissionSets.page.title'))}
          </h2>
          <div className='flex items-center gap-2'>
            {current && capabilities.canDelete ? (
              <Button
                variant='ghost'
                className='text-destructive hover:bg-destructive/10 hover:text-destructive'
                disabled={busy}
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className='size-4' />
                {t('common.delete')}
              </Button>
            ) : null}
          </div>
        </header>
        {current ? (
          <nav
            className='flex max-w-full shrink-0 gap-6 overflow-x-auto border-b px-4'
            aria-label={t('permissionWorkspace.sections')}
          >
            {['permissions', 'assignments', 'details'].map((tab) => (
              <button
                key={tab}
                type='button'
                className={`min-h-11 shrink-0 border-b-2 py-3 text-sm ${tab === section ? 'border-primary font-medium text-primary' : 'border-transparent text-muted-foreground'}`}
                aria-current={tab === section ? 'page' : undefined}
                onClick={() => go(setPath(current.key, tab))}
              >
                {t(
                  tab === 'assignments'
                    ? 'permissionWorkspace.userAssignments'
                    : `permissionWorkspace.${tab}`,
                )}
              </button>
            ))}
          </nav>
        ) : null}
        {error ? (
          <p role='alert' className='p-3 text-sm text-destructive'>
            {error}
          </p>
        ) : null}
        {location.pathname === base ? (
          <p className='p-6 text-sm text-muted-foreground'>
            {loaded ? t('permissionWorkspace.chooseSet') : t('common.loading')}
          </p>
        ) : (
          <Outlet context={{ content } satisfies PermissionWorkspaceContext} />
        )}
      </section>
      <ConfirmDialog
        open={pending !== undefined}
        title={t('permissionWorkspace.discardTitle')}
        confirmLabel={t('permissionWorkspace.discard')}
        onCancel={() => setPending(undefined)}
        onConfirm={() => {
          const path = pending;
          setPending(undefined);
          discard();
          if (path === location.pathname) setDismissedEditorPath(path);
          else if (path)
            void navigate({
              pathname: path,
              search: location.search,
              hash: location.hash,
            });
        }}
      >
        {t('permissionWorkspace.discardBody')}
      </ConfirmDialog>
      <ConfirmDialog
        open={confirmDelete}
        busy={busy}
        error={error}
        title={t('permissionSets.detail.confirmDeleteTitle', {
          title: current ? title(current) : '',
        })}
        confirmLabel={t('permissionSets.detail.confirmDelete')}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          void remove();
        }}
      >
        {t('permissionSets.detail.confirmDeleteBody', {
          title: current ? title(current) : '',
        })}
      </ConfirmDialog>
    </div>
  );
}
