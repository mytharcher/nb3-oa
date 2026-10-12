import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useRef, useState } from 'react';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Checkbox } from '#components/ui/checkbox';
import { Field, FieldLabel, FieldDescription } from '#components/ui/field';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Skeleton } from '#components/ui/skeleton';
import { ErrorState } from './states.js';
export interface EvidenceFile {
  id: string;
  filename: string;
  ext: string;
  contentUrl: string;
}

/** The guarded repository supplies both metadata and secure byte URLs; no public file route is constructed. */
export function PaymentAttachments({
  recordId,
  ids,
  refreshKey = 0,
  purpose = 'invoice',
}: {
  recordId: string;
  ids: readonly string[];
  refreshKey?: number;
  purpose?: 'invoice' | 'voucher';
}) {
  const api = useApiClient(),
    { t } = useTranslation();
  const [result, setResult] = useState<{
    key: string;
    files?: EvidenceFile[];
    error?: unknown;
  }>();
  const [generation, setGeneration] = useState(0);
  const key = JSON.stringify([recordId, ids, generation, refreshKey, purpose]);
  useEffect(() => {
    if (!ids.length) return;
    const controller = new AbortController();
    api
      .request<{ data: EvidenceFile[] }>({
        method: 'POST',
        path: 'paymentAttachments/findMany',
        headers: {
          'x-payment-request-id': recordId,
          'x-payment-file-purpose': purpose,
        },
        json: {
          filter: {
            kind: 'filter',
            version: 1,
            root: {
              kind: 'group',
              logic: 'or',
              items: ids.map((id) => ({
                kind: 'condition',
                path: ['id'],
                operator: '$eq',
                value: id,
              })),
            },
          },
          limit: 100,
        },
        signal: controller.signal,
      })
      .then(
        ({ data }) => {
          if (!controller.signal.aborted) setResult({ key, files: data });
        },
        (error) => {
          if (!controller.signal.aborted) setResult({ key, error });
        },
      );
    return () => controller.abort();
  }, [api, key, recordId, ids, purpose]);
  if (!ids.length) return <span>—</span>;
  if (result?.key !== key)
    return <Skeleton className='h-5 w-full' aria-label={t('status.loading')} />;
  if (result.error)
    return (
      <ErrorState
        error={result.error}
        retry={() => setGeneration((v) => v + 1)}
      />
    );
  if (
    (result.files?.filter((file) => ids.includes(file.id)).length ?? 0) !==
    ids.length
  )
    return <span>{t('paymentRequestsForm.evidenceMissing')}</span>;
  return (
    <ul className='flex flex-col gap-2'>
      {result.files
        ?.filter((f) => ids.includes(f.id))
        .map((f) => (
          <li key={f.id}>
            <a
              href={f.contentUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='break-all text-primary underline'
            >
              {f.filename}
              {f.ext ? `.${f.ext}` : ''}
            </a>
          </li>
        ))}
    </ul>
  );
}
export function PaymentAttachmentEditor({
  recordId,
  ids,
  onChange,
  ensureDraft,
  disabled,
  onBusyChange,
  id,
  purpose = 'invoice',
  invalid,
  focusRef,
}: {
  recordId?: string;
  invalid?: boolean;
  focusRef?: (node: HTMLInputElement | null) => void;
  ids: readonly string[];
  onChange: (ids: string[]) => void;
  ensureDraft: () => Promise<string>;
  disabled: boolean;
  onBusyChange: (v: boolean) => void;
  id: string;
  purpose?: 'invoice' | 'voucher';
}) {
  const api = useApiClient(),
    { t } = useTranslation(),
    inputRef = useRef<HTMLInputElement>(null),
    lockRef = useRef(false);
  const [resolvedId, setResolvedId] = useState<string>();
  const [unknownUpload, setUnknownUpload] = useState(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(),
    [validation, setValidation] = useState<string>(),
    [fileResult, setFileResult] = useState<{
      key: string;
      files: EvidenceFile[];
    }>(),
    [show, setShow] = useState(false);
  const fileKey = JSON.stringify([recordId ?? resolvedId ?? '', purpose]);
  const files = fileResult?.key === fileKey ? fileResult.files : [];
  function working(v: boolean) {
    lockRef.current = v;
    setBusy(v);
    onBusyChange(v);
  }
  async function upload(file: File) {
    if (lockRef.current || disabled || unknownUpload) return;
    setError(undefined);
    setValidation(undefined);
    if (!file.size || file.size > 5 * 1024 * 1024) {
      setValidation(t('paymentRequestsForm.fileSize'));
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
      setValidation(t('paymentRequestsForm.fileType'));
      return;
    }
    working(true);
    try {
      const savedId = recordId ?? resolvedId ?? (await ensureDraft());
      setResolvedId(savedId);
      const body = new FormData();
      body.append('file', file);
      const { data } = await api.request<{ data: { record: EvidenceFile } }>({
        method: 'POST',
        path: 'paymentAttachments/uploadOne',
        headers: {
          'x-payment-request-id': savedId,
          'x-payment-file-purpose': purpose,
        },
        body,
      });
      onChange([...new Set([...ids, data.record.id])]);
      setFileResult((old) => ({
        key: JSON.stringify([savedId, purpose]),
        files: [
          ...(old?.key === JSON.stringify([savedId, purpose])
            ? old.files
            : []
          ).filter((f) => f.id !== data.record.id),
          data.record,
        ],
      }));
    } catch (cause) {
      if (!(cause instanceof ApiClientError) || cause.status >= 500)
        setUnknownUpload(true);
      setError(cause);
    } finally {
      working(false);
    }
  }
  async function choose() {
    if (lockRef.current || disabled) return;
    working(true);
    setError(undefined);
    try {
      const savedId = recordId ?? resolvedId ?? (await ensureDraft());
      setResolvedId(savedId);
      const all: EvidenceFile[] = [];
      for (let offset = 0; ; offset += 100) {
        const { data } = await api.request<{ data: EvidenceFile[] }>({
          method: 'POST',
          path: 'paymentAttachments/findMany',
          headers: {
            'x-payment-request-id': savedId,
            'x-payment-file-purpose': purpose,
          },
          json: { limit: 100, offset },
        });
        all.push(...data);
        if (data.length < 100) break;
      }
      setFileResult({ key: JSON.stringify([savedId, purpose]), files: all });
      setUnknownUpload(false);
      setShow(true);
    } catch (cause) {
      setError(cause);
    } finally {
      working(false);
    }
  }
  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={id}>
        {t(
          purpose === 'voucher'
            ? 'paymentRequestsForm.voucherAttachments'
            : 'paymentRequestsForm.attachments',
        )}{' '}
        *
      </FieldLabel>
      <FieldDescription>{t('paymentRequestsForm.uploadHint')}</FieldDescription>
      <Input
        ref={(node) => {
          inputRef.current = node;
          focusRef?.(node);
        }}
        aria-invalid={invalid}
        id={id}
        type='file'
        accept='.pdf,.jpg,.jpeg,.png,.webp'
        disabled={disabled || busy || unknownUpload}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) void upload(file);
        }}
      />
      <Button
        type='button'
        variant='outline'
        disabled={disabled || busy}
        onClick={() => void choose()}
      >
        {t('paymentRequestsForm.selectEvidence')}
      </Button>
      {busy ? (
        <FieldDescription role='status'>
          {t('paymentRequestsForm.uploading')}
        </FieldDescription>
      ) : null}
      {unknownUpload ? (
        <FieldDescription role='status'>
          {t('paymentRequestsForm.uploadUnknown')}
        </FieldDescription>
      ) : null}
      {validation ? (
        <Alert variant='destructive'>
          <AlertDescription>{validation}</AlertDescription>
        </Alert>
      ) : null}
      {error ? <ErrorState error={error} retry={() => void choose()} /> : null}
      {show ? (
        <div className='flex flex-col gap-2'>
          {!files.length ? (
            <FieldDescription>
              {t('paymentRequestsForm.emptyEvidence')}
            </FieldDescription>
          ) : (
            files.map((file) => (
              <label
                key={file.id}
                className='flex items-center gap-2 break-all'
              >
                <Checkbox
                  checked={ids.includes(file.id)}
                  disabled={disabled || busy}
                  onCheckedChange={(checked) =>
                    onChange(
                      checked
                        ? [...new Set([...ids, file.id])]
                        : ids.filter((v) => v !== file.id),
                    )
                  }
                />
                {file.filename}
                {file.ext ? `.${file.ext}` : ''}
              </label>
            ))
          )}
        </div>
      ) : null}
      {recordId && ids.length ? (
        <PaymentAttachments recordId={recordId} ids={ids} purpose={purpose} />
      ) : null}
      {ids.map((selected, index) => (
        <Button
          key={selected}
          type='button'
          variant='outline'
          disabled={disabled || busy}
          onClick={() => {
            onChange(ids.filter((v) => v !== selected));
            inputRef.current?.focus();
          }}
        >
          {t('paymentRequestsForm.removeEvidence', {
            name:
              files.find((f) => f.id === selected)?.filename ??
              String(index + 1),
          })}
        </Button>
      ))}
    </Field>
  );
}
