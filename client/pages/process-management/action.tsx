import { useProcessText } from './text.js';
import { useContext, useEffect, useId, useRef, useState } from 'react';
import { useParams, useLocation } from 'react-router';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { RouteDialog } from '#components/route-dialog';
import { useRouteOverlay } from '#components/use-route-overlay';
import { PageContainer } from '#components/page-container';
import { ApplicationSearch } from '#components/application-search';
import { Button } from '#components/ui/button';
import { Label } from '#components/ui/label';
import { Textarea } from '#components/ui/textarea';
import { Alert, AlertDescription } from '#components/ui/alert';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import { createRequestKey } from '#lib/request-key';
import { useExecution } from './execution-context.js';
import { ProcessListContext } from './resource.js';
import { Failure } from './shared.js';
import type { DetailDto } from '../../../server/routes/process-management/schemas.js';
type Options = {
  version: number;
  taskId: string;
  runId: string;
  contentHash: string;
  places?: string[];
  people: { id: string; name: string }[];
  nextOffset: number | null;
};
export default function ProcessActionPage() {
  const resource = useExecution(),
    { actionName = '', taskId = '' } = useParams();
  return (
    <ActionFrame
      key={`${resource.identity}:${actionName}:${taskId}`}
      action={actionName}
      taskId={taskId}
    />
  );
}
function ActionFrame({ action, taskId }: { action: string; taskId: string }) {
  const resource = useExecution(),
    detail = resource.data?.data,
    { t } = useTranslation(),
    text = useProcessText();
  const [busy, setBusy] = useState(false),
    [blocked, setBlocked] = useState(true),
    formId = useId();
  const busyRef = useRef(false),
    location = useLocation();
  const label =
    detail?.record.number ??
    `${text.name(detail?.record.kind ?? '')} · ${detail?.record.recordLabel ?? ''}`;
  return (
    <RouteDialog
      title={t(
        action === 'appoint'
          ? 'processManagement.appointTitle'
          : 'processManagement.reassignTitle',
        { recordLabel: label },
      )}
      closeTo={{
        pathname: location.pathname.replace(/\/actions\/[^/]+\/[^/]+$/, ''),
        search: location.search,
        hash: location.hash,
      }}
      beforeClose={() => !busyRef.current}
      footer={
        <ActionFooter
          action={action}
          busy={busy}
          blocked={blocked}
          formId={formId}
        />
      }
    >
      <ActionForm
        action={action}
        taskId={taskId}
        busy={busy}
        onBusy={(value) => {
          busyRef.current = value;
          setBusy(value);
        }}
        onBlocked={setBlocked}
        formId={formId}
        label={label}
      />
    </RouteDialog>
  );
}
function ActionForm({
  action,
  taskId,
  busy,
  onBusy,
  onBlocked,
  formId,
  label,
}: {
  action: string;
  taskId: string;
  busy: boolean;
  onBusy: (busy: boolean) => void;
  onBlocked: (blocked: boolean) => void;
  formId: string;
  label: string;
}) {
  const resource = useExecution(),
    api = useApiClient(),
    { t } = useTranslation(),
    { close } = useRouteOverlay(),
    toaster = useToaster(),
    reloadList = useContext(ProcessListContext);
  const detail = resource.data?.data;
  const path = `processManagement/executions/${encodeURIComponent(detail?.record.kind ?? '')}/${encodeURIComponent(detail?.record.id ?? '')}`;
  const [search, setSearch] = useState(''),
    [offset, setOffset] = useState(0),
    [options, setOptions] = useState<Options>(),
    [loadError, setLoadError] = useState<unknown>(),
    [loading, setLoading] = useState(true),
    [retry, setRetry] = useState(0);
  const [place, setPlace] = useState('');
  const [to, setTo] = useState(''),
    [reason, setReason] = useState(''),
    [validated, setValidated] = useState(false),
    [writeError, setWriteError] = useState<string>();
  const activeRef = useRef(true),
    requestIdRef = useRef(createRequestKey()),
    reasonRef = useRef<HTMLTextAreaElement>(null),
    personRef = useRef<HTMLButtonElement>(null),
    placeRef = useRef<HTMLButtonElement>(null),
    id = useId();
  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);
  useEffect(() => {
    if (!detail) return;
    const abort = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      setLoadError(undefined);
      api
        .request<{ data: Options }>({
          path: `${path}/managementOptions`,
          method: 'POST',
          json: { action, taskId, search, offset, limit: 20 },
          signal: abort.signal,
        })
        .then(
          (result) => {
            if (abort.signal.aborted) return;
            setOptions((old) => ({
              ...result.data,
              people:
                offset && old
                  ? [...old.people, ...result.data.people]
                  : result.data.people,
            }));
            setLoading(false);
          },
          (error: unknown) => {
            if (!abort.signal.aborted) {
              setLoadError(error);
              setOptions(undefined);
              setLoading(false);
            }
          },
        );
    }, 300);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [api, path, action, taskId, search, offset, retry, detail]);
  useEffect(
    () =>
      onBlocked(
        loading || !options || Boolean(loadError) || Boolean(writeError),
      ),
    [loading, options, loadError, writeError, onBlocked],
  );
  async function submit() {
    setValidated(true);
    if (!to) {
      personRef.current?.focus();
      return;
    }
    if ((options?.places?.length ?? 0) > 1 && !place) {
      placeRef.current?.focus();
      return;
    }
    if (!reason.trim()) {
      reasonRef.current?.focus();
      return;
    }
    if (
      !options ||
      busy ||
      loading ||
      ((options.places?.length ?? 0) > 1 && !place)
    )
      return;
    onBusy(true);
    setWriteError(undefined);
    try {
      const result = await api.request<{ data: { detail: DetailDto } }>({
        path: `${path}/managementActions`,
        method: 'POST',
        json: {
          action,
          taskId,
          runId: options.runId,
          contentHash: options.contentHash,
          expectedVersion: options.version,
          to,
          place: place || undefined,
          reason,
          requestId: requestIdRef.current,
        },
      });
      if (!activeRef.current) return;
      resource.update({ data: result.data.detail });
      reloadList();
      onBusy(false);
      toaster.show({
        type: 'success',
        title: t(
          action === 'appoint'
            ? 'processManagement.appointed'
            : 'processManagement.reassigned',
          { recordLabel: label },
        ),
      });
      await close();
    } catch (error) {
      if (activeRef.current) {
        setWriteError(
          error instanceof ApiClientError && error.status === 409
            ? 'stale'
            : error instanceof ApiClientError
              ? 'submitFailed'
              : 'unknown',
        );
        resource.reload();
      }
    } finally {
      if (activeRef.current) onBusy(false);
    }
  }
  return (
    <PageContainer>
      <form
        id={formId}
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className='flex flex-col gap-4'
      >
        {Boolean(loadError) && (
          <Failure error={loadError} retry={() => setRetry((v) => v + 1)} />
        )}
        {writeError && (
          <Alert variant='destructive'>
            <AlertDescription>
              {t(`processManagement.${writeError}`)}
              <Button
                type='button'
                variant='outline'
                disabled={busy}
                onClick={() => {
                  setWriteError(undefined);
                  setRetry((v) => v + 1);
                  setTo('');
                }}
              >
                {t('processManagement.refresh')}
              </Button>
            </AlertDescription>
          </Alert>
        )}
        <ApplicationSearch
          value={search}
          onChange={(event) => {
            setTo('');
            setPlace('');
            setSearch(event.target.value);
            setOffset(0);
          }}
          placeholder={t('processManagement.peopleSearch')}
          disabled={busy}
        />
        <div className='flex flex-col gap-2'>
          <Label htmlFor={`${id}-person`}>
            {t('processManagement.person')} *
          </Label>
          <Select value={to} onValueChange={(value) => setTo(value ?? '')}>
            <SelectTrigger
              ref={personRef}
              id={`${id}-person`}
              disabled={busy || loading || !options?.people.length}
              aria-invalid={validated && !to}
            >
              <SelectValue
                placeholder={t(
                  loading
                    ? 'processManagement.loading'
                    : 'processManagement.person',
                )}
              >
                {options?.people.find((person) => person.id === to)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
              <SelectGroup>
                {options?.people.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {validated && !to && (
            <p className='text-sm text-destructive'>
              {t('processManagement.personRequired')}
            </p>
          )}
          {!loading && options && !options.people.length && (
            <p className='text-sm text-muted-foreground'>
              {t('processManagement.noPeople')}
            </p>
          )}
          {options?.nextOffset !== null &&
            options?.nextOffset !== undefined && (
              <Button
                variant='outline'
                type='button'
                disabled={loading || busy}
                onClick={() => setOffset(options.nextOffset!)}
              >
                {t('processManagement.loadMore')}
              </Button>
            )}
        </div>
        {(options?.places?.length ?? 0) > 1 && (
          <div className='flex flex-col gap-2'>
            <Label htmlFor={`${id}-place`}>
              {t('processManagement.place')} *
            </Label>
            <Select
              value={place}
              onValueChange={(value) => setPlace(value ?? '')}
            >
              <SelectTrigger
                disabled={busy || loading}
                ref={placeRef}
                id={`${id}-place`}
                aria-label={t('processManagement.place')}
                aria-invalid={validated && !place}
              >
                <SelectValue placeholder={t('processManagement.place')} />
              </SelectTrigger>
              <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                <SelectGroup>
                  {options?.places?.map((key, i) => (
                    <SelectItem key={key} value={key}>
                      {t('processManagement.placeNumber', { number: i + 1 })}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {validated && !place && (
              <p className='text-sm text-destructive'>
                {t('processManagement.placeRequired')}
              </p>
            )}
          </div>
        )}
        <div className='flex flex-col gap-2'>
          <Label htmlFor={`${id}-reason`}>
            {t('processManagement.reason')} *
          </Label>
          <Textarea
            ref={reasonRef}
            id={`${id}-reason`}
            disabled={busy}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            aria-invalid={validated && !reason.trim()}
          />
          {validated && !reason.trim() && (
            <p className='text-sm text-destructive'>
              {t('processManagement.reasonRequired')}
            </p>
          )}
        </div>
      </form>
    </PageContainer>
  );
}

function ActionFooter({
  action,
  busy,
  blocked,
  formId,
}: {
  action: string;
  busy: boolean;
  blocked: boolean;
  formId: string;
}) {
  const { t } = useTranslation(),
    { close } = useRouteOverlay();
  return (
    <div className='flex justify-end gap-2'>
      <Button variant='outline' disabled={busy} onClick={() => void close()}>
        {t('processManagement.cancel')}
      </Button>
      <Button type='submit' form={formId} disabled={busy || blocked}>
        {t(
          busy
            ? 'processManagement.loading'
            : action === 'appoint'
              ? 'processManagement.appoint'
              : 'processManagement.reassign',
        )}
      </Button>
    </div>
  );
}
