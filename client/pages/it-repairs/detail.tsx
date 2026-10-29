import { HandlingDetail } from './handling.js';
import { LongText } from '#components/long-text';
import { fieldViolationsOf, statusOf } from '../platform/shared/errors.js';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '#components/ui/alert-dialog';
import { useEffect, useRef, useState } from 'react';
import {
  useNavigate,
  useOutletContext,
  useParams,
  useLocation,
} from 'react-router';
import {
  useApiClient,
  useToaster,
  useNavigationGuard,
} from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useBusinessResource } from '#hooks/use-business-resource';
import { createRequestKey } from '#lib/request-key';
import { RouteFormPage } from '#components/route-form-page';
import { PageContainer } from '#components/page-container';
import { FormActions } from '#components/form-actions';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Textarea } from '#components/ui/textarea';
import {
  Field,
  FieldLabel,
  FieldGroup,
  FieldError,
} from '#components/ui/field';
import { Alert, AlertDescription } from '#components/ui/alert';
import { DateTimePicker } from '#components/date-time-picker';
import { FileUploadInput } from '#components/file-upload-input';
import { BusinessAttachmentList } from '#components/business-attachment-list';
import { Failure, Loading } from '../work-items/states.js';
import { OptionSelect } from '../work-items/select.js';
import type { Item } from './index.js';
type Draft = Pick<
  Item,
  | 'title'
  | 'description'
  | 'category'
  | 'impact'
  | 'location'
  | 'contact'
  | 'occurredAt'
  | 'assetId'
