export const policy = (action: 'view' | 'manage', folder = false) => ({
  resource: {
    type: 'composite' as const,
    id: folder ? 'oa.knowledgeFolders' : 'oa.knowledgeDocuments',
  },
  action,
});
export interface Folder {
  id: string;
  parentId: string | null;
  title: string;
  version: number;
}
export interface Person {
  id: string;
  name: string;
}
export interface Document {
  id: string;
  folderId: string | null;
  title: string;
  ownerId: string;
  owner: Person;
  latestVersionId: string;
  version: number;
  active: boolean;
  departmentIds: string[];
  dutyRoleCodes: string[];
  updatedAt: string;
}
export interface Version {
  id: string;
  documentId: string;
  version: number;
  kind: 'markdown' | 'file';
  markdown: string | null;
  fileId: string | null;
  authorId: string;
  author: Person;
  createdAt: string;
}
export interface Detail {
  document: Document;
  versions: Version[];
}
export interface FileMetadata {
  id: string;
  filename: string;
  ext: string;
  mimeType: string;
  size: number;
  contentUrl: string;
}
export interface Option {
  id: string;
  title: string;
}
export interface Options {
  canCreate: boolean;
  canEdit: boolean;
  folders: Folder[];
  audience: {
    kind: 'department' | 'dutyRole';
    items: Option[];
    total: number;
    page: number;
    pageSize: number;
  };
  selected: { departments: Option[]; dutyRoles: Option[] };
  restrictedSelected: number;
}
export interface Context {
  reload: () => void;
}
export const selectWidth = 'w-auto min-w-40 max-w-[calc(100vw-2rem)]';
export const MAX_BYTES = 20 * 1024 * 1024;
export const ACCEPT = '.pdf,.docx,.xlsx,.pptx,.txt,.md,.png,.jpg,.jpeg,.webp';
