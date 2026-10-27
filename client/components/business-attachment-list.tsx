import { useState } from 'react';
import { XIcon } from 'lucide-react';
import { Button } from './ui/button.js';
import { useTranslation } from '@nocobase/i18n/client';
import { AttachmentList, type AttachmentLabels } from './attachment-list.js';
import {
  FilePreviewDialog,
  type FileRecord,
} from '../extensions/nocobase-file-component-ui/index.js';
import { resolveFilePreviewKind } from '../extensions/nocobase-file-component-ui/lib/file-preview.js';
import { resolveSafeFileUrl } from '../extensions/nocobase-file-component-ui/lib/file-url.js';

/** Business endpoints omit storage credentials. Older consumers also omit optional
 * preview metadata from their TS types; preserve it when returned by the server. */
export interface BusinessAttachment {
  readonly id: string;
  readonly filename: string;
  readonly ext?: string;
  readonly contentUrl: string;
  readonly mimeType?: string;
  readonly size?: number | string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

function previewRecord(file: BusinessAttachment): FileRecord {
  const ext = file.ext?.replace(/^\./u, '') ?? '';
  const filename =
    ext && !file.filename.toLowerCase().endsWith(`.${ext.toLowerCase()}`)
      ? `${file.filename}.${ext}`
      : file.filename;
  return {
    ...file,
    filename,
    ext,
    // These unused storage/time fields are never persisted or used to build URLs.
    disk: '',
    key: '',
    createdAt: file.createdAt ?? '',
    updatedAt: file.updatedAt ?? '',
    mimeType: file.mimeType ?? '',
    size: file.size ?? 0,
  };
}

/** Presentation only: callers still own metadata authorization, selection and uploads. */
export function BusinessAttachmentList({
  files,
  onRemove,
}: {
  readonly files: readonly BusinessAttachment[];
  readonly onRemove?: (id: string) => void;
}) {
  // Replacing a selection or its content closes the old preview, including requests
  // in flight; the file recipe owns aborting fetches and disposing its viewers.
  return (
    <AttachmentView
      key={JSON.stringify(files)}
      files={files}
      onRemove={onRemove}
    />
  );
}

function AttachmentView({
  files,
  onRemove,
}: {
  readonly files: readonly BusinessAttachment[];
  readonly onRemove?: (id: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const { t: fileText } = useTranslation('@nocobase/app-plugin-file');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const records = files.map(previewRecord);
  const safe = records.filter((file) =>
    resolveSafeFileUrl(file.contentUrl ?? ''),
  );
  const initialIndex = safe.findIndex((file) => file.id === selectedId);
  // Editors opt into selection removal; read-only consumers expose no delete action.
  const labels: AttachmentLabels = {
    title: t('approvals.attachments'),
    images: t('attachmentList.images'),
    files: t('attachmentList.files'),
    preview: t('attachmentList.preview'),
    download: t('attachmentList.download'),
    previous: fileText('files.previous'),
    next: fileText('files.next'),
    pending: fileText('files.pending'),
    upload: fileText('files.chooseMany'),
    uploading: fileText('files.uploading'),
    remove: `${fileText('files.remove')} {name}`,
    removeTitle: fileText('files.remove'),
    removeDescription: fileText('files.remove'),
    removeConfirm: fileText('files.remove'),
    cancel: t('actions.cancel'),
  };
  return (
    <>
      <AttachmentList
        locale={i18n.language}
        labels={labels}
        files={safe.map((file) => ({
          id: file.id,
          name: file.filename,
          size: Number(file.size) > 0 ? Number(file.size) : undefined,
          url: resolveSafeFileUrl(file.contentUrl ?? '')!,
          downloadUrl: resolveSafeFileUrl(file.contentUrl ?? '')!,
          image: resolveFilePreviewKind(file) === 'image',
          canRemove: Boolean(onRemove),
        }))}
        onRemove={onRemove ? (file) => onRemove(file.id) : undefined}
        onPreview={(ordered, index) =>
          setSelectedId(ordered[index]?.id ?? null)
        }
      />
      {records
        .filter((file) => !resolveSafeFileUrl(file.contentUrl ?? ''))
        .map((file) => (
          <p
            key={file.id}
            className='group flex items-center gap-1 break-all text-sm text-muted-foreground'
          >
            {file.filename}: {fileText('invalidUrl')}
            {onRemove ? (
              <Button
                type='button'
                variant='ghost'
                size='icon-xs'
                className='shrink-0 [@media(hover:hover)]:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100'
                aria-label={`${fileText('files.remove')} ${file.filename}`}
                onClick={() => onRemove(file.id)}
              >
                <XIcon />
              </Button>
            ) : null}
          </p>
        ))}
      <FilePreviewDialog
        files={safe}
        open={initialIndex >= 0}
        initialIndex={Math.max(0, initialIndex)}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </>
  );
}
