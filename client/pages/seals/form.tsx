import { FileUploadInput } from '#components/file-upload-input';
import { externalIntegrationsEnabled } from '../../../shared/external-integrations.js';
import { Spinner } from '#components/ui/spinner';
import { createRequestKey } from '#lib/request-key';
import { useEffect, useRef, useState } from 'react';
import { useParams, useOutletContext } from 'react-router';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useAuthorizationRevision } from '@nocobase/app-plugin-authorization/client';
import { RouteDrawer } from '#components/route-drawer';
import { useRouteOverlay } from '#components/use-route-overlay';
import { DateTimePicker } from '#components/date-time-picker';
import { Button } from '#components/ui/button';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Input } from '#components/ui/input';
import { Textarea } from '#components/ui/textarea';
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from '#components/ui/field';
import { Switch } from '#components/ui/switch';
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
  AlertDialogAction,
} from '#components/ui/alert-dialog';
import {
  useRequestFormSubmission,
  preventComposingSubmit,
} from '#hooks/use-request-form-submission';
import { RequestSubmissionFeedback } from '#components/request-form-submission';
import { useSealResource } from './resource.js';
import { useSealCommand } from './command.js';
import { SealError, SealSkeleton } from './states.js';
import type {
  Detail,
  Options,
  Capabilities,
  Source,
  SealRequest,
  SealFile,
} from './types.js';
export default function SealForm() {
  const { session } = useAuthentication(),
    revision = useAuthorizationRevision();
  return <Overlay key={`${session?.user.id}:${revision}`} />;
}
function Overlay() {
  const { t } = useTranslation(),
    { sealRequestId } = useParams(),
    busyRef = useRef(false),
    dirtyRef = useRef(false),
    savedRef = useRef(false),
    resolveRef = useRef<((v: boolean) => void) | null>(null),
    [busy, setBusy] = useState(false),
    [discard, setDiscard] = useState(false);
  return (
    <RouteDrawer
      printable
      title={t(sealRequestId ? 'seals.edit' : 'seals.new')}
      className='text-sm sm:max-w-2xl'
      beforeClose={() =>
        savedRef.current
          ? true
          : busyRef.current
            ? false
            : dirtyRef.current
              ? new Promise<boolean>((resolve) => {
                  resolveRef.current = resolve;
                  setDiscard(true);
                })
              : true
      }
      footer={<Footer busy={busy} />}
    >
      <Body
        id={sealRequestId}
        busyRef={busyRef}
        dirtyRef={dirtyRef}
        savedRef={savedRef}
        onBusy={setBusy}
      />
      <AlertDialog
        open={discard}
        onOpenChange={(v) => {
          setDiscard(v);
          if (!v) {
            resolveRef.current?.(false);
            resolveRef.current = null;
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('seals.discard')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('seals.discardDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('seals.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              onClick={() => {
                dirtyRef.current = false;
                resolveRef.current?.(true);
                resolveRef.current = null;
                setDiscard(false);
              }}
            >
              {t('seals.discard')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RouteDrawer>
  );
}
function Footer({ busy }: { busy: boolean }) {
  const { t } = useTranslation(),
    { close } = useRouteOverlay();
  return (
    <>
      <Button variant='outline' disabled={busy} onClick={() => void close()}>
        {t('seals.cancel')}
      </Button>
      <Button
        type='submit'
        form='seal-form'
        name='requestIntent'
        value='save'
        variant='outline'
        disabled={busy}
      >
        {busy ? <Spinner data-icon='inline-start' /> : null}
        {t('seals.saveDraft')}
      </Button>
      <Button
        type='submit'
        form='seal-form'
        name='requestIntent'
        value='submit'
        disabled={busy}
      >
        {busy ? <Spinner data-icon='inline-start' /> : null}
        {t('seals.submit')}
      </Button>
    </>
  );
}
function Body({
  id,
  busyRef,
  dirtyRef,
  savedRef,
  onBusy,
}: {
  id?: string;
  busyRef: React.RefObject<boolean>;
  dirtyRef: React.RefObject<boolean>;
  savedRef: React.RefObject<boolean>;
  onBusy: (v: boolean) => void;
}) {
  const { t } = useTranslation();
  const o = useSealResource<{ data: Options }>('sealBrowser/options'),
    r = useSealResource<{ data: Detail }>(
      id ? `sealRequests/${encodeURIComponent(id)}` : null,
    ),
    c = useSealResource<{ data: Capabilities }>(
      id ? `sealBrowser/requests/${encodeURIComponent(id)}/capabilities` : null,
    );
  return o.error || r.error || c.error ? (
    <SealError
      error={o.error ?? r.error ?? c.error}
      retry={() => {
        o.reload();
        r.reload();
        c.reload();
      }}
    />
  ) : o.loading || r.loading || c.loading ? (
    <SealSkeleton />
  ) : o.data && (!id || c.data?.data.transitions.includes('edit')) ? (
    <Fields
      key={r.data?.data.record.lifecycleVersion ?? 'new'}
      options={o.data.data}
      record={r.data?.data.record}
      busyRef={busyRef}
      dirtyRef={dirtyRef}
      savedRef={savedRef}
      onBusy={onBusy}
    />
  ) : (
    <Alert>
      <AlertDescription>{t('seals.noLongerEditable')}</AlertDescription>
    </Alert>
  );
}
function Fields({
  options,
  record,
  busyRef,
  dirtyRef,
  savedRef,
  onBusy,
}: {
  options: Options;
  record?: SealRequest;
  busyRef: React.RefObject<boolean>;
  dirtyRef: React.RefObject<boolean>;
  savedRef: React.RefObject<boolean>;
  onBusy: (v: boolean) => void;
}) {
  const { t, i18n } = useTranslation(),
    api = useApiClient(),
    toast = useToaster(),
    parent = useOutletContext<Source>(),
    { close } = useRouteOverlay(),
    cmd = useSealCommand(),
    [draft, setDraft] = useState<SealRequest | undefined>(record),
    [files, setFiles] = useState(record?.fileIds ?? []),
    [uploading, setUploading] = useState(false),
    [error, setError] = useState<unknown>(),
    uploadRef = useRef<{ file: File; key: string } | null>(null);
  const existingFiles = useSealResource<{ data: SealFile[] }>(
    draft?.id ? `sealRequests/${encodeURIComponent(draft.id)}/files` : null,
  );
  const [uploadedNames, setUploadedNames] = useState<Record<string, string>>(
    {},
  );
  const [validationNow] = useState(() => Date.now());
  const schema = z
    .object({
      contractId: z.string(),
      sealType: z.string().min(1, t('seals.required')),
      executionMode: z.enum(['physical', 'electronic']),
      copies: z
        .number({ error: t('seals.required') })
        .int(t('seals.required'))
        .min(0, t('seals.required'))
        .max(10000, t('seals.required')),
      external: z.boolean(),
      returnDueAt: z.string(),
      purpose: z.string().trim().min(1, t('seals.required')).max(5000),
      contact: z.string().max(2000),
    })
    .refine(
      (v) =>
        !v.external ||
        (Number.isFinite(Date.parse(v.returnDueAt)) &&
          Date.parse(v.returnDueAt) > validationNow),
      { path: ['returnDueAt'], message: t('seals.futureReturn') },
    );
  const form = useForm({
      resolver: zodResolver(schema),
      defaultValues: {
        contractId: record?.contractId ?? '',
        sealType: record?.sealType ?? '',
        executionMode: record?.executionMode ?? 'physical',
        copies: record?.copies ?? 1,
        external: record?.external ?? false,
        returnDueAt: record?.returnDueAt ?? '',
        purpose: record?.purpose ?? '',
        contact: record?.contact ?? '',
      },
    }),
    busy = form.formState.isSubmitting || cmd.busy || uploading;
  const external = useWatch({ control: form.control, name: 'external' });
  const executionMode = useWatch({
    control: form.control,
    name: 'executionMode',
  });
  const submission = useRequestFormSubmission<SealRequest>({
    replayUnknownCreate: true,
    resource: 'sealRequests',
    suffix: 'submit',
    keyField: 'requestKey',
    versionField: 'expectedVersion',
    recordResult: 'direct',
  });
  useEffect(() => {
    busyRef.current = busy;
    dirtyRef.current =
      form.formState.isDirty || files.join() !== (record?.fileIds ?? []).join();
    onBusy(busy);
  }, [busy, form.formState.isDirty, files, record, busyRef, dirtyRef, onBusy]);
  const payload = (v: z.infer<typeof schema>) => ({
    ...v,
    copies: v.executionMode === 'electronic' ? 0 : v.copies,
    external: v.executionMode === 'electronic' ? false : v.external,
    contractId: v.contractId || null,
    returnDueAt:
      v.executionMode !== 'electronic' && v.external ? v.returnDueAt : null,
    fileIds: files,
  });
  async function save(values: z.infer<typeof schema>) {
    return submission.save(payload(values), draft, async (current) => {
      const result = await cmd.execute<{ data: SealRequest }>(
        current ? `sealRequests/${current.id}` : 'sealRequests',
        current ? 'PUT' : 'POST',
        {
          ...payload(values),
          ...(current ? { expectedVersion: current.lifecycleVersion } : {}),
        },
        'requestKey',
        true,
      );
      if (!result) throw new Error('save failed');
      setDraft(result.data);
      return result.data;
    });
  }
  async function upload(file: File) {
    if (busy || !(await form.trigger())) return;
    setUploading(true);
    setError(undefined);
    try {
      const current = await save(form.getValues());
      if (uploadRef.current?.file !== file)
        uploadRef.current = { file, key: createRequestKey() };
      const data = new FormData();
      data.set('file', file);
      data.set('requestKey', uploadRef.current.key);
      const result = await api.request<{ data: SealFile }>({
        method: 'POST',
        path: `sealRequests/${current.id}/files`,
        body: data,
      });
      setUploadedNames((old) => ({
        ...old,
        [result.data.id]: result.data.filename,
      }));
      setFiles((old) => [...old, result.data.id]);
      uploadRef.current = null;
      parent?.reload();
    } catch (e) {
      setError(e);
    } finally {
      setUploading(false);
    }
  }
  return (
    <form
      id='seal-form'
      className='flex flex-col gap-4'
      onSubmitCapture={submission.captureIntent}
      onKeyDown={preventComposingSubmit}
      onSubmit={(e) => {
        void form.handleSubmit(async (values) => {
          setError(undefined);
          try {
            const saved = await save(values);
            if (
              !saved.contractId &&
              !saved.fileIds.length &&
              submission.intent.current === 'submit'
            ) {
              form.setError('root', { message: t('seals.sourceRequired') });
              return;
            }
            await submission.finish(saved);
            // React Hook Form remains submitting until this handler returns.
            // Permit only this confirmed write's close, then restore the guard.
            savedRef.current = true;
            dirtyRef.current = false;
            busyRef.current = false;
            form.reset(values);
            parent?.reload();
            toast.show({
              type: 'success',
              title: t('seals.requestSaved', {
                name: saved.number ?? t('seals.draft'),
              }),
            });
            try {
              await close();
            } finally {
              savedRef.current = false;
            }
          } catch (e) {
            setError(e);
          }
        })(e);
      }}
    >
      <RequestSubmissionFeedback
        failed={submission.submitFailed}
        unknown={submission.submitUnknown}
      />
      {error || cmd.error ? <SealError error={cmd.error ?? error} /> : null}
      <FieldError errors={[form.formState.errors.root]} />
      <FieldGroup inert={submission.submitUnknown || undefined}>
        <Controller
          name='sealType'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor='seal-type'>
                {t('seals.sealType')} *
              </FieldLabel>
              <Select
                value={field.value}
                onValueChange={(v) => field.onChange(v ?? '')}
                disabled={busy}
              >
                <SelectTrigger id='seal-type'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                  <SelectGroup>
                    {options.sealTypes.map((v) => (
                      <SelectItem key={v.code} value={v.code}>
                        {v.label[i18n.language] ?? v.label['zh-CN'] ?? v.code}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          name='contractId'
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor='seal-contract'>
                {t('seals.contractId')}
              </FieldLabel>
              <Select
                items={[
                  { value: 'none', label: t('seals.fileSource') },
                  ...options.contracts.map((c) => ({
                    value: c.id,
                    label: c.number ?? t('seals.relatedUnavailable'),
                  })),
                ]}
                value={field.value || 'none'}
                onValueChange={(v) =>
                  field.onChange(v === 'none' ? '' : (v ?? ''))
                }
                disabled={busy}
              >
                <SelectTrigger id='seal-contract'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                  <SelectGroup>
                    <SelectItem value='none'>
                      {t('seals.fileSource')}
                    </SelectItem>
                    {options.contracts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.number ?? c.id}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          )}
        />
        {(['purpose', 'contact'] as const).map((name) => (
          <Field key={name}>
            <FieldLabel htmlFor={`seal-${name}`}>
              {t(`seals.${name}`)}
              {name === 'purpose' ? ' *' : ''}
            </FieldLabel>
            <Textarea
              id={`seal-${name}`}
              {...form.register(name)}
              disabled={busy}
              aria-invalid={!!form.formState.errors[name]}
            />
            <FieldError errors={[form.formState.errors[name]]} />
          </Field>
        ))}
        <Controller
          name='executionMode'
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor='seal-execution-mode'>
                {t('electronicSignatures.channel')}
              </FieldLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={busy || !externalIntegrationsEnabled}
                items={[
                  {
                    value: 'physical',
                    label: t('electronicSignatures.physical'),
                  },
                  ...(externalIntegrationsEnabled ||
                  field.value === 'electronic'
                    ? [
                        {
                          value: 'electronic',
                          label: t('electronicSignatures.electronic'),
                        },
                      ]
                    : []),
                ]}
              >
                <SelectTrigger id='seal-execution-mode'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='physical'>
                    {t('electronicSignatures.physical')}
                  </SelectItem>
                  {externalIntegrationsEnabled ||
                  field.value === 'electronic' ? (
                    <SelectItem value='electronic'>
                      {t('electronicSignatures.electronic')}
                    </SelectItem>
                  ) : null}
                </SelectContent>
              </Select>
              <p className='text-xs text-muted-foreground'>
                {t('electronicSignatures.channelHint')}
              </p>
            </Field>
          )}
        />
        {executionMode !== 'electronic' ? (
          <>
            <Field>
              <FieldLabel htmlFor='seal-copies'>
                {t('seals.copies')} *
              </FieldLabel>
              <Input
                id='seal-copies'
                type='number'
                min={1}
                max={10000}
                disabled={busy}
                {...form.register('copies', { valueAsNumber: true })}
              />
              <FieldError errors={[form.formState.errors.copies]} />
            </Field>
            <Controller
              name='external'
              control={form.control}
              render={({ field }) => (
                <Field orientation='horizontal'>
                  <FieldLabel htmlFor='seal-external'>
                    {t('seals.external')}
                  </FieldLabel>
                  <Switch
                    id='seal-external'
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={busy}
                  />
                </Field>
              )}
            />
            {external ? (
              <Controller
                name='returnDueAt'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor='seal-due'>
                      {t('seals.returnDueAt')} *
                    </FieldLabel>
                    <DateTimePicker
                      id='seal-due'
                      value={field.value}
                      onChange={field.onChange}
                      timeZone={options.timeZone}
                      timeLabel={t('seals.returnDueAt')}
                      disabled={busy}
                      invalid={!!fieldState.error}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            ) : null}
          </>
        ) : null}
        <Field>
          <FieldLabel htmlFor='seal-upload'>{t('seals.files')}</FieldLabel>
          <p className='text-muted-foreground'>{t('seals.uploadNotice')}</p>
          <FileUploadInput
            id='seal-upload'
            disabled={busy || submission.submitUnknown}
            onFileChange={(file) => void upload(file)}
          />
          {existingFiles.error ? (
            <SealError
              error={existingFiles.error}
              retry={existingFiles.reload}
            />
          ) : null}
          {files.map((id) => (
            <div key={id} className='flex items-center justify-between gap-2'>
              <span className='break-words'>
                {uploadedNames[id] ??
                  existingFiles.data?.data.find((file) => file.id === id)
                    ?.filename ??
                  t('seals.files')}
              </span>
              <Button
                type='button'
                variant='ghost'
                disabled={busy}
                onClick={() => setFiles((old) => old.filter((f) => f !== id))}
              >
                {t('seals.remove')}
              </Button>
            </div>
          ))}
        </Field>
      </FieldGroup>
    </form>
  );
}
