import { Pencil } from 'lucide-react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '#components/ui/tooltip';
import { useCallback, useState, useRef } from 'react';
import {
  ApiClientError,
  useApiClient,
  useToaster,
  useNavigationGuard,
} from '@nocobase/app-client';
import { useSearchParams } from 'react-router';
import { UsersClient } from '../administration/users/user-client.js';
import { userListParams } from './user-url.js';
import { useTranslation } from '@nocobase/i18n/client';
import { useDrawerFormGuard } from '#hooks/use-drawer-form-guard';
import { FormActions } from '#components/form-actions';
import { Button } from '#components/ui/button';
import { Badge } from '#components/ui/badge';
import { titleText } from '../administration/authorization/i18n.js';
import type { DutyRole } from '../org/duty-roles/types.js';
import { ConfirmDialog } from '../administration/authorization/components/confirm-dialog.js';
import { useLoad } from './hooks.js';
import { Loading, ErrorState, Refresh, Blank } from './ui.js';
import { ChoicePicker } from './choice-picker.js';

type RoleState = {
  userId: string;
  disabledAt: string | null;
  roles: (DutyRole & { assigned: boolean })[];
};
export default function UserDutyRoles({
  userId,
  name,
  saved,
  editing = false,
  canEdit = false,
  edit,
  cancel,
  accountChanged,
  compact = false,
}: {
  userId: string;
  compact?: boolean;
  name: string;
  saved: () => void;
  editing?: boolean;
  canEdit?: boolean;
  edit?: () => void;
  cancel?: () => void;
  accountChanged?: (disabledAt: string | null) => void;
}) {
  const api = useApiClient();
  const { t } = useTranslation();
  const toaster = useToaster();
  const load = useCallback(
    async () =>
      (
        await api.request<{ data: RoleState }>({
          path: `org/users/${encodeURIComponent(userId)}/duty-roles`,
        })
      ).data,
    [api, userId],
  );
  const data = useLoad(load);
  const [draft, setDraft] = useState<string[]>();
  const [baseline, setBaseline] = useState<RoleState>();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [reconcileError, setReconcileError] = useState<unknown>();
  const [notice, setNotice] = useState(false);
  const [params] = useSearchParams();
  const listParams = userListParams(params);
  const closeTo = `/users${listParams.size ? `?${listParams}` : ''}`;
  const [unverified, setUnverified] = useState(false);
  const [completed, setCompleted] = useState(0);
  const current = baseline ?? data.data;
  const original =
    current?.roles.filter((role) => role.assigned).map((role) => role.code) ??
    [];
  const selected = draft ?? original;
  const added = selected.filter((code) => !original.includes(code));
  const removed = original.filter((code) => !selected.includes(code));
  const dirty = editing && added.length + removed.length > 0;
  const blocked = added.some(
    (code) =>
      current?.disabledAt ||
      !current?.roles.find((role) => role.code === code)?.active,
  );
  const bypassRef = useRef(false);
  const guard = useDrawerFormGuard(dirty, busy, () => {
    bypassRef.current = true;
  });
  useNavigationGuard(
    () =>
      bypassRef.current ||
      (!busy && (!dirty || window.confirm(t('access.discardHelp')))),
  );
  async function reconcile() {
    const latest = await load();
    setBaseline(latest);
    accountChanged?.(latest.disabledAt);
    setUnverified(false);
    setReconcileError(undefined);
    return latest;
  }
  async function save() {
    setBusy(true);
    setError(undefined);
    setNotice(false);
    let done = 0;
    try {
      // Re-read before any writes. Preserve user intent if another administrator changed the baseline.
      const latest = await reconcile();
      const previous = latest.roles
        .filter((role) => role.assigned)
        .map((role) => role.code);
      if (
        JSON.stringify([...previous].sort()) !==
          JSON.stringify([...original].sort()) ||
        added.some(
          (code) =>
            latest.disabledAt ||
            !latest.roles.find((role) => role.code === code)?.active,
        )
      ) {
        setDraft(selected);
        setNotice(true);
        setConfirm(false);
        return;
      }
      for (const code of [...removed, ...added]) {
        const removing = removed.includes(code);
        await api.request({
          path: `dutyRoles/${encodeURIComponent(code)}/members${removing ? `/${encodeURIComponent(userId)}` : ''}`,
          method: removing ? 'DELETE' : 'POST',
          ...(!removing ? { json: { userId } } : {}),
        });
        done++;
      }
      setDraft(undefined);
      setConfirm(false);
      bypassRef.current = true;
      saved();
      toaster.show({ type: 'success', title: t('access.saved', { name }) });
    } catch (cause) {
      setError(cause);
      setCompleted(done);
      setDraft(selected);
      // A failed response can follow a committed write. Never replay until the state is known.
      setUnverified(true);
      try {
        if (
          cause instanceof ApiClientError &&
          cause.reason === 'USER_NOT_FOUND'
        ) {
          // The write's 400 does not identify deletion. Only a separate account read can do that.
          const account = await new UsersClient(api).get(userId);
          accountChanged?.(account.disabledAt);
          setNotice(true);
        }
        await reconcile();
        setNotice(true);
      } catch (readError) {
        setReconcileError(readError);
      }
      setConfirm(false);
    } finally {
      setBusy(false);
    }
  }
  const heading = compact ? (
    <h2 className='text-base font-medium'>{t('access.dutyRoles')}</h2>
  ) : null;
  if (data.error)
    return (
      <>
        {heading}
        <ErrorState error={data.error} retry={data.reload} />
      </>
    );
  if (!current)
    return (
      <>
        {heading}
        <Loading />
      </>
    );
  const label = (code: string) =>
    titleText(current.roles.find((role) => role.code === code)?.title, t) ||
    code;
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center justify-end gap-2'>
        <div className='mr-auto'>{heading}</div>
        {!editing ? (
          <>
            <Refresh busy={data.busy} reload={data.reload} />
            {canEdit ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant='outline'
                      size='icon'
                      aria-label={t('access.adjustDutyRoles')}
                      onClick={edit}
                    />
                  }
                >
                  <Pencil />
                </TooltipTrigger>
                <TooltipContent>{t('access.adjustDutyRoles')}</TooltipContent>
              </Tooltip>
            ) : null}
          </>
        ) : null}
      </div>
      {guard.confirmation}
      {notice ? <p role='status'>{t('access.membershipChanged')}</p> : null}
      {reconcileError ? (
        <ErrorState
          error={reconcileError}
          backTo={closeTo}
          onBack={() => {
            bypassRef.current = true;
            guard.markSaved();
            saved();
          }}
        />
      ) : null}
      {current.disabledAt ? (
        <p className='text-muted-foreground'>{t('access.frozenRoles')}</p>
      ) : null}
      {!editing ? (
        <>
          {original.length ? (
            <div className='flex flex-wrap gap-2'>
              {current.roles
                .filter((role) => role.assigned)
                .map((role) => (
                  <Badge variant='secondary' key={role.code}>
                    {label(role.code)}
                    {!role.active ? ` · ${t('access.roleInactive')}` : ''}
                  </Badge>
                ))}
            </div>
          ) : compact ? (
            <p className='text-muted-foreground'>{t('access.noRoles')}</p>
          ) : (
            <Blank
              title={t('access.noRoles')}
              description={t('access.dutyRolesHelp')}
            />
          )}
        </>
      ) : (
        <>
          {error ? (
            <>
              <ErrorState error={error} />
              <p role='status'>
                {t('access.partialSave', { count: completed })}
              </p>
            </>
          ) : null}
          {unverified ? (
            <>
              <p role='status'>{t('access.membershipUnverified')}</p>
              <Button
                variant='outline'
                disabled={busy}
                onClick={() => {
                  setBusy(true);
                  void reconcile()
                    .catch(setError)
                    .finally(() => setBusy(false));
                }}
              >
                {t('access.reload')}
              </Button>
            </>
          ) : null}
          {blocked ? (
            <p role='alert' className='text-destructive'>
              {t('access.roleAdditionBlocked')}
            </p>
          ) : null}
          <ChoicePicker
            label={t('access.adjustDutyRoles')}
            choices={current.roles.map((role) => ({
              value: role.code,
              label: `${label(role.code)}${!role.active ? ` · ${t('access.roleInactive')}` : ''}`,
              disabled:
                !original.includes(role.code) &&
                !selected.includes(role.code) &&
                (!!current.disabledAt || !role.active),
            }))}
            value={selected}
            onChange={setDraft}
            disabled={busy || unverified}
          />
          <FormActions>
            <Button
              variant='outline'
              disabled={busy}
              onClick={() => {
                if (!dirty || window.confirm(t('access.discardHelp'))) {
                  bypassRef.current = true;
                  setDraft(undefined);
                  cancel?.();
                }
              }}
            >
              {t('access.cancel')}
            </Button>
            <Button
              disabled={!dirty || busy || blocked || unverified}
              onClick={() => setConfirm(true)}
            >
              {t('access.save')}
            </Button>
          </FormActions>
        </>
      )}
      <ConfirmDialog
        open={confirm}
        title={t('access.confirmTitle', { name })}
        confirmLabel={t('access.save')}
        cancelLabel={t('access.cancel')}
        variant={removed.length ? 'destructive' : 'default'}
        busy={busy}
        onCancel={() => setConfirm(false)}
        onConfirm={() => void save()}
      >
        <span className='block'>
          {t('access.addedRoles', {
            names: added.map(label).join(' · ') || t('access.none'),
          })}
        </span>
        <span className='block'>
          {t('access.removedRoles', {
            names: removed.map(label).join(' · ') || t('access.none'),
          })}
        </span>
        <span className='block'>{t('access.memberImpact')}</span>
      </ConfirmDialog>
    </div>
  );
}
