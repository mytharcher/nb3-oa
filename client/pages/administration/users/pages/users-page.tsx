import { useFormDiscardGuard } from '#hooks/use-form-discard-guard';
import {
  FormDrawerContent,
  FormDrawerHeader,
  FormDrawerBody,
  FormDrawerFooter,
} from '#components/form-drawer';
import { ApplicationTableEmpty } from '#components/application-table-empty';
import { Skeleton } from '#components/ui/skeleton';
import { SessionExpiredAlert } from '#components/session-expired-alert';
import { ConfirmDialog } from '../../authorization/components/confirm-dialog.js';
import { Alert, AlertDescription } from '#components/ui/alert';
import { ApplicationSearch } from '#components/application-search';
import { ApplicationToolbar } from '#components/application-toolbar';
import { UserNameText } from '#components/user-name';
import { UserName } from '#components/user-name';
import { ResponsiveTable as Table } from '#components/responsive-table';
import { Link } from 'react-router';
import { Spinner } from '#components/ui/spinner';
import { useClientApplication } from '@nocobase/app-client';
import { PermissionSelection } from '../components/permission-selection.js';
import { PermissionAssignmentDrawer } from '../components/permission-assignment-drawer.js';
import { InviteDialog, InviteResults } from '../components/invite-dialog.js';
import { InvitationsPanel } from '../components/invitations-panel.js';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { PageContainer } from '../components/page-container.js';
import { PageHeader } from '../components/page-header.js';
import {
  useApiClient,
  ApiClientError,
  useService,
  useToaster,
} from '@nocobase/app-client';
import {
  authorizationClientToken,
  useCan,
  useAuthorizationRevision,
} from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  ChevronDown,
  KeyRound,
  LockKeyhole,
  Mail,
  MoreHorizontal,
  Plus,
  UserRoundCheck,
  UserRoundX,
} from 'lucide-react';
import {
  useId,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactElement,
} from 'react';

import { Badge } from '#components/ui/badge';
import { Button } from '#components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#components/ui/dropdown-menu';
import { Input } from '#components/ui/input';
import { Label } from '#components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#components/ui/table';
import {
  emptyUserCapabilities,
  loadUserCapabilities,
  type UserCapabilities,
} from '../user-permissions.js';
import {
  createRoleFilterOptions,
  createStatusFilterOptions,
} from '../filter-options.js';
import {
  UsersClient,
  type CreateUserInput,
  type ManagedUser,
  type ManagedUserPage,
  type UpdateUserInput,
  type UserInvitation,
  type UserInvitationResult,
  type UserRoleScopeOption,
  type UserRoleValue,
  type UsersOptions,
  isEmailAddress,
} from '../user-client.js';
import {
  assignableRoleScopes,
  emptyRoleScopeValues,
  hasEveryRequiredRoleScope,
  localizeRoleScopes,
  selectedRoleScopeValues,
} from '../role-scopes.js';

const EMPTY_PAGE: ManagedUserPage = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
};

export default function UsersPage(): ReactElement {
  const { session } = useAuthentication();
  const revision = useAuthorizationRevision();
  return (
    <UsersManagement key={`${session?.user.id ?? 'anonymous'}:${revision}`} />
  );
}

