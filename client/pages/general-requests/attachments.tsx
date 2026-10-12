import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useReducer, useRef, useState } from 'react';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Field, FieldLabel, FieldDescription } from '#components/ui/field';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Skeleton } from '#components/ui/skeleton';
import { ErrorState } from './states.js';

interface Attachment {
  id: string;
  filename: string;
  ext: string;
  contentUrl: string;
}
/** Metadata and bytes both enforce the owning general request's current access policy. */
export function GeneralAttachments({
  generalId,
  ids,
}: {
  generalId: string;
  ids: readonly string[];
}) {
  const api = useApiClient();
  const { t } = useTranslation();
  const [generation, reload] = useReducer((v) => v + 1, 0);
  const idsKey = JSON.stringify(ids);
  const key = JSON.stringify([generalId, idsKey, generation]);
  const [result, setResult] = useState<{
    key: string;
    files?: Attachment[];
    error?: unknown;
  }>();
  useEffect(() => {
    if (idsKey === '[]') return;
    const controller = new AbortController();
    api
      .request<{ data: Attachment[] }>({
        method: 'POST',
        path: 'generalAttachments/findMany',
        headers: { 'x-general-request-id': generalId },
        json: {
          filter: {
            kind: 'filter',
            version: 1,
            root: {
              kind: 'group',
              logic: 'or',
              items: (JSON.parse(idsKey) as string[]).map((id) => ({
                kind: 'condition',
                path: ['id'],
                operator: '$eq',
                value: id,
              })),
            },
          },
          limit: 10,
        },
        signal: controller.signal,
      })
      .then(
        ({ data }) => {
          if (!controller.signal.aborted) setResult({ key, files: data });
        },
        (error: unknown) => {
          if (!controller.signal.aborted) setResult({ key, error });
        },
      );
    return () => controller.abort();
  }, [api, generalId, idsKey, key]);
  if (!ids.length) return <span>—</span>;
  if (result?.key !== key)
    return <Skeleton className='h-5 w-40' aria-label={t('status.loading')} />;
  if (result.error) return <ErrorState error={result.error} retry={reload} />;
  const files = result.files?.filter((file) => ids.includes(file.id)) ?? [];
  if (files.length !== ids.length)
    return <span>{t('approvals.attachmentMissing')}</span>;
  return (
    <ul className='flex flex-col gap-2'>
      {files.map((file) => (
        <li key={file.id}>
          <a
            href={file.contentUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='break-all text-primary underline underline-offset-4'
          >
            {file.filename}
            {file.ext ? `.${file.ext}` : ''}
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Uploads stay draft-owned; removing a selection never deletes stored proof. */
export function GeneralAttachmentEditor({
  generalId,
  ids,
  onChange,
  ensureDraft,
  disabled,
  onBusyChange,
}: {
  generalId?: string;
  ids: readonly string[];
  onChange: (ids: string[]) => void;
  ensureDraft: () => Promise<string>;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
}) {
  const api = useApiClient();
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const lockedRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  async function upload(file: File) {
    if (lockedRef.current || disabled) return;
    setError(undefined);
    if (!file.size || file.size > 5 * 1024 * 1024) {
      setError(t('approvals.attachmentSize'));
      return;
    }
    const types: Record<string, string> = {
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
    };
    if (types[file.name.split('.').at(-1)?.toLowerCase() ?? ''] !== file.type) {
      setError(t('approvals.attachmentType'));
      return;
    }
    if (ids.length >= 10) {
      setError(t('approvals.attachmentCount'));
      return;
    }
    lockedRef.current = true;
    setBusy(true);
    onBusyChange(true);
    try {
      const id = generalId ?? (await ensureDraft());
      const body = new FormData();
      body.append('file', file);
      const { data } = await api.request<{ data: { record: Attachment } }>({
        method: 'POST',
        path: 'generalAttachments/uploadOne',
        headers: { 'x-general-request-id': id },
        body,
      });
      onChange([...ids, data.record.id]);
    } catch (cause) {
      const reason = cause instanceof ApiClientError ? cause.reason : undefined;
      setError(
        t(
          reason === 'GENERAL_FILE_SIZE' || reason === 'BODY_TOO_LARGE'
            ? 'approvals.attachmentSize'
            : reason === 'GENERAL_FILE_TYPE'
              ? 'approvals.attachmentType'
              : reason === 'GENERAL_ATTACHMENT_DENIED'
                ? 'approvals.attachmentDenied'
                : 'approvals.attachmentFailed',
        ),
      );
    } finally {
      lockedRef.current = false;
      setBusy(false);
      onBusyChange(false);
    }
  }
  return (
    <Field>
      <FieldLabel htmlFor='general-file'>{t('approvals.attachments')}</FieldLabel>
      <FieldDescription>{t('approvals.attachmentLimit')}</FieldDescription>
      <Input
        ref={inputRef}
        id='general-file'
        type='file'
        accept='.pdf,.jpg,.jpeg,.png,.webp'
        disabled={disabled || busy || ids.length >= 10}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) void upload(file);
        }}
      />
      {busy ? (
        <FieldDescription role='status'>
          {t('approvals.attachmentUploading')}
        </FieldDescription>
      ) : null}
      {error ? (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {generalId && ids.length ? (
        <GeneralAttachments generalId={generalId} ids={ids} />
      ) : null}
      {ids.map((id, index) => (
        <Button
          key={id}
          type='button'
          variant='outline'
          size='sm'
          disabled={disabled || busy}
          onClick={() => {
            onChange(ids.filter((selected) => selected !== id));
            inputRef.current?.focus();
          }}
        >
          {t('approvals.attachmentRemove', { number: index + 1 })}
        </Button>
      ))}
    </Field>
  );
}
