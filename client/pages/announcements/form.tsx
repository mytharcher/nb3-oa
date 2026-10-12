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
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { RouteFormPage } from '#components/route-form-page';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Textarea } from '#components/ui/textarea';
import { Checkbox } from '#components/ui/checkbox';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldDescription,
} from '#components/ui/field';
import { DateTimePicker } from '#components/date-time-picker';
import { DepartmentPicker } from '#components/department-picker';
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
import { useAnnouncementResource, isDenied } from './resource.js';
import { useAnnouncementCommand } from './command.js';
import { useAnnouncementGuard } from './use-guard.js';
import { AnnouncementDiscard } from './guard.js';
import { Failure, Loading } from './states.js';
import { OptionSelect } from './select.js';
import { Attachments } from './files.js';
import {
  resource,
  type Announcement,
  type Detail,
  type Options,
  type Context,
} from './types.js';
import type { Document } from '../knowledge/types.js';
import { statusOf, fieldViolationsOf } from '../platform/shared/errors.js';
export default function AnnouncementForm() {
  const { announcementId } = useParams(),
    { t } = useTranslation(),
    create = useCan({ resource, action: 'create' }),
    edit = useCan({ resource, action: 'edit' });
  const detail = useAnnouncementResource<{ data: Detail }>(
      announcementId
        ? `announcements/${encodeURIComponent(announcementId)}`
        : null,
    ),
    options = useAnnouncementResource<{ data: Options }>(
      'announcements/context',
    );
  const ready =
    options.data &&
    !options.loading &&
    !options.error &&
    (!announcementId
      ? create.can && !create.isPending && !create.error
      : detail.data?.data.capabilities.actions.includes('edit') &&
        !detail.loading &&
        !detail.error &&
        edit.can &&
        !edit.isPending &&
        !edit.error);
  return (
    <RouteFormPage
      title={t(announcementId ? 'announcements.edit' : 'announcements.new')}
    >
      <PageContainer>
        {detail.error ? (
          <Failure error={detail.error} retry={detail.reload} />
        ) : null}
        {options.error ? (
          <Failure error={options.error} retry={options.reload} />
        ) : null}
        {detail.loading || options.loading ? (
          <Loading />
        ) : ready ? (
          <Fields
            key={detail.data?.data.version ?? 'new'}
            row={detail.data?.data}
            options={options.data!.data}
            reload={detail.invalidate}
          />
        ) : (
          <p>{t('announcements.unavailable')}</p>
        )}
      </PageContainer>
    </RouteFormPage>
  );
}
function Fields({
  row,
  options,
  reload,
}: {
  row?: Detail;
  options: Options;
  reload: () => void;
}) {
  const { t } = useTranslation(),
    api = useApiClient(),
    navigate = useNavigate(),
    location = useLocation(),
    parent = useOutletContext<Context>(),
    toaster = useToaster();
  const [initialTime] = useState(() => Date.now());
  const schema = z
    .object({
      title: z
        .string()
        .trim()
        .min(1, t('announcements.required'))
        .max(200, t('announcements.titleLimit')),
      body: z
        .string()
        .refine((v) => v.trim().length > 0, t('announcements.required'))
        .max(100000, t('announcements.bodyLimit')),
      all: z.boolean(),
      departmentIds: z.array(z.string()).max(500),
      dutyRoleCodes: z.array(z.string()).max(100),
      requiresConfirmation: z.boolean(),
      pinned: z.boolean(),
      validFrom: z
        .string()
        .refine(
          (v) => Number.isFinite(Date.parse(v)),
          t('announcements.invalidDate'),
        ),
      validUntil: z
        .string()
        .refine(
          (v) => Number.isFinite(Date.parse(v)),
          t('announcements.invalidDate'),
        ),
      knowledgeDocumentId: z.string(),
      attachments: z.array(z.string()).max(10),
    })
    .refine(
      (v) => v.all || v.departmentIds.length + v.dutyRoleCodes.length > 0,
      { path: ['all'], message: t('announcements.audienceRequired') },
    )
    .refine(
      (v) =>
        Date.parse(v.validUntil) > Date.parse(v.validFrom) &&
        Date.parse(v.validUntil) > initialTime,
      { path: ['validUntil'], message: t('announcements.invalidInterval') },
    );
  const form = useForm({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      title: row?.title ?? '',
      body: row?.body ?? '',
      all: row?.audience.all ?? false,
      departmentIds: row?.audience.departmentIds ?? [],
      dutyRoleCodes: row?.audience.dutyRoleCodes ?? [],
      requiresConfirmation: row?.requiresConfirmation ?? false,
      pinned: row?.pinned ?? false,
      validFrom: row?.validFrom ?? new Date(initialTime).toISOString(),
      validUntil:
        row?.validUntil ?? new Date(initialTime + 7 * 86400000).toISOString(),
      knowledgeDocumentId: row?.knowledgeLink?.documentId ?? '',
      attachments: row?.attachments ?? [],
    },
  });
  const [department, setDepartment] = useState(''),
    [departmentNames, setDepartmentNames] = useState<Record<string, string>>(
      {},
    ),
    [uploading, setUploading] = useState(false),
    [replace, setReplace] = useState(false),
    [uploadRefreshError, setUploadRefreshError] = useState<unknown>();
  const command = useAnnouncementCommand(() => form.reset()),
    values = useWatch({ control: form.control }),
    busy = command.busy || uploading,
    guard = useAnnouncementGuard(busy, form.formState.isDirty);
  const knowledgeGrant = useCan({
      resource: { type: 'composite', id: 'oa.knowledgeDocuments' },
      action: 'view',
    }),
    knowledgeAllowed =
      knowledgeGrant.can && !knowledgeGrant.isPending && !knowledgeGrant.error;
  const docs = useAnnouncementResource<{
    data: Document[];
    meta: { total: number };
  }>(knowledgeAllowed ? 'knowledge/documents' : null, {
    page: '1',
    pageSize: '100',
  });
  const controllerRef = useRef(new AbortController());
  useEffect(() => {
    controllerRef.current = new AbortController();
    return () => controllerRef.current.abort();
  }, []);
  useEffect(() => {
    for (const name of fieldViolationsOf(command.error)) {
      const field = name === 'audience' ? 'all' : name;
      if (
        [
          'title',
          'body',
          'all',
          'validFrom',
          'validUntil',
          'knowledgeDocumentId',
          'attachments',
        ].includes(field)
      )
        form.setError(
          field as keyof z.infer<typeof schema>,
          { message: t('announcements.invalidField') },
          { shouldFocus: true },
        );
    }
  }, [command.error, form, t]);
  const cas = statusOf(command.error) === 409;
  const closeTo = {
    pathname: '..',
    search: location.search,
    hash: location.hash,
  };
  async function saved(v: z.infer<typeof schema>) {
    if (cas || busy || uploadRefreshError) return;
    if (Date.parse(v.validUntil) <= Date.now()) {
      form.setError(
        'validUntil',
        { message: t('announcements.invalidInterval') },
        { shouldFocus: true },
      );
      return;
    }
    const result = await command.execute<{ data: Announcement }>(
      row ? `announcements/${encodeURIComponent(row.id)}` : 'announcements',
      row ? 'PATCH' : 'POST',
      {
        title: v.title,
        body: v.body,
        audience: {
          all: v.all,
          departmentIds: v.departmentIds,
          dutyRoleCodes: v.dutyRoleCodes,
        },
        requiresConfirmation: v.requiresConfirmation,
        pinned: v.pinned,
        attachments: v.attachments,
        validFrom: v.validFrom,
        validUntil: v.validUntil,
        ...(knowledgeAllowed &&
        (!row || form.formState.dirtyFields.knowledgeDocumentId)
          ? { knowledgeDocumentId: v.knowledgeDocumentId || null }
          : {}),
        ...(row ? { expectedVersion: row.version } : {}),
      },
    );
    if (result) {
      if (row)
        parent.updateDetail?.({
          ...row,
          ...result.data,
          capabilities: { ...row.capabilities, actions: [] },
        });
      guard.markSaved();
      form.reset(v);
      parent.reload();
      toaster.show({
        type: 'success',
        title: t('announcements.saved', { name: v.title }),
      });
      void navigate(closeTo, { replace: true });
    }
  }
  if (isDenied(command.error)) return <Failure error={command.error} />;
  return (
    <>
      <PageHeader
        title={t(row ? 'announcements.edit' : 'announcements.new')}
        description={t('announcements.zoneHint', { zone: options.timeZone })}
        actions={
          <>
            <Button
              variant='outline'
              disabled={busy}
              onClick={() => {
                void Promise.resolve(guard.beforeClose()).then((ok) => {
                  if (ok) void navigate(closeTo, { replace: true });
                });
              }}
            >
              {t('announcements.cancel')}
            </Button>
            <Button
              type='submit'
              form='announcement-form'
              disabled={busy || cas || !!uploadRefreshError}
            >
              {t(busy ? 'announcements.saving' : 'announcements.save')}
            </Button>
          </>
        }
      />
      <form
        id='announcement-form'
        onSubmit={(e) => void form.handleSubmit(saved)(e)}
      >
        <FieldGroup>
          {command.error ? <Failure error={command.error} /> : null}
          {(['title', 'body'] as const).map((name) => (
            <Field key={name} data-invalid={!!form.formState.errors[name]}>
              <FieldLabel htmlFor={`announcement-${name}`}>
                {t(`announcements.fields.${name}`)} *
              </FieldLabel>
              {name === 'title' ? (
                <Input
                  id={`announcement-${name}`}
                  {...form.register(name)}
                  disabled={busy}
                  aria-invalid={!!form.formState.errors[name]}
                  aria-describedby={`announcement-${name}-error`}
                />
              ) : (
                <Textarea
                  id={`announcement-${name}`}
                  {...form.register(name)}
                  disabled={busy}
                  aria-invalid={!!form.formState.errors[name]}
                  aria-describedby={`announcement-${name}-error`}
                  rows={8}
                />
              )}
              <FieldError id={`announcement-${name}-error`}>
                {form.formState.errors[name]?.message}
              </FieldError>
            </Field>
          ))}
          <FieldDescription>{t('announcements.freezeHint')}</FieldDescription>
          <Controller
            control={form.control}
            name='all'
            render={({ field, fieldState }) => (
              <Field>
                <label className='flex min-h-11 items-center gap-3'>
                  <Checkbox
                    id='announcement-all'
                    ref={field.ref}
                    aria-invalid={fieldState.invalid}
                    aria-describedby='announcement-all-error'
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={busy}
                  />
                  {t('announcements.allEmployees')}
                </label>
                <FieldError
                  id='announcement-all-error'
                  errors={[fieldState.error]}
                />
              </Field>
            )}
          />
          <Field>
            <FieldLabel htmlFor='announcement-department'>
              {t('announcements.departments')}
            </FieldLabel>
            <DepartmentPicker
              id='announcement-department'
              value={department}
              disabled={busy}
              onChange={(id, option) => {
                setDepartment(id);
                if (id && !values.departmentIds?.includes(id)) {
                  form.setValue(
                    'departmentIds',
                    [...(values.departmentIds ?? []), id],
                    { shouldDirty: true },
                  );
                  if (option)
                    setDepartmentNames((old) => ({
                      ...old,
                      [id]: option.title,
                    }));
                  setDepartment('');
                }
              }}
            />
            {values.departmentIds?.map((id) => (
              <Button
                key={id}
                type='button'
                variant='outline'
                disabled={busy}
                onClick={() =>
                  form.setValue(
                    'departmentIds',
                    values.departmentIds!.filter((v) => v !== id),
                    { shouldDirty: true },
                  )
                }
              >
                {departmentNames[id] ?? t('announcements.selectedDepartment')} ·{' '}
                {t('announcements.remove')}
              </Button>
            ))}
          </Field>
          <Field>
            <FieldLabel>{t('announcements.dutyRoles')}</FieldLabel>
            {options.dutyRoles ? (
              <>
                {options.dutyRoles.map((role) => (
                  <label
                    key={role.code}
                    className='flex min-h-11 items-center gap-3'
                  >
                    <Checkbox
                      checked={
                        values.dutyRoleCodes?.includes(role.code) ?? false
                      }
                      disabled={busy}
                      onCheckedChange={(v) =>
                        form.setValue(
                          'dutyRoleCodes',
                          v
                            ? [
                                ...(values.dutyRoleCodes ?? []).filter(
                                  (c) => c !== role.code,
                                ),
                                role.code,
                              ]
                            : (values.dutyRoleCodes ?? []).filter(
                                (c) => c !== role.code,
                              ),
                          { shouldDirty: true },
                        )
                      }
                    />
                    {typeof role.title === 'string'
                      ? role.title
                      : t(role.title.key, { ns: role.title.ns })}
                  </label>
                ))}
              </>
            ) : (
              <FieldDescription>
                {t('announcements.rolesUnavailable')}
              </FieldDescription>
            )}
          </Field>
          {(['requiresConfirmation', 'pinned'] as const).map((name) => (
            <Controller
              key={name}
              control={form.control}
              name={name}
              render={({ field }) => (
                <label className='flex min-h-11 items-center gap-3'>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={busy}
                  />
                  {t(`announcements.${name}`)}
                </label>
              )}
            />
          ))}
          {(['validFrom', 'validUntil'] as const).map((name) => (
            <Controller
              key={name}
              name={name}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor={`announcement-${name}`}>
                    {t(`announcements.fields.${name}`)} *
                  </FieldLabel>
                  <DateTimePicker
                    id={`announcement-${name}`}
                    value={field.value}
                    onChange={field.onChange}
                    timeZone={options.timeZone}
                    disabled={busy}
                    invalid={fieldState.invalid}
                    timeLabel={t(`announcements.fields.${name}`)}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          ))}
          {knowledgeAllowed ? (
            <Field>
              <FieldLabel>{t('announcements.knowledge')}</FieldLabel>
              {docs.error ? (
                <Failure error={docs.error} retry={docs.reload} />
              ) : (
                <OptionSelect
                  label={t('announcements.knowledge')}
                  value={values.knowledgeDocumentId || 'none'}
                  disabled={busy || docs.loading}
                  items={[
                    { value: 'none', label: t('announcements.none') },
                    ...(docs.data?.data
                      .filter((d) => d.active)
                      .map((d) => ({ value: d.id, label: d.title })) ?? []),
                  ]}
                  change={(v) =>
                    form.setValue(
                      'knowledgeDocumentId',
                      v === 'none' ? '' : v,
                      { shouldDirty: true },
                    )
                  }
                />
              )}
              {(docs.data?.meta.total ?? 0) > 100 ? (
                <FieldDescription>
                  {t('announcements.knowledgeLimit')}
                </FieldDescription>
              ) : null}
            </Field>
          ) : row?.knowledgeLink ? (
            <FieldDescription>
              {t('announcements.knowledgeRetained')}
            </FieldDescription>
          ) : null}
          {row ? (
            <>
              <Attachments
                announcementId={row.id}
                selected={values.attachments ?? []}
                disabled={busy || cas}
                change={(ids) =>
                  form.setValue('attachments', ids, { shouldDirty: true })
                }
                uploadingChanged={setUploading}
                uploaded={async () => {
                  try {
                    const latest = await api.request<{ data: Detail }>({
                      path: `announcements/${encodeURIComponent(row.id)}`,
                      signal: controllerRef.current.signal,
                    });
                    if (!controllerRef.current.signal.aborted) {
                      if (!latest.data.capabilities.actions.includes('edit'))
                        throw new Error('denied');
                      if (latest.data.version !== row.version)
                        throw new ApiClientError(
                          'Version changed during upload',
                          {
                            status: 409,
                            method: 'GET',
                            url: `/api/announcements/${row.id}`,
                          },
                        );
                      setUploadRefreshError(undefined);
                    }
                  } catch (e) {
                    if (!controllerRef.current.signal.aborted)
                      setUploadRefreshError(e);
                    throw e;
                  }
                }}
              />
              {uploadRefreshError ? (
                <Failure error={uploadRefreshError} />
              ) : null}
            </>
          ) : (
            <FieldDescription>
              {t('announcements.saveBeforeUpload')}
            </FieldDescription>
          )}
          {cas || uploadRefreshError ? (
            <Button
              type='button'
              variant='outline'
              disabled={busy}
              onClick={() => setReplace(true)}
            >
              {t('announcements.loadLatest')}
            </Button>
          ) : null}
        </FieldGroup>
      </form>
      <AnnouncementDiscard
        guard={guard}
        name={values.title || t('announcements.new')}
      />
      <AlertDialog open={replace} onOpenChange={setReplace}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('announcements.loadLatest')} — {values.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('announcements.replaceDraft')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('announcements.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                reload();
                setReplace(false);
              }}
            >
              {t('announcements.loadLatest')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
