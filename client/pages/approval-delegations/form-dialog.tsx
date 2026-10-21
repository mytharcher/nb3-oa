import { UserAvatar } from '#components/user-name';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '#components/ui/input-group';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { format, parseISO } from 'date-fns';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useOutletContext, useParams } from 'react-router';
import { DatePicker } from '#components/date-picker';
import { RouteDrawer } from '#components/route-drawer';
import { UserPicker } from '#components/user-picker';
import { useRouteOverlay } from '#components/use-route-overlay';
import { Alert, AlertDescription } from '#components/ui/alert';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '#components/ui/alert-dialog';
import { Button } from '#components/ui/button';
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from '#components/ui/field';
import { Input } from '#components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '#components/ui/select';
import { CloseButton } from '../org/dialog-parts.js';
import { Spinner } from '#components/ui/spinner';
import { FormSkeleton, RequiredMark } from '../org/org-ui.js';
import { ErrorState } from '../approvals/states.js';
import { useResource } from '../approvals/use-resource.js';
import {
  DELEGATION_SETTINGS,
  SELECT_POPUP,
  instantToWall,
  wallTimeToInstant,
  type Delegation,
  type DelegationContext,
} from './types.js';

interface FormValues {
  principalId: string;
  delegateId: string;
  scope: 'all' | 'leave';
  fromDate: string;
  fromTime: string;
  toDate: string;
  toTime: string;
}
interface FormProps {
  formId: string;
  row?: Delegation;
  zone: string;
  context: DelegationContext;
  setSaving: (value: boolean) => void;
  setDirty: (value: boolean) => void;
  setBlocked: (value: boolean) => void;
  reloadLatest: () => void;
}
function DelegationForm({
  formId,
  row,
  zone,
  context,
  setSaving,
  setDirty,
  setBlocked,
  reloadLatest,
}: FormProps) {
  const { t } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const { close } = useRouteOverlay();
  const peoplePermission = useCan({
    resource: { type: 'user', id: '*' },
    action: 'read',
  });
  const canPick =
    peoplePermission.can &&
    !peoplePermission.isPending &&
    !peoplePermission.error;
  const [values, setValues] = useState<FormValues>(() => {
    const from = row
      ? instantToWall(row.from, zone)
      : { date: '', time: '09:00' };
    const to = row ? instantToWall(row.to, zone) : { date: '', time: '18:00' };
    return {
      principalId: row?.principalId ?? '',
      delegateId: row?.delegateId ?? '',
      scope: row?.scope === 'all' || !row ? 'all' : 'leave',
      fromDate: from.date,
      fromTime: from.time,
      toDate: to.date,
      toTime: to.time,
    };
  });
  const [baseline, setBaseline] = useState(JSON.stringify(values));
  const dirty = baseline !== JSON.stringify(values);
  useEffect(() => setDirty(dirty), [dirty, setDirty]);
  const [attempted, setAttempted] = useState(false);
  const [error, setError] = useState<unknown>();
  const [formSaving, setFormSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const from = wallTimeToInstant(values.fromDate, values.fromTime, zone);
  const to = wallTimeToInstant(values.toDate, values.toTime, zone);
  const peopleInvalid =
    !values.principalId ||
    !values.delegateId ||
    values.principalId === values.delegateId;
  const timeInvalid = !from || !to || Date.parse(to) <= Date.parse(from);
  const knownUsers = row ? [row.principal, row.delegate] : [];
  function change<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((old) => ({ ...old, [key]: value }));
    setError(undefined);
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (formSaving || terminalError) return;
    setAttempted(true);
    if (!canPick) return;
    if (peopleInvalid || timeInvalid || !from || !to) {
      const firstInvalid =
        !values.principalId || values.principalId === values.delegateId
          ? 'principal'
          : !values.delegateId
            ? 'delegate'
            : !values.fromDate
              ? 'fromDate'
              : !from
                ? 'fromTime'
                : !values.toDate
                  ? 'toDate'
                  : 'toTime';
      // The composed pickers expose their focusable control through their public id.
      formRef.current
        ?.querySelector<HTMLElement>(`[id="${formId}-${firstInvalid}"]`)
        ?.focus();
      return;
    }
    setFormSaving(true);
    setSaving(true);
    setError(undefined);
    try {
      const result = await api.request<{ data: Delegation }>({
        path: row
          ? `approvalDelegations/${encodeURIComponent(row.id)}`
          : 'approvalDelegations',
        method: row ? 'PATCH' : 'POST',
        json: {
          principalId: values.principalId,
          delegateId: values.delegateId,
          scope: values.scope === 'all' ? 'all' : ['oa.leave'],
          from,
          to,
        },
      });
      setBaseline(JSON.stringify(values));
      setDirty(false);
      if (context.onSaved) context.onSaved(result.data);
      else context.reload();
      toaster.show({
        type: 'success',
        title: t('approvals.delegations.saved', {
          name: result.data.principal.name,
        }),
      });
      setSaving(false);
      setFormSaving(false);
      await close();
    } catch (failure) {
      setError(failure);
      if (failure instanceof ApiClientError && failure.status === 404)
        context.reload();
    } finally {
      setSaving(false);
      setFormSaving(false);
    }
  }
  const terminalError =
    error instanceof ApiClientError && [401, 403, 404].includes(error.status);
  useEffect(() => {
    setBlocked(terminalError);
    return () => setBlocked(false);
  }, [terminalError, setBlocked]);
  const localError =
    error instanceof ApiClientError &&
    ['DELEGATION_OVERLAP', 'INVALID_DELEGATION'].includes(error.reason ?? '');
  return (
    <form
      ref={formRef}
      id={formId}
      noValidate
      onSubmit={(event) => void submit(event)}
    >
      <FieldGroup>
        {!canPick && !peoplePermission.isPending ? (
          <Alert>
            <AlertDescription>
              {t('approvals.noPickerPermission')}
            </AlertDescription>
          </Alert>
        ) : null}
        {error ? (
          localError ? (
            <Alert variant='destructive'>
              <AlertDescription>
                {t(
                  error instanceof ApiClientError &&
                    error.reason === 'DELEGATION_OVERLAP'
                    ? 'approvals.delegations.overlap'
                    : 'approvals.delegations.invalid',
                )}
              </AlertDescription>
            </Alert>
          ) : (
            <ErrorState
              error={error}
              retry={() => {
                setError(undefined);
                reloadLatest();
              }}
            />
          )
        ) : null}
        <Field data-invalid={attempted && peopleInvalid}>
          <FieldLabel htmlFor={`${formId}-principal`}>
            {t('approvals.delegations.principal')}
            <RequiredMark />
          </FieldLabel>
          {canPick ? (
            <UserPicker
              id={`${formId}-principal`}
              value={values.principalId}
              onChange={(value) => change('principalId', value)}
              knownUsers={knownUsers}
              excludeIds={values.delegateId ? [values.delegateId] : []}
              disabled={!canPick || formSaving || terminalError}
              invalid={attempted && peopleInvalid}
            />
          ) : (
            <InputGroup>
              <InputGroupAddon align='inline-start'>
                {row?.principal ? (
                  <UserAvatar name={row.principal.name} />
                ) : null}
              </InputGroupAddon>
              <InputGroupInput
                id={`${formId}-principal`}
                value={row?.principal.name ?? ''}
                disabled
                readOnly
              />
            </InputGroup>
          )}
          {attempted && peopleInvalid ? (
            <FieldError>{t('approvals.delegations.invalid')}</FieldError>
          ) : null}
        </Field>
        <Field data-invalid={attempted && peopleInvalid}>
          <FieldLabel htmlFor={`${formId}-delegate`}>
            {t('approvals.delegations.delegate')}
            <RequiredMark />
          </FieldLabel>
          {canPick ? (
            <UserPicker
              id={`${formId}-delegate`}
              value={values.delegateId}
              onChange={(value) => change('delegateId', value)}
              knownUsers={knownUsers}
              excludeIds={values.principalId ? [values.principalId] : []}
              disabled={!canPick || formSaving || terminalError}
              invalid={attempted && peopleInvalid}
            />
          ) : (
            <InputGroup>
              <InputGroupAddon align='inline-start'>
                {row?.delegate ? <UserAvatar name={row.delegate.name} /> : null}
              </InputGroupAddon>
              <InputGroupInput
                id={`${formId}-delegate`}
                value={row?.delegate.name ?? ''}
                disabled
                readOnly
              />
            </InputGroup>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor={`${formId}-scope`}>
            {t('approvals.delegations.scope')}
            <RequiredMark />
          </FieldLabel>
          <Select
            value={values.scope}
            items={[
              { value: 'all', label: t('approvals.delegations.allScope') },
              { value: 'leave', label: t('approvals.delegations.leaveScope') },
            ]}
            onValueChange={(value) =>
              change('scope', value === 'leave' ? 'leave' : 'all')
            }
            disabled={formSaving || terminalError}
          >
            <SelectTrigger id={`${formId}-scope`} className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={SELECT_POPUP}>
              <SelectGroup>
                <SelectItem value='all'>
                  {t('approvals.delegations.allScope')}
                </SelectItem>
                <SelectItem value='leave'>
                  {t('approvals.delegations.leaveScope')}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        {(['from', 'to'] as const).map((side) => (
          <FieldGroup key={side} className='grid gap-4 sm:grid-cols-2'>
            <Field data-invalid={attempted && timeInvalid}>
              <FieldLabel htmlFor={`${formId}-${side}Date`}>
                {t(`approvals.delegations.${side}`)}
                <RequiredMark />
              </FieldLabel>
              <DatePicker
                id={`${formId}-${side}Date`}
                value={
                  values[`${side}Date`]
                    ? parseISO(values[`${side}Date`])
                    : undefined
                }
                onChange={(date) =>
                  change(`${side}Date`, date ? format(date, 'yyyy-MM-dd') : '')
                }
                className='w-full'
                disabled={formSaving || terminalError}
                invalid={attempted && timeInvalid}
              />
            </Field>
            <Field data-invalid={attempted && timeInvalid}>
              <FieldLabel htmlFor={`${formId}-${side}Time`}>
                {t(`approvals.delegations.${side}Time`)}
                <RequiredMark />
              </FieldLabel>
              <Input
                id={`${formId}-${side}Time`}
                value={values[`${side}Time`]}
                onChange={(event) => change(`${side}Time`, event.target.value)}
                placeholder='HH:mm'
                inputMode='numeric'
                maxLength={5}
                disabled={formSaving || terminalError}
                aria-invalid={attempted && timeInvalid}
              />
            </Field>
          </FieldGroup>
        ))}
        {attempted && timeInvalid ? (
          <FieldError>{t('approvals.delegations.timeInvalid')}</FieldError>
        ) : null}
        <p className='text-sm text-muted-foreground'>
          {t('approvals.delegations.timeZone', { zone })}
        </p>
      </FieldGroup>
    </form>
  );
}
export default function DelegationFormDialog() {
  const { t } = useTranslation();
  const { delegationId } = useParams();
  const context = useOutletContext<DelegationContext>();
  const people = useCan({
    resource: { type: 'user', id: '*' },
    action: 'read',
  });
  const permission = useCan({
    resource: { type: 'settings', id: DELEGATION_SETTINGS },
    action: 'update',
  });
  const canUpdate =
    permission.can && !permission.isPending && !permission.error;
  const rows = useResource<Delegation[]>(
    delegationId ? 'approvalDelegations' : null,
  );
  const options = useResource<{ timeZone: string }>('leaveRequests/options');
  const row = rows.data?.find((entry) => entry.id === delegationId);
  const missing = !!delegationId && !rows.loading && !!rows.data && !row;
  const blockedSource = row?.source === 'leave';
  const [saving, setSaving] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const savingRef = useRef(false);
  const dirtyRef = useRef(false);
  const onSaving = useCallback((value: boolean) => {
    savingRef.current = value;
    setSaving(value);
  }, []);
  const onDirty = useCallback((value: boolean) => {
    dirtyRef.current = value;
  }, []);
  const [discard, setDiscard] = useState(false);
  const decisionRef = useRef<((value: boolean) => void) | null>(null);
  const formId = useId();
  const loading =
    options.loading || (!!delegationId && rows.loading) || permission.isPending;
  const failure = rows.error ?? options.error;
  const parentReload = context.reload;
  useEffect(() => {
    if (missing) parentReload();
  }, [missing, parentReload]);
  const ready =
    !loading &&
    !failure &&
    !missing &&
    !blockedSource &&
    canUpdate &&
    !!options.data?.timeZone;
  return (
    <>
      <RouteDrawer
        className='sm:max-w-2xl'
        title={t(
          delegationId
            ? 'approvals.delegations.edit'
            : 'approvals.delegations.new',
        )}
        description={t('approvals.delegations.description')}
        beforeClose={() =>
          savingRef.current
            ? false
            : dirtyRef.current
              ? new Promise<boolean>((resolve) => {
                  decisionRef.current = resolve;
                  setDiscard(true);
                })
              : true
        }
        footer={
          ready ? (
            <>
              <CloseButton label={t('approvals.cancel')} disabled={saving} />
              <Button
                type='submit'
                form={formId}
                disabled={
                  saving ||
                  blocked ||
                  !people.can ||
                  people.isPending ||
                  !!people.error
                }
              >
                {saving ? <Spinner data-icon='inline-start' /> : null}
                {t(
                  delegationId
                    ? 'approvals.save'
                    : 'approvals.delegations.create',
                )}
              </Button>
            </>
          ) : (
            <CloseButton label={t('approvals.close')} />
          )
        }
      >
        {loading ? (
          <FormSkeleton fields={7} />
        ) : failure ? (
          <ErrorState
            error={failure}
            retry={() => {
              rows.reload();
              options.reload();
            }}
          />
        ) : missing ? (
          <Alert variant='destructive'>
            <AlertDescription>{t('approvals.error.notFound')}</AlertDescription>
          </Alert>
        ) : blockedSource ? (
          <Alert>
            <AlertDescription>
              {t('approvals.delegations.sourceLeave')}
            </AlertDescription>
          </Alert>
        ) : !canUpdate ? (
          <Alert variant='destructive'>
            <AlertDescription>
              {t('approvals.error.forbidden')}
            </AlertDescription>
          </Alert>
        ) : ready ? (
          <DelegationForm
            key={`${delegationId ?? 'new'}:${row?.updatedAt ?? ''}:${options.data!.timeZone}`}
            formId={formId}
            row={row}
            zone={options.data!.timeZone}
            context={context}
            setSaving={onSaving}
            setDirty={onDirty}
            setBlocked={setBlocked}
            reloadLatest={() => {
              rows.reload();
              options.reload();
            }}
          />
        ) : null}
      </RouteDrawer>
      <AlertDialog
        open={discard}
        onOpenChange={(open) => {
          if (!open) {
            setDiscard(false);
            decisionRef.current?.(false);
            decisionRef.current = null;
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('approvals.discard')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('approvals.discardDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setDiscard(false);
                decisionRef.current?.(false);
                decisionRef.current = null;
              }}
            >
              {t('approvals.cancel')}
            </Button>
            <Button
              variant='destructive'
              onClick={() => {
                setDiscard(false);
                decisionRef.current?.(true);
                decisionRef.current = null;
              }}
            >
              {t('approvals.discardConfirm')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
