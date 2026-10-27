import { FileUploadInput } from '#components/file-upload-input';
import { BusinessAttachmentList } from '#components/business-attachment-list';
import { finalRefusal, uncertainError } from './errors.js';
import { validFile } from './file-model.js';
import { useEffect, useRef, useState } from 'react';
import { useApiClient, ApiClientError } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useTranslation } from '@nocobase/i18n/client';
import { Button } from '#components/ui/button';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Field, FieldLabel, FieldDescription } from '#components/ui/field';
import { ErrorState, Loading } from './shared.js';
export interface FileRecord {
  id: string;
  filename: string;
  ext: string;
  contentUrl: string;
  size?: number;
  createdAt?: string;
}
interface SelectedText {
  textVersion: {
    id: string;
    requestId: string;
    fileId: string;
    version: number;
  } | null;
}
const headers = (id: string, purpose: 'text' | 'evidence') => ({
  'x-contract-request-id': id,
  'x-contract-file-purpose': purpose,
});
/** Both the immutable mapping and metadata are guarded by the owning application. Ledger access alone cannot reveal a file URL. */
export function SecureFiles({
  requestId,
  ids = [],
  text = false,
  refreshKey = 0,
}: {
  requestId: string;
  ids?: readonly string[];
  text?: boolean;
  refreshKey?: number;
}) {
  const api = useApiClient(),
    { session } = useAuthentication(),
    { t } = useTranslation(),
    [generation, setGeneration] = useState(0);
  const idsKey = JSON.stringify(ids);
  const source = JSON.stringify([session?.user.id, requestId, ids, text]),
    key = JSON.stringify([source, refreshKey, generation]);
  const [result, setResult] = useState<{
    key: string;
    files?: FileRecord[];
    error?: unknown;
  }>();
  useEffect(() => {
    const c = new AbortController();
    async function read() {
      let selected = JSON.parse(idsKey) as string[];
      if (text) {
        const { data } = await api.request<{ data: SelectedText }>({
          path: `contractRequests/${encodeURIComponent(requestId)}/textVersions`,
          signal: c.signal,
        });
        selected = data.textVersion ? [data.textVersion.fileId] : [];
      }
      if (!selected.length) return [];
      const { data } = await api.request<{ data: FileRecord[] }>({
        method: 'POST',
        path: 'contractAttachments/findMany',
        headers: headers(requestId, text ? 'text' : 'evidence'),
        json: {
          filter: {
            kind: 'filter',
            version: 1,
            root: {
              kind: 'group',
              logic: 'or',
              items: selected.map((id) => ({
                kind: 'condition',
                path: ['id'],
                operator: '$eq',
                value: id,
              })),
            },
          },
          limit: 10,
        },
        signal: c.signal,
      });
      if (data.length !== selected.length)
        throw new Error('Selected metadata is unavailable');
      return data.filter((f) => selected.includes(f.id));
    }
    void read().then(
      (files) => {
        if (!c.signal.aborted) setResult({ key, files });
      },
      (error: unknown) => {
        if (!c.signal.aborted) setResult({ key, error });
      },
    );
    return () => c.abort();
  }, [api, key, requestId, text, idsKey]);
  if (result?.key !== key) return <Loading fields={1} />;
  if (result.error)
    return result.error instanceof ApiClientError &&
      result.error.status === 403 ? (
      <Alert>
        <AlertDescription>{t('contracts.textDenied')}</AlertDescription>
      </Alert>
    ) : (
      <ErrorState
        error={result.error}
        retry={() => setGeneration((v) => v + 1)}
      />
    );
  return result.files?.length ? (
    <BusinessAttachmentList files={result.files} />
  ) : (
    <span>—</span>
  );
}
/** Unknown multipart results never retry the upload. The actor-scoped marker survives remount, and only explicit selection of stored evidence unblocks it. */
export function FileEditor({
  requestId,
  ensureRequest,
  purpose,
  disabled,
  onChoose,
  onBusy,
}: {
  requestId?: string;
  ensureRequest?: () => Promise<string>;
  purpose: 'text' | 'evidence';
  disabled: boolean;
  onChoose: (file: FileRecord) => Promise<void>;
  onBusy: (busy: boolean) => void;
}) {
  const api = useApiClient(),
    { session } = useAuthentication(),
    { t } = useTranslation(),
    actor = session?.user.id ?? '',
    marker = `oa:contracts:upload:${actor}:${requestId}:${purpose}`;
  const [unknown, setUnknown] = useState(
      () => sessionStorage.getItem(marker) !== null,
    ),
    [busy, setBusy] = useState(false),
    [blocked, setBlocked] = useState(false),
    [files, setFiles] = useState<FileRecord[] | null>(null),
    [error, setError] = useState<unknown>(),
    [invalid, setInvalid] = useState(false),
    lockRef = useRef(false),
    inputRef = useRef<HTMLInputElement>(null);
  function working(v: boolean) {
    lockRef.current = v;
    setBusy(v);
    onBusy(v);
  }
  async function choose(file: FileRecord) {
    if (lockRef.current || disabled || blocked) return;
    working(true);
    try {
      await onChoose(file);
      sessionStorage.removeItem(marker);
      setUnknown(false);
      setError(undefined);
    } catch (cause) {
      setError(cause);
      if (finalRefusal(cause)) {
        setFiles(null);
        setBlocked(true);
        sessionStorage.removeItem(marker);
      }
    } finally {
      working(false);
    }
  }
  async function upload(file: File) {
    if (lockRef.current || disabled || blocked || unknown) return;
    if (!validFile(file, purpose)) {
      setInvalid(true);
      inputRef.current?.focus();
      return;
    }
    setInvalid(false);
    working(true);
    setError(undefined);
    let uploaded: FileRecord | undefined;
    let uploadMarker = marker;
    try {
      const ownerId = requestId ?? (await ensureRequest?.());
      if (!ownerId) return;
      uploadMarker = `oa:contracts:upload:${actor}:${ownerId}:${purpose}`;
      sessionStorage.setItem(
        uploadMarker,
        JSON.stringify({
          actor,
          requestId: ownerId,
          purpose,
          name: file.name,
          size: file.size,
          type: file.type,
        }),
      );
      const body = new FormData();
      body.append('file', file);
      const { data } = await api.request<{ data: { record: FileRecord } }>({
        method: 'POST',
        path: 'contractAttachments/uploadOne',
        headers: headers(ownerId, purpose),
        body,
      });
      uploaded = data.record;
      sessionStorage.removeItem(uploadMarker);
      await onChoose(uploaded);
      setFiles((old) => [
        ...(old ?? []).filter((f) => f.id !== uploaded!.id),
        uploaded!,
      ]);
    } catch (cause) {
      setError(cause);
      if (!uploaded && uncertainError(cause)) setUnknown(true);
      else sessionStorage.removeItem(uploadMarker);
      if (finalRefusal(cause)) {
        setFiles(null);
        setBlocked(true);
        sessionStorage.removeItem(uploadMarker);
      }
    } finally {
      working(false);
    }
  }
  async function existing() {
    if (!requestId) return;
    if (lockRef.current || disabled || blocked) return;
    working(true);
    try {
      const all: FileRecord[] = [];
      for (let offset = 0; ; offset += 10) {
        const { data } = await api.request<{ data: FileRecord[] }>({
          method: 'POST',
          path: 'contractAttachments/findMany',
          headers: headers(requestId, purpose),
          json: { limit: 10, offset },
        });
        all.push(...data);
        if (data.length < 10) break;
      }
      setFiles(all);
      setError(
        undefined,
      ); /* Zero or ambiguous matches never establish that an uncertain upload did not persist. */
    } catch (cause) {
      setError(cause);
      if (finalRefusal(cause)) {
        setFiles(null);
        setBlocked(true);
        sessionStorage.removeItem(marker);
      }
    } finally {
      working(false);
    }
  }
  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={`contract-file-${purpose}`}>
        {t(
          purpose === 'text'
            ? 'contracts.textVersionId'
            : 'contracts.attachments',
        )}
      </FieldLabel>
      <FieldDescription>{t('contracts.uploadHint')}</FieldDescription>
      <FileUploadInput
        ref={inputRef}
        id={`contract-file-${purpose}`}
        accept={purpose === 'text' ? '.pdf' : '.pdf,.jpg,.jpeg,.png,.webp'}
        aria-invalid={invalid || undefined}
        disabled={disabled || blocked || busy || unknown}
        onFileChange={(file) => void upload(file)}
      />
      {invalid && (
        <Alert variant='destructive'>
          <AlertDescription>{t('contracts.fileInvalid')}</AlertDescription>
        </Alert>
      )}
      {unknown && (
        <Alert>
          <AlertDescription>{t('contracts.uploadUnknown')}</AlertDescription>
        </Alert>
      )}
      {error ? <ErrorState error={error} /> : null}
      <Button
        type='button'
        variant='outline'
        disabled={disabled || blocked || busy || !requestId}
        onClick={() => void existing()}
      >
        {t('contracts.selectExisting')}
      </Button>
      {files && (
        <div className='flex flex-col gap-2'>
          {files.length ? (
            files.map((file) => (
              <Button
                key={file.id}
                type='button'
                variant='outline'
                disabled={disabled || blocked || busy}
                onClick={() => void choose(file)}
              >
                {file.filename}
                {file.ext ? `.${file.ext}` : ''}
              </Button>
            ))
          ) : (
            <span>{t('contracts.noFiles')}</span>
          )}
        </div>
      )}
    </Field>
  );
}
