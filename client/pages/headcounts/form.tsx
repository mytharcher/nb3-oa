import { useEffect, useRef, useState } from 'react';
import { useLocation, useOutletContext, useParams } from 'react-router';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useAuthorizationRevision } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { RouteDialog } from '#components/route-dialog';
import { useRouteOverlay } from '#components/use-route-overlay';
import { DepartmentPicker } from '#components/department-picker';
import { Button } from '#components/ui/button';
import { Spinner } from '#components/ui/spinner';
import { Input } from '#components/ui/input';
import { Textarea } from '#components/ui/textarea';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from '#components/ui/field';
import { Checkbox } from '#components/ui/checkbox';
import { Alert, AlertDescription } from '#components/ui/alert';
import { createRequestKey } from '#lib/request-key';
import { useResource } from './resource.js';
import { useCloseGuard } from './use-close-guard.js';
import { Choice, Failure, Loading, Discard, Confirmation } from './shared.js';
import {
  accountName,
  type Balance,
  type Options,
  type PageContext,
  type Preview,
} from './types.js';
export default function HeadcountForm() {
  const { session } = useAuthentication(),
    revision = useAuthorizationRevision();
  return <Form key={JSON.stringify([session?.user.id, revision])} />;
}
function Form() {
  const { accountId = '' } = useParams(),
    location = useLocation(),
    { t } = useTranslation(),
    parent = useOutletContext<PageContext>();
  const mode = !accountId
    ? 'create'
    : location.pathname.endsWith('/reconcile')
      ? 'reconcile'
      : 'adjust';
  const latest = useResource<{ data: Balance }>(
    accountId ? `headcounts/${encodeURIComponent(accountId)}` : null,
  );
  const initial = useResource<{ data: Options }>(
    mode === 'create' ? 'headcounts/createOptions' : null,
  );
  const preview = useResource<{ data: Preview }>(
    mode === 'reconcile'
      ? `headcounts/${encodeURIComponent(accountId)}/reconciliationPreview`
      : null,
  );
  const [busy, setBusy] = useState(false),
    [unknown, setUnknown] = useState(false),
    [dirty, setDirty] = useState(false),
    guard = useCloseGuard(busy || unknown);
  const ready =
    mode === 'create'
      ? !!initial.data && !initial.error && !initial.loading
      : !!latest.data &&
        !latest.error &&
        !latest.loading &&
        (mode !== 'reconcile' ||
          (!!preview.data &&
            !preview.error &&
            !preview.loading &&
            !preview.data.data.initialized));
  const reload = () => {
    latest.reload();
    preview.reload();
    parent.reload();
  };
  const { reload: parentReload } = parent;
  useEffect(() => {
    if (latest.error instanceof ApiClientError && latest.error.status === 404)
      parentReload();
  }, [latest.error, parentReload]);
  const [formReady, setFormReady] = useState(false);
  return (
    <RouteDialog
      title={t(
        mode === 'create'
          ? 'headcounts.create'
          : mode === 'reconcile'
            ? 'headcounts.reconcile'
            : 'headcounts.adjust',
      )}
      className={mode === 'adjust' ? 'sm:max-w-md' : 'sm:max-w-2xl'}
      beforeClose={guard.beforeClose}
      footer={
        <Footer
          busy={busy}
          unknown={unknown}
          ready={ready && formReady}
          mode={mode}
        />
      }
    >
      {initial.error ? (
        <Failure error={initial.error} retry={initial.reload} />
      ) : latest.error ? (
        <Failure error={latest.error} retry={latest.reload} />
      ) : preview.error ? (
        <Failure error={preview.error} retry={preview.reload} />
      ) : mode === 'reconcile' && preview.data?.data.initialized ? (
        <Alert>
          <AlertDescription>
            {t('headcounts.alreadyInitialized')}
          </AlertDescription>
        </Alert>
      ) : !ready ? (
        <Loading />
      ) : (
        <Body
          key={`${accountId}:${latest.data?.data.version ?? 'new'}:${preview.data?.data.version ?? 0}`}
          mode={mode}
          account={latest.data?.data}
          options={initial.data?.data}
          preview={preview.data?.data}
          onBusy={setBusy}
          onUnknown={setUnknown}
          onReady={setFormReady}
          onChange={() => {
            setDirty(true);
            guard.changed();
          }}
          onSaved={(value) => {
            guard.saved();
            setDirty(false);
            parent.onSaved(value);
          }}
          onReload={reload}
        />
      )}
      {dirty ? <Discard guard={guard} /> : null}
    </RouteDialog>
  );
}
function Footer({
  busy,
  unknown,
  ready,
  mode,
}: {
  busy: boolean;
  unknown: boolean;
  ready: boolean;
  mode: string;
}) {
  const { t } = useTranslation(),
    overlay = useRouteOverlay();
  return (
    <>
      <Button
        type='button'
        variant='outline'
        disabled={busy || unknown}
        onClick={() => void overlay.close()}
      >
        {t('headcounts.cancel')}
      </Button>
      <Button type='submit' form='headcount-form' disabled={busy || !ready}>
        {busy ? <Spinner /> : null}
        {t(
          unknown
            ? 'headcounts.retryCommand'
            : mode === 'create'
              ? 'headcounts.createSubmit'
              : mode === 'reconcile'
                ? 'headcounts.confirmInitialize'
                : 'headcounts.save',
        )}
      </Button>
    </>
  );
}
function Body({
  mode,
  account,
  options,
  preview,
  onBusy,
  onUnknown,
  onReady,
  onChange,
  onSaved,
  onReload,
}: {
  mode: string;
  account?: Balance;
  options?: Options;
  preview?: Preview;
  onBusy: (v: boolean) => void;
  onUnknown: (v: boolean) => void;
  onReady: (v: boolean) => void;
  onChange: () => void;
  onSaved: (v: Balance) => void;
  onReload: () => void;
}) {
  const { t, i18n } = useTranslation(),
    api = useApiClient(),
    toaster = useToaster(),
    overlay = useRouteOverlay();
  const [values, setValues] = useState({
    departmentId: '',
    positionId: '',
    year: String(options?.year ?? account?.year ?? ''),
    limit: String(account?.limit ?? 0),
    reason: '',
    confirmed: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({}),
    [error, setError] = useState<unknown>(),
    [busy, setBusy] = useState(false),
    [unknown, setUnknown] = useState(false),
    [blocked, setBlocked] = useState(false),
    [reduce, setReduce] = useState(false);
  const commandRef = useRef<{
      path: string;
      method: 'POST' | 'PATCH';
      body: unknown;
    } | null>(null),
    lockRef = useRef(false),
    formRef = useRef<HTMLFormElement>(null),
    boundaryRef = useRef(new AbortController());
  useEffect(() => {
    if (boundaryRef.current.signal.aborted)
      boundaryRef.current = new AbortController();
    const controller = boundaryRef.current;
    return () => controller.abort();
  }, []);
  const validQuery =
    Number.isInteger(Number(values.year)) &&
    Number(values.year) >= 1900 &&
    Number(values.year) <= 9999 &&
    Number.isInteger(Number(values.limit)) &&
    Number(values.limit) >= 0 &&
    Number(values.limit) <= 1000000;
  const current = useResource<{ data: Options }>(
    mode === 'create' && validQuery ? 'headcounts/createOptions' : null,
    { year: values.year, limit: values.limit },
  );
  const targets = current.data?.data.targets ?? [];
  const ready =
    mode !== 'create' || (!!current.data && !current.error && !current.loading);
  useEffect(
    () => onReady((ready || unknown) && !blocked),
    [ready, unknown, blocked, onReady],
  );
  function validate(v: typeof values) {
    const found: Record<string, string> = {};
    if (!v.reason.trim() || v.reason.trim().length > 5000)
      found.reason = t('headcounts.reasonRequired');
    if (
      v.limit === '' ||
      !Number.isInteger(Number(v.limit)) ||
      Number(v.limit) < 0 ||
      Number(v.limit) > 1000000
    )
      found.limit = t('headcounts.invalidLimit');
    if (mode === 'create') {
      if (
        v.year === '' ||
        !Number.isInteger(Number(v.year)) ||
        Number(v.year) < 1900 ||
        Number(v.year) > 9999
      )
        found.year = t('headcounts.invalidYear');
      if (
        !targets.some(
          (p) =>
            p.department.id === v.departmentId &&
            p.position.id === v.positionId,
        )
      ) {
        if (!v.departmentId)
          found.departmentId = t('headcounts.selectRequired');
        else found.positionId = t('headcounts.selectRequired');
      }
    }
    if (mode === 'reconcile' && !v.confirmed)
      found.confirmed = t('headcounts.rosterConfirmationRequired');
    if (
      mode === 'adjust' &&
      account &&
      Number(v.limit) < account.used + account.pending + account.allocated
    )
      found.limit = t('headcounts.errors.HEADCOUNT_INSUFFICIENT');
    return found;
  }
  function change<K extends keyof typeof values>(
    key: K,
    value: (typeof values)[K],
  ) {
    const next = {
      ...values,
      [key]: value,
      ...(key === 'departmentId' ? { positionId: '' } : {}),
    };
    setValues(next);
    onChange();
    setErrors((old) => {
      const found = validate(next);
      return Object.fromEntries(
        Object.keys(old)
          .filter((k) => found[k])
          .map((k) => [k, found[k]]),
      );
    });
  }
  async function send() {
    if (lockRef.current || blocked) return;
    lockRef.current = true;
    setBusy(true);
    onBusy(true);
    setError(undefined);
    try {
      const receipt = await api.request<{ data: Balance }>({
        path: commandRef.current!.path,
        method: commandRef.current!.method,
        body: JSON.stringify(commandRef.current!.body),
        signal: boundaryRef.current.signal,
      });
      if (boundaryRef.current.signal.aborted) return;
      onSaved(receipt.data);
      onUnknown(false);
      setUnknown(false);
      toaster.show({
        type: 'success',
        title: t(
          mode === 'create'
            ? 'headcounts.created'
            : mode === 'reconcile'
              ? 'headcounts.reconciled'
              : 'headcounts.adjusted',
          { name: accountName(receipt.data) },
        ),
      });
      await overlay.close();
    } catch (e) {
      if (boundaryRef.current.signal.aborted) return;
      setError(e);
      if (e instanceof ApiClientError && [401, 403, 404].includes(e.status)) {
        setBlocked(true);
        onUnknown(false);
        setUnknown(false);
        commandRef.current = null;
        setValues((v) => ({ ...v, reason: '', confirmed: false }));
        if (e.status === 404) onReload();
      } else if (!(e instanceof ApiClientError) || e.status >= 500) {
        setUnknown(true);
        onUnknown(true);
      } else {
        commandRef.current = null;
        setUnknown(false);
        onUnknown(false);
        if (
          e instanceof ApiClientError &&
          e.reason === 'HEADCOUNT_ALREADY_EXISTS'
        )
          setErrors((v) => ({
            ...v,
            positionId: t('headcounts.errors.HEADCOUNT_ALREADY_EXISTS'),
          }));
      }
    } finally {
      lockRef.current = false;
      setBusy(false);
      onBusy(false);
    }
  }
  function submit() {
    if (unknown) {
      void send();
      return;
    }
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) {
      formRef.current
        ?.querySelector<HTMLElement>(
          `#hc-${['departmentId', 'positionId', 'year', 'limit', 'confirmed', 'reason'].find((key) => found[key])}`,
        )
        ?.focus();
      return;
    }
    const common = {
      requestKey: createRequestKey(),
      reason: values.reason.trim(),
    };
    commandRef.current =
      mode === 'create'
        ? {
            path: 'headcounts',
            method: 'POST',
            body: {
              ...common,
              departmentId: values.departmentId,
              positionId: values.positionId,
              year: Number(values.year),
              limit: Number(values.limit),
            },
          }
        : mode === 'adjust'
          ? {
              path: `headcounts/${account!.id}`,
              method: 'PATCH',
              body: {
                ...common,
                expectedVersion: account!.version,
                limit: Number(values.limit),
              },
            }
          : {
              path: `headcounts/${account!.id}/reconcile`,
              method: 'POST',
              body: {
                ...common,
                expectedVersion: preview!.version,
                employeeIds: preview!.employees.map((e) => e.id),
              },
            };
    if (mode === 'adjust' && Number(values.limit) < account!.limit) {
      setReduce(true);
      return;
    }
    void send();
  }
  const frozen = busy || unknown || blocked;
  return (
    <>
      <form
        id='headcount-form'
        ref={formRef}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy) submit();
        }}
        className='flex flex-col gap-4'
      >
        {error ? (
          <Failure error={error} retry={unknown ? undefined : onReload} />
        ) : null}
        {unknown ? (
          <Alert>
            <AlertDescription>
              {t('headcounts.unknownOutcome')}
            </AlertDescription>
          </Alert>
        ) : null}
        {mode === 'create' ? (
          <>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor='hc-departmentId'>
                  {t('headcounts.fields.department')} *
                </FieldLabel>
                <DepartmentPicker
                  id='hc-departmentId'
                  value={values.departmentId}
                  allowedIds={[...new Set(targets.map((p) => p.department.id))]}
                  onChange={(v) => change('departmentId', v)}
                  disabled={frozen || current.loading}
                  invalid={!!errors.departmentId}
                />
                {errors.departmentId ? (
                  <FieldError>{errors.departmentId}</FieldError>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor='hc-positionId'>
                  {t('headcounts.fields.position')} *
                </FieldLabel>
                <Choice
                  id='hc-positionId'
                  label={t('headcounts.fields.position')}
                  value={values.positionId}
                  items={targets
                    .filter((p) => p.department.id === values.departmentId)
                    .map((p) => ({
                      value: p.position.id,
                      label: p.position.name,
                    }))}
                  onChange={(v) => change('positionId', v)}
                  disabled={frozen || current.loading}
                  invalid={!!errors.positionId}
                />
                {errors.positionId ? (
                  <FieldError>{errors.positionId}</FieldError>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor='hc-year'>
                  {t('headcounts.fields.year')} *
                </FieldLabel>
                <Input
                  id='hc-year'
                  type='number'
                  value={values.year}
                  onChange={(e) => change('year', e.target.value)}
                  disabled={frozen}
                  aria-invalid={!!errors.year}
                />
                {errors.year ? <FieldError>{errors.year}</FieldError> : null}
              </Field>
            </FieldGroup>
            {current.error ? (
              <Failure error={current.error} retry={current.reload} />
            ) : null}
            {ready && targets.length === 0 ? (
              <Alert>
                <AlertDescription>{t('headcounts.noTargets')}</AlertDescription>
              </Alert>
            ) : null}
          </>
        ) : null}
        {mode !== 'reconcile' ? (
          <Field>
            <FieldLabel htmlFor='hc-limit'>
              {t('headcounts.fields.limit')} *
            </FieldLabel>
            <Input
              id='hc-limit'
              type='number'
              value={values.limit}
              disabled={frozen}
              onChange={(e) => change('limit', e.target.value)}
              aria-invalid={!!errors.limit}
            />
            {errors.limit ? <FieldError>{errors.limit}</FieldError> : null}
          </Field>
        ) : (
          <>
            <p className='text-sm text-muted-foreground'>
              {t('headcounts.rosterHelp')}
            </p>
            <p>
              {t('headcounts.rosterCount', {
                count: preview!.employees.length,
              })}
            </p>
            {preview!.employees.length ? (
              <ul className='flex flex-col gap-2'>
                {preview!.employees.map((e) => (
                  <li key={e.id} className='flex justify-between gap-4'>
                    <span className='min-w-0 flex-1 break-words'>{e.name}</span>
                    <span className='text-muted-foreground'>
                      {t(`headcounts.employeeStatus.${e.status}`)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <Alert>
                <AlertDescription>
                  {t('headcounts.rosterEmpty')}
                </AlertDescription>
              </Alert>
            )}
            <Field>
              <div className='flex items-center gap-2'>
                <Checkbox
                  id='hc-confirmed'
                  checked={values.confirmed}
                  disabled={frozen}
                  onCheckedChange={(v) => change('confirmed', v === true)}
                  aria-invalid={!!errors.confirmed}
                />
                <FieldLabel htmlFor='hc-confirmed'>
                  {t('headcounts.confirmRoster')} *
                </FieldLabel>
              </div>
              {errors.confirmed ? (
                <FieldError>{errors.confirmed}</FieldError>
              ) : null}
            </Field>
          </>
        )}
        {mode === 'adjust' && account ? (
          <p className='text-sm text-muted-foreground'>
            {t('headcounts.minimumLimit', {
              count: account.used + account.pending + account.allocated,
            })}
          </p>
        ) : null}
        <Field>
          <FieldLabel htmlFor='hc-reason'>
            {t('headcounts.fields.reason')} *
          </FieldLabel>
          <Textarea
            id='hc-reason'
            value={values.reason}
            disabled={frozen}
            onChange={(e) => change('reason', e.target.value)}
            aria-invalid={!!errors.reason}
          />
          {errors.reason ? <FieldError>{errors.reason}</FieldError> : null}
        </Field>
      </form>
      <Confirmation
        open={reduce}
        title={t('headcounts.reduceTitle', {
          account: account ? accountName(account) : '',
        })}
        description={t('headcounts.reduceDescription', {
          previous: new Intl.NumberFormat(i18n.language).format(
            account?.limit ?? 0,
          ),
          next: new Intl.NumberFormat(i18n.language).format(
            Number(values.limit),
          ),
        })}
        confirm={t('headcounts.reduceConfirm')}
        onCancel={() => {
          setReduce(false);
          commandRef.current = null;
        }}
        onConfirm={() => {
          setReduce(false);
          void send();
        }}
        destructive
      />
    </>
  );
}
