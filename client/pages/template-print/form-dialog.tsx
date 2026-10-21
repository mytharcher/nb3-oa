import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '#components/ui/alert-dialog';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useOutletContext, useParams } from 'react-router';
import { RouteDrawer } from '#components/route-drawer';
import { useRouteOverlay } from '#components/use-route-overlay';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Spinner } from '#components/ui/spinner';
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
  FieldDescription,
} from '#components/ui/field';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '#components/ui/select';
import { Alert, AlertDescription } from '#components/ui/alert';
import { isDenied, useResource } from './resource.js';
import { useCommand, fileHash } from './command.js';
import {
  RESOURCE,
  SOURCES,
  supported,
  writable,
  selectWidth,
  type Context,
  type Detail,
  type Template,
  type Source,
} from './types.js';
import { ErrorState, Loading } from './states.js';
export default function FormDialog({ upload = false }: { upload?: boolean }) {
  const { templateId } = useParams();
  const { session } = useAuthentication();
  const { t } = useTranslation();
  const workingRef = useRef(false);
  const [state, setState] = useState({
    ready: false,
    busy: false,
    label: upload ? 'upload' : templateId ? 'save' : 'create',
  });
  return (
    <RouteDrawer
      title={t(
        `templatePrintUI.${upload ? 'uploadTitle' : templateId ? 'editTitle' : 'new'}`,
      )}
      className='sm:max-w-2xl'
      beforeClose={() => !workingRef.current}
      footer={<FormFooter {...state} />}
    >
      <Form
        key={`${session?.user.id ?? ''}:${templateId ?? 'new'}:${upload}`}
        templateId={templateId}
        upload={upload}
        workingRef={workingRef}
        onState={setState}
      />
    </RouteDrawer>
  );
}
function Form({
  templateId,
  upload,
  workingRef,
  onState,
}: {
  templateId?: string;
  upload: boolean;
  workingRef: React.MutableRefObject<boolean>;
  onState: (state: { ready: boolean; busy: boolean; label: string }) => void;
}) {
  const { t } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const { close } = useRouteOverlay();
  const context = useOutletContext<Context>();
  const grant = useCan({
    resource: { type: 'composite', id: RESOURCE },
    action: 'manage',
  });
  const allowed = grant.can && !grant.error && !grant.isPending;
  const r = useResource<{ data: Detail }>(
    templateId && allowed ? `printTemplates/${templateId}` : null,
    { mode: 'manage' },
  );
  const cmd = useCommand(
    `${upload ? 'upload' : templateId ? 'edit' : 'new'}:${templateId ?? ''}`,
  );
  const record = r.data?.data.record;
  const [name, setName] = useState('');
  const [source, setSource] = useState<Source>('leave');
  const [file, setFile] = useState<File>();
  const [validation, setValidation] = useState<Record<string, string>>({});
  const [prefilled, setPrefilled] = useState(false);
  const [verificationError, setVerificationError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [preparationError, setPreparationError] = useState<unknown>();
  const [abandon, setAbandon] = useState(false);
  const busy = submitting || cmd.busy;
  const nameRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const fatal =
    !allowed ||
    isDenied(cmd.error) ||
    isDenied(r.error) ||
    isDenied(preparationError);
  const ready =
    allowed &&
    !fatal &&
    !r.error &&
    !r.loading &&
    (!templateId || writable(record)) &&
    (!upload ||
      (r.data?.data.sourceReady === true && supported(record?.source)));
  const hydrate =
    cmd.pending?.requestKey ??
    (record && !prefilled ? record.id + ':' + record.version : '');
  const [hydrated, setHydrated] = useState('');
  if (hydrate && hydrate !== hydrated) {
    setHydrated(hydrate);
    setName(
      cmd.pending
        ? typeof cmd.pending.json?.name === 'string'
          ? cmd.pending.json.name
          : ''
        : (record?.name ?? ''),
    );
    if (supported(cmd.pending?.json?.source))
      setSource(cmd.pending.json.source);
    if (record) setPrefilled(true);
  }
  const [previousFatal, setPreviousFatal] = useState(false);
  if (fatal !== previousFatal) {
    setPreviousFatal(fatal);
  }
  if (fatal && !previousFatal) {
    setName('');
    setFile(undefined);
  }
  const invalidate = r.invalidate;
  useEffect(() => {
    if (isDenied(cmd.error)) invalidate(cmd.error);
  }, [cmd.error, invalidate]);
  useEffect(() => {
    if (r.error instanceof ApiClientError && r.error.status === 404) {
      toaster.show({ type: 'info', title: t('templatePrintUI.missing') });
      context?.reload?.();
      void close().then(() =>
        requestAnimationFrame(() =>
          document
            .querySelector<HTMLElement>('[data-print-management-focus]')
            ?.focus(),
        ),
      );
    }
  }, [r.error, context, close, t, toaster]);
  const pending = cmd.pending;
  useEffect(() => {
    onState({
      ready: ready && !verificationError,
      busy,
      label: pending
        ? 'retry'
        : upload
          ? 'upload'
          : templateId
            ? 'save'
            : 'create',
    });
  }, [onState, ready, verificationError, busy, pending, upload, templateId]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!ready || workingRef.current) return;
    const errors: Record<string, string> = {};
    if (upload) {
      if (
        !file ||
        file.size <= 0 ||
        file.size > 5 * 1024 * 1024 ||
        !/\.docx$/i.test(file.name)
      )
        errors.file = t('templatePrintUI.invalidFile');
    } else if (!pending && (!name.trim() || name.trim().length > 120))
      errors.name = t('templatePrintUI.invalidName');
    if (!upload && !templateId && !supported(source))
      errors.source = t('templatePrintUI.invalidSource');
    setValidation(errors);
    if (Object.keys(errors).length) {
      (errors.name ? nameRef : fileRef).current?.focus();
      return;
    }
    workingRef.current = true;
    setSubmitting(true);
    setPreparationError(undefined);
    try {
      let result:
        | {
            data: {
              record: Template;
              revision?: { id: string; contentHash: string };
            };
          }
        | undefined;
      if (upload) {
        const hash = await fileHash(file!);
        result = await cmd.execute(
          {
            method: 'POST',
            path: `printTemplates/${templateId}/revisions`,
            file: {
              name: file!.name,
              size: file!.size,
              hash,
              version: record!.version!,
            },
          },
          file,
        );
      } else
        result = await cmd.execute({
          method: templateId ? 'PATCH' : 'POST',
          path: templateId ? `printTemplates/${templateId}` : 'printTemplates',
          json: templateId
            ? {
                version: record!.version,
                name: name.trim(),
                active: record!.active,
              }
            : { name: name.trim(), source },
        });
      if (!result) return;
      context?.onSaved?.(result.data.record);
      context?.reload?.();
      if (upload) {
        try {
          const latest = await api.request<{ data: Detail }>({
            path: `printTemplates/${templateId}`,
            query: { mode: 'manage' },
          });
          if (
            !result.data.revision ||
            !latest.data.revisions.some(
              (v) =>
                v.id === result.data.revision!.id &&
                v.contentHash === result.data.revision!.contentHash,
            )
          )
            throw new Error('Revision readback mismatch');
        } catch (error) {
          if (isDenied(error)) {
            r.invalidate(error);
            setPreparationError(error);
          }
          setVerificationError(true);
          setFile(undefined);
          return;
        }
      }
      toaster.show({
        type: 'success',
        title: t(
          `templatePrintUI.${upload ? 'uploaded' : templateId ? 'saved' : 'created'}`,
          { name: result.data.record.name ?? name },
        ),
      });
      workingRef.current = false;
      void close();
    } catch (error) {
      setPreparationError(error);
      if (isDenied(error)) r.invalidate(error);
    } finally {
      setSubmitting(false);
      workingRef.current = false;
    }
  }
  return (
    <form
      id='print-template-form'
      onSubmit={(e) => {
        void submit(e);
      }}
      className='flex flex-col gap-4'
    >
      {!allowed && !grant.isPending ? (
        <Alert variant='destructive'>
          <AlertDescription>{t('templatePrintUI.forbidden')}</AlertDescription>
        </Alert>
      ) : null}
      {r.loading || grant.isPending ? <Loading /> : null}
      {r.error ? (
        <ErrorState
          error={r.error}
          retry={() => {
            setPrefilled(false);
            r.reload();
          }}
        />
      ) : null}
      {preparationError ? <ErrorState error={preparationError} /> : null}
      {cmd.error && cmd.error !== r.error ? (
        <ErrorState
          error={cmd.error}
          retry={() => {
            setPrefilled(false);
            r.reload();
          }}
        />
      ) : null}
      {pending ? (
        <Alert>
          <AlertDescription>
            {t('templatePrintUI.unknown')}
            {upload ? ' ' + t('templatePrintUI.sameFile') : null}
            <Button
              type='button'
              variant='outline'
              disabled={busy}
              onClick={() => setAbandon(true)}
            >
              {t('templatePrintUI.abandon')}
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      {verificationError ? (
        <Alert>
          <AlertDescription>
            {t('templatePrintUI.readbackFailed')}
          </AlertDescription>
          <Button
            variant='outline'
            type='button'
            onClick={() => {
              context?.reload?.();
              r.reload();
            }}
          >
            {t('templatePrintUI.refresh')}
          </Button>
        </Alert>
      ) : null}
      <AlertDialog open={abandon} onOpenChange={setAbandon}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('templatePrintUI.abandonPendingTitle', {
                name: name || t('templatePrintUI.new'),
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('templatePrintUI.abandonPendingDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>
              {t('templatePrintUI.cancel')}
            </AlertDialogCancel>
            <Button
              type='button'
              variant='destructive'
              disabled={busy}
              onClick={() => {
                cmd.abandon();
                setAbandon(false);
                setFile(undefined);
                if (fileRef.current) fileRef.current.value = '';
              }}
            >
              {t('templatePrintUI.abandon')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {!upload && (!templateId || record) && !fatal ? (
        <FieldGroup>
          <Field data-invalid={!!validation.name}>
            <FieldLabel htmlFor='print-template-name'>
              {t('templatePrintUI.name')}{' '}
              <span aria-hidden='true' className='text-destructive'>
                *
              </span>
            </FieldLabel>
            <Input
              id='print-template-name'
              ref={nameRef}
              value={name}
              disabled={!ready || busy || !!pending}
              aria-invalid={!!validation.name}
              aria-describedby={
                validation.name ? 'print-name-error' : undefined
              }
              onChange={(e) => {
                setName(e.target.value);
                if (validation.name)
                  setValidation((v) => ({
                    ...v,
                    name:
                      e.target.value.trim() &&
                      e.target.value.trim().length <= 120
                        ? ''
                        : t('templatePrintUI.invalidName'),
                  }));
              }}
            />
            {validation.name ? (
              <FieldError id='print-name-error'>{validation.name}</FieldError>
            ) : null}
          </Field>
          {!templateId ? (
            <Field>
              <FieldLabel htmlFor='print-template-source'>
                {t('templatePrintUI.source')}{' '}
                <span aria-hidden='true' className='text-destructive'>
                  *
                </span>
              </FieldLabel>
              <Select
                items={Object.fromEntries(
                  SOURCES.map((s) => [
                    s,
                    t(`templatePrintUI.sourceLabels.${s}`),
                  ]),
                )}
                value={source}
                onValueChange={(v) => {
                  if (supported(v)) setSource(v);
                }}
                disabled={!ready || busy || !!pending}
              >
                <SelectTrigger id='print-template-source'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={selectWidth}>
                  <SelectGroup>
                    {SOURCES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(`templatePrintUI.sourceLabels.${s}`)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          ) : null}
        </FieldGroup>
      ) : null}
      {upload && !fatal ? (
        <FieldGroup>
          <Field data-invalid={!!validation.file}>
            <FieldLabel htmlFor='print-template-file'>
              {t('templatePrintUI.file')}{' '}
              <span aria-hidden='true' className='text-destructive'>
                *
              </span>
            </FieldLabel>
            <Input
              id='print-template-file'
              ref={fileRef}
              type='file'
              accept='.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              disabled={!ready || busy || verificationError}
              aria-invalid={!!validation.file}
              aria-describedby='print-file-help print-file-error'
              onChange={(e) => {
                setFile(e.target.files?.[0]);
                if (validation.file) setValidation((v) => ({ ...v, file: '' }));
              }}
            />
            <FieldDescription id='print-file-help'>
              {t('templatePrintUI.fileHelp')}
            </FieldDescription>
            {validation.file ? (
              <FieldError id='print-file-error'>{validation.file}</FieldError>
            ) : null}
          </Field>
        </FieldGroup>
      ) : null}
      {!ready && !r.loading && !r.error && allowed && !fatal ? (
        <p className='text-sm text-muted-foreground'>
          {t(
            upload && !r.data?.data.sourceReady
              ? 'templatePrintUI.sourceUnavailable'
              : 'templatePrintUI.unreadable',
          )}
        </p>
      ) : null}
    </form>
  );
}

function FormFooter({
  ready,
  busy,
  label,
}: {
  ready: boolean;
  busy: boolean;
  label: string;
}) {
  const { t } = useTranslation();
  const { close } = useRouteOverlay();
  return (
    <>
      <Button
        type='button'
        variant='outline'
        disabled={busy}
        onClick={() => void close()}
      >
        {t('templatePrintUI.cancel')}
      </Button>
      <Button
        type='submit'
        form='print-template-form'
        disabled={!ready || busy}
      >
        {busy ? <Spinner /> : null}
        {t(`templatePrintUI.${label}`)}
      </Button>
    </>
  );
}
