import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import {
  useApiClient,
  useToaster,
  useNavigationGuard,
} from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { RouteFormPage } from '#components/route-form-page';
import { PageContainer } from '#components/page-container';
import { FormActions } from '#components/form-actions';
import { Button } from '#components/ui/button';
import { Badge } from '#components/ui/badge';
import { Input } from '#components/ui/input';
import { Textarea } from '#components/ui/textarea';
import { Field, FieldLabel, FieldError } from '#components/ui/field';
import { Alert, AlertDescription } from '#components/ui/alert';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '#components/ui/alert-dialog';
import { LongText } from '#components/long-text';
import { BusinessAttachmentList } from '#components/business-attachment-list';
import { FileUploadInput } from '#components/file-upload-input';
import { DateTimePicker } from '#components/date-time-picker';
import { useBusinessResource } from '#hooks/use-business-resource';
import { createRequestKey } from '#lib/request-key';
import { fieldViolationsOf, statusOf } from '../platform/shared/errors.js';
import { Failure, Loading } from '../work-items/states.js';
import { OptionSelect } from '../work-items/select.js';
import type { Item } from './index.js';
interface Handling {
  references?: {
    key: string;
    kind: string;
    readable: boolean;
    number?: string;
    status?: string;
    path?: string;
  }[];
  securityTargets?: { id: string; title: string }[];
  hasMoreHistory: boolean;
  internalFiles: string[];
  groups: {
    id: string;
    title: string;
    candidates: { id: string; name: string }[];
  }[];
  categories: { code: string; label: unknown }[];
  assigneeLabel: string | null;
  actions: string[];
  full: boolean;
  internal: boolean;
  candidates: { id: string; name: string }[];
  events: {
    id: string;
    type: string;
    visibility: string;
    createdAt: string;
    data: Record<string, unknown>;
  }[];
  clocks: {
    consumed: number;
    response: number;
    paused: number;
    acceptance: number;
    waiting: number;
  } | null;
}
const fields: Record<string, string[]> = {
  transferSecurity: ['groupId', 'reason'],
  link: ['sourceId', 'reason'],
  requestSupplement: ['reason'],
  supplement: ['message'],
  triage: ['priority', 'advice', 'category', 'groupId', 'reason', 'assigneeId'],
  assign: ['assigneeId', 'reason'],
  release: ['reason'],
  comment: ['message', 'advice'],
  internal: ['message'],
  wait: ['reason', 'party', 'followUpAt', 'pauseRequested'],
  approvePause: ['reason'],
  resume: ['reason'],
  resolve: ['cause', 'solution', 'completion', 'resultType'],
  accept: ['rating', 'evaluation'],
  return: ['reason'],
  rate: ['rating', 'evaluation'],
  cancel: ['reason'],
  reviewCancel: ['approve', 'reason'],
  duplicate: ['mainId', 'reason'],
  manageClose: ['reason', 'completion'],
  priority: ['priority', 'reason'],
};
export function HandlingDetail({
  row,
  onChange,
  onClose,
}: {
  row: Item;
  onChange: (r: Item) => void;
  onClose: () => void;
}) {
  const sourcePage = useCan({
    resource: { type: 'page', id: 'oa.approvals' },
    action: 'access',
  });
  const { t, i18n } = useTranslation(),
    api = useApiClient(),
    toast = useToaster(),
    navigate = useNavigate(),
    location = useLocation();
  const [params, setParams] = useSearchParams(),
    action = params.get('repairAction') ?? '';
  const [historyPage, setHistoryPage] = useState(1);
  const context = useBusinessResource<{ data: Handling }>(
    `itRepairs/${row.id}/handling`,
    { historyPage: String(historyPage) },
  );
  const [files, setFiles] = useState<
    { id: string; filename: string; ext: string; contentUrl: string }[]
  >([]);
  async function loadFiles() {
    const result = await api.request<{ data: typeof files }>({
      method: 'POST',
      path: 'itRepairAttachments/findMany',
      headers: { 'x-repair-id': row.id },
      json: { limit: 100 },
    });
    setFiles(result.data);
  }
  const [chosen, setChosen] = useState('none'),
    [data, setData] = useState<Record<string, string | number | boolean>>({}),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(),
    [confirm, setConfirm] = useState(false),
    [needsReload, setNeedsReload] = useState(false);
  const keyRef = useRef(createRequestKey()),
    payloadRef = useRef(''),
    leavingRef = useRef(false);
  const [fileVisibility, setFileVisibility] = useState('public');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const uploadRef = useRef<{
    file: File;
    key: string;
    version: number;
    visibility: string;
  } | null>(null);
  const [search, setSearch] = useState(''),
    [matches, setMatches] = useState<
      {
        id: string;
        kind: string;
        number: string | null;
        title: string | null;
      }[]
    >([]),
    [searching, setSearching] = useState(false),
    [sourceCursor, setSourceCursor] = useState<string | null>(null);
  async function findSources(more = false) {
    setSearching(true);
    try {
      const result = await api.request<{
        data: typeof matches;
        meta: { nextCursor: string | null };
      }>({
        path: 'requestSearch',
        query: {
          q: search,
          pageSize: 50,
          ...(more && sourceCursor ? { cursor: sourceCursor } : {}),
        },
      });
      setSourceCursor(result.meta.nextCursor);
      setMatches((previous) => [
        ...(more ? previous : []),
        ...result.data.filter((r) =>
          action === 'duplicate'
            ? r.kind === 'oa.itRepair' && r.id !== row.id
            : ['oa.purchase', 'oa.expensePlan'].includes(r.kind),
        ),
      ]);
    } catch (e) {
      setError(e);
    } finally {
      setSearching(false);
    }
  }

  const tr = (key: string, options?: Record<string, unknown>) =>
    t(`itRepairs.${key}`, options);
  useNavigationGuard(() => {
    if (leavingRef.current) return true;
    if (busy) return false;
    return (
      !Object.keys(data).length ||
      !action ||
      window.confirm(tr('discardChanges'))
    );
  });
  async function refresh() {
    const result = await api.request<{ data: Item }>({
      path: `itRepairs/${row.id}`,
    });
    onChange(result.data);
    context.reload();
    setNeedsReload(false);
  }
  useEffect(() => {
    void Promise.resolve().then(refresh).catch(setError);
    void Promise.resolve()
      .then(loadFiles)
      .catch(() => setFiles([]));
    leavingRef.current = false;
    keyRef.current = createRequestKey();
  }, [action, row.id]); // eslint-disable-line react-hooks/exhaustive-deps, @eslint-react/exhaustive-deps -- action changes remount the form; async callbacks use the current record.
  const update = (name: string, value: string | number | boolean) => {
    setData((old) => ({ ...old, [name]: value }));
    setError(undefined);
  };
  function closeAction() {
    leavingRef.current = true;
    const next = new URLSearchParams(params);
    next.delete('repairAction');
    setParams(next, { replace: true });
    setData({});
  }
  async function submit() {
    if (busy || needsReload) return;
    setBusy(true);
    setError(undefined);
    const json = JSON.stringify({ action, data });
    if (payloadRef.current !== json) {
      keyRef.current = createRequestKey();
      payloadRef.current = json;
    }
    try {
      const result = await api.request<{ data: Item }>({
        method: 'POST',
        path: `itRepairs/${row.id}/actions`,
        json: {
          action,
          data: {
            ...data,
            ...(action === 'comment' && data.advice ? { effective: true } : {}),
          },
          requestKey: keyRef.current,
          expectedVersion: row.version,
        },
      });
      if (action === 'transferSecurity') {
        leavingRef.current = true;
        setFiles([]);
        setData({});
        onClose();
        toast.show({
          title: tr('securityTransferred', { number: row.number }),
          type: 'success',
        });
        return;
      }
      onChange(result.data);
      context.reload();
      closeAction();
      toast.show({ title: tr('actionSaved'), type: 'success' });
    } catch (e) {
      setError(e);
      if (statusOf(e) === 409) setNeedsReload(true);
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  }
  const invalid = fieldViolationsOf(error).map((v) => v);
  useEffect(() => {
    const name = fieldViolationsOf(error)[0];
    if (name) document.getElementById(`handling-${name}`)?.focus();
  }, [error]);
  const required = (name: string) =>
    !['evaluation', 'pauseRequested'].includes(name) &&
    !(name === 'rating' && action === 'accept') &&
    !(
      action === 'triage' &&
      ['category', 'groupId', 'reason', 'assigneeId'].includes(name)
    ) &&
    !(action === 'comment' && name === 'advice');
  const destructive = [
    'cancel',
    'duplicate',
    'manageClose',
    'transferSecurity',
  ].includes(action);
  const format = (value: string) =>
    new Date(value).toLocaleString(i18n.language);
  function eventLines(event: Handling['events'][number]): [string, string][] {
    if (event.type === 'alert')
      return [[tr('reminder'), tr('reminderDetails')]];
    if (event.type === 'sourceChange')
      return [
        [
          tr('sourceProgress'),
          tr(
            `sourceStates.${['draft', 'head', 'purchasing', 'exception', 'finance', 'executive', 'gm', 'revision', 'terminated', 'awaitingReceipt', 'approved', 'rejected', 'withdrawn', 'cancelled', 'received', 'accepted'].includes(String(event.data.status)) ? String(event.data.status) : 'pending'}`,
          ),
        ],
      ];
    const known = [
      'reason',
      'message',
      'advice',
      'priority',
      'party',
      'followUpAt',
      'pauseRequested',
      'cause',
      'solution',
      'completion',
      'resultType',
      'rating',
      'evaluation',
      'approve',
    ];
    return known.flatMap((name) => {
      const value = event.data[name];
      if (value === undefined || value === null || value === '') return [];
      const formatted =
        name === 'followUpAt' && typeof value === 'string'
          ? format(value)
          : ['party', 'resultType'].includes(name) && typeof value === 'string'
            ? tr(`handlingOptions.${value}`)
            : typeof value === 'boolean'
              ? tr(`handlingOptions.${value}`)
              : typeof value === 'string' || typeof value === 'number'
                ? String(value)
                : '';
      return formatted
        ? [[tr(`handlingFields.${name}`), formatted] as [string, string]]
        : [];
    });
  }
  async function upload(file: File) {
    if (
      !uploadRef.current ||
      uploadRef.current.file !== file ||
      uploadRef.current.visibility !== fileVisibility
    )
      uploadRef.current = {
        file,
        key: createRequestKey(),
        version: row.version,
        visibility: fileVisibility,
      };
    setSelectedFile(file);
    setBusy(true);
    setError(undefined);
    try {
      const body = new FormData();
      body.set('file', file);
      await api.request({
        method: 'POST',
        path: `itRepairs/${row.id}/upload`,
        headers: {
          'x-request-key': uploadRef.current.key,
          'x-expected-version': String(uploadRef.current.version),
          'x-file-purpose': context.data?.data.internal
            ? 'processing'
            : 'fault',
          'x-file-visibility':
            fileVisibility === 'internal' ? 'internal' : 'public',
        },
        body,
      });
      await refresh();
      await loadFiles();
      setSelectedFile(null);
      uploadRef.current = null;
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <RouteFormPage
      title={`${row.number} · ${action ? tr(`actions.${action}`) : row.title}`}
      beforeClose={() =>
        !busy &&
        (!Object.keys(data).length || window.confirm(tr('discardChanges')))
      }
    >
      <PageContainer>
        {context.loading && !context.data ? (
          <Loading />
        ) : context.error ? (
          <Failure
            error={context.error}
            module='itRepairs'
            retry={context.reload}
          />
        ) : (
          <>
            {error ? <Failure error={error} module='itRepairs' /> : null}
            {needsReload ? (
              <Button
                variant='outline'
                disabled={busy}
                onClick={() => void refresh().catch(setError)}
              >
                {tr('reloadLatest')}
              </Button>
            ) : null}
            {action ? (
              <form
                id='repair-action-form'
                className='flex flex-col gap-4'
                onSubmit={(event) => {
                  event.preventDefault();
                  if (destructive) setConfirm(true);
                  else void submit();
                }}
              >
                <p>{tr('actionContext', { number: row.number })}</p>
                {(fields[action] ?? []).map((name) => (
                  <Field key={name}>
                    <FieldLabel htmlFor={`handling-${name}`}>
                      {tr(
                        action === 'transferSecurity' && name === 'groupId'
                          ? 'query.groupId'
                          : `handlingFields.${name}`,
                      )}
                      {required(name) ? (
                        <span aria-hidden='true'> *</span>
                      ) : null}
                    </FieldLabel>
                    {['groupId', 'category'].includes(name) ? (
                      <OptionSelect
                        id={`handling-${name}`}
                        invalid={invalid.includes(name)}
                        value={String(data[name] ?? 'none')}
                        disabled={busy}
                        onChange={(v) => {
                          update(name, v === 'none' ? '' : v);
                          if (name === 'groupId' && action === 'triage')
                            update('assigneeId', '');
                        }}
                        options={[
                          { value: 'none', label: tr('options.none') },
                          ...(name === 'groupId'
                            ? (action === 'transferSecurity'
                                ? (context.data?.data.securityTargets ?? [])
                                : (context.data?.data.groups ?? [])
                              ).map((g) => ({
                                value: g.id,
                                label: g.title,
                              }))
                            : (context.data?.data.categories ?? []).map(
                                (c) => ({
                                  value: c.code,
                                  label:
                                    typeof c.label === 'string'
                                      ? c.label
                                      : c.code,
                                }),
                              )),
                        ]}
                      />
                    ) : name === 'assigneeId' ? (
                      <OptionSelect
                        id={`handling-${name}`}
                        invalid={invalid.includes(name)}
                        disabled={busy}
                        value={String(data[name] ?? 'none')}
                        onChange={(v) => update(name, v === 'none' ? '' : v)}
                        options={[
                          { value: 'none', label: tr('options.none') },
                          ...(
                            context.data?.data.groups?.find(
                              (g) => g.id === data.groupId,
                            )?.candidates ??
                            context.data?.data.candidates ??
                            []
                          ).map((u) => ({
                            value: u.id,
                            label: u.name,
                          })),
                        ]}
                      />
                    ) : [
                        'priority',
                        'party',
                        'resultType',
                        'rating',
                        'approve',
                        'pauseRequested',
                      ].includes(name) ? (
                      <OptionSelect
                        id={`handling-${name}`}
                        invalid={invalid.includes(name)}
                        disabled={busy}
                        value={String(data[name] ?? 'none')}
                        onChange={(v) =>
                          update(
                            name,
                            name === 'rating'
                              ? Number(v)
                              : ['approve', 'pauseRequested'].includes(name)
                                ? v === 'true'
                                : v,
                          )
                        }
                        options={[
                          { value: 'none', label: tr('options.none') },
                          ...(
                            {
                              priority: ['P1', 'P2', 'P3', 'P4'],
                              party: [
                                'employee',
                                'vendor',
                                'purchase',
                                'authorization',
                                'internal',
                              ],
                              resultType: [
                                'restored',
                                'alternative',
                                'otherService',
                              ],
                              rating: ['1', '2', '3', '4', '5'],
                              approve: ['true', 'false'],
                              pauseRequested: ['true', 'false'],
                            }[name] ?? []
                          ).map((v) => ({
                            value: v,
                            label:
                              name === 'priority' || name === 'rating'
                                ? v
                                : tr(`handlingOptions.${v}`),
                          })),
                        ]}
                      />
                    ) : name === 'followUpAt' ? (
                      <DateTimePicker
                        id={`handling-${name}`}
                        invalid={invalid.includes(name)}
                        disabled={busy}
                        value={String(data[name] ?? '')}
                        onChange={(v) => update(name, v)}
                        timeZone='Asia/Singapore'
                        timeLabel={tr('time')}
                      />
                    ) : ['mainId', 'sourceId'].includes(name) ? (
                      <div className='flex flex-col gap-2'>
                        <Input
                          aria-label={tr('sourceQuery')}
                          value={search}
                          onChange={(e) => {
                            setSearch(e.target.value);
                            setSourceCursor(null);
                          }}
                        />
                        <Button
                          type='button'
                          variant='outline'
                          disabled={
                            busy || searching || search.trim().length < 2
                          }
                          onClick={() => void findSources()}
                        >
                          {tr('findSources')}
                        </Button>
                        {sourceCursor ? (
                          <Button
                            type='button'
                            variant='outline'
                            disabled={searching}
                            onClick={() => void findSources(true)}
                          >
                            {tr('moreSources')}
                          </Button>
                        ) : null}
                        <OptionSelect
                          id={`handling-${name}`}
                          invalid={invalid.includes(name)}
                          value={String(data[name] ?? 'none')}
                          onChange={(v) => {
                            const match = matches.find((r) => r.id === v);
                            update(name, v);
                            if (name === 'sourceId' && match)
                              update(
                                'kind',
                                match.kind === 'oa.purchase'
                                  ? 'purchase'
                                  : 'expensePlan',
                              );
                          }}
                          options={[
                            { value: 'none', label: tr('options.none') },
                            ...matches.map((r) => ({
                              value: r.id,
                              label: [r.number, r.title]
                                .filter(Boolean)
                                .join(' · '),
                            })),
                          ]}
                        />
                      </div>
                    ) : (
                      <Textarea
                        id={`handling-${name}`}
                        value={String(data[name] ?? '')}
                        disabled={busy}
                        aria-invalid={invalid.includes(name)}
                        onChange={(e) => update(name, e.target.value)}
                        maxLength={
                          ['reason', 'evaluation'].includes(name)
                            ? 1000
                            : name === 'message'
                              ? 5000
                              : 2000
                        }
                      />
                    )}
                    {invalid.includes(name) ? (
                      <FieldError>{tr('required')}</FieldError>
                    ) : null}
                  </Field>
                ))}
              </form>
            ) : (
              <div className='flex flex-col gap-4'>
                <div className='flex flex-wrap gap-2'>
                  <Badge>{tr(`states.${row.status}`)}</Badge>
                  {row.processing?.cancelPending ? (
                    <Badge variant='outline'>{tr('cancelPending')}</Badge>
                  ) : null}
                  {row.processing?.pauseSince ? (
                    <Badge variant='outline'>{tr('pauseApproved')}</Badge>
                  ) : row.processing?.pauseRequested ? (
                    <Badge variant='outline'>{tr('pausePending')}</Badge>
                  ) : null}
                </div>
                {context.data?.data.full ? (
                  <>
                    <LongText>{row.description}</LongText>
                    <p>{row.location}</p>
                    <p>
                      {tr('handlingFields.assigneeId')}:{' '}
                      {context.data?.data.assigneeLabel ?? '—'}
                    </p>
                    <p>
                      {tr('responseDue')}:{' '}
                      {row.responseDueAt ? format(row.responseDueAt) : '—'}
                    </p>
                    <p>
                      {tr('resolutionDue')}:{' '}
                      {row.resolutionDueAt
                        ? format(row.resolutionDueAt)
                        : tr('clockStopped')}
                    </p>
                    {context.data.data.clocks ? (
                      <p>
                        {tr('clockTotals', {
                          hours: context.data.data.clocks.consumed.toFixed(2),
                          pause: context.data.data.clocks.paused.toFixed(2),
                          acceptance:
                            context.data.data.clocks.acceptance.toFixed(2),
                        })}
                      </p>
                    ) : null}
                    <details open>
                      <summary>{tr('timeline')}</summary>
                      <div className='flex flex-col gap-3 pt-3'>
                        {context.data.data.events.map((e) => (
                          <article key={e.id} className='border-b pb-3'>
                            <p>
                              {tr(`actions.${e.type}`)} · {format(e.createdAt)}{' '}
                              {e.visibility === 'internal' ? (
                                <Badge variant='outline'>
                                  {tr('internalOnly')}
                                </Badge>
                              ) : null}
                            </p>
                            {eventLines(e).map(([label, value]) => (
                              <div key={label}>
                                <p className='text-sm text-muted-foreground'>
                                  {label}
                                </p>
                                <LongText>{value}</LongText>
                              </div>
                            ))}
                          </article>
                        ))}
                      </div>
                    </details>
                    <div className='flex gap-2'>
                      <Button
                        variant='outline'
                        disabled={busy || historyPage === 1}
                        onClick={() => setHistoryPage((p) => p - 1)}
                      >
                        {tr('newerHistory')}
                      </Button>
                      <Button
                        variant='outline'
                        disabled={busy || !context.data.data.hasMoreHistory}
                        onClick={() => setHistoryPage((p) => p + 1)}
                      >
                        {tr('olderHistory')}
                      </Button>
                    </div>
                    {context.data.data.references?.length ? (
                      <section>
                        <h3 className='font-medium'>{tr('linkedSources')}</h3>
                        {context.data.data.references.map((source) => (
                          <p key={source.key} className='text-sm'>
                            {source.readable ? (
                              <>
                                {source.number} ·{' '}
                                {tr(`sourceStates.${source.status}`)}
                                {sourcePage.can && source.path ? (
                                  <Link
                                    className='ml-2 underline'
                                    to={source.path}
                                  >
                                    {tr('openSource')}
                                  </Link>
                                ) : null}
                              </>
                            ) : (
                              tr('restrictedSource')
                            )}
                          </p>
                        ))}
                      </section>
                    ) : null}
                    <BusinessAttachmentList
                      files={files.filter(
                        (f) =>
                          !context.data?.data.internalFiles?.includes(f.id),
                      )}
                    />
                    {context.data.data.internal &&
                    files.some((f) =>
                      context.data?.data.internalFiles?.includes(f.id),
                    ) ? (
                      <section>
                        <Badge variant='outline'>{tr('internalOnly')}</Badge>
                        <BusinessAttachmentList
                          files={files.filter((f) =>
                            context.data?.data.internalFiles?.includes(f.id),
                          )}
                        />
                      </section>
                    ) : null}
                    {context.data.data.actions.includes('comment') ? (
                      <>
                        <Alert>
                          <AlertDescription>{tr('noSecrets')}</AlertDescription>
                        </Alert>
                        {context.data.data.internal ? (
                          <OptionSelect
                            value={fileVisibility}
                            ariaLabel={tr('attachmentVisibility')}
                            onChange={setFileVisibility}
                            options={['public', 'internal'].map((value) => ({
                              value,
                              label:
                                value === 'internal'
                                  ? tr('internalOnly')
                                  : tr('handlingOptions.public'),
                            }))}
                          />
                        ) : null}
                        <FileUploadInput
                          disabled={busy}
                          selectedFile={selectedFile}
                          onFileChange={(file) => void upload(file)}
                        />
                        {selectedFile ? (
                          <Button
                            variant='outline'
                            disabled={busy}
                            onClick={() => void upload(selectedFile)}
                          >
                            {tr('retryUpload')}
                          </Button>
                        ) : null}
                      </>
                    ) : null}
                  </>
                ) : (
                  <p>{tr('poolSummary')}</p>
                )}
              </div>
            )}
          </>
        )}
        <FormActions>
          <div className='flex flex-wrap justify-end gap-2'>
            <Button
              variant='outline'
              disabled={busy}
              onClick={() => {
                if (action) {
                  if (
                    !Object.keys(data).length ||
                    window.confirm(tr('discardChanges'))
                  )
                    closeAction();
                } else onClose();
              }}
            >
              {t('actions.cancel')}
            </Button>
            {!action ? (
              <Button
                variant='outline'
                disabled={busy}
                onClick={() => void refresh().then(loadFiles).catch(setError)}
              >
                {tr('refresh')}
              </Button>
            ) : null}
            {action ? (
              <Button
                form='repair-action-form'
                type='submit'
                disabled={
                  busy ||
                  needsReload ||
                  !context.data?.data.actions.includes(action)
                }
              >
                {busy ? tr('working') : tr(`actions.${action}`)}
              </Button>
            ) : (
              <>
                <OptionSelect
                  ariaLabel={tr('selectAction')}
                  disabled={busy}
                  value={chosen}
                  onChange={setChosen}
                  options={[
                    { value: 'none', label: tr('selectAction') },
                    ...(context.data?.data.actions ?? []).map((value) => ({
                      value,
                      label: tr(`actions.${value}`),
                    })),
                  ]}
                />
                <Button
                  disabled={chosen === 'none' || busy}
                  onClick={() => {
                    const next = new URLSearchParams(location.search);
                    next.set('repairAction', chosen);
                    void navigate({
                      pathname: location.pathname,
                      search: next.toString(),
                    });
                  }}
                >
                  {tr('openAction')}
                </Button>
              </>
            )}
          </div>
        </FormActions>
        <AlertDialog open={confirm} onOpenChange={setConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {tr(`actions.${action}`)} · {row.number}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {tr(
                  action === 'transferSecurity'
                    ? 'securityConfirm'
                    : 'destructiveConfirm',
                  { number: row.number },
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>
                {t('actions.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                variant='destructive'
                disabled={busy}
                onClick={() => void submit()}
              >
                {tr(`actions.${action}`)}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageContainer>
    </RouteFormPage>
  );
}
