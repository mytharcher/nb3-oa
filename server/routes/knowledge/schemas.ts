import { z } from 'zod';
export const Id = z.string().min(1).max(64);
export const ListQuery = z.strictObject({
  page: z.coerce.number().int().min(1).max(1000000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(200).optional(),
  folderId: z.union([Id, z.literal('root')]).optional(),
  orderBy: z
    .enum([
      'updatedAt:asc',
      'updatedAt:desc',
      'title:asc',
      'title:desc',
      'version:asc',
      'version:desc',
    ])
    .default('updatedAt:desc'),
});
export const OptionsQuery = z.strictObject({
  documentId: Id.optional(),
  kind: z.enum(['department', 'dutyRole']).default('department'),
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).max(1000000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export const AudienceOption = z.strictObject({ id: Id, title: z.string() });
export const FormOptions = z.strictObject({
  canCreate: z.boolean(),
  canEdit: z.boolean(),
  folders: z.array(
    z.strictObject({
      id: Id,
      parentId: Id.nullable(),
      title: z.string(),
      version: z.number(),
    }),
  ),
  audience: z.strictObject({
    kind: z.enum(['department', 'dutyRole']),
    items: z.array(AudienceOption),
    total: z.number().int(),
    page: z.number().int(),
    pageSize: z.number().int(),
  }),
  selected: z.strictObject({
    departments: z.array(AudienceOption),
    dutyRoles: z.array(AudienceOption),
  }),
  restrictedSelected: z.number().int(),
});
export const DocumentParams = z.strictObject({ id: Id });
export const ContentParams = z.strictObject({ id: Id, versionId: Id });
export const FolderInput = z.strictObject({
  requestKey: z.string().min(1).max(128),
  id: Id.optional(),
  expectedVersion: z.number().int().positive().optional(),
  parentId: Id.nullable(),
  title: z.string().trim().min(1).max(200),
});
export const SaveInput = z.strictObject({
  requestKey: z.string().min(1).max(128),
  id: Id.optional(),
  expectedVersion: z.number().int().positive().optional(),
  title: z.string().trim().min(1).max(200),
  folderId: Id.nullable(),
  departmentIds: z.array(Id).max(100),
  dutyRoleCodes: z.array(Id).max(100),
  kind: z.enum(['markdown', 'file']),
  markdown: z
    .string()
    .max(20 * 1024 * 1024)
    .optional(),
  fileId: Id.optional(),
});
export const Folder = z.strictObject({
  id: Id,
  parentId: Id.nullable(),
  title: z.string(),
  version: z.number(),
});
export const Person = z.object({ id: Id, name: z.string() });
export const Document = z.strictObject({
  owner: Person,
  id: Id,
  folderId: Id.nullable(),
  title: z.string(),
  ownerId: Id,
  latestVersionId: Id,
  version: z.number(),
  active: z.boolean(),
  departmentIds: z.array(Id),
  dutyRoleCodes: z.array(Id),
  updatedAt: z.union([z.string(), z.date()]),
});
export const Version = z.strictObject({
  author: Person,
  id: Id,
  documentId: Id,
  version: z.number(),
  kind: z.enum(['markdown', 'file']),
  markdown: z.string().nullable(),
  fileId: Id.nullable(),
  authorId: Id,
  createdAt: z.union([z.string(), z.date()]),
});
export const Detail = z.strictObject({
  document: Document,
  versions: z.array(Version),
});
export const File = z.strictObject({
  id: Id,
  filename: z.string(),
  ext: z.string(),
  mimeType: z.string(),
  size: z.number(),
});

export const Meta = z.object({
  total: z.number().int(),
  page: z.number().int().optional(),
  pageSize: z.number().int().optional(),
});
export const VersionFile = File.extend({ contentUrl: z.string() });

export const UploadInput = z.strictObject({
  file: z.custom<File>((v) => v instanceof globalThis.File),
  requestKey: z.string().min(1).max(128),
});
