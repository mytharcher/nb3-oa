import { BusinessAttachmentList } from '#components/business-attachment-list';
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
export function QualificationAttachments({
  recordId,
  ids,
  refreshKey = 0,
}: {
  recordId: string;
  ids: readonly string[];
  refreshKey?: number;
}) {
  const api = useApiClient(),
    { t } = useTranslation();
  const [result, setResult] = useState<{
    key: string;
    files?: EvidenceFile[];
    error?: unknown;
  }>();
  const [generation, setGeneration] = useState(0);
  const key = JSON.stringify([recordId, ids, generation, refreshKey]);
  useEffect(() => {
    if (!ids.length) return;
    const controller = new AbortController();
    api
      .request<{ data: EvidenceFile[] }>({
        method: 'POST',
        path: 'vendorQualificationAttachments/findMany',
        headers: {
          'x-vendor-qualification-id': recordId,
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
          limit: 10,
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
  }, [api, key, recordId, ids]);
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
    return <span>{t('vendorQualifications.files.evidenceMissing')}</span>;
  return (
    <BusinessAttachmentList
      files={result.files?.filter((file) => ids.includes(file.id)) ?? []}
    />
  );
}
export function QualificationAttachmentEditor({
  recordId,
  ids,
  onChange,
  ensureDraft,
  disabled,
  onBusyChange,
  id,

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
  const fileKey = JSON.stringify([recordId ?? resolvedId ?? '']);
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
      setValidation(t('vendorQualifications.files.fileSize'));
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
      setValidation(t('vendorQualifications.files.fileType'));
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
        path: 'vendorQualificationAttachments/uploadOne',
        headers: {
          'x-vendor-qualification-id': savedId,
        },
        body,
      });
      onChange([...new Set([...ids, data.record.id])]);
      setFileResult((old) => ({
        key: JSON.stringify([savedId]),
        files: [
          ...(old?.key === JSON.stringify([savedId]) ? old.files : []).filter(
            (f) => f.id !== data.record.id,
          ),
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
      for (let offset = 0; ; offset += 10) {
        const { data } = await api.request<{ data: EvidenceFile[] }>({
          method: 'POST',
          path: 'vendorQualificationAttachments/findMany',
          headers: {
            'x-vendor-qualification-id': savedId,
          },
          json: { limit: 10, offset },
        });
        all.push(...data);
        if (data.length < 10) break;
      }
      setFileResult({ key: JSON.stringify([savedId]), files: all });
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
        {t('vendorQualifications.files.attachments')} *
      </FieldLabel>
      <FieldDescription>
        {t('vendorQualifications.files.uploadHint')}
      </FieldDescription>
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
        {t('vendorQualifications.files.selectEvidence')}
      </Button>
      {busy ? (
        <FieldDescription role='status'>
          {t('vendorQualifications.files.uploading')}
        </FieldDescription>
      ) : null}
      {unknownUpload ? (
        <FieldDescription role='status'>
          {t('vendorQualifications.files.uploadUnknown')}
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
              {t('vendorQualifications.files.emptyEvidence')}
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
        <QualificationAttachments recordId={recordId} ids={ids} />
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
          {t('vendorQualifications.files.removeEvidence', {
            name:
              files.find((f) => f.id === selected)?.filename ??
              String(index + 1),
          })}
        </Button>
      ))}
    </Field>
  );
}