>;
const initial: Draft = {
  title: '',
  description: '',
  category: '',
  impact: '',
  location: '',
  contact: '',
  occurredAt: null,
  assetId: null,
};
interface FileRow {
  id: string;
  filename: string;
  ext: string;
  contentUrl: string;
}
export default function RepairDetail() {
  const location = useLocation();
  const { repairId } = useParams(),
    api = useApiClient(),
    { t, i18n } = useTranslation(),
    navigate = useNavigate(),
    toast = useToaster(),
    { session } = useAuthentication();
  const parent = useOutletContext<{ reload?: () => void }>(),
    [draft, setDraft] = useState<Draft>(initial),
    [row, setRow] = useState<Item>(),
    [saved, setSaved] = useState<string>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(),
    [files, setFiles] = useState<FileRow[]>([]),
    [discard, setDiscard] = useState(false),
    [clientErrors, setClientErrors] = useState<string[]>([]);
  const leavingRef = useRef(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const edit = useCan({
      resource: { type: 'composite', id: 'oa.itRepairs' },
      action: repairId ? 'edit' : 'create',
    }),
    submit = useCan({
      resource: { type: 'composite', id: 'oa.itRepairs' },
      action: 'submit',
    });
  const assets = useBusinessResource<{
    data: {
      items: { id: string; code: string; name: string }[];
      total: number;
    };
  }>(edit.can ? 'itRepairs/assets' : null, { page: '1', pageSize: '100' });
  const r = useBusinessResource<{ data: Item }>(
      repairId ? `itRepairs/${repairId}` : null,
    ),
    initializedRef = useRef(false),
    keyRef = useRef(createRequestKey()),
    [uploadRetry, setUploadRetry] = useState<{
      file: File;
      key: string;
      version: number;
    }>();
  const changed = JSON.stringify(draft) !== saved,
    editable =
      (!row || row.status === 'draft') &&
      edit.can &&
      !isLeaving &&
      (!row || row.requesterId === session?.user.id);
  const dirty = row
    ? changed
    : JSON.stringify(draft) !== JSON.stringify(initial);
  useNavigationGuard(() => {
    if (row && row.status !== 'draft') return true;
    if (leavingRef.current) return true;
    if (busy) return false;
    if (dirty) {
      setDiscard(true);
      return false;
    }
    return true;
  });
  const invalid = [
    ...clientErrors,
    ...fieldViolationsOf(error).map((field) => field.replace(/^draft\./, '')),
  ];
  useEffect(() => {
    const field = fieldViolationsOf(error)[0];
    if (field)
      document
        .getElementById(`repair-${field === 'occurredAt' ? 'occurred' : field}`)
        ?.focus();
  }, [error]);
  useEffect(() => {
    if (r.data && !initializedRef.current) {
      initializedRef.current = true;
      const data = r.data.data;
      setRow(data);
      const next = Object.fromEntries(
        Object.keys(initial).map((k) => [
          k,
          data[k as keyof Item] ?? initial[k as keyof Draft],
        ]),
      ) as Draft;
      setDraft(next);
      setSaved(JSON.stringify(next));
    }
  }, [r.data]);
  useEffect(() => {
    if (!repairId) return;
    let cancelled = false;
    api
      .request<{ data: FileRow[] }>({
        method: 'POST',
        path: 'itRepairAttachments/findMany',
        headers: { 'x-repair-id': repairId },
        json: { limit: 10 },
      })
      .then(
        (result) => {
          if (!cancelled) setFiles(result.data);
        },
        (e) => {
          if (!cancelled) setError(e);
        },
      );
    return () => {
      cancelled = true;
    };
  }, [api, repairId, row?.version]);
  function change<K extends keyof Draft>(field: K, value: Draft[K]) {
    setDraft((old) => ({ ...old, [field]: value }));
    keyRef.current = createRequestKey();
    setClientErrors((old) => old.filter((key) => key !== field));
    setError(undefined);
  }
  function checkInput(submitting: boolean) {
    const fields: string[] = [];
    if (submitting)
      for (const field of [
        'title',
        'description',
        'location',
        'category',
        'impact',
      ] as const)
        if (!draft[field].trim()) fields.push(field);
    if (
      draft.occurredAt &&
      (!Number.isFinite(Date.parse(draft.occurredAt)) ||
        Date.parse(draft.occurredAt) > Date.now())
    )
      fields.push('occurredAt');
    setClientErrors(fields);
    if (fields.length)
      document
        .getElementById(
          `repair-${fields[0] === 'occurredAt' ? 'occurred' : fields[0]}`,
        )
        ?.focus();
    return fields.length === 0;
  }
  async function reloadLatest() {
    if (!row || busy) return;
    setBusy(true);
    try {
      const result = await api.request<{ data: Item }>({
        path: `itRepairs/${row.id}`,
      });
      setRow(result.data);
      setSaved(
        JSON.stringify(
          Object.fromEntries(
            Object.keys(initial).map((k) => [
              k,
              result.data[k as keyof Item] ?? initial[k as keyof Draft],
            ]),
          ),
        ),
      );
      keyRef.current = createRequestKey();
      setError(undefined);
      toast.show({ title: t('itRepairs.reloaded'), type: 'success' });
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (busy || !checkInput(false)) return;
    setBusy(true);
    setError(undefined);
    try {
      const result = await api.request<{ data: Item }>({
        method: 'POST',
        path: 'itRepairs/save',
        json: {
          requestKey: keyRef.current,
          ...(row ? { id: row.id, expectedVersion: row.version } : {}),
          draft,
        },
      });
      setRow(result.data);
      setSaved(JSON.stringify(draft));
      parent?.reload?.();
      toast.show({ title: t('itRepairs.saved'), type: 'success' });
      keyRef.current = createRequestKey();
      if (!repairId) {
        leavingRef.current = true;
        setIsLeaving(true);
        void navigate(
          location.pathname.endsWith('/newItRepair')
            ? `../itRepair/${result.data.id}`
            : `../${result.data.id}`,
          {
            replace: true,
            state: { routeOverlayHandoff: `../${result.data.id}` },
          },
        );
      }
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  async function send() {
    if (!row || changed || busy || !checkInput(true)) return;
    setBusy(true);
    setError(undefined);
    try {
      const result = await api.request<{ data: Item }>({
        method: 'POST',
        path: `itRepairs/${row.id}/submit`,
        json: { requestKey: keyRef.current, expectedVersion: row.version },
      });
      setRow(result.data);
      parent?.reload?.();
      toast.show({ title: t('itRepairs.submitted'), type: 'success' });
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  async function upload(file: File) {
    if (!row || busy) return;
    setBusy(true);
    setError(undefined);
    const retry =
      uploadRetry?.file === file
        ? uploadRetry
        : { file, key: createRequestKey(), version: row.version };
    setUploadRetry(retry);
    try {
      const form = new FormData();
      form.set('file', file);
      const result = await api.request<{
        data: { file: FileRow; version: number };
      }>({
        method: 'POST',
        path: `itRepairs/${row.id}/upload`,
        headers: {
          'x-request-key': retry.key,
          'x-expected-version': String(retry.version),
        },
        body: form,
      });
      setRow({ ...row, version: result.data.version });
      setFiles((old) => [
        ...old.filter((f) => f.id !== result.data.file.id),
        result.data.file,
      ]);
      setUploadRetry(undefined);
      keyRef.current = createRequestKey();
      parent?.reload?.();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  if (row && row.status !== 'draft')
    return (
      <HandlingDetail
        key={row.id + location.search}
        row={row}
        onChange={(next) => {
          setRow(next);
          parent?.reload?.();
        }}
        onClose={() => void navigate('..')}
      />
    );
  return (
    <>
      <RouteFormPage
        title={
          repairId
            ? row?.number || row?.title || t('itRepairs.title')
            : t('itRepairs.create')
        }
        beforeClose={() => {
          if (busy) return false;
          if (dirty) {
            setDiscard(true);
            return false;
          }
          return true;
        }}
      >
        <PageContainer>
          {r.loading && !row ? (
            <Loading />
          ) : r.error ? (
            <Failure error={r.error} module='itRepairs' retry={r.reload} />
          ) : (
            <>
              <Alert>
                <AlertDescription>{t('itRepairs.noSecrets')}</AlertDescription>
              </Alert>
              {error ? <Failure error={error} module='itRepairs' /> : null}
              {busy ? <p role='status'>{t('itRepairs.working')}</p> : null}
              {statusOf(error) === 409 ? (
                <Button
                  variant='outline'
                  disabled={busy}
                  onClick={() => void reloadLatest()}
                >
                  {t('itRepairs.reloadLatest')}
                </Button>
              ) : null}
              {row?.status === 'triage' ? (
                <ReadOnlyRepair row={row} files={files} />
              ) : (
                <form
                  id='repair-draft-form'
                  onSubmit={(event) => {
                    event.preventDefault();
                    void save();
                  }}
                >
                  <FieldGroup>
                    {(
                      ['title', 'description', 'location', 'contact'] as const
                    ).map((field) => (
                      <Field key={field}>
                        <FieldLabel htmlFor={`repair-${field}`}>
                          {t(`itRepairs.${field}Field`)}
                          {field !== 'contact' ? ' *' : ''}
                        </FieldLabel>
                        {field === 'description' ? (
                          <Textarea
                            id={`repair-${field}`}
                            aria-invalid={invalid.includes(field)}
                            disabled={!editable || busy}
                            maxLength={5000}
                            value={draft[field]}
                            onChange={(e) => change(field, e.target.value)}
                          />
                        ) : (
                          <Input
                            id={`repair-${field}`}
                            aria-invalid={invalid.includes(field)}
                            disabled={!editable || busy}
                            maxLength={field === 'title' ? 120 : 200}
                            value={draft[field]}
                            onChange={(e) => change(field, e.target.value)}
                          />
                        )}
                        {invalid.includes(field) ? (
                          <FieldError>{t('itRepairs.fieldInvalid')}</FieldError>
                        ) : null}
                      </Field>
                    ))}
                    {(['category', 'impact'] as const).map((field) => (
                      <Field key={field}>
                        <FieldLabel htmlFor={`repair-${field}`}>
                          {t(`itRepairs.${field}`)} *
                        </FieldLabel>
                        <OptionSelect
                          id={`repair-${field}`}
                          invalid={invalid.includes(field)}
                          disabled={!editable || busy}
                          value={draft[field] || 'none'}
                          onChange={(value) =>
                            change(field, value === 'none' ? '' : value)
                          }
                          options={[
                            'none',
                            ...(field === 'category'
                              ? [
                                  'device',
                                  'network',
                                  'software',
                                  'account',
                                  'other',
                                ]
                              : ['unable', 'partial', 'multiple', 'outage']),
                          ].map((value) => ({
                            value,
                            label: t(`itRepairs.options.${value}`),
                          }))}
                        />
                        {invalid.includes(field) ? (
                          <FieldError>{t('itRepairs.fieldInvalid')}</FieldError>
                        ) : null}
                      </Field>
                    ))}
                    <Field>
                      <FieldLabel htmlFor='repair-asset'>
                        {t('itRepairs.asset')}
                      </FieldLabel>
                      <OptionSelect
                        id='repair-asset'
                        disabled={!editable || busy}
                        value={draft.assetId ?? 'none'}
                        onChange={(id) =>
                          change('assetId', id === 'none' ? null : id)
                        }
                        options={[
                          { value: 'none', label: t('itRepairs.options.none') },
                          ...(assets.data?.data.items ?? []).map((a) => ({
                            value: a.id,
                            label: `${a.code} · ${a.name}`,
                          })),
                        ]}
                      />
                      {(assets.data?.data.total ?? 0) > 100 ? (
                        <p>{t('itRepairs.assetCap')}</p>
                      ) : null}
                    </Field>
                    <Field>
                      <FieldLabel htmlFor='repair-occurred'>
                        {t('itRepairs.occurredAt')}
                      </FieldLabel>
                      <DateTimePicker
                        id='repair-occurred'
                        value={draft.occurredAt ?? ''}
                        onChange={(v) => change('occurredAt', v || null)}
                        timeZone='Asia/Singapore'
                        disabled={!editable || busy}
                        timeLabel={t('itRepairs.time')}
                        invalid={invalid.includes('occurredAt')}
                      />
                    </Field>
                    <Field>
                      <FieldLabel>{t('itRepairs.attachments')}</FieldLabel>
                      <p className='text-sm text-muted-foreground'>
                        {t('itRepairs.attachmentLimits')}
                      </p>
                      <BusinessAttachmentList files={files} />
                      {editable && row ? (
                        <FileUploadInput
                          accept='.png,.jpg,.jpeg,.pdf,.txt,.log'
                          disabled={busy || files.length >= 10}
                          onFileChange={(file) => void upload(file)}
                        />
                      ) : null}
                      {uploadRetry ? (
                        <Button
                          variant='outline'
                          disabled={busy}
                          onClick={() => void upload(uploadRetry.file)}
                        >
                          {t('itRepairs.retryUpload')}
                        </Button>
                      ) : null}
                      {!row ? <p>{t('itRepairs.saveBeforeUpload')}</p> : null}
                    </Field>
                  </FieldGroup>
                </form>
              )}
              {row?.status === 'triage' ? (
                <div className='flex flex-col gap-2'>
                  <p>{t('itRepairs.states.triage')}</p>
                  {!row.groupId ? (
                    <Alert>
                      <AlertDescription>
                        {t('itRepairs.unconfigured')}
                      </AlertDescription>
                    </Alert>
                  ) : null}
                  <p>
                    {t('itRepairs.responseDue')}:{' '}
                    {row.responseDueAt
                      ? new Date(row.responseDueAt).toLocaleString(
                          i18n.language,
                        )
                      : '—'}
                  </p>
                  <p>
                    {t('itRepairs.resolutionDue')}:{' '}
                    {row.resolutionDueAt
                      ? new Date(row.resolutionDueAt).toLocaleString(
                          i18n.language,
                        )
                      : '—'}
                  </p>
                </div>
              ) : changed && row ? (
                <p className='text-muted-foreground'>
                  {t('itRepairs.saveBeforeSubmit')}
                </p>
              ) : null}
              <FormActions>
                <div className='flex flex-wrap justify-end gap-2'>
                  <Button
                    variant='outline'
                    disabled={busy}
                    onClick={() => {
                      if (dirty) setDiscard(true);
                      else void navigate('..');
                    }}
                  >
                    {t('actions.cancel')}
                  </Button>
                  {editable ? (
                    <Button
                      disabled={busy}
                      variant={row ? 'outline' : 'default'}
                      type='submit'
                      form='repair-draft-form'
                    >
                      {t('itRepairs.save')}
                    </Button>
                  ) : null}
                  {editable && row && submit.can ? (
                    <Button
                      disabled={busy || changed}
                      onClick={() => void send()}
                    >
                      {t('itRepairs.submit')}
                    </Button>
                  ) : null}
                </div>
              </FormActions>
            </>
          )}
        </PageContainer>
      </RouteFormPage>
      <AlertDialog open={discard} onOpenChange={setDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('workItems.discardTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('workItems.discardDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('workItems.continue')}</AlertDialogCancel>
            <Button
              variant='destructive'
              onClick={() => {
                leavingRef.current = true;
                setIsLeaving(true);
                void navigate('..');
              }}
            >
              {t('workItems.leave')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ReadOnlyRepair({ row, files }: { row: Item; files: FileRow[] }) {
  const { t, i18n } = useTranslation();
  const fields = [
    ['titleField', row.title],
    ['descriptionField', row.description],
    ['category', t(`itRepairs.options.${row.category}`)],
    ['impact', t(`itRepairs.options.${row.impact}`)],
    ['locationField', row.location],
    ['contactField', row.contact],
    [
      'asset',
      row.assetId ? (row.assetLabel ?? t('itRepairs.linkedAsset')) : '—',
    ],
    [
      'occurredAt',
      row.occurredAt
        ? new Date(row.occurredAt).toLocaleString(i18n.language)
        : '—',
    ],
  ];
  return (
    <>
      <dl className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        {fields.map(([key, value]) => (
          <div
            key={key}
            className={
              key === 'descriptionField' ? 'sm:col-span-2 min-w-0' : 'min-w-0'
            }
          >
            <dt className='text-sm text-muted-foreground'>
              {t(`itRepairs.${key}`)}
            </dt>
            <dd className='break-words'>
              {key === 'descriptionField' ? (
                <LongText>{value || '—'}</LongText>
              ) : (
                value || '—'
              )}
            </dd>
          </div>
        ))}
      </dl>
      <section className='flex flex-col gap-2'>
        <h2 className='text-base font-medium'>{t('itRepairs.attachments')}</h2>
        <BusinessAttachmentList files={files} />
        {files.length === 0 ? <p>—</p> : null}
      </section>
    </>
  );
}
