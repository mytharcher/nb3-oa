import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { Link, useOutletContext, useParams, useLocation } from 'react-router';
import { RouteDrawer } from '#components/route-drawer';
import { useRouteOverlay } from '#components/use-route-overlay';
import { DepartmentPicker } from '#components/department-picker';
import { Button } from '#components/ui/button';
import { FieldError } from '#components/ui/field';
import { Label } from '#components/ui/label';
import { Textarea } from '#components/ui/textarea';
import { Spinner } from '#components/ui/spinner';
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from '#components/ui/combobox';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '#components/ui/select';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '#components/ui/alert-dialog';
import { Alert, AlertDescription } from '#components/ui/alert';
import {
  SETTINGS,
  type Assignment,
  type Person,
  type Context,
} from './types.js';
import { useFinanceResource } from './resource.js';
import { FinanceError, FinanceSkeleton } from './states.js';
export default function FormDialog() {
  const { assignmentId } = useParams(),
    { t } = useTranslation(),
    [busy, setBusy] = useState(false),
    [discard, setDiscard] = useState(false);
  const dirtyRef = useRef(false),
    workingRef = useRef(false),
    resolverRef = useRef<((v: boolean) => void) | null>(null);
  const latest = useFinanceResource<{ data: Assignment }>(
      assignmentId
        ? `financeAssignments/${encodeURIComponent(assignmentId)}`
        : null,
    ),
    options = useFinanceResource<{ data: { accountants: Person[] } }>(
      'financeAssignments/options',
    );
  const p = useCan({
      resource: { type: 'settings', id: SETTINGS },
      action: 'update',
    }),
    allowed = p.can && !p.isPending && !p.error,
    ready =
      allowed &&
      !latest.loading &&
      !latest.error &&
      (!assignmentId || !!latest.data) &&
      !!options.data &&
      !options.error;
  return (
    <>
      <RouteDrawer
        className='sm:max-w-2xl'
        title={t(`financeAssignments.${assignmentId ? 'edit' : 'new'}`)}
        description={t('financeAssignments.formDescription')}
        beforeClose={() => {
          if (workingRef.current) return false;
          if (!dirtyRef.current) return true;
          setDiscard(true);
          return new Promise<boolean>((resolve) => {
            resolverRef.current = resolve;
          });
        }}
        footer={<Footer disabled={!ready} busy={busy} />}
      >
        {latest.error ? (
          <FinanceError error={latest.error} retry={latest.reload} />
        ) : options.error ? (
          <FinanceError error={options.error} retry={options.reload} />
        ) : !allowed && !p.isPending ? (
          <Alert variant='destructive'>
            <AlertDescription>
              {t('financeAssignments.error.forbidden')}
            </AlertDescription>
          </Alert>
        ) : !ready ? (
          <FinanceSkeleton />
        ) : (
          <Form
            key={assignmentId ?? 'new'}
            row={latest.data?.data}
            accountants={options.data!.data.accountants}
            onDirty={(v) => {
              dirtyRef.current = v;
            }}
            onBusy={(v) => {
              workingRef.current = v;
              setBusy(v);
            }}
          />
        )}
      </RouteDrawer>
      <AlertDialog
        open={discard}
        onOpenChange={(v) => {
          if (!v) {
            setDiscard(false);
            resolverRef.current?.(false);
            resolverRef.current = null;
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
            <AlertDialogCancel>
              {t('financeAssignments.cancel')}
            </AlertDialogCancel>
            <Button
              variant='destructive'
              onClick={() => {
                dirtyRef.current = false;
                setDiscard(false);
                resolverRef.current?.(true);
                resolverRef.current = null;
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
function Footer({ disabled, busy }: { disabled: boolean; busy: boolean }) {
  const { assignmentId } = useParams();
  const { close } = useRouteOverlay(),
    { t } = useTranslation();
  return (
    <>
      <Button variant='outline' disabled={busy} onClick={() => void close()}>
        {t('financeAssignments.cancel')}
      </Button>
      <Button
        form='finance-assignment-form'
        type='submit'
        disabled={disabled || busy}
      >
        {busy ? <Spinner data-icon='inline-start' /> : null}
        {t(
          assignmentId
            ? 'financeAssignments.save'
            : 'financeAssignments.create',
        )}
      </Button>
    </>
  );
}
function Form({
  row,
  accountants,
  onDirty,
  onBusy,
}: {
  row?: Assignment;
  accountants: Person[];
  onDirty: (v: boolean) => void;
  onBusy: (v: boolean) => void;
}) {
  const api = useApiClient(),
    toast = useToaster(),
    { t } = useTranslation(),
    { close } = useRouteOverlay(),
    context = useOutletContext<Context>(),
    location = useLocation();
  const [departmentId, setDepartmentId] = useState(row?.departmentId ?? ''),
    [person, setPerson] = useState<Person | null>(
      accountants.find((p) => p.id === row?.accountantId) ??
        row?.accountant ??
        null,
    ),
    [reason, setReason] = useState(''),
    [active, setActive] = useState(row?.active ?? true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(),
    [confirm, setConfirm] = useState(false),
    [version, setVersion] = useState(row?.version),
    [latest, setLatest] = useState<Assignment>(),
    [invalid, setInvalid] = useState<string[]>([]),
    [uncertain, setUncertain] = useState(false),
    [existing, setExisting] = useState<Assignment>();
  const permission = useCan({
      resource: { type: 'settings', id: 'oa.org.departments' },
      action: 'read',
    }),
    ref = useRef(false),
    attemptedDepartmentRef = useRef(departmentId);
  const changed =
    departmentId !== (row?.departmentId ?? '') ||
    person?.id !== row?.accountantId ||
    reason !== '' ||
    active !== (row?.active ?? true);
  useEffect(() => onDirty(changed), [changed, onDirty]);
  async function save() {
    if (ref.current || uncertain) return;
    ref.current = true;
    setBusy(true);
    onBusy(true);
    setError(undefined);
    try {
      if (!row) attemptedDepartmentRef.current = departmentId;
      await api.request({
        path: row
          ? `financeAssignments/${encodeURIComponent(row.id)}`
          : 'financeAssignments',
        method: row ? 'PATCH' : 'POST',
        json: row
          ? { accountantId: person!.id, active, version, reason }
          : { departmentId, accountantId: person!.id, reason },
      });
      toast.show({
        type: 'success',
        title: t('financeAssignments.saved', { name: person!.name }),
      });
      onDirty(false);
      context?.onSaved();
      ref.current = false;
      setBusy(false);
      onBusy(false);
      await close();
    } catch (e) {
      setError(e);
      if (!row && (!(e instanceof ApiClientError) || e.status >= 500))
        setUncertain(true);
      ref.current = false;
      setBusy(false);
      onBusy(false);
    }
  }
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const missing = [
      ...(!departmentId ? ['department'] : []),
      ...(!person ? ['accountant'] : []),
      ...(!reason.trim() ? ['reason'] : []),
    ];
    setInvalid(missing);
    if (missing.length) {
      document
        .getElementById(
          missing[0] === 'department'
            ? 'finance-form-department'
            : missing[0] === 'accountant'
              ? 'finance-accountant'
              : 'finance-reason',
        )
        ?.focus();
      return;
    }
    if (
      uncertain ||
      (error instanceof ApiClientError &&
        error.reason === 'FINANCE_ASSIGNMENT_VERSION_CONFLICT')
    )
      return;
    if (row?.active && !active) setConfirm(true);
    else void save();
  };
  return (
    <>
      <form
        id='finance-assignment-form'
        onSubmit={submit}
        className='flex flex-col gap-4'
      >
        <fieldset disabled={busy} className='flex flex-col gap-4'>
          {error ? (
            <FinanceError
              error={error}
              context='save'
              retry={
                uncertain ||
                (error instanceof ApiClientError && error.status === 409)
                  ? undefined
                  : () => {
                      void save();
                    }
              }
            />
          ) : null}
          {error instanceof ApiClientError && error.status === 409 && row ? (
            <div className='flex flex-col gap-2'>
              <p className='text-sm text-muted-foreground'>
                {t('financeAssignments.conflictAdvice')}
              </p>
              <Button
                type='button'
                variant='outline'
                onClick={() =>
                  void api
                    .request<{ data: Assignment }>({
                      path: `financeAssignments/${encodeURIComponent(row.id)}`,
                    })
                    .then((result) => setLatest(result.data), setError)
                }
              >
                {t('financeAssignments.loadLatest')}
              </Button>
            </div>
          ) : null}
          {latest ? (
            <Alert>
              <AlertDescription>
                {t('financeAssignments.latestSummary', {
                  name: latest.accountant.name,
                  status: t(
                    `financeAssignments.${latest.active ? 'active' : 'inactive'}`,
                  ),
                })}
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    setVersion(latest.version);
                    setLatest(undefined);
                    setError(undefined);
                  }}
                >
                  {t('financeAssignments.adoptVersion')}
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}
          {uncertain ||
          (!row && error instanceof ApiClientError && error.status === 409) ? (
            <div className='flex flex-col gap-2'>
              <p className='text-sm'>{t('financeAssignments.uncertain')}</p>
              <Button
                type='button'
                variant='outline'
                onClick={() =>
                  void api
                    .request<{ data: Assignment[] }>({
                      path: 'financeAssignments',
                      query: { departmentId: attemptedDepartmentRef.current },
                    })
                    .then((result) => {
                      if (result.data[0]) setExisting(result.data[0]);
                      else {
                        setUncertain(false);
                        setError(undefined);
                      }
                    }, setError)
                }
              >
                {t('financeAssignments.checkExisting')}
              </Button>
              {existing ? (
                <Button
                  nativeButton={false}
                  type='button'
                  variant='outline'
                  render={
                    <Link
                      to={{
                        pathname: `/financeAssignments/${existing.id}`,
                        search: location.search,
                        hash: location.hash,
                      }}
                    />
                  }
                >
                  {t('financeAssignments.viewExisting')}
                </Button>
              ) : null}
            </div>
          ) : null}
          <div className='flex flex-col gap-2'>
            <Label htmlFor='finance-form-department'>
              {t('financeAssignments.department')}{' '}
              <span aria-hidden='true' className='text-destructive'>
                *
              </span>
            </Label>
            {row ? (
              <p className='text-sm break-words'>{row.department.title}</p>
            ) : !permission.isPending &&
              (!permission.can || permission.error) ? (
              <Alert variant='destructive'>
                <AlertDescription>
                  {t('financeAssignments.departmentPermission')}
                </AlertDescription>
              </Alert>
            ) : (
              <DepartmentPicker
                id='finance-form-department'
                value={departmentId}
                invalid={invalid.includes('department')}
                disabled={permission.isPending}
                onChange={(v) => {
                  setDepartmentId(v);
                  if (v)
                    setInvalid((old) =>
                      old.filter((key) => key !== 'department'),
                    );
                }}
              />
            )}
            {invalid.includes('department') ? (
              <FieldError>{t('financeAssignments.required')}</FieldError>
            ) : null}
          </div>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='finance-accountant'>
              {t('financeAssignments.accountant')}{' '}
              <span aria-hidden='true' className='text-destructive'>
                *
              </span>
            </Label>
            <Combobox
              items={accountants}
              value={person}
              onValueChange={(value) => {
                setPerson(value);
                if (value)
                  setInvalid((old) =>
                    old.filter((key) => key !== 'accountant'),
                  );
              }}
              itemToStringLabel={(v) => v.name}
              isItemEqualToValue={(a, b) => a.id === b.id}
            >
              <ComboboxInput
                id='finance-accountant'
                aria-invalid={invalid.includes('accountant')}
                placeholder={t('financeAssignments.accountantPlaceholder')}
                showClear
              />
              <ComboboxContent>
                <ComboboxEmpty>
                  {t('financeAssignments.noAccountants')}
                </ComboboxEmpty>
                <ComboboxList>
                  {(item: Person) => (
                    <ComboboxItem key={item.id} value={item}>
                      {item.name}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            {invalid.includes('accountant') ? (
              <FieldError>{t('financeAssignments.required')}</FieldError>
            ) : null}
          </div>
          {row ? (
            <div className='flex flex-col gap-2'>
              <Label htmlFor='finance-status'>
                {t('financeAssignments.status')}
              </Label>
              <Select
                value={active ? 'active' : 'inactive'}
                onValueChange={(v) => setActive(v === 'active')}
              >
                <SelectTrigger id='finance-status'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                  <SelectGroup>
                    <SelectItem value='active'>
                      {t('financeAssignments.active')}
                    </SelectItem>
                    <SelectItem value='inactive'>
                      {t('financeAssignments.inactive')}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className='flex flex-col gap-2'>
            <Label htmlFor='finance-reason'>
              {t('financeAssignments.reason')}{' '}
              <span aria-hidden='true' className='text-destructive'>
                *
              </span>
            </Label>
            <Textarea
              id='finance-reason'
              aria-invalid={invalid.includes('reason')}
              maxLength={4000}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.trim())
                  setInvalid((old) => old.filter((key) => key !== 'reason'));
              }}
            />
            {invalid.includes('reason') ? (
              <FieldError>{t('financeAssignments.required')}</FieldError>
            ) : null}
          </div>
        </fieldset>
      </form>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('financeAssignments.disableTitle', {
                name: row?.department.title,
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('financeAssignments.disableDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>
              {t('financeAssignments.cancel')}
            </AlertDialogCancel>
            <Button
              variant='destructive'
              disabled={busy}
              onClick={() => {
                setConfirm(false);
                void save();
              }}
            >
              {t('financeAssignments.disable')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
