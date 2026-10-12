import { useEffect, useState } from 'react';
import { useApiClient } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useTranslation } from '@nocobase/i18n/client';
import { Input } from '#components/ui/input';
import { Button } from '#components/ui/button';
import { Alert, AlertDescription } from '#components/ui/alert';
import { ErrorState } from './states.js';
import { statusOf } from './types.js';
interface UnknownUpload {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}
const originalFiles = new Map<string, File>();
function unknownUpload(key: string): UnknownUpload | undefined {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as UnknownUpload) : undefined;
  } catch {
    return undefined;
  }
}
interface Photo {
  id: string;
  filename: string;
  ext?: string;
  contentUrl: string;
  size?: number;
}
export function Photos({
  requestId,
  ids,
  onChange,
  disabled,
  ensureDraft,
  onBusy,
  onDenied,
}: {
  requestId?: string;
  ids: string[];
  onChange?: (ids: string[]) => void;
  disabled?: boolean;
  ensureDraft?: () => Promise<string | undefined>;
  onBusy?: (v: boolean) => void;
  onDenied?: () => void;
}) {
  const { session } = useAuthentication();
  const actor = session?.user.id ?? '';
  const attemptKey = `oa:assetRequests:upload:${actor}:${requestId ?? 'new'}`;
  const api = useApiClient(),
    { t } = useTranslation();
  const [files, setFiles] = useState<Photo[]>([]),
    [error, setError] = useState<unknown>(),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [generation, setGeneration] = useState(0),
    [unknownFile, setUnknownFile] = useState<UnknownUpload | undefined>(() =>
      unknownUpload(attemptKey),
    );
  const [attemptScope, setAttemptScope] = useState(attemptKey);
  if (attemptScope !== attemptKey) {
    setAttemptScope(attemptKey);
    setUnknownFile(unknownUpload(attemptKey));
  }
  const idsKey = JSON.stringify(ids);
  const [loadedId, setLoadedId] = useState<string>();
  useEffect(() => {
    if (!requestId) return;
    const abort = new AbortController();
    api
      .request<{ data: Photo[] }>({
        method: 'POST',
        path: 'assetRequestPhotos/findMany',
        headers: { 'x-asset-request-id': requestId },
        json: { limit: 10 },
        signal: abort.signal,
      })
      .then(
        ({ data }) => {
          if (!abort.signal.aborted) {
            setLoadedId(requestId);
            setFiles(data);
            setError(undefined);
          }
        },
        (e) => {
          if (!abort.signal.aborted) {
            setFiles([]);
            setError(e);
            if ([401, 403].includes(statusOf(e) ?? 0)) onDenied?.();
          }
        },
      );
    return () => abort.abort();
  }, [api, requestId, idsKey, generation, onDenied]);
  async function upload(file: File) {
    if (busy || disabled || unknownFile) return;
    setMessage('');
    setError(undefined);
    if (
      !file.size ||
      file.size > 5 * 1024 * 1024 ||
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      ids.length >= 10
    ) {
      setMessage(t('assetRequests.photoLimit'));
      return;
    }
    setBusy(true);
    onBusy?.(true);
    let actualId = requestId;
    try {
      const id = requestId ?? (await ensureDraft?.());
      actualId = id;
      if (!id) return;
      const body = new FormData();
      body.append('file', file);
      const result = await api.request<{ data: { record: Photo } }>({
        method: 'POST',
        path: 'assetRequestPhotos/uploadOne',
        headers: { 'x-asset-request-id': id },
        body,
      });
      onChange?.([...ids, result.data.record.id]);
      setGeneration((g) => g + 1);
    } catch (e) {
      setError(e);
      if (!statusOf(e) || statusOf(e)! >= 500) {
        const key = `oa:assetRequests:upload:${actor}:${actualId ?? 'new'}`;
        const metadata = {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        };
        originalFiles.set(key, file);
        sessionStorage.setItem(key, JSON.stringify(metadata));
        setUnknownFile(metadata);
        setGeneration((g) => g + 1);
      }
      if ([401, 403].includes(statusOf(e) ?? 0)) {
        setFiles([]);
        sessionStorage.removeItem(attemptKey);
        originalFiles.delete(attemptKey);
        onDenied?.();
      }
    } finally {
      setBusy(false);
      onBusy?.(false);
    }
  }
  return (
    <div className='flex flex-col gap-2'>
      {onChange ? (
        <>
          <p className='text-sm text-muted-foreground'>
            {t('assetRequests.photoLimit')}
          </p>
          <Input
            id='asset-photos'
            type='file'
            accept='image/jpeg,image/png,image/webp'
            disabled={disabled || busy || !!unknownFile}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = '';
            }}
          />
        </>
      ) : null}
      {message ? (
        <Alert variant='destructive'>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <ErrorState error={error} retry={() => setGeneration((g) => g + 1)} />
      ) : null}
      {unknownFile ? (
        <Alert>
          <AlertDescription>
            {t('assetRequests.uploadUnknown', { name: unknownFile.name })}
          </AlertDescription>
        </Alert>
      ) : null}
      <ul className='flex flex-col gap-2'>
        {(loadedId === requestId ? files : [])
          .filter((f) => onChange || ids.includes(f.id))
          .map((f) => (
            <li className='flex flex-wrap items-center gap-2' key={f.id}>
              <a
                className='break-all text-primary underline'
                href={f.contentUrl}
                target='_blank'
                rel='noopener noreferrer'
              >
                {f.filename}
                {f.ext ? `.${f.ext}` : ''}
              </a>
              {onChange ? (
                <Button
                  variant='outline'
                  disabled={disabled || busy}
                  onClick={() => {
                    onChange(
                      ids.includes(f.id)
                        ? ids.filter((id) => id !== f.id)
                        : [...ids, f.id],
                    );
                    if (unknownFile) {
                      sessionStorage.removeItem(attemptKey);
                      originalFiles.delete(attemptKey);
                      setUnknownFile(undefined);
                      setError(undefined);
                    }
                  }}
                >
                  {t(
                    ids.includes(f.id)
                      ? 'assetRequests.removeSelection'
                      : 'assetRequests.selectPhoto',
                  )}
                </Button>
              ) : null}
            </li>
          ))}
      </ul>
    </div>
  );
}
