import { useNavigate, useLocation, useParams } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { FilePreviewDialog } from '../../extensions/nocobase-file-component-ui/index.js';
import { RouteDialog } from '#components/route-dialog';
import { useKnowledgeResource } from './resource.js';
import { KnowledgeError, KnowledgeSkeleton } from './states.js';
import type { FileMetadata, Detail } from './types.js';
export default function KnowledgePreview() {
  const { documentId, versionId } = useParams(),
    location = useLocation(),
    navigate = useNavigate(),
    { t } = useTranslation();
  const r = useKnowledgeResource<{ data: FileMetadata }>(
      `knowledge/documents/${encodeURIComponent(documentId!)}/versions/${encodeURIComponent(versionId!)}/file`,
    ),
    f = r.data?.data,
    detail = useKnowledgeResource<{ data: Detail }>(
      `knowledge/documents/${encodeURIComponent(documentId!)}`,
    ),
    version = detail.data?.data.versions.find((v) => v.id === versionId);
  // Guarded business metadata only; File Repository upload URLs never reach this viewer.
  return !r.loading &&
    !r.error &&
    !detail.loading &&
    !detail.error &&
    f &&
    version ? (
    <FilePreviewDialog
      key={f.id}
      open
      files={[
        {
          ...f,
          disk: '',
          key: '',
          createdAt: version.createdAt,
          updatedAt: version.createdAt,
        },
      ]}
      onOpenChange={(open) => {
        if (!open)
          void navigate(
            { pathname: '..', search: location.search },
            { replace: true },
          );
      }}
      labels={{
        download: t('knowledge.download'),
        preview: t('knowledge.preview'),
      }}
    />
  ) : (
    <RouteDialog title={t('knowledge.preview')}>
      {r.error || detail.error ? (
        <KnowledgeError
          error={r.error || detail.error}
          retry={() => {
            r.reload();
            detail.reload();
          }}
        />
      ) : !r.loading && !detail.loading ? (
        <KnowledgeError error={undefined} unavailable />
      ) : (
        <KnowledgeSkeleton />
      )}
    </RouteDialog>
  );
}
