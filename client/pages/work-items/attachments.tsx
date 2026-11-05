import { FileUploadInput } from '#components/file-upload-input';
import { BusinessAttachmentList } from '#components/business-attachment-list';
import { useEffect, useRef, useState } from 'react';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { Button } from '#components/ui/button';
import { Failure, Loading } from './states.js';
interface FileRecord {
  id: string;
  filename: string;
  ext: string;
  contentUrl: string;
}
export function Attachments({ id, ids }: { id: string; ids: string[] }) {
  const api = useApiClient(),
    { t } = useTranslation(),
    [r, setR] = useState<{
      key: string;
      files?: FileRecord[];
      error?: unknown;
    }>();
  const key = JSON.stringify([id, ids]);
  useEffect(() => {
    if ((JSON.parse(key) as [string, string[]])[1].length === 0) return;
    const controllerRef = new AbortController();
    api
      .request<{ data: FileRecord[] }>({
        method: 'POST',
        path: 'workItemAttachments/findMany',
        headers: { 'x-work-item-id': id },
        json: {
          filter: {
            kind: 'filter',
            version: 1,
            root: {
              kind: 'group',
              logic: 'or',
              items: (JSON.parse(key) as [string, string[]])[1].map(
                (value) => ({
                  kind: 'condition',
                  path: ['id'],
                  operator: '$eq',
                  value,
                }),
              ),
            },
          },
          limit: 10,
        },
        signal: controllerRef.signal,
      })
      .then(
        ({ data }) => {
          if (!controllerRef.signal.aborted) setR({ key, files: data });
        },
        (error) => {
          if (!controllerRef.signal.aborted) setR({ key, error });
        },
      );
    return () => controllerRef.abort();
  }, [api, id, key]);
  if (!ids.length) return <span>—</span>;
  if (r?.key !== key) return <Loading />;
  if (r.error) return <Failure error={r.error} />;
  return (
    <>
      <BusinessAttachmentList
        files={ids.flatMap(
          (id) => r.files?.find((file) => file.id === id) ?? [],
        )}
      />
      {ids
        .filter((id) => !r.files?.some((file) => file.id === id))
        .map((id) => (
          <p key={id}>{t('workItems.fileMissing')}</p>
        ))}
    </>
  );
}
export function AttachmentEditor({
  id,
  ids,
  onChange,
  disabled,
  onBusy,
}: {
  id?: string;
  ids: string[];
  onChange: (ids: string[]) => void;
  disabled: boolean;
  onBusy: (busy: boolean) => void;
}) {
  const api = useApiClient(),
    { t } = useTranslation(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(),
    lockedRef = useRef(false),
    controllerRef = useRef(new AbortController());
  useEffect(() => {
    const c = new AbortController();
    controllerRef.current = c;
    return () => c.abort();
  }, []);
  async function upload(file: File) {
    if (lockedRef.current || disabled || !id) return;
    if (
      !file.size ||
      file.size > 20 * 1024 * 1024 ||
      ids.length >= 10 ||
      !['pdf', 'png', 'jpg', 'jpeg', 'txt'].includes(
        file.name.split('.').at(-1)?.toLowerCase() ?? '',
      )
    ) {
      setError(new Error('file'));
      return;
    }
    lockedRef.current = true;
    setBusy(true);
    onBusy(true);
    setError(undefined);
    try {
      const body = new FormData();
      body.append('file', file);
      const { data } = await api.request<{ data: { record: FileRecord } }>({
        method: 'POST',
        path: 'workItemAttachments/uploadOne',
        headers: { 'x-work-item-id': id },
        body,
        signal: controllerRef.current.signal,
      });
      if (!controllerRef.current.signal.aborted) {
        await api.request({
          path: `workItems/${id}`,
          signal: controllerRef.current.signal,
        });
        if (controllerRef.current.signal.aborted) return;
        onChange([...ids, data.record.id]);
      }
    } catch (e) {
      if (!controllerRef.current.signal.aborted) setError(e);
    } finally {
      if (!controllerRef.current.signal.aborted) {
        lockedRef.current = false;
        setBusy(false);
        onBusy(false);
      }
    }
  }
  return (
    <div className='flex flex-col gap-3'>
      <p className='text-sm text-muted-foreground'>
        {t(id ? 'workItems.fileLimit' : 'workItems.saveBeforeUpload')}
      </p>
      <FileUploadInput
        aria-label={t('workItems.upload')}
        accept='.pdf,.png,.jpg,.jpeg,.txt'
        disabled={disabled || busy || !id || ids.length >= 10}
        onFileChange={(file) => void upload(file)}
      />
      {busy ? <p role='status'>{t('workItems.uploading')}</p> : null}
      {error ? <Failure error={error} /> : null}
      {id ? <Attachments id={id} ids={ids} /> : null}
      {ids.map((fileId, index) => (
        <Button
          key={fileId}
          variant='outline'
          disabled={disabled || busy}
          onClick={() => onChange(ids.filter((v) => v !== fileId))}
        >
          {t('workItems.removeFile', { number: index + 1 })}
        </Button>
      ))}
    </div>
  );
}
