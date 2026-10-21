import { createServiceToken } from '@nocobase/service-provider';
import type { DatabaseConnection, RepositoryPolicy } from '@nocobase/db';
export interface KnowledgeFolder {
  id: string;
  parentId: string | null;
  title: string;
  version: number;
}
export interface KnowledgeDocument {
  id: string;
  folderId: string | null;
  title: string;
  ownerId: string;
  latestVersionId: string;
  version: number;
  active: boolean;
  departmentIds: string[];
  dutyRoleCodes: string[];
  updatedAt: Date | string;
}
export interface KnowledgeVersion {
  id: string;
  documentId: string;
  version: number;
  kind: 'markdown' | 'file';
  markdown: string | null;
  fileId: string | null;
  authorId: string;
  createdAt: Date | string;
}
export interface KnowledgeSnapshot {
  documentId: string;
  title: string;
  versionId: string;
  version: number;
}
export interface KnowledgeWrite {
  actorId: string;
  requestKey: string;
  id?: string;
  expectedVersion?: number;
  title: string;
  folderId: string | null;
  departmentIds: string[];
  dutyRoleCodes: string[];
  kind: 'markdown' | 'file';
  markdown?: string;
  fileId?: string;
}
export const KNOWLEDGE_DOCUMENT_FIELDS = [
  'id',
  'folderId',
  'title',
  'ownerId',
  'latestVersionId',
  'version',
  'active',
  'departmentIds',
  'dutyRoleCodes',
  'updatedAt',
] as const;
export interface KnowledgeListQuery {
  page: number;
  pageSize: number;
  q?: string;
  folderId?: string | null;
  orderBy?:
    | 'updatedAt:asc'
    | 'updatedAt:desc'
    | 'title:asc'
    | 'title:desc'
    | 'version:asc'
    | 'version:desc';
}
export interface KnowledgeFileMetadata {
  id: string;
  filename: string;
  ext: string;
  mimeType: string;
  size: number;
}
export interface KnowledgeService {
  listPage(
    actorId: string,
    tx: DatabaseConnection,
    policy: RepositoryPolicy,
    query: KnowledgeListQuery,
  ): Promise<{ items: KnowledgeDocument[]; total: number }>;
  versionFile(
    documentId: string,
    versionId: string,
    actorId: string,
    tx: DatabaseConnection,
    policy: RepositoryPolicy,
    versionPolicy: RepositoryPolicy,
  ): Promise<KnowledgeFileMetadata>;

  visible(
    actorId: string,
    document: KnowledgeDocument,
    tx: DatabaseConnection,
  ): Promise<boolean>;
  list(
    actorId: string,
    tx: DatabaseConnection,
    policy: RepositoryPolicy,
  ): Promise<KnowledgeDocument[]>;
  detail(
    id: string,
    actorId: string,
    tx: DatabaseConnection,
    policy: RepositoryPolicy,
    versionPolicy: RepositoryPolicy,
  ): Promise<{ document: KnowledgeDocument; versions: KnowledgeVersion[] }>;
  save(
    input: KnowledgeWrite,
    tx: DatabaseConnection,
    policy: RepositoryPolicy,
    versionPolicy: RepositoryPolicy,
    folderPolicy: RepositoryPolicy,
  ): Promise<KnowledgeDocument>;
  saveFolder(
    input: {
      actorId: string;
      requestKey: string;
      id?: string;
      expectedVersion?: number;
      parentId: string | null;
      title: string;
    },
    tx: DatabaseConnection,
    policy: RepositoryPolicy,
  ): Promise<KnowledgeFolder>;
  folders(
    tx: DatabaseConnection,
    policy: RepositoryPolicy,
  ): Promise<KnowledgeFolder[]>;
  upload(
    actorId: string,
    file: File,
    requestKey: string,
  ): Promise<{
    id: string;
    filename: string;
    ext: string;
    mimeType: string;
    size: number;
  }>;
  content(
    documentId: string,
    versionId: string,
    actorId: string,
    tx: DatabaseConnection,
    policy: RepositoryPolicy,
    versionPolicy: RepositoryPolicy,
  ): Promise<{ bytes: Buffer; filename: string; mimeType: string }>;
  snapshotForAnnouncement(
    input: { documentId: string; actorId: string },
    tx: DatabaseConnection,
    policy: RepositoryPolicy,
  ): Promise<KnowledgeSnapshot>;
  compareAnnouncementVersion(
    input: { documentId: string; versionId: string; actorId: string },
    tx: DatabaseConnection,
    policy: RepositoryPolicy,
  ): Promise<{
    visible: boolean;
    hasNewVersion: boolean;
    latest?: KnowledgeSnapshot;
  }>;
}
export const knowledgeServiceToken = createServiceToken<KnowledgeService>(
  'oa/knowledge-service',
);
