import { useRouteFormCloseGuard } from '#hooks/use-route-form-close-guard';
import { FormActions } from '#components/form-actions';
import { createRequestKey } from '#lib/request-key';
import { useEffect, useRef, useState } from 'react';
import {
  useParams,
  useNavigate,
  useLocation,
  useOutletContext,
} from 'react-router';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from '@nocobase/i18n/client';
import { useApiClient, useToaster } from '@nocobase/app-client';
import { RouteFormPage } from '#components/route-form-page';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { BackButton } from '#components/back-button';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Textarea } from '#components/ui/textarea';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldDescription,
} from '#components/ui/field';
import { Checkbox } from '#components/ui/checkbox';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '#components/ui/select';
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
import { isDenied } from './resource.js';
import { useKnowledgeResource } from './resource.js';
import { useKnowledgeCommand } from './command.js';
import { KnowledgeIdentity } from './identity.js';
import { KnowledgeError, KnowledgeSkeleton } from './states.js';
import { KnowledgeDiscard } from './guard.js';
import { useKnowledgeGuard } from './use-guard.js';
import { statusOf, fieldViolationsOf } from '../platform/shared/errors.js';
import {
  ACCEPT,
  MAX_BYTES,
  type Detail,
  type Options,
  type FileMetadata,
  type Context,
} from './types.js';
export default function KnowledgeForm() {
  return (
    <KnowledgeIdentity>
      <Load />
    </KnowledgeIdentity>
  );
}
function Load() {
  const { documentId } = useParams(),
    { t } = useTranslation(),
    detail = useKnowledgeResource<{ data: Detail }>(
      documentId
        ? `knowledge/documents/${encodeURIComponent(documentId)}`
        : null,
    ),
    options = useKnowledgeResource<{ data: Options }>(
      'knowledge/formOptions',
      documentId ? { documentId } : {},
    );
  const loading = options.loading || (!!documentId && detail.loading),
    error = options.error || detail.error,
    o = options.data?.data,
    d = detail.data?.data;
  return (
    <RouteFormPage title={t(documentId ? 'knowledge.edit' : 'knowledge.new')}>
      <PageContainer className='max-w-4xl'>
        <BackButton />
        <PageHeader
          title={t(documentId ? 'knowledge.edit' : 'knowledge.new')}
        />
        {error ? (
          <KnowledgeError
            error={error}
            retry={() => {
              options.reload();
              detail.reload();
            }}
          />
        ) : loading ? (
          <KnowledgeSkeleton />
        ) : o &&
          (!documentId || d) &&
          (documentId ? o.canEdit : o.canCreate) ? (
          <Fields
            key={`${d?.document.version ?? 'new'}`}
            detail={d}
            options={o}
            reload={() => {
              options.invalidate();
              detail.invalidate();
            }}
          />
        ) : (
          <Alert variant='destructive'>
            <AlertDescription>{t('knowledge.unavailable')}</AlertDescription>
          </Alert>
        )}
      </PageContainer>
    </RouteFormPage>
  );
}
function Fields({
  detail,
  options,
  reload,
}: {
  detail?: Detail;
  options: Options;
  reload: () => void;
}) {
  const { t } = useTranslation(),
    api = useApiClient(),
    toaster = useToaster(),
    navigate = useNavigate(),
    location = useLocation(),
    parent = useOutletContext<Context>(),
    command = useKnowledgeCommand(clearDraft),
    latest = detail?.versions.find(
      (v) => v.id === detail.document.latestVersionId,
    );
  const schema = z.object({
    title: z
      .string()
      .trim()
      .min(1, t('knowledge.required'))
      .max(200, t('knowledge.titleTooLong')),
    folderId: z.string(),
    departmentIds: z.array(z.string()).max(100),
    dutyRoleCodes: z.array(z.string()).max(100),
    kind: z.enum(['markdown', 'file']),
    markdown: z
      .string()
      .refine(
        (v) => new TextEncoder().encode(v).length <= MAX_BYTES,
        t('knowledge.contentTooLarge'),
      ),
  });
  const form = useForm({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      title: detail?.document.title ?? '',
      folderId: detail?.document.folderId ?? 'root',
      departmentIds: detail?.document.departmentIds ?? [],
      dutyRoleCodes: detail?.document.dutyRoleCodes ?? [],
      kind: latest?.kind ?? 'markdown',
      markdown: latest?.markdown ?? '',
    },
  });
  const [file, setFile] = useState<File | null>(null),
    [uploaded, setUploaded] = useState<FileMetadata | null>(null),
    [uploading, setUploading] = useState(false),
    [uploadError, setUploadError] = useState<unknown>(),
    [validation, setValidation] = useState(''),
    [cas, setCas] = useState(false),
    controllerRef = useRef(new AbortController()),
    uploadKeyRef = useRef<{ file: File; key: string } | null>(null),
    lockedRef = useRef(false),
    fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    controllerRef.current = new AbortController();
    return () => controllerRef.current.abort();
  }, []);
  useEffect(() => {
    let focused = false;
    for (const name of fieldViolationsOf(command.error)) {
      if (name === 'fileId') {
        if (!focused) {
          fileInputRef.current?.focus();
          focused = true;
        }
        continue;
      }
      if (
        [
          'title',
          'folderId',
          'departmentIds',
          'dutyRoleCodes',
          'kind',
          'markdown',
        ].includes(name)
      ) {
        form.setError(name as keyof z.infer<typeof schema>, {
          message: t('knowledge.invalidField'),
        });
        if (!focused) {
          if (name === 'departmentIds' || name === 'dutyRoleCodes')
            document.getElementById(`knowledge-audience-${name}`)?.focus();
          else form.setFocus(name as keyof z.infer<typeof schema>);
          focused = true;
        }
      }
    }
  }, [command.error, form, t]);
  const deniedError = isDenied(command.error)
    ? command.error
    : isDenied(uploadError)
      ? uploadError
      : undefined;
  function clearDraft() {
    form.reset({
      title: '',
      folderId: 'root',
      departmentIds: [],
      dutyRoleCodes: [],
      kind: 'markdown',
      markdown: '',
    });
    setFile(null);
    setUploaded(null);
    uploadKeyRef.current = null;
  }
  const busy = command.busy || uploading,
    dirty = form.formState.isDirty || !!file || !!uploaded,
    guard = useKnowledgeGuard(busy, dirty),
    kind = useWatch({ control: form.control, name: 'kind' }),
    departments = useWatch({ control: form.control, name: 'departmentIds' }),
    dutyRoles = useWatch({ control: form.control, name: 'dutyRoleCodes' });
  useRouteFormCloseGuard(guard.beforeClose);
  const cancel = async () => {
    if (await guard.beforeClose())
      void navigate(
        { pathname: '..', search: location.search },
        { replace: true },
      );
  };
  async function upload() {
    if (!file || lockedRef.current) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (
      file.size <= 0 ||
      file.size > MAX_BYTES ||
      !ext ||
      !ACCEPT.split(',').includes(`.${ext}`)
    ) {
      setValidation(t('knowledge.fileLimit'));
      fileInputRef.current?.focus();
      return;
    }
    lockedRef.current = true;
    setUploading(true);
    setValidation('');
    setUploadError(undefined);
    if (uploadKeyRef.current?.file !== file)
      uploadKeyRef.current = { file, key: createRequestKey() };
    const body = new FormData();
    body.append('file', file);
    body.append('requestKey', uploadKeyRef.current.key);
    try {
      const r = await api.request<{ data: FileMetadata }>({
        path: 'knowledge/files',
        method: 'POST',
        body,
        signal: controllerRef.current.signal,
      });
      if (!controllerRef.current.signal.aborted) setUploaded(r.data);
    } catch (e) {
      if (!controllerRef.current.signal.aborted) {
        setUploadError(e);
        if (isDenied(e)) clearDraft();
      }
    } finally {
      lockedRef.current = false;
      if (!controllerRef.current.signal.aborted) setUploading(false);
    }
  }
  if (deniedError) return <KnowledgeError error={deniedError} />;
  return (
    <>
      <form
        id='knowledge-document-form'
        className='flex flex-col gap-6'
        onChange={guard.markUnsaved}
        onSubmit={(event) => {
          guard.markUnsaved();
          void form.handleSubmit(async (v) => {
            if (v.kind === 'file' && !uploaded && (!!file || !latest?.fileId)) {
              setValidation(t('knowledge.uploadRequired'));
              fileInputRef.current?.focus();
              return;
            }
            setValidation('');
            const body = {
              ...(detail
                ? {
                    id: detail.document.id,
                    expectedVersion: detail.document.version,
                  }
                : {}),
              title: v.title,
              folderId: v.folderId === 'root' ? null : v.folderId,
              departmentIds: v.departmentIds,
              dutyRoleCodes: v.dutyRoleCodes,
              kind: v.kind,
              ...(v.kind === 'markdown'
                ? { markdown: v.markdown }
                : { fileId: uploaded?.id ?? latest?.fileId }),
            };
            const result = await command.execute<{ data: Detail }>(
              'knowledge/documents',
              'POST',
              body,
            );
            if (result) {
              guard.markSaved();
              parent.reload();
              toaster.show({
                type: 'success',
                title: t('knowledge.published', { name: v.title }),
              });
              void navigate(
                { pathname: '..', search: location.search },
                { replace: true },
              );
            }
          })(event);
        }}
      >
        {command.error ? (
          <>
            <KnowledgeError error={command.error} />
            {statusOf(command.error) === 409 && detail ? (
              <Button
                variant='outline'
                className='w-fit'
                type='button'
                disabled={busy}
                onClick={() => setCas(true)}
              >
                {t('knowledge.loadLatest')}
              </Button>
            ) : null}
          </>
        ) : null}
        <FieldGroup>
          <Field data-invalid={!!form.formState.errors.title}>
            <FieldLabel htmlFor='knowledge-title'>
              {t('knowledge.titleField')}{' '}
              <span aria-hidden='true' className='text-destructive'>
                *
              </span>
            </FieldLabel>
            <Input
              id='knowledge-title'
              disabled={busy}
              {...form.register('title')}
              aria-invalid={!!form.formState.errors.title}
              aria-describedby='knowledge-title-error'
            />
            <FieldError id='knowledge-title-error'>
              {form.formState.errors.title?.message}
            </FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor='knowledge-folder'>
              {t('knowledge.folder')}
            </FieldLabel>
            <Controller
              control={form.control}
              name='folderId'
              render={({ field }) => (
                <Select
                  disabled={busy}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id='knowledge-folder'
                    aria-invalid={!!form.formState.errors.folderId}
                    aria-describedby='knowledge-folder-error'
                    ref={field.ref}
                    onBlur={field.onBlur}
                  >
                    <SelectValue>
                      {field.value === 'root'
                        ? t('knowledge.unfiled')
                        : (options.folders.find((f) => f.id === field.value)
                            ?.title ?? t('knowledge.restrictedOption'))}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                    <SelectGroup>
                      <SelectItem value='root'>
                        {t('knowledge.unfiled')}
                      </SelectItem>
                      {options.folders.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.title}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError id='knowledge-folder-error'>
              {form.formState.errors.folderId?.message}
            </FieldError>
          </Field>
          <Audience
            error={form.formState.errors.departmentIds?.message}
            name='departmentIds'
            kind='department'
            documentId={detail?.document.id}
            selected={options.selected.departments}
            values={departments}
            disabled={busy}
            change={(v) =>
              form.setValue('departmentIds', v, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
          <Audience
            error={form.formState.errors.dutyRoleCodes?.message}
            name='dutyRoleCodes'
            kind='dutyRole'
            documentId={detail?.document.id}
            selected={options.selected.dutyRoles}
            values={dutyRoles}
            disabled={busy}
            change={(v) =>
              form.setValue('dutyRoleCodes', v, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
          {options.restrictedSelected ? (
            <FieldDescription>
              {t('knowledge.restrictedSelected', {
                count: options.restrictedSelected,
              })}
            </FieldDescription>
          ) : null}
          <FieldDescription>{t('knowledge.audienceHint')}</FieldDescription>
          <Field>
            <FieldLabel htmlFor='knowledge-kind'>
              {t('knowledge.kind')}{' '}
              <span aria-hidden='true' className='text-destructive'>
                *
              </span>
            </FieldLabel>
            <Controller
              control={form.control}
              name='kind'
              render={({ field }) => (
                <Select
                  disabled={busy}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id='knowledge-kind'
                    ref={field.ref}
                    onBlur={field.onBlur}
                  >
                    <SelectValue>
                      {t(`knowledge.kinds.${field.value}`)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                    <SelectGroup>
                      {(['markdown', 'file'] as const).map((k) => (
                        <SelectItem key={k} value={k}>
                          {t(`knowledge.kinds.${k}`)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          {kind === 'markdown' ? (
            <Field data-invalid={!!form.formState.errors.markdown}>
              <FieldLabel htmlFor='knowledge-markdown'>
                {t('knowledge.markdown')}
              </FieldLabel>
              <Textarea
                id='knowledge-markdown'
                className='min-h-64'
                disabled={busy}
                {...form.register('markdown')}
                aria-invalid={!!form.formState.errors.markdown}
                aria-describedby='knowledge-markdown-error'
              />
              <FieldDescription>{t('knowledge.markdownHint')}</FieldDescription>
              <FieldError id='knowledge-markdown-error'>
                {form.formState.errors.markdown?.message}
              </FieldError>
            </Field>
          ) : (
            <Field>
              <FieldLabel htmlFor='knowledge-file'>
                {t('knowledge.file')}{' '}
                <span aria-hidden='true' className='text-destructive'>
                  *
                </span>
              </FieldLabel>
              <Input
                id='knowledge-file'
                ref={fileInputRef}
                type='file'
                accept={ACCEPT}
                disabled={busy}
                aria-invalid={
                  !!validation ||
                  fieldViolationsOf(command.error).includes('fileId')
                }
                aria-describedby='knowledge-file-hint knowledge-file-error'
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setUploaded(null);
                  uploadKeyRef.current = null;
                  setValidation('');
                }}
              />
              <FieldDescription id='knowledge-file-hint'>
                {t('knowledge.fileLimit')}
              </FieldDescription>
              {latest?.fileId && !file ? (
                <p>{t('knowledge.retainFile')}</p>
              ) : null}
              <Button
                variant='outline'
                className='w-fit'
                type='button'
                disabled={busy || !file || !!uploaded}
                onClick={() => void upload()}
              >
                {t(uploading ? 'knowledge.uploading' : 'knowledge.upload')}
              </Button>
              {uploaded ? (
                <p role='status'>
                  {t('knowledge.uploadedNotPublished', {
                    name: uploaded.filename,
                  })}
                </p>
              ) : null}
              {uploadError ? (
                <KnowledgeError
                  error={uploadError}
                  retry={() => void upload()}
                />
              ) : null}
              <FieldError id='knowledge-file-error'>
                {validation ||
                  (fieldViolationsOf(command.error).includes('fileId')
                    ? t('knowledge.invalidField')
                    : '')}
              </FieldError>
            </Field>
          )}
        </FieldGroup>

        <FormActions>
          <Button
            type='button'
            variant='outline'
            disabled={busy}
            onClick={() => void cancel()}
          >
            {t('knowledge.cancel')}
          </Button>
          <Button
            type='submit'
            form='knowledge-document-form'
            disabled={
              busy ||
              (kind === 'file' && !uploaded && (!!file || !latest?.fileId))
            }
          >
            {t(busy ? 'knowledge.saving' : 'knowledge.publishVersion')}
          </Button>
        </FormActions>
      </form>
      <KnowledgeDiscard
        guard={guard}
        name={
          detail?.document.title ??
          (form.getValues('title') || t('knowledge.new'))
        }
      />
      <AlertDialog open={cas} onOpenChange={setCas}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('knowledge.reloadNamed', {
                name:
                  detail?.document.title ??
                  (form.getValues('title') || t('knowledge.new')),
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('knowledge.replaceDraft')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('knowledge.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              onClick={() => {
                reload();
                setCas(false);
              }}
            >
              {t('knowledge.loadLatest')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
function Audience({
  error,
  name,
  kind,
  documentId,
  selected,
  values,
  disabled,
  change,
}: {
  error?: string;
  name: string;
  kind: 'department' | 'dutyRole';
  documentId?: string;
  selected: Options['selected']['departments'];
  values: string[];
  disabled: boolean;
  change: (v: string[]) => void;
}) {
  const { t } = useTranslation(),
    [search, setSearch] = useState(''),
    [draftSearch, setDraftSearch] = useState(''),
    [composing, setComposing] = useState(false),
    [page, setPage] = useState(1),
    r = useKnowledgeResource<{ data: Options }>('knowledge/formOptions', {
      ...(documentId ? { documentId } : {}),
      kind,
      search,
      page: String(page),
    }),
    [cache, setCache] = useState<{
      identity: string;
      data?: { data: Options };
      items: Options['selected']['departments'];
    }>({ identity: '', items: [] });
  const identity = JSON.stringify([documentId, kind]);
  if (r.data && cache.data !== r.data) {
    setCache({ identity, data: r.data, items: r.data.data.audience.items });
  }
  const items = [
    ...selected,
    ...(r.data?.data.audience.items ??
      (cache.identity === identity ? cache.items : [])),
  ].filter((v, i, a) => a.findIndex((x) => x.id === v.id) === i);
  useEffect(() => {
    if (composing) return;
    const timer = window.setTimeout(() => {
      setSearch(draftSearch);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [draftSearch, composing]);
  return (
    <fieldset
      id={`knowledge-audience-${name}`}
      tabIndex={-1}
      aria-invalid={!!error}
      aria-describedby={`knowledge-audience-${name}-error`}
      className='flex flex-col gap-3'
      disabled={disabled}
    >
      <legend className='mb-2 font-medium'>
        {t(`knowledge.${kind === 'department' ? 'departments' : 'dutyRoles'}`)}
      </legend>
      <Input
        aria-label={t(
          `knowledge.${kind === 'department' ? 'searchDepartments' : 'searchDutyRoles'}`,
        )}
        placeholder={t(
          `knowledge.${kind === 'department' ? 'searchDepartments' : 'searchDutyRoles'}`,
        )}
        value={draftSearch}
        onCompositionStart={() => setComposing(true)}
        onCompositionEnd={(e) => {
          setDraftSearch(e.currentTarget.value);
          setComposing(false);
        }}
        onChange={(e) => setDraftSearch(e.target.value)}
      />
      {r.error ? (
        <KnowledgeError error={r.error} retry={r.reload} />
      ) : r.loading && !items.length ? (
        <KnowledgeSkeleton />
      ) : items.length ? (
        items.map((item) => (
          <label key={item.id} className='flex min-h-11 items-center gap-3'>
            <Checkbox
              id={`${name}-${item.id}`}
              disabled={
                disabled || (values.length >= 100 && !values.includes(item.id))
              }
              checked={values.includes(item.id)}
              onCheckedChange={(v) =>
                change(
                  v
                    ? [...values.filter((x) => x !== item.id), item.id]
                    : values.filter((x) => x !== item.id),
                )
              }
            />
            {item.title}
          </label>
        ))
      ) : (
        <p>{t('knowledge.noOptions')}</p>
      )}
      <FieldError id={`knowledge-audience-${name}-error`}>{error}</FieldError>
      <div className='flex flex-wrap gap-2'>
        <Button
          type='button'
          variant='outline'
          disabled={disabled || r.loading || page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          {t('knowledge.previous')}
        </Button>
        <span className='self-center'>
          {t('knowledge.optionPage', { page })}
        </span>
        <Button
          type='button'
          variant='outline'
          disabled={
            disabled ||
            r.loading ||
            page * 20 >= (r.data?.data.audience.total ?? 0)
          }
          onClick={() => setPage((p) => p + 1)}
        >
          {t('knowledge.next')}
        </Button>
      </div>
    </fieldset>
  );
}