function UsersManagement(): ReactElement {
  const { session } = useAuthentication();
  const { t } = useTranslation('@nocobase/app-plugin-users');
  const toaster = useToaster();
  const api = useApiClient();
  const authorization = useService(authorizationClientToken);
  const users = useMemo(() => new UsersClient(api), [api]);
  const app = useClientApplication();
  const inspector = app.runtime.routes
    .flatMap(function flatten(route): typeof app.runtime.routes {
      return [route, ...(route.children ?? []).flatMap(flatten)];
    })
    .find((route) => route.name === 'inspector');
  const canReadAccess = useCan({
    resource: { type: 'settings', id: 'authorization.permission-sets' },
    action: 'read',
  }).can;
  const canAssignAccess = useCan({
    resource: { type: 'settings', id: 'authorization.permission-sets' },
    action: 'assign',
  }).can;
  const [canInspect, setCanInspect] = useState(false);
  const [options, setOptions] = useState<UsersOptions>({ roleScopes: [] });
  const [result, setResult] = useState<ManagedUserPage>(EMPTY_PAGE);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [role, setRole] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<number>();
  const [mutationError, setMutationError] = useState<string>();
  const [revokeUser, setRevokeUser] = useState<ManagedUser>();
  const loadGenerationRef = useRef(0);
  const [deleteUser, setDeleteUser] = useState<ManagedUser>();
  const reportError = useCallback(
    (reason: unknown) => {
      const code = reason instanceof ApiClientError ? reason.reason : undefined;
      toaster.show({
        type: 'error',
        // Branch on the reason only; the server's message is for developers and never shown.
        title: t(`errors.${code ?? 'operationFailed'}`, {
          defaultValue: t('errors.operationFailed'),
        }),
      });
    },
    [toaster, t],
  );
  const [editor, setEditor] = useState<ManagedUser | 'create'>();
  const [inviting, setInviting] = useState(false);
  const [invitations, setInvitations] = useState<readonly UserInvitation[]>([]);
  const [resent, setResent] = useState<UserInvitationResult>();
  const [assignment, setAssignment] = useState<{
    user: ManagedUser;
    scope: UserRoleScopeOption;
  }>();
  const [passwordUser, setPasswordUser] = useState<ManagedUser>();
  const [stateUser, setStateUser] = useState<ManagedUser>();
  const [globalCapabilities, setGlobalCapabilities] =
    useState<UserCapabilities>(emptyUserCapabilities);
  const [userCapabilities, setUserCapabilities] = useState<
    Readonly<Record<string, UserCapabilities>>
  >({});

  // This component is keyed by identity and authorization revision. No cached grants or rows survive either.
  const metadataRef = useRef<
    Promise<readonly [UsersOptions, UserCapabilities, boolean]> | undefined
  >(undefined);
  const capabilitiesRef = useRef(new Map<string, Promise<UserCapabilities>>());
  const localizedOptions: UsersOptions = {
    roleScopes: localizeRoleScopes(
      options.roleScopes,
      (key, namespace, defaultValue) =>
        t(key, { ...(namespace ? { ns: namespace } : {}), defaultValue }),
    ),
  };
  const roleChoices = localizedOptions.roleScopes.flatMap((scope) =>
    scope.options.map((option) => ({ scope, option })),
  );
  const statusOptions = createStatusFilterOptions({
    all: t('page.allStatuses'),
    enabled: t('page.enabled'),
    disabled: t('page.disabled'),
  });
  const roleFilterOptions = createRoleFilterOptions(
    localizedOptions.roleScopes,
    t('page.allRoles'),
  );
  const load = useCallback(async () => {
    const generation = ++loadGenerationRef.current;
    setLoading(true);
    setLoadError(undefined);
    try {
      metadataRef.current ??= Promise.all([
        users.options(),
        loadUserCapabilities(authorization, '*'),
        authorization.can({
          resource: { type: 'settings', id: 'authorization.inspector' },
          action: 'inspect',
        }),
      ]).catch((cause: unknown) => {
        metadataRef.current = undefined;
        throw cause;
      });
      const [[nextOptions, nextGlobalCapabilities, inspectAllowed], nextPage] =
        await Promise.all([
          metadataRef.current,
          users.list({
            page,
            pageSize: 20,
            ...(search.trim() ? { q: search.trim() } : {}),
            ...(status === 'all' ? {} : { status }),
            ...(role === 'all'
              ? {}
              : {
                  roleScope: role.slice(0, role.indexOf(':')),
                  role: role.slice(role.indexOf(':') + 1),
                }),
          }),
        ]);
      const capabilityEntries: readonly (readonly [
        string,
        UserCapabilities,
      ])[] = await Promise.all(
        nextPage.items.map(
          async (user): Promise<readonly [string, UserCapabilities]> => [
            user.id,
            await (() => {
              let pending = capabilitiesRef.current.get(user.id);
              if (!pending) {
                pending = loadUserCapabilities(authorization, user.id).catch(
                  (cause: unknown) => {
                    capabilitiesRef.current.delete(user.id);
                    throw cause;
                  },
                );
                capabilitiesRef.current.set(user.id, pending);
              }
              return pending;
            })(),
          ],
        ),
      );
      const nextUserCapabilities: Readonly<Record<string, UserCapabilities>> =
        Object.fromEntries(capabilityEntries);
      const nextInvitations = nextGlobalCapabilities.invite
        ? await users.listInvitations()
        : [];
      if (generation !== loadGenerationRef.current) return;
      setInvitations(nextInvitations);
      setCanInspect(inspectAllowed);
      setOptions(nextOptions);
      setResult(nextPage);
      setGlobalCapabilities(nextGlobalCapabilities);
      setUserCapabilities(nextUserCapabilities);
      setLoaded(true);
    } catch (reason) {
      if (generation !== loadGenerationRef.current) return;
      const status = reason instanceof ApiClientError ? reason.status : 500;
      setLoadError(status);
      if ([401, 403, 404].includes(status)) {
        metadataRef.current = undefined;
        capabilitiesRef.current.clear();
        setResult(EMPTY_PAGE);
        setOptions({ roleScopes: [] });
        setGlobalCapabilities(emptyUserCapabilities());
        setUserCapabilities({});
        setInvitations([]);
        setCanInspect(false);
        setEditor(undefined);
        setInviting(false);
        setRevokeUser(undefined);
        setPasswordUser(undefined);
        setAssignment(undefined);
        setStateUser(undefined);
        setDeleteUser(undefined);
        setResent(undefined);
        setLoaded(true);
      }
      reportError(reason);
    } finally {
      if (generation === loadGenerationRef.current) setLoading(false);
    }
  }, [authorization, page, role, search, status, users, reportError]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 200);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(
    () =>
      authorization.onInvalidated(() => {
        metadataRef.current = undefined;
        capabilitiesRef.current.clear();
        void load();
      }),
    [authorization, load],
  );

  const perform = async (work: () => Promise<unknown>): Promise<void> => {
    setBusy(true);
    setMutationError(undefined);
    try {
      await work();
      metadataRef.current = undefined;
      capabilitiesRef.current.clear();
      await load();
    } catch (reason) {
      if (reason instanceof ApiClientError && reason.status === 403) {
        authorization.invalidate();
      }
      const code = reason instanceof ApiClientError ? reason.reason : undefined;
      setMutationError(
        t(`errors.${code ?? 'operationFailed'}`, {
          defaultValue: t('errors.operationFailed'),
        }),
      );
      reportError(reason);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader title={t('page.title')} description={t('page.description')} />

      <ApplicationToolbar
        actions={
          <>
            {globalCapabilities.invite ? (
              <Button variant='outline' onClick={() => setInviting(true)}>
                <Mail /> {t('invite.open')}
              </Button>
            ) : null}
            {globalCapabilities.create && globalCapabilities['assign-role'] ? (
              <Button
                onClick={() => {
                  setMutationError(undefined);
                  setEditor('create');
                }}
              >
                <Plus /> {t('page.add')}
              </Button>
            ) : null}
          </>
        }
      >
        <ApplicationSearch
          placeholder={t('page.search')}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <Select
          items={statusOptions}
          value={status}
          onValueChange={(value) => {
            setStatus(value as typeof status);
            setPage(1);
          }}
        >
          <SelectTrigger className='w-36'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
            <SelectItem value='all'>{t('page.allStatuses')}</SelectItem>
            <SelectItem value='enabled'>{t('page.enabled')}</SelectItem>
            <SelectItem value='disabled'>{t('page.disabled')}</SelectItem>
          </SelectContent>
        </Select>
        {roleChoices.length ? (
          <Select
            items={roleFilterOptions}
            value={role}
            onValueChange={(value) => {
              setRole(String(value));
              setPage(1);
            }}
          >
            <SelectTrigger className='w-56'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
              <SelectItem value='all'>{t('page.allRoles')}</SelectItem>
              {roleChoices.map(({ scope, option }) => (
                <SelectItem
                  key={`${scope.key}:${option.value}`}
                  value={`${scope.key}:${option.value}`}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </ApplicationToolbar>

      {localizedOptions.roleScopes.some(
        (scope) => scope.hasAuthenticatedDefaultAccess,
      ) ? (
        <p className='text-sm text-muted-foreground'>
          {t('page.authenticatedDefaultAccess')}
        </p>
      ) : null}

      {loadError === 401 ? (
        <SessionExpiredAlert />
      ) : loadError ? (
        <Alert variant='destructive'>
          <AlertDescription>
            {t(
              loadError === 403
                ? 'errors.loadForbidden'
                : loadError === 404
                  ? 'errors.loadNotFound'
                  : 'errors.loadFailed',
            )}
          </AlertDescription>
          {![403, 404].includes(loadError) ? (
            <Button variant='outline' onClick={() => void load()}>
              {t('page.retry')}
            </Button>
          ) : null}
        </Alert>
      ) : null}
      {loading && loaded ? <Spinner aria-label={t('page.loading')} /> : null}
      <div className='overflow-hidden rounded-xl border bg-card'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('page.columns.user')}</TableHead>
              <TableHead>{t('page.columns.status')}</TableHead>
              {localizedOptions.roleScopes.map((scope) => (
                <TableHead key={scope.key}>{scope.label}</TableHead>
              ))}
              <TableHead className='w-14'>
                <span className='sr-only'>{t('page.columns.actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && !loaded ? (
              Array.from({ length: 5 }, (_, row) => (
                <TableRow key={row}>
                  {Array.from(
                    { length: 3 + localizedOptions.roleScopes.length },
                    (_, column) => (
                      <TableCell key={column}>
                        <Skeleton className='h-4 w-24' />
                      </TableCell>
                    ),
                  )}
                </TableRow>
              ))
            ) : result.items.length ? (
              result.items.map((user) => {
                const capabilities =
                  userCapabilities[user.id] ?? emptyUserCapabilities();
                const canChangeState = user.disabledAt
                  ? capabilities.enable
                  : capabilities.disable;
                const canDelete =
                  capabilities.delete && user.id !== session?.user.id;
                const hasActions =
                  (canInspect && canReadAccess && !!inspector) ||
                  capabilities.update ||
                  capabilities['reset-password'] ||
                  capabilities['revoke-sessions'] ||
                  canDelete ||
                  canChangeState;
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className='font-medium'>
                        <UserName name={user.name} />
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        {user.username ? `@${user.username} · ` : ''}
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.disabledAt ? 'secondary' : 'default'}
                      >
                        {user.disabledAt
                          ? t('page.disabled')
                          : t('page.enabled')}
                      </Badge>
                    </TableCell>
                    {localizedOptions.roleScopes.map((scope) => (
                      <TableCell key={scope.key}>
                        {capabilities['assign-role'] &&
                        (scope.key !== 'app' ||
                          (canInspect && canReadAccess && canAssignAccess)) &&
                        scope.options.some((option) =>
                          roleOptionCanToggle(
                            option,
                            roleValues(user.roleScopes[scope.key] ?? ''),
                          ),
                        ) ? (
                          <Button
                            variant='ghost'
                            className='h-auto max-w-72 justify-start px-2 py-1.5 text-left font-normal'
                            disabled={busy}
                            aria-label={`${t('assignment.title')} · ${user.name} · ${scope.label}`}
                            nativeButton={scope.key !== 'app'}
                            render={
                              scope.key === 'app' ? (
                                <Link
                                  to={`/access/people/${encodeURIComponent(user.id)}/personal`}
                                />
                              ) : undefined
                            }
                            onClick={
                              scope.key === 'app'
                                ? undefined
                                : () => setAssignment({ user, scope })
                            }
                          >
                            <RoleValue
                              scope={scope}
                              value={user.roleScopes[scope.key] ?? ''}
                            />
                            <ChevronDown className='size-4 shrink-0 text-muted-foreground' />
                          </Button>
                        ) : (
                          <RoleValue
                            scope={scope}
                            value={user.roleScopes[scope.key] ?? ''}
                          />
                        )}
                      </TableCell>
                    ))}
                    <TableCell>
                      {hasActions ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant='ghost'
                                size='icon-sm'
                                aria-label={t('page.actions.menuFor', {
                                  name: user.name,
                                })}
                              />
                            }
                          >
                            <MoreHorizontal />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align='end'
                            className='w-auto min-w-40'
                          >
                            {canInspect && canReadAccess && inspector && (
                              <DropdownMenuItem
                                render={
                                  <Link
                                    to={`/access/people/${encodeURIComponent(user.id)}/sources`}
                                  />
                                }
                              >
                                {t('assignment.inspect')}
                              </DropdownMenuItem>
                            )}

                            {capabilities.update ? (
                              <DropdownMenuItem
                                onClick={() => {
                                  setMutationError(undefined);
                                  setEditor(user);
                                }}
                              >
                                {t('page.actions.edit')}
                              </DropdownMenuItem>
                            ) : null}
                            {capabilities['reset-password'] ? (
                              <DropdownMenuItem
                                onClick={() => {
                                  setMutationError(undefined);
                                  setPasswordUser(user);
                                }}
                              >
                                {t('page.actions.resetPassword')}
                              </DropdownMenuItem>
                            ) : null}
                            {capabilities['revoke-sessions'] ? (
                              <DropdownMenuItem
                                onClick={() => {
                                  setMutationError(undefined);
                                  setRevokeUser(user);
                                }}
                              >
                                {t('page.actions.revokeSessions')}
                              </DropdownMenuItem>
                            ) : null}
                            {canChangeState ? (
                              <DropdownMenuItem
                                onClick={() => setStateUser(user)}
                              >
                                {user.disabledAt
                                  ? t('page.actions.enable')
                                  : t('page.actions.disable')}
                              </DropdownMenuItem>
                            ) : null}
                            {canDelete ? (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant='destructive'
                                  onClick={() => setDeleteUser(user)}
                                >
                                  {t('page.actions.delete')}
                                </DropdownMenuItem>
                              </>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={3 + localizedOptions.roleScopes.length}
                  className='h-32 text-center text-muted-foreground'
                >
                  {!loadError ? (
                    <ApplicationTableEmpty
                      title={t(
                        search.trim() || status !== 'all' || role !== 'all'
                          ? 'page.noMatches'
                          : 'page.noUsers',
                      )}
                      description={t('page.emptyDescription')}
                      clearFilters={
                        search.trim() || status !== 'all' || role !== 'all'
                          ? {
                              label: t('page.clearFilters'),
                              onClick: () => {
                                setSearch('');
                                setStatus('all');
                                setRole('all');
                                setPage(1);
                              },
                            }
                          : undefined
                      }
                    />
                  ) : null}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div
        data-slot='table-pagination'
        className='flex min-w-0 flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground'
      >
        <span>{t('page.total', { count: result.total })}</span>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            disabled={page <= 1 || loading}
            onClick={() => setPage((value) => value - 1)}
          >
            {t('page.previous')}
          </Button>
          <Button
            variant='outline'
            size='sm'
            disabled={page * result.pageSize >= result.total || loading}
            onClick={() => setPage((value) => value + 1)}
          >
            {t('page.next')}
          </Button>
        </div>
      </div>

      {assignment && userCapabilities[assignment.user.id]?.['assign-role'] ? (
        <PermissionAssignmentDrawer
          user={assignment.user}
          scope={
            localizedOptions.roleScopes.find(
              (scope) => scope.key === assignment.scope.key,
            ) ?? assignment.scope
          }
          onClose={() => setAssignment(undefined)}
          onSave={async (value) => {
            await users.replaceRoleScope(
              assignment.user.id,
              assignment.scope.key,
              value,
            );
            metadataRef.current = undefined;
            capabilitiesRef.current.clear();
            toaster.show({
              type: 'success',
              title: t('assignment.saved', { name: assignment.user.name }),
            });
            setAssignment(undefined);
            await load();
          }}
        />
      ) : null}
      {editor &&
      (editor === 'create'
        ? globalCapabilities.create && globalCapabilities['assign-role']
        : userCapabilities[editor.id]?.update) ? (
        <UserDialog
          busy={busy}
          error={mutationError}
          options={localizedOptions}
          user={editor === 'create' ? undefined : editor}
          onClose={() => setEditor(undefined)}
          onSubmit={(input) =>
            void perform(async () => {
              if (input.kind === 'create') await users.create(input.value);
              else if (editor !== 'create') {
                await users.update(editor.id, input.value);
              }
              toaster.show({
                type: 'success',
                title: t('form.saved', { name: input.value.name }),
              });
              setEditor(undefined);
            })
          }
        />
      ) : null}
      {globalCapabilities.invite && invitations.length > 0 ? (
        <InvitationsPanel
          invitations={invitations}
          busy={busy}
          onResend={(invitation) =>
            void perform(async () => {
              const result = await users.resendInvitation(invitation.id);
              if (result.outcome === 'invited' && result.inviteUrl)
                setResent(result);
              else
                toaster.show({
                  type: 'success',
                  title: t('invitations.resent'),
                });
            })
          }
          onRevoke={(invitation) =>
            void perform(async () => {
              await users.revokeInvitation(invitation.id);
              toaster.show({
                type: 'success',
                title: t('invitations.revoked'),
              });
            })
          }
        />
      ) : null}
      {inviting && globalCapabilities.invite ? (
        <InviteDialog
          roleScopes={
            globalCapabilities['assign-role']
              ? assignableRoleScopes(localizedOptions.roleScopes)
              : []
          }
          onInvite={async (input) => {
            try {
              const results = await users.invite(input);
              await load();
              return results;
            } catch (reason) {
              reportError(reason);
              throw reason;
            }
          }}
          onClose={() => setInviting(false)}
        />
      ) : null}
      {resent ? (
        <Dialog
          open
          onOpenChange={(open) => (!open ? setResent(undefined) : undefined)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('invitations.resend')}</DialogTitle>
            </DialogHeader>
            <InviteResults results={[resent]} />
            <DialogFooter>
              <Button onClick={() => setResent(undefined)}>
                {t('invite.done')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
      {deleteUser && userCapabilities[deleteUser.id]?.delete ? (
        <ConfirmDeleteDialog
          user={deleteUser}
          busy={busy}
          onClose={() => setDeleteUser(undefined)}
          onConfirm={() =>
            void perform(async () => {
              await users.remove(deleteUser.id);
              setDeleteUser(undefined);
              if (result.items.length === 1 && page > 1) setPage(page - 1);
              toaster.show({
                type: 'success',
                title: t('deletion.success', { name: deleteUser.name }),
              });
            })
          }
        />
      ) : null}
      {revokeUser ? (
        <ConfirmDialog
          open
          busy={busy}
          error={mutationError}
          title={t('sessions.title', { name: revokeUser.name })}
          confirmLabel={t('sessions.confirm')}
          cancelLabel={t('form.cancel')}
          onCancel={() => setRevokeUser(undefined)}
          onConfirm={() =>
            void perform(async () => {
              await users.revokeSessions(revokeUser.id);
              toaster.show({
                type: 'success',
                title: t('sessions.success', { name: revokeUser.name }),
              });
              setRevokeUser(undefined);
            })
          }
        >
          {t('sessions.description')}
        </ConfirmDialog>
      ) : null}
      {passwordUser && userCapabilities[passwordUser.id]?.['reset-password'] ? (
        <PasswordDialog
          busy={busy}
          error={mutationError}
          user={passwordUser}
          onClose={() => setPasswordUser(undefined)}
          onSubmit={(password) =>
            void perform(async () => {
              await users.resetPassword(passwordUser.id, password);
              toaster.show({
                type: 'success',
                title: t('password.saved', { name: passwordUser.name }),
              });
              setPasswordUser(undefined);
            })
          }
        />
      ) : null}
      {stateUser &&
      userCapabilities[stateUser.id]?.[
        stateUser.disabledAt ? 'enable' : 'disable'
      ] ? (
        <ConfirmStateDialog
          busy={busy}
          user={stateUser}
          onClose={() => setStateUser(undefined)}
          onConfirm={() =>
            void perform(async () => {
              if (stateUser.disabledAt) await users.enable(stateUser.id);
              else await users.disable(stateUser.id);
              toaster.show({
                type: 'success',
                title: t(
                  stateUser.disabledAt ? 'state.enabled' : 'state.disabled',
                  { name: stateUser.name },
                ),
              });
              setStateUser(undefined);
            })
          }
        />
      ) : null}
    </PageContainer>
  );
}

function RoleValue({
  scope,
  value,
}: {
  readonly scope: UserRoleScopeOption;
  readonly value: UserRoleValue;
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-users');
  const values = roleValues(value);
  if (!values.length) {
    return (
      <span className='text-sm text-muted-foreground'>
        {t('page.noDirectRoles')}
      </span>
    );
  }
  return (
    <div className='flex min-w-0 flex-wrap items-center gap-1.5'>
      {values.slice(0, 2).map((entry) => {
        const option = scope.options.find((item) => item.value === entry);
        return (
          <Badge
            key={entry}
            variant='secondary'
            className='max-w-48'
            title={option?.label ?? entry}
          >
            <span className='truncate'>{option?.label ?? entry}</span>
            {option?.removable === false ? (
              <LockKeyhole
                aria-label={t('page.protectedRole')}
                className='ml-1 size-3'
              />
            ) : null}
          </Badge>
        );
      })}
      {values.length > 2 && (
        <span className='text-xs text-muted-foreground'>
          +{values.length - 2}
        </span>
      )}
    </div>
  );
}

function roleOptionCanToggle(
  option: UserRoleScopeOption['options'][number],
  selected: readonly string[],
): boolean {
  return selected.includes(option.value)
    ? option.removable !== false
    : option.assignable !== false;
}

function UserDialog({
  busy,
  error,
  options,
  user,
  onClose,
  onSubmit,
}: {
  readonly busy: boolean;
  readonly options: UsersOptions;
  readonly error?: string;
  readonly user?: ManagedUser;
  readonly onClose: () => void;
  readonly onSubmit: (input: UserDialogSubmitInput) => void;
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-users');
  const formId = useId();
  const [name, setName] = useState(user?.name ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [validated, setValidated] = useState(false);
  const creationRoleScopes = assignableRoleScopes(options.roleScopes);
  const [roles, setRoles] = useState<Record<string, UserRoleValue>>(() =>
    emptyRoleScopeValues(creationRoleScopes),
  );
  const requiredRolesSelected = hasEveryRequiredRoleScope(
    creationRoleScopes,
    roles,
  );
  const invalid = {
    name: !name.trim() ? t('form.nameRequired') : undefined,
    email: !isEmailAddress(email.trim()) ? t('form.emailInvalid') : undefined,
    password: !user && !password ? t('form.passwordRequired') : undefined,
  };
  const submit = (event: FormEvent): void => {
    event.preventDefault();
    setValidated(true);
    const first = (['name', 'email', 'password'] as const).find(
      (key) => invalid[key],
    );
    if (first) {
      document.getElementById(`${formId}-${first}`)?.focus();
      return;
    }
    if (!user && !requiredRolesSelected) {
      const missing = creationRoleScopes.find(
        (scope) =>
          scope.requiredOnCreate &&
          roleValues(roles[scope.key] ?? '').length === 0,
      );
      if (missing)
        document
          .getElementById(`${formId}-roles-${missing.key}`)
          ?.querySelector<HTMLElement>('button,[role=checkbox]')
          ?.focus();
      return;
    }
    onSubmit(
      user
        ? {
            kind: 'update',
            value: { name, username: username.trim() ? username : null, email },
          }
        : {
            kind: 'create',
            value: {
              name,
              ...(username.trim() ? { username } : {}),
              email,
              password,
              roleScopes: selectedRoleScopeValues(creationRoleScopes, roles),
            },
          },
    );
  };
  const [initialRoles] = useState(() => JSON.stringify(roles));
  const guard = useFormDiscardGuard(
    name !== (user?.name ?? '') ||
      username !== (user?.username ?? '') ||
      email !== (user?.email ?? '') ||
      !!password ||
      JSON.stringify(roles) !== initialRoles,
    busy,
  );
  const close = () => {
    void guard.requestClose(onClose);
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <FormDrawerContent>
        <form onSubmit={submit} noValidate className='flex flex-col gap-4'>
          <FormDrawerHeader>
            <DialogTitle>
              {user ? t('form.editTitle') : t('form.addTitle')}
            </DialogTitle>
            <DialogDescription>
              {user ? t('form.editDescription') : t('form.addDescription')}
            </DialogDescription>
          </FormDrawerHeader>
          <FormDrawerBody>
            {error ? (
              <Alert variant='destructive'>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <Field
              label={t('form.name')}
              htmlFor={`${formId}-name`}
              error={validated ? invalid.name : undefined}
              required={true}
            >
              <Input
                required
                id={`${formId}-name`}
                aria-invalid={validated && Boolean(invalid.name)}
                aria-describedby={
                  validated && invalid.name ? `${formId}-name-error` : undefined
                }
                aria-required='true'
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            <Field
              label={t('form.username')}
              htmlFor={`${formId}-username`}
              required={false}
            >
              <Input
                id={`${formId}-username`}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </Field>
            <Field
              label={t('form.email')}
              htmlFor={`${formId}-email`}
              error={validated ? invalid.email : undefined}
              required={true}
            >
              <Input
                required
                type='email'
                id={`${formId}-email`}
                aria-invalid={validated && Boolean(invalid.email)}
                aria-describedby={
                  validated && invalid.email
                    ? `${formId}-email-error`
                    : undefined
                }
                aria-required='true'
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            {!user ? (
              <>
                <Field
                  label={t('form.password')}
                  htmlFor={`${formId}-password`}
                  error={validated ? invalid.password : undefined}
                  required={true}
                >
                  <Input
                    required
                    type='password'
                    id={`${formId}-password`}
                    aria-invalid={validated && Boolean(invalid.password)}
                    aria-describedby={
                      validated && invalid.password
                        ? `${formId}-password-error`
                        : undefined
                    }
                    aria-required='true'
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </Field>
                {creationRoleScopes.map((scope) => (
                  <Field
                    key={scope.key}
                    label={scope.label}
                    htmlFor={`${formId}-roles-${scope.key}`}
                    required={scope.requiredOnCreate}
                    error={
                      validated &&
                      scope.requiredOnCreate &&
                      roleValues(roles[scope.key] ?? '').length === 0
                        ? t('form.roleRequired', { name: scope.label })
                        : undefined
                    }
                  >
                    <div
                      id={`${formId}-roles-${scope.key}`}
                      role='group'
                      aria-label={scope.label}
                      className='flex max-h-80 flex-col overflow-hidden rounded-lg border'
                    >
                      <PermissionSelection
                        disabled={busy}
                        scope={scope}
                        selected={roleValues(roles[scope.key] ?? '')}
                        onChange={(value) =>
                          setRoles((current) => ({
                            ...current,
                            [scope.key]:
                              scope.selection === 'single'
                                ? (value[0] ?? '')
                                : value,
                          }))
                        }
                      />
                    </div>
                  </Field>
                ))}
              </>
            ) : null}
          </FormDrawerBody>
          <FormDrawerFooter>
            <Button
              type='button'
              variant='outline'
              disabled={busy}
              onClick={close}
            >
              {t('form.cancel')}
            </Button>
            <Button type='submit' disabled={busy}>
              {busy ? (
                <Spinner
                  data-icon='inline-start'
                  aria-label={t('page.loading')}
                />
              ) : null}
              {user ? t('form.save') : t('form.create')}
            </Button>
          </FormDrawerFooter>
        </form>
      </FormDrawerContent>
      {guard.confirmation}
    </Dialog>
  );
}

type UserDialogSubmitInput =
  | { readonly kind: 'create'; readonly value: CreateUserInput }
  | { readonly kind: 'update'; readonly value: UpdateUserInput };

function PasswordDialog({
  busy,
  error,
  user,
  onClose,
  onSubmit,
}: {
  readonly busy: boolean;
  readonly error?: string;
  readonly user: ManagedUser;
  readonly onClose: () => void;
  readonly onSubmit: (password: string) => void;
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-users');
  const passwordId = useId();
  const [password, setPassword] = useState('');
  const [validated, setValidated] = useState(false);
  const guard = useFormDiscardGuard(!!password, busy);
  const close = () => {
    void guard.requestClose(onClose);
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <FormDrawerContent>
        <form
          noValidate
          className='flex flex-col gap-4'
          onSubmit={(event) => {
            event.preventDefault();
            setValidated(true);
            if (!password) {
              document.getElementById(passwordId)?.focus();
              return;
            }
            onSubmit(password);
          }}
        >
          <FormDrawerHeader>
            <DialogTitle>{t('password.title')}</DialogTitle>
            <DialogDescription>
              <UserNameText
                text={t('password.description', { name: user.name })}
                name={user.name}
              />
            </DialogDescription>
          </FormDrawerHeader>
          <FormDrawerBody>
            {error ? (
              <Alert variant='destructive'>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <Field
              label={t('password.newPassword')}
              htmlFor={passwordId}
              error={
                validated && !password ? t('form.passwordRequired') : undefined
              }
              required
            >
              <Input
                aria-required='true'
                aria-invalid={validated && !password}
                aria-describedby={
                  validated && !password ? `${passwordId}-error` : undefined
                }
                type='password'
                id={passwordId}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>
          </FormDrawerBody>
          <FormDrawerFooter>
            <Button
              type='button'
              variant='outline'
              disabled={busy}
              onClick={close}
            >
              {t('form.cancel')}
            </Button>
            <Button type='submit' disabled={busy}>
              <KeyRound /> {t('password.submit')}
            </Button>
          </FormDrawerFooter>
        </form>
      </FormDrawerContent>
      {guard.confirmation}
    </Dialog>
  );
}

function ConfirmStateDialog({
  busy,
  user,
  onClose,
  onConfirm,
}: {
  readonly busy: boolean;
  readonly user: ManagedUser;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-users');
  const enabling = Boolean(user.disabledAt);
  return (
    <AlertDialog
      open
      onOpenChange={(open) => (!open && !busy ? onClose() : undefined)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            <UserNameText
              text={
                enabling
                  ? t('state.enableTitle', { name: user.name })
                  : t('state.disableTitle', { name: user.name })
              }
              name={user.name}
            />
          </AlertDialogTitle>
          <AlertDialogDescription>
            <UserNameText
              text={
                enabling
                  ? t('state.enableDescription', { name: user.name })
                  : t('state.disableDescription', { name: user.name })
              }
              name={user.name}
            />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>
            {t('form.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            variant={enabling ? 'default' : 'destructive'}
            onClick={onConfirm}
          >
            {busy ? (
              <Spinner
                data-icon='inline-start'
                aria-label={t('page.loading')}
              />
            ) : enabling ? (
              <UserRoundCheck />
            ) : (
              <UserRoundX />
            )}
            {enabling ? t('state.enable') : t('state.disable')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function roleValues(value: UserRoleValue): readonly string[] {
  return typeof value === 'string' ? (value ? [value] : []) : value;
}

function Field({
  label,
  htmlFor,
  required = false,
  error,
  children,
}: {
  readonly label: string;
  readonly htmlFor?: string;
  readonly required?: boolean;
  readonly error?: string;
  readonly children: ReactElement;
}): ReactElement {
  return (
    <div className='flex flex-col gap-2'>
      <Label htmlFor={htmlFor}>
        {label}
        {required ? (
          <span aria-hidden='true' className='text-destructive'>
            *
          </span>
        ) : null}
      </Label>
      {children}
      {error ? (
        <p
          id={`${htmlFor}-error`}
          role='alert'
          className='text-sm text-destructive'
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function ConfirmDeleteDialog({
  user,
  busy,
  onClose,
  onConfirm,
}: {
  readonly user: ManagedUser;
  readonly busy: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-users');
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            <UserNameText
              text={t('deletion.title', { name: user.name })}
              name={user.name}
            />
          </AlertDialogTitle>
          <AlertDialogDescription>
            <UserNameText
              text={t('deletion.description', { name: user.name })}
              name={user.name}
            />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>
            {t('form.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? (
              <Spinner
                data-icon='inline-start'
                aria-label={t('page.loading')}
              />
            ) : null}
            {t('page.actions.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
