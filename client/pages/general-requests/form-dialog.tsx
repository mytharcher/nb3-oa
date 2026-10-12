import {
  useRequestFormSubmission,
  preventComposingSubmit,
} from '#hooks/use-request-form-submission';
import {
  RequestFormButtons,
  RequestSubmissionFeedback,
} from '#components/request-form-submission';
import { Minus } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useOutletContext, useParams } from 'react-router';
import { z } from 'zod';
import { RouteDrawer } from '#components/route-drawer';
import { useRouteOverlay } from '#components/use-route-overlay';
import { UserPicker } from '#components/user-picker';
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
import { Alert, AlertDescription } from '#components/ui/alert';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '#components/ui/alert-dialog';
import { FieldsSkeleton } from '../platform/shared/states.js';
import { useResource } from '../approvals/use-resource.js';
import { createRequestId } from '../approvals/request-id.js';
import { ErrorState } from './states.js';
import { GeneralAttachmentEditor } from './attachments.js';
import type {
  GeneralRequestDetail,
  GeneralRequestRecord,
  SourceContext,
  DetailContext,
} from './types.js';
export default function GeneralFormDialog() {
  const { requestId } = useParams();
  const { t } = useTranslation();
  const parent = useOutletContext<SourceContext & Partial<DetailContext>>();
  const parentReload = parent.reload;
  const resource = useResource<GeneralRequestDetail>(
    requestId ? `generalRequests/${encodeURIComponent(requestId)}` : null,
  );
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const dirtyRef = useRef(false);
  const [done, setDone] = useState(false);
  const [discard, setDiscard] = useState(false);
  const resolveCloseRef = useRef<((allowed: boolean) => void) | null>(null);
  const submit = useCan({
    resource: { type: 'composite', id: 'oa.general' },
    action: 'submit',
  }).can;
  const delegate = useCan({
    resource: { type: 'composite', id: 'oa.general' },
    action: 'delegate',
  }).can;
  const pick = useCan({
    resource: { type: 'user', id: '*' },
    action: 'read',
  }).can;
  const allowed = requestId
    ? resource.data?.view.available.some((a) => a.name === 'edit' && a.allowed)
    : submit || delegate;
  useEffect(() => {
    if (
      resource.error instanceof ApiClientError &&
      resource.error.status === 404
    )
      parentReload();
  }, [resource.error, parentReload]);
  return (
    <RouteDrawer
      printable
      className='text-sm sm:max-w-2xl'
      title={t(requestId ? 'general.edit' : 'general.new')}
      description={t('general.formDescription')}
      beforeClose={() => {
        if (busyRef.current) return false;
        if (!dirtyRef.current) return true;
        setDiscard(true);
        return new Promise<boolean>((resolve) => {
          resolveCloseRef.current = resolve;
        });
      }}
      footer={
        <FormFooter
          revision={resource.data?.record.status === 'revision'}
          busy={busy}
          disabled={
            done || !allowed || !pick || resource.loading || !!resource.error
          }
        />
      }
    >
      {resource.error ? (
        <ErrorState error={resource.error} retry={resource.reload} />
      ) : requestId && !resource.data ? (
        <FieldsSkeleton fields={5} />
      ) : (
        <GeneralForm
          key={
            resource.data
              ? `${resource.data.record.id}:${resource.data.record.lifecycleVersion}`
              : 'new'
          }
          detail={resource.data}
          allowed={!!allowed}
          canPick={pick}
          reload={resource.reload}
          onBusy={(value) => {
            busyRef.current = value;
            setBusy(value);
          }}
          onDirty={(value) => {
            dirtyRef.current = value;
          }}
          onDone={() => setDone(true)}
        />
      )}
      <AlertDialog
        open={discard}
        onOpenChange={(open) => {
          if (!open) {
            setDiscard(false);
            resolveCloseRef.current?.(false);
            resolveCloseRef.current = null;
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
            <AlertDialogCancel>{t('approvals.cancel')}</AlertDialogCancel>
            <Button
              variant='destructive'
              onClick={() => {
                dirtyRef.current = false;
                setDiscard(false);
                resolveCloseRef.current?.(true);
                resolveCloseRef.current = null;
              }}
            >
              {t('approvals.discardConfirm')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RouteDrawer>
  );
}
function FormFooter({
  busy,
  disabled,
  revision,
}: {
  busy: boolean;
  disabled: boolean;
  revision?: boolean;
}) {
  const { close } = useRouteOverlay();
  const { t } = useTranslation();
  return (
    <>
      <Button variant='outline' disabled={busy} onClick={() => void close()}>
        {t('approvals.cancel')}
      </Button>
      <RequestFormButtons
        revision={revision}
        resource='oa.general'
        form='general-form'
        busy={busy}
        disabled={disabled}
      />
    </>
  );
}
function GeneralForm({
  detail,
  allowed,
  canPick,
  reload,
  onBusy,
  onDirty,
  onDone,
}: {
  detail?: GeneralRequestDetail;
  allowed: boolean;
  canPick: boolean;
  reload: () => void;
  onBusy: (v: boolean) => void;
  onDirty: (v: boolean) => void;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const { close } = useRouteOverlay();
  const { session } = useAuthentication();
  const parent = useOutletContext<SourceContext & Partial<DetailContext>>();
  const delegate = useCan({
    resource: { type: 'composite', id: 'oa.general' },
    action: 'delegate',
  }).can;
  const [error, setError] = useState<unknown>();
  const [uncertain, setUncertain] = useState(false);
  const uncertainRef = useRef(false);
  const runningRef = useRef(false);
  const draftRef = useRef<GeneralRequestRecord | undefined>(detail?.record);
  const attemptRef = useRef<{ key: string; requestId: string } | null>(null);
  const [draft, setDraft] = useState<GeneralRequestRecord | undefined>(
    detail?.record,
  );
  const [attachments, setAttachments] = useState<string[]>(
    detail?.record.attachments ?? [],
  );
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const submission = useRequestFormSubmission<GeneralRequestRecord>({
    resource: 'generalRequests',
  });
  const schema = useMemo(
    () =>
      z
        .object({
          applicantId: z.string(),
          title: z
            .string()
            .trim()
            .min(1, t('approvals.required'))
            .max(255, t('approvals.limit')),
          body: z
            .string()
            .trim()
            .min(1, t('approvals.required'))
            .max(50000, t('approvals.limit')),
          extraApproverIds: z
            .array(z.string().min(1, t('approvals.required')))
            .min(1, t('general.approversInvalid'))
            .max(3, t('general.approversInvalid'))
            .refine(
              (v) => new Set(v).size === v.length,
              t('general.approversInvalid'),
            ),
        })
        .refine(
          (value) =>
            !value.extraApproverIds.includes(
              draft?.applicantId ??
                (value.applicantId || session?.user.id || ''),
            ),
          {
            message: t('general.approversInvalid'),
            path: ['extraApproverIds'],
          },
        ),
    [t, draft?.applicantId, session?.user],
  );
  const form = useForm({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      applicantId: '',
      title: detail?.record.title ?? '',
      body: detail?.record.body ?? '',
      extraApproverIds: detail?.record.extraApproverIds ?? [''],
    },
  });
  const extras = useWatch({ control: form.control, name: 'extraApproverIds' });
  const dirty =
    form.formState.isDirty ||
    JSON.stringify(attachments) !==
      JSON.stringify(detail?.record.attachments ?? []);
  useEffect(() => onDirty(dirty && !saved), [onDirty, dirty, saved]);
  const busy = form.formState.isSubmitting || uploading;
  async function ensureDraft(): Promise<string> {
    if (draftRef.current) return draftRef.current.id;
    if (uncertainRef.current) throw new Error('Uncertain creation result');
    if (!allowed || !canPick || !(await form.trigger()))
      throw new Error('Invalid general draft');
    const { applicantId, ...input } = form.getValues();
    try {
      const response = await api.request<{
        data: { record: GeneralRequestRecord };
      }>({
        method: 'POST',
        path: 'generalRequests',
        json: {
          ...input,
          attachments: [],
          ...(delegate && applicantId && applicantId !== session?.user.id
            ? { applicantId }
            : {}),
        },
      });
      draftRef.current = response.data.record;
      setDraft(response.data.record);
      parent.reload();
      return response.data.record.id;
    } catch (failure) {
      setError(failure);
      if (!(failure instanceof ApiClientError) || failure.status >= 500) {
        uncertainRef.current = true;
        setUncertain(true);
        onDone();
        parent.reload();
      }
      throw failure;
    }
  }
  async function save(values: z.infer<typeof schema>) {
    if (
      !allowed ||
      !canPick ||
      runningRef.current ||
      uploading ||
      uncertainRef.current
    )
      return;
    runningRef.current = true;
    onBusy(true);
    setError(undefined);
    try {
      const { applicantId, ...input } = values;
      const savedRecord = await submission.save(
        { input, attachments, applicantId },
        draftRef.current,
        async (existing) => {
          let result: GeneralRequestRecord;
          if (existing) {
            const payload = { ...input, attachments };
            const key = JSON.stringify({
              version: existing.lifecycleVersion,
              input: payload,
            });
            if (attemptRef.current?.key !== key)
              attemptRef.current = { key, requestId: createRequestId() };
            const response = await api.request<{
              data: { record: GeneralRequestRecord };
            }>({
              method: 'POST',
              path: `generalRequests/${existing.id}/transition`,
              json: {
                transition: 'edit',
                version: existing.lifecycleVersion,
                requestId: attemptRef.current.requestId,
                input: payload,
              },
            });
            result = response.data.record;
          } else {
            await ensureDraft();
            result = draftRef.current!;
          }
          draftRef.current = result;
          setDraft(result);
          return result;
        },
      );
      const result = await submission.finish(savedRecord);
      draftRef.current = result;
      setDraft(result);
      setSaved(true);
      onDone();
      form.reset(values);
      onDirty(false);
      parent.update?.(result);
      parent.reload();
      toaster.show({
        type: 'success',
        title: t(
          submission.intent.current === 'submit'
            ? 'approvals.submitted'
            : 'approvals.saved',
          {
            name: result.number ?? t('approvals.draft'),
          },
        ),
      });
      runningRef.current = false;
      onBusy(false);
      await close();
    } catch (failure) {
      if (
        failure instanceof ApiClientError &&
        failure.reason === 'GENERAL_APPROVERS_INVALID'
      ) {
        form.setError('extraApproverIds', {
          message: t('general.approversInvalid'),
        });
        document.getElementById('general-approver-0')?.focus();
      } else setError(failure);
    } finally {
      runningRef.current = false;
      onBusy(false);
    }
  }
  return (
    <>
      {!allowed ? (
        <Alert>
          <AlertDescription>{t('approvals.readOnly')}</AlertDescription>
        </Alert>
      ) : null}
      {!canPick ? (
        <Alert>
          <AlertDescription>
            {t('approvals.noPickerPermission')}
          </AlertDescription>
        </Alert>
      ) : null}
      {uncertain ? (
        <Alert>
          <AlertDescription>{t('general.uncertainCreate')}</AlertDescription>
        </Alert>
      ) : error ? (
        <ErrorState error={error} retry={reload} />
      ) : null}
      <RequestSubmissionFeedback
        failed={submission.submitFailed}
        unknown={submission.submitUnknown}
      />
      <form
        id='general-form'
        onSubmitCapture={submission.captureIntent}
        onKeyDown={preventComposingSubmit}
        onSubmit={(event) =>
          void form.handleSubmit(save, (errors) => {
            if (!errors.title && !errors.body && errors.extraApproverIds)
              document.getElementById('general-approver-0')?.focus();
          })(event)
        }
      >
        <FieldGroup inert={submission.submitUnknown || undefined}>
          {delegate && canPick && !detail ? (
            <Controller
              name='applicantId'
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor='general-applicant'>
                    {t('approvals.applicant')}
                  </FieldLabel>
                  <UserPicker
                    id='general-applicant'
                    value={field.value}
                    onChange={field.onChange}
                    disabled={
                      busy ||
                      uncertain ||
                      !allowed ||
                      !!submission.current.current
                    }
                  />
                </Field>
              )}
            />
          ) : null}
          <Field data-invalid={!!form.formState.errors.title}>
            <FieldLabel htmlFor='general-title'>
              {t('general.title')} *
            </FieldLabel>
            <Input
              id='general-title'
              {...form.register('title')}
              aria-invalid={!!form.formState.errors.title}
              disabled={busy || uncertain || !allowed}
            />
            <FieldError errors={[form.formState.errors.title]} />
          </Field>
          <Field data-invalid={!!form.formState.errors.body}>
            <FieldLabel htmlFor='general-body'>
              {t('general.body')} *
            </FieldLabel>
            <Textarea
              id='general-body'
              {...form.register('body')}
              aria-invalid={!!form.formState.errors.body}
              disabled={busy || uncertain || !allowed}
            />
            <FieldError errors={[form.formState.errors.body]} />
          </Field>
          <div className='flex flex-col gap-4'>
            <FieldDescription>{t('general.extraHint')}</FieldDescription>
            {extras.map((value, index) => (
              <Controller
                // These are fixed numbered positions, not identities; removing a reviewer shifts values between positions.
                // eslint-disable-next-line @eslint-react/no-array-index-key
                key={`approver-position-${index}`}
                name={`extraApproverIds.${index}`}
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`general-approver-${index}`}>
                      {t('general.approver', { number: index + 1 })} *
                    </FieldLabel>
                    <div className='flex items-center gap-2'>
                      <UserPicker
                        id={`general-approver-${index}`}
                        value={value}
                        onChange={field.onChange}
                        disabled={busy || uncertain || !allowed || !canPick}
                        knownUsers={detail?.users}
                        excludeIds={[
                          draft?.applicantId ?? session?.user.id ?? '',
                          ...extras.filter((_, i) => i !== index),
                        ]}
                      />
                      {extras.length > 1 ? (
                        <Button
                          type='button'
                          variant='outline'
                          disabled={busy || uncertain || !allowed}
                          aria-label={t('general.removeApprover', {
                            number: index + 1,
                          })}
                          onClick={() =>
                            form.setValue(
                              'extraApproverIds',
                              extras.filter((_, i) => i !== index),
                              {
                                shouldDirty: true,
                                shouldValidate: form.formState.isSubmitted,
                              },
                            )
                          }
                        >
                          <Minus />
                        </Button>
                      ) : null}
                    </div>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            ))}
            <FieldError
              errors={[
                form.formState.errors.extraApproverIds,
                form.formState.errors.extraApproverIds?.root,
              ]}
            />
            {extras.length < 3 ? (
              <Button
                type='button'
                variant='outline'
                className='self-start'
                disabled={busy || uncertain || !allowed || !canPick}
                onClick={() =>
                  form.setValue('extraApproverIds', [...extras, ''], {
                    shouldDirty: true,
                  })
                }
              >
                {t('general.addApprover')}
              </Button>
            ) : null}
          </div>
          <GeneralAttachmentEditor
            generalId={draft?.id}
            ids={attachments}
            onChange={setAttachments}
            ensureDraft={ensureDraft}
            disabled={busy || uncertain || !allowed || !canPick}
            onBusyChange={(value) => {
              setUploading(value);
              onBusy(value);
            }}
          />
        </FieldGroup>
      </form>
    </>
  );
}
