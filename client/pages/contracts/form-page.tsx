import {
  useRequestFormSubmission,
  preventComposingSubmit,
} from '#hooks/use-request-form-submission';
import {
  RequestFormButtons,
  RequestSubmissionFeedback,
} from '#components/request-form-submission';
import { useMissing } from './use-missing.js';
import { finalRefusal, uncertainError } from './errors.js';
import { useCloseGuard } from './use-close-guard.js';
import { useEffect, useRef, useState } from 'react';
import {
  useParams,
  useLocation,
  useNavigate,
  useOutletContext,
} from 'react-router';
import { useApiClient, useToaster, ApiClientError } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { format, parseISO } from 'date-fns';
import { RouteFormPage } from '#components/route-form-page';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { DatePicker } from '#components/date-picker';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Textarea } from '#components/ui/textarea';
import { Checkbox } from '#components/ui/checkbox';
import {
  FieldGroup,
  FieldSet,
  FieldLegend,
  Field,
  FieldLabel,
  FieldError,
} from '#components/ui/field';
import { Alert, AlertDescription } from '#components/ui/alert';
import { useResource } from '../approvals/use-resource.js';
import { createRequestId } from '../approvals/request-id.js';
import { ErrorState, Choice, Loading, Discard } from './shared.js';
import { useTrail, focusSource } from './breadcrumb.js';
import {
  keyOf,
  loadCommand,
  saveCommand,
  clearCommand,
  clearActor,
  clearOtherActors,
  type Command,
} from './journal.js';
import { FileEditor, SecureFiles, type FileRecord } from './files.js';
import { centsOf, decimalOf, validateProposal } from './model.js';
import {
  EMPTY,
  completeRecord,
  proposalOf,
  type ContractDetail,
  type ContractRecord,
  type Options,
  type Proposal,
  type Operation,
  type SourceContext,
  type LedgerDetail,
} from './types.js';
interface PendingText {
  id: string;
  fileId: string;
  version: number;
}
export default function ContractFormPage() {
  const { session } = useAuthentication(),
    params = useParams(),
    location = useLocation();
  return (
    <Form
      key={`${session?.user.id}:${params.requestId ?? 'new'}:${location.pathname}`}
      actorId={session?.user.id ?? ''}
    />
  );
}
function Form({ actorId }: { actorId: string }) {
  const { requestId: routeRequestId } = useParams(),
    location = useLocation(),
    navigate = useNavigate(),
    parent = useOutletContext<SourceContext>(),
    api = useApiClient(),
    toaster = useToaster(),
    { t, i18n } = useTranslation();
  const draftBindingKey = `oa:contracts:draft:${actorId}:${location.pathname}`;
  const [requestId, setRequestId] = useState(
    () =>
      routeRequestId ?? sessionStorage.getItem(draftBindingKey) ?? undefined,
  );
  const requestIdRef = useRef(requestId);
  const draftRecordRef = useRef<ContractRecord | undefined>(undefined);
  const submission = useRequestFormSubmission<ContractRecord>({
    replayUnknownCreate: true,
    resource: 'contractRequests',
    nameField: 'name',
  });
  const params = new URLSearchParams(location.search),
    operationValue = params.get('operation') ?? 'new',
    operation: Operation = ['new', 'change', 'renew', 'terminate'].includes(
      operationValue,
    )
      ? (operationValue as Operation)
      : 'new',
    sourceId = params.get('source') ?? '';
  const journalKey = keyOf(actorId, location.pathname, 'form'),
    bindingKey = `oa:contracts:binding:${actorId}:${requestId ?? 'new'}`;
  const [restored] = useState(() => loadCommand(journalKey, actorId)),
    commandRef = useRef<Command | null>(restored);
  const [pendingText, setPendingText] = useState<PendingText | null>(() => {
    try {
      return JSON.parse(
        sessionStorage.getItem(bindingKey) ?? 'null',
      ) as PendingText | null;
    } catch {
      return null;
    }
  });
  const [values, setValues] = useState<Proposal>(() =>
    restored?.body.input &&
    typeof restored.body.input === 'object' &&
    'proposal' in restored.body.input
      ? structuredClone(
          (restored.body.input as { proposal: Proposal }).proposal,
        )
      : restored?.body.name === 'edit'
        ? structuredClone(restored.body.input as Proposal)
        : structuredClone(EMPTY),
  );
  const [amount, setAmount] = useState(() => decimalOf(values.amountCents)),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [attempted, setAttempted] = useState(false),
    [error, setError] = useState<unknown>(),
    [busy, setBusy] = useState(false),
    [fileBusy, setFileBusy] = useState(false),
    [unknown, setUnknown] = useState(!!restored),
    [blocked, setBlocked] = useState(false),
    [base, setBase] = useState(0),
    [sourceContract, setSourceContract] = useState(sourceId);
  const lockRef = useRef(false),
    initializedRef = useRef(false),
    guard = useCloseGuard(busy || fileBusy || unknown),
    trail = useTrail(t(requestId ? 'contracts.edit' : 'contracts.new'));
  const submitGrant = useCan({
      resource: { type: 'composite', id: 'oa.contract' },
      action: 'submit',
    }),
    viewGrant = useCan({
      resource: { type: 'composite', id: 'oa.contract' },
      action: 'view',
    });
  const allowed =
    submitGrant.can && !submitGrant.isPending && !submitGrant.error;
  const options = useResource<Options>(
    allowed ? 'contractRequests/options' : null,
    { viewer: actorId },
  );
  const detail = useResource<ContractDetail>(
    requestId && viewGrant.can && !viewGrant.isPending && !viewGrant.error
      ? `contractRequests/${requestId}`
      : null,
    { viewer: actorId },
  );
  const source = useResource<LedgerDetail>(
    !requestId && operation !== 'new' && sourceContract
      ? `contracts/${sourceContract}`
      : null,
    { viewer: actorId },
  );
  const editAllowed =
    !!detail.data &&
    completeRecord(detail.data.record) &&
    detail.data.view.available.some((a) => a.name === 'edit' && a.allowed);
  const ready =
    allowed &&
    !!options.data &&
    !options.error &&
    !options.loading &&
    !blocked &&
    (!requestId ||
      ((editAllowed || !!draftRecordRef.current) && !detail.error)) &&
    (!sourceContract ||
      requestId ||
      (!!source.data && !source.error && !source.loading)) &&
    !unknown;
  const frozen = !ready || busy || fileBusy;
  useEffect(() => {
    clearOtherActors(actorId);
  }, [actorId]);
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      if (
        finalRefusal(detail.error) ||
        finalRefusal(options.error) ||
        finalRefusal(source.error) ||
        finalRefusal(error) ||
        (!viewGrant.isPending && requestId && !viewGrant.can) ||
        (!submitGrant.isPending && !submitGrant.can)
      ) {
        clearActor(actorId);
        sessionStorage.removeItem(bindingKey);
        commandRef.current = null;
        setValues(structuredClone(EMPTY));
        setAmount('');
        setPendingText(null);
        setBlocked(true);
        setUnknown(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [
    detail.error,
    options.error,
    source.error,
    error,
    actorId,
    bindingKey,
    requestId,
    viewGrant.isPending,
    viewGrant.can,
    submitGrant.isPending,
    submitGrant.can,
  ]);
  useEffect(() => {
    if (initializedRef.current || unknown || !detail.data || !requestId) return;
    const r = detail.data.record;
    if (!completeRecord(r)) return;
    initializedRef.current = true;
    queueMicrotask(() => {
      setValues(proposalOf(r));
      setAmount(decimalOf(r.amountCents));
      setBase(r.baseVersion);
      setSourceContract(r.contractId);
    });
  }, [detail.data, requestId, unknown]);
  useEffect(() => {
    if (
      requestId ||
      operation === 'new' ||
      !source.data ||
      initializedRef.current ||
      unknown
    )
      return;
    const r = source.data.contract;
    if (!['active', 'activePendingSeal'].includes(r.status)) return;
    initializedRef.current = true;
    queueMicrotask(() => {
      setBase(r.version);
      setValues({
        ...structuredClone(r.facts),
        amountCents: r.amountCents,
        reason: '',
        textVersionId: null,
        attachments: [],
      });
      setAmount(decimalOf(r.amountCents));
    });
  }, [requestId, operation, source.data, unknown]);
  useEffect(() => {
    if (!guard.dirty && !unknown) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [guard.dirty, unknown]);
  function change<K extends keyof Proposal>(key: K, value: Proposal[K]) {
    guard.changed();
    setValues((old) => {
      const next = { ...old, [key]: value };
      if (attempted) setErrors(validateProposal(next, amount));
      return next;
    });
  }
  function validate(submit = false) {
    setAttempted(true);
    const next = validateProposal(values, amount, submit);
    if (!requestId && operation !== 'new' && (!sourceContract || !source.data))
      next.source = 'required';
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first)
      requestAnimationFrame(() =>
        document.getElementById(`contract-${first}`)?.focus(),
      );
    return !first;
  }
  async function execute(wireCommand: Command) {
    saveCommand(journalKey, wireCommand);
    commandRef.current = wireCommand;
    try {
      const result = await api.request<{
        data: { record: ContractRecord } | { textVersion: PendingText };
      }>({ method: 'POST', path: wireCommand.path, json: wireCommand.body });
      clearCommand(journalKey);
      commandRef.current = null;
      setUnknown(false);
      return 'record' in result.data ? result.data.record : result.data;
    } catch (cause) {
      if (uncertainError(cause)) setUnknown(true);
      else {
        clearCommand(journalKey);
        commandRef.current = null;
        setUnknown(false);
      }
      throw cause;
    }
  }
  async function latest() {
    const { data } = await api.request<{ data: ContractDetail }>({
      path: `contractRequests/${requestIdRef.current}`,
    });
    if (!completeRecord(data.record))
      throw new Error('Complete latest proposal is unavailable');
    if (
      detail.data &&
      data.record.lifecycleVersion !== detail.data.record.lifecycleVersion
    ) {
      detail.update(data);
      throw new ApiClientError('Conflict', {
        status: 409,
        method: 'GET',
        url: `contractRequests/${requestId}`,
      });
    }
    detail.update(data);
    return data;
  }
  function nextUrl(id: string) {
    return `${trail.source}/contract/${id}`;
  }
  async function save(submit = false, retry = false) {
    submission.intent.current = submit ? 'submit' : 'save';
    if (
      lockRef.current ||
      fileBusy ||
      blocked ||
      (!retry && (!ready || !validate(submit)))
    )
      return;
    lockRef.current = true;
    setBusy(true);
    setError(undefined);
    try {
      const command = retry ? commandRef.current : null;
      let record: ContractRecord;
      if (command) {
        const response = await execute(command);
        if ('textVersion' in response) {
          setPendingText(response.textVersion);
          sessionStorage.setItem(
            bindingKey,
            JSON.stringify(response.textVersion),
          );
          return;
        }
        record = response;
        submit = command.body.name === 'submit';
      } else {
        const proposal = { ...values, amountCents: centsOf(amount)! };
        const draft = await submission.save(
          { operation, sourceContract, base, proposal },
          detail.data?.record ?? draftRecordRef.current,
          async (current) => {
            if (!current) {
              return (await execute({
                actorId,
                path: 'contractRequests',
                body: {
                  requestId: createRequestId(),
                  input: {
                    operation,
                    contractId: operation === 'new' ? null : sourceContract,
                    baseVersion: operation === 'new' ? 0 : base,
                    proposal,
                  },
                },
              })) as ContractRecord;
            }
            const fresh = await latest();
            return (await execute({
              actorId,
              path: `contractRequests/${current.id}/transition`,
              body: {
                name: 'edit',
                version: fresh.record.lifecycleVersion,
                requestId: createRequestId(),
                input: proposal,
              },
            })) as ContractRecord;
          },
        );
        rememberDraft(draft);
        record = await submission.finish(
          draft,
          async (current, key) =>
            (await execute({
              actorId,
              path: `contractRequests/${current.id}/transition`,
              body: {
                name: 'submit',
                version: current.lifecycleVersion,
                requestId: key,
                input: {},
              },
            })) as ContractRecord,
        );
      }
      rememberDraft(record);
      // Contract text must be bound to an actual request. Keep preparation in
      // the same drawer so a first save does not send the user to a detail page.
      if (!submit && !record.textVersionId) {
        guard.saved();
        parent?.reload();
        toaster.show({
          title: t('contracts.saved', {
            name: record.number ?? t('contracts.draftName'),
          }),
        });
        return;
      }
      sessionStorage.removeItem(draftBindingKey);
      guard.saved();
      parent?.reload();
      toaster.show({
        title: t(submit ? 'contracts.submitted' : 'contracts.saved', {
          name: record.number ?? t('contracts.draftName'),
        }),
      });
      await navigate(
        { pathname: nextUrl(record.id), search: trail.search },
        { replace: true },
      );
      focusSource();
    } catch (cause) {
      setError(cause);
    } finally {
      lockRef.current = false;
      setBusy(false);
    }
  }
  function rememberDraft(record: ContractRecord) {
    draftRecordRef.current = record;
    requestIdRef.current = record.id;
    initializedRef.current = true;
    sessionStorage.setItem(draftBindingKey, record.id);
    setRequestId(record.id);
  }
  async function ensureContractDraft(): Promise<string> {
    if (requestIdRef.current) return requestIdRef.current;
    if (!validate(false)) throw new Error(t('contracts.required'));
    const record = (await execute({
      actorId,
      path: 'contractRequests',
      body: {
        requestId: createRequestId(),
        input: {
          operation,
          contractId: operation === 'new' ? null : sourceContract,
          baseVersion: operation === 'new' ? 0 : base,
          proposal: { ...values, amountCents: centsOf(amount)! },
        },
      },
    })) as ContractRecord;
    rememberDraft(record);
    parent?.reload();
    return record.id;
  }
  async function bind(text: PendingText) {
    setPendingText(text);
    sessionStorage.setItem(bindingKey, JSON.stringify(text));
    const current = await latest();
    const proposal = {
      ...values,
      amountCents: centsOf(amount)!,
      textVersionId: text.id,
    };
    const record = (await execute({
      actorId,
      path: `contractRequests/${requestIdRef.current}/transition`,
      body: {
        name: 'edit',
        version: current.record.lifecycleVersion,
        requestId: createRequestId(),
        input: proposal,
      },
    })) as ContractRecord;
    draftRecordRef.current = record;
    setValues(proposalOf(record));
    setAmount(decimalOf(record.amountCents));
    sessionStorage.removeItem(bindingKey);
    setPendingText(null);
    guard.saved();
    parent?.reload();
    const { data } = await api.request<{ data: ContractDetail }>({
      path: `contractRequests/${requestIdRef.current}`,
    });
    detail.update(data);
    toaster.show({
      title: t('contracts.boundText', { version: text.version }),
    });
  }
  async function append(file: FileRecord) {
    if (!requestIdRef.current || !validate(false)) return;
    try {
      const response = (await execute({
        actorId,
        path: `contractRequests/${requestIdRef.current}/textVersions`,
        body: { fileId: file.id, requestId: createRequestId() },
      })) as { textVersion: PendingText };
      await bind(response.textVersion);
    } catch (cause) {
      setError(cause);
      throw cause;
    }
  }
  async function continueBind() {
    if (lockRef.current || !pendingText || unknown) return;
    lockRef.current = true;
    setBusy(true);
    try {
      await bind(pendingText);
    } catch (cause) {
      setError(cause);
    } finally {
      lockRef.current = false;
      setBusy(false);
    }
  }
  useMissing(
    finalRefusal(error) ? error : detail.error,
    trail.source,
    trail.search,
    parent?.reload,
    guard.saved,
  );
  const operationActual = detail.data?.record.operation ?? operation;
  const textFields = ['paymentTerms', 'reason'] as const;
  return (
    <RouteFormPage
      printable
      title={t(requestId ? 'contracts.edit' : 'contracts.new')}
    >
      <PageContainer>
        <PageHeader
          title={t(requestId ? 'contracts.edit' : 'contracts.new')}
          description={t(`contracts.operations.${operationActual}`)}
          actions={
            <>
              <Button
                variant='outline'
                type='button'
                disabled={busy || fileBusy || unknown}
                onClick={() =>
                  void navigate({
                    pathname: trail.parent,
                    search: location.search,
                  })
                }
              >
                {t('contracts.cancel')}
              </Button>
              <RequestFormButtons
                resource='oa.contract'
                form='contract-form'
                busy={busy || fileBusy}
                disabled={frozen}
                canSubmit={allowed}
                revision={detail.data?.record.status === 'revision'}
              />
            </>
          }
        />
        <RequestSubmissionFeedback
          failed={submission.submitFailed}
          unknown={submission.submitUnknown}
        />
        {error ? (
          <ErrorState
            error={error}
            retry={() => {
              detail.reload();
              source.reload();
            }}
          />
        ) : null}
        {options.error ? (
          <ErrorState error={options.error} retry={options.reload} />
        ) : null}
        {detail.error ? (
          <ErrorState error={detail.error} retry={detail.reload} />
        ) : null}
        {source.error ? (
          <ErrorState error={source.error} retry={source.reload} />
        ) : null}
        {blocked || (!submitGrant.isPending && !allowed) ? (
          <Alert>
            <AlertDescription>{t('contracts.noAccess')}</AlertDescription>
          </Alert>
        ) : (options.loading && !options.data) ||
          (requestId &&
            detail.loading &&
            !detail.data &&
            !draftRecordRef.current) ? (
          <Loading fields={10} />
        ) : (
          <form
            id='contract-form'
            onSubmitCapture={submission.captureIntent}
            onKeyDown={preventComposingSubmit}
            className='flex max-w-3xl flex-col gap-6'
            onSubmit={(event) => {
              event.preventDefault();
              void save(submission.intent.current === 'submit');
            }}
          >
            <FieldGroup inert={submission.submitUnknown || undefined}>
              {!requestId && operation !== 'new' ? (
                <Field>
                  <FieldLabel htmlFor='contract-source'>
                    {t('contracts.sourceContract')} *
                  </FieldLabel>
                  <Choice
                    id='contract-source'
                    label={t('contracts.sourceContract')}
                    value={sourceContract}
                    disabled={busy || unknown}
                    items={(options.data?.contracts ?? []).map((c) => ({
                      value: c.id,
                      label: `${c.number ?? t('contracts.draftName')} · ${t('contracts.version')} ${c.version}`,
                    }))}
                    onChange={(id) => {
                      initializedRef.current = false;
                      setSourceContract(id);
                      guard.changed();
                    }}
                  />
                  <p className='text-sm text-muted-foreground'>
                    {t('contracts.sourceVersion')}: {base || '—'}
                  </p>
                </Field>
              ) : null}
              <FieldSet>
                <FieldLegend>{t('contracts.proposal')}</FieldLegend>
                <FieldGroup inert={submission.submitUnknown || undefined}>
                  <Field data-invalid={!!errors.contractType}>
                    <FieldLabel htmlFor='contract-contractType'>
                      {t('contracts.contractType')} *
                    </FieldLabel>
                    <Choice
                      id='contract-contractType'
                      label={t('contracts.contractType')}
                      value={values.contractType}
                      disabled={frozen}
                      invalid={!!errors.contractType}
                      items={(options.data?.contractTypes ?? [])
                        .filter((c) => c.active)
                        .map((c) => ({
                          value: c.code,
                          label:
                            c.label[i18n.language] ??
                            c.label['zh-CN'] ??
                            c.code,
                        }))}
                      onChange={(value) => change('contractType', value)}
                    />
                    {errors.contractType && (
                      <FieldError>
                        {t(`contracts.${errors.contractType}`)}
                      </FieldError>
                    )}
                  </Field>
                  <div className='grid gap-4 sm:grid-cols-[8rem_1fr]'>
                    <Field>
                      <FieldLabel htmlFor='contract-counterpartyKind'>
                        {t('contracts.counterpartyKind')} *
                      </FieldLabel>
                      <Choice
                        id='contract-counterpartyKind'
                        label={t('contracts.counterpartyKind')}
                        value={values.counterparty.kind}
                        disabled={frozen}
                        items={['customer', 'vendor'].map((v) => ({
                          value: v,
                          label: t(`contracts.${v}`),
                        }))}
                        onChange={(kind) =>
                          change(
                            'counterparty',
                            kind === 'vendor'
                              ? {
                                  kind: 'vendor',
                                  id: '',
                                  name: '',
                                  category: '',
                                }
                              : { kind: 'customer', name: '' },
                          )
                        }
                      />
                    </Field>
                    <Field data-invalid={!!errors.counterparty}>
                      <FieldLabel htmlFor='contract-counterparty'>
                        {t('contracts.counterparty')} *
                      </FieldLabel>
                      {values.counterparty.kind === 'vendor' ? (
                        <Choice
                          id='contract-counterparty'
                          label={t('contracts.counterparty')}
                          disabled={frozen}
                          invalid={!!errors.counterparty}
                          value={values.counterparty.id}
                          items={(options.data?.vendors ?? []).map((v) => ({
                            value: v.id,
                            label: v.name,
                          }))}
                          onChange={(id) => {
                            const v = options.data?.vendors.find(
                              (v) => v.id === id,
                            );
                            if (v)
                              change('counterparty', { kind: 'vendor', ...v });
                          }}
                        />
                      ) : (
                        <Input
                          id='contract-counterparty'
                          disabled={frozen}
                          aria-invalid={!!errors.counterparty}
                          maxLength={255}
                          value={values.counterparty.name}
                          onChange={(e) =>
                            change('counterparty', {
                              kind: 'customer',
                              name: e.target.value,
                            })
                          }
                        />
                      )}
                      {errors.counterparty && (
                        <FieldError>
                          {t(`contracts.${errors.counterparty}`)}
                        </FieldError>
                      )}
                    </Field>
                  </div>
                  <Field data-invalid={!!errors.amountCents}>
                    <FieldLabel htmlFor='contract-amountCents'>
                      {t('contracts.amountCents')} *
                    </FieldLabel>
                    <Input
                      id='contract-amountCents'
                      inputMode='decimal'
                      disabled={frozen}
                      aria-invalid={!!errors.amountCents}
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        guard.changed();
                        if (attempted)
                          setErrors(validateProposal(values, e.target.value));
                      }}
                    />
                    {errors.amountCents && (
                      <FieldError>
                        {t(`contracts.${errors.amountCents}`)}
                      </FieldError>
                    )}
                  </Field>
                  <div className='grid gap-4 sm:grid-cols-2'>
                    {(['startsOn', 'endsOn'] as const).map((key) => (
                      <Field key={key} data-invalid={!!errors[key]}>
                        <FieldLabel htmlFor={`contract-${key}`}>
                          {t(`contracts.${key}`)} *
                        </FieldLabel>
                        <DatePicker
                          id={`contract-${key}`}
                          className='w-full'
                          value={
                            values[key] ? parseISO(values[key]) : undefined
                          }
                          onChange={(date) =>
                            change(key, date ? format(date, 'yyyy-MM-dd') : '')
                          }
                          disabled={frozen}
                          invalid={!!errors[key]}
                        />
                        {errors[key] && (
                          <FieldError>
                            {t(`contracts.${errors[key]}`)}
                          </FieldError>
                        )}
                      </Field>
                    ))}
                  </div>
                  {textFields.map((key) => (
                    <Field key={key} data-invalid={!!errors[key]}>
                      <FieldLabel htmlFor={`contract-${key}`}>
                        {t(`contracts.${key}`)}
                        {requestId ? ' *' : ''}
                      </FieldLabel>
                      <Textarea
                        id={`contract-${key}`}
                        value={values[key]}
                        maxLength={key === 'paymentTerms' ? 10000 : 5000}
                        disabled={frozen}
                        aria-invalid={!!errors[key]}
                        onChange={(e) => change(key, e.target.value)}
                      />
                      {errors[key] && (
                        <FieldError>{t(`contracts.${errors[key]}`)}</FieldError>
                      )}
                    </Field>
                  ))}
                  <Field orientation='horizontal'>
                    <Checkbox
                      id='contract-standardTemplate'
                      checked={values.standardTemplate}
                      disabled={frozen}
                      onCheckedChange={(v) => change('standardTemplate', v)}
                    />
                    <FieldLabel htmlFor='contract-standardTemplate'>
                      {t('contracts.standardTemplate')}
                    </FieldLabel>
                  </Field>
                </FieldGroup>
              </FieldSet>
              <>
                <FieldSet>
                  <FieldLegend>{t('contracts.textVersionId')}</FieldLegend>
                  <FieldGroup inert={submission.submitUnknown || undefined}>
                    {pendingText ? (
                      <>
                        <Alert>
                          <AlertDescription>
                            {t('contracts.bindText')}
                          </AlertDescription>
                        </Alert>
                        <Button
                          type='button'
                          variant='outline'
                          disabled={frozen}
                          onClick={() => void continueBind()}
                        >
                          {t('contracts.bindText')}
                        </Button>
                      </>
                    ) : (
                      <FileEditor
                        requestId={requestId}
                        ensureRequest={ensureContractDraft}
                        purpose='text'
                        disabled={frozen}
                        onBusy={setFileBusy}
                        onChoose={append}
                      />
                    )}
                    <div id='contract-textVersionId' tabIndex={-1}>
                      {errors.textVersionId && (
                        <FieldError>
                          {t(`contracts.${errors.textVersionId}`)}
                        </FieldError>
                      )}
                      {requestId ? (
                        <SecureFiles
                          requestId={requestId}
                          text
                          refreshKey={detail.data?.record.lifecycleVersion ?? 0}
                        />
                      ) : null}
                    </div>
                  </FieldGroup>
                </FieldSet>
                <FieldSet>
                  <FieldLegend>{t('contracts.attachments')}</FieldLegend>
                  <FieldGroup inert={submission.submitUnknown || undefined}>
                    <FileEditor
                      requestId={requestId}
                      ensureRequest={ensureContractDraft}
                      purpose='evidence'
                      disabled={frozen || values.attachments.length >= 10}
                      onBusy={setFileBusy}
                      onChoose={async (file) =>
                        change('attachments', [
                          ...new Set([...values.attachments, file.id]),
                        ])
                      }
                    />
                    {requestId ? (
                      <SecureFiles
                        requestId={requestId}
                        ids={values.attachments}
                      />
                    ) : null}
                    {values.attachments.map((id, index) => (
                      <Button
                        key={id}
                        type='button'
                        variant='outline'
                        disabled={frozen}
                        onClick={() => {
                          change(
                            'attachments',
                            values.attachments.filter((v) => v !== id),
                          );
                          document
                            .getElementById('contract-file-evidence')
                            ?.focus();
                        }}
                      >
                        {t('contracts.removeFile', {
                          name: String(index + 1),
                        })}
                      </Button>
                    ))}
                  </FieldGroup>
                </FieldSet>
              </>
            </FieldGroup>
            {unknown ? (
              <Alert>
                <AlertDescription>{t('contracts.unknown')}</AlertDescription>
                <Button
                  type='button'
                  variant='outline'
                  disabled={busy}
                  onClick={() => void save(false, true)}
                >
                  {t('contracts.retryExact')}
                </Button>
              </Alert>
            ) : null}
          </form>
        )}
        <Discard guard={guard} />
      </PageContainer>
    </RouteFormPage>
  );
}
