import { BusinessAttachmentList } from '#components/business-attachment-list';
import { useEffect, useReducer, useState, useRef } from 'react';
import { useApiClient } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useAuthorizationRevision } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Label } from '#components/ui/label';
import { Checkbox } from '#components/ui/checkbox';
import { Failure, Loading } from './states.js';
import type { FileMetadata } from './types.js';
export function Attachments({
  announcementId,
  selected,
  change,
  disabled,
  uploadingChanged,
  uploaded,
}: {
  announcementId: string;
  selected: string[];
  change?: (ids: string[]) => void;
  disabled?: boolean;
  uploadingChanged?: (busy: boolean) => void;
  uploaded?: () => Promise<void>;
}) {
  const api = useApiClient(),
    { t } = useTranslation(),
    { session } = useAuthentication(),
    revision = useAuthorizationRevision();
  const [generation, reload] = useReducer((n: number) => n + 1, 0),
    [result, setResult] = useState<{
      key: string;
      data?: FileMetadata[];
      error?: unknown;
    }>();
  const selectedKey = JSON.stringify(selected);
  const key = JSON.stringify([
    announcementId,
    session?.user.id,
    revision,
    generation,
    selectedKey,
  ]);
  const [busy, setBusy] = useState(false),
    [uploadError, setUploadError] = useState<unknown>(),
    lockRef = useRef(false),
    controllerRef = useRef(new AbortController());
  useEffect(() => {
    controllerRef.current = new AbortController();
    return () => controllerRef.current.abort();
  }, []);
  useEffect(() => {
    const abort = new AbortController();
    api
      .request<{ data: FileMetadata[] }>({
        path: 'announcementAttachments/findMany',
        method: 'POST',
        headers: { 'x-announcement-id': announcementId },
        json: {
          limit: 10,
          sort: {
            kind: 'sort',
            version: 1,
            items: [{ kind: 'field', path: ['createdAt'], direction: 'desc' }],
          },
        },
        signal: abort.signal,
      })
      .then(
        async (r) => {
          const extras = await Promise.all(
            (JSON.parse(selectedKey) as string[])
              .filter((id) => !r.data.some((f) => f.id === id))
              .map((id) =>
                api.request<{ data: FileMetadata | null }>({
                  path: 'announcementAttachments/findOne',
                  method: 'POST',
                  headers: { 'x-announcement-id': announcementId },
                  json: { filter: { id } },
                  signal: abort.signal,
                }),
              ),
          );
          if (!abort.signal.aborted)
            setResult({
              key,
              data: [
                ...r.data,
                ...extras.flatMap((v) => (v.data ? [v.data] : [])),
              ],
            });
        },
        (error: unknown) => {
          if (!abort.signal.aborted) setResult({ key, error });
        },
      )
      .catch((error: unknown) => {
        if (!abort.signal.aborted) setResult({ key, error });
      });
    return () => abort.abort();
  }, [api, key, announcementId, selectedKey]);
  const current = result?.key === key ? result : undefined;
  async function upload(file: File) {
    if (lockRef.current || disabled || selected.length >= 10) return;
    if (
      file.size <= 0 ||
      file.size > 20 * 1024 * 1024 ||
      !['pdf', 'png', 'jpg', 'jpeg', 'txt'].includes(
        file.name.split('.').pop()?.toLowerCase() ?? '',
      )
    ) {
      setUploadError(new Error('file'));
      return;
    }
    lockRef.current = true;
    setBusy(true);
    uploadingChanged?.(true);
    setUploadError(undefined);
    try {
      const body = new FormData();
      body.append('file', file);
      const r = await api.request<{ data: { record: FileMetadata } }>({
        path: 'announcementAttachments/uploadOne',
        method: 'POST',
        headers: { 'x-announcement-id': announcementId },
        body,
        signal: controllerRef.current.signal,
      });
      if (controllerRef.current.signal.aborted) return;
      await uploaded?.();
      if (controllerRef.current.signal.aborted) return;
      change?.([...selected, r.data.record.id]);
      reload();
    } catch (e) {
      if (!controllerRef.current.signal.aborted) setUploadError(e);
    } finally {
      lockRef.current = false;
      if (!controllerRef.current.signal.aborted) {
        setBusy(false);
        uploadingChanged?.(false);
      }
    }
  }
  return (
    <section className='flex flex-col gap-3'>
      <h3 className='font-medium'>{t('announcements.attachments')}</h3>
      {change ? (
        <>
          <Label htmlFor='announcement-file'>{t('announcements.upload')}</Label>
          <Input
            id='announcement-file'
            type='file'
            accept='.pdf,.png,.jpg,.jpeg,.txt'
            disabled={disabled || busy || selected.length >= 10}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = '';
            }}
          />
          <p className='text-muted-foreground'>
            {t('announcements.fileLimit')}
          </p>
        </>
      ) : null}
      {busy ? <p role='status'>{t('announcements.uploading')}</p> : null}
      {uploadError ? <Failure error={uploadError} /> : null}
      {current?.error ? (
        <Failure error={current.error} retry={reload} />
      ) : !current ? (
        <Loading />
      ) : (
        current.data
          ?.filter((f) => !!change || selected.includes(f.id))
          .map((f) => (
            <div className='flex min-w-0 items-center gap-3' key={f.id}>
              {change ? (
                <Checkbox
                  aria-label={t('announcements.includeFile', {
                    name: f.filename,
                  })}
                  checked={selected.includes(f.id)}
                  disabled={disabled || busy}
                  onCheckedChange={(v) =>
                    change(
                      v
                        ? [...selected.filter((id) => id !== f.id), f.id]
                        : selected.filter((id) => id !== f.id),
                    )
                  }
                />
              ) : null}
              <BusinessAttachmentList files={[f]} />
            </div>
          ))
      )}
      {change ? (
        <Button
          type='button'
          variant='outline'
          disabled={busy || disabled}
          onClick={reload}
        >
          {t('announcements.refresh')}
        </Button>
      ) : null}
    </section>
  );
}
