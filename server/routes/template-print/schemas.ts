import { z } from 'zod';
import { PRINT_SOURCES } from '../../providers/template-print/contract.js';
const id = z.string().uuid();
export const Params = z.object({ templateId: id }).strict();
export const RevisionParams = z
  .object({ templateId: id, revisionId: id })
  .strict();
export const ListQuery = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    source: z.enum(PRINT_SOURCES).optional(),
    mode: z.enum(['manage', 'use']).default('use'),
  })
  .strict();
export const DetailQuery = z
  .object({ mode: z.enum(['manage', 'use']).default('use') })
  .strict();
const requestKey = z.string().min(1).max(128);
export const CreateInput = z
  .object({
    name: z.string().trim().min(1).max(120),
    source: z.enum(PRINT_SOURCES),
    requestKey,
  })
  .strict();
export const UpdateInput = z
  .object({
    version: z.number().int().positive(),
    name: z.string().trim().min(1).max(120),
    active: z.boolean(),
    requestKey,
  })
  .strict();
export const UploadInput = z
  .object({
    version: z.coerce.number().int().positive(),
    requestKey,
    file: z.instanceof(File),
  })
  .strict();
export const RenderInput = z
  .object({
    recordId: z.string().min(1).max(64),
    revisionId: id.optional(),
    locale: z.enum(['zh-CN', 'en-US']),
  })
  .strict();
export const TemplateSchema = z.object({
  id,
  name: z.string(),
  source: z.enum(PRINT_SOURCES),
  active: z.boolean(),
  currentRevisionId: id.nullable(),
  version: z.number(),
  createdById: z.string(),
  createdBy: z.object({ id: z.string(), name: z.string() }),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
});
export const RevisionSchema = z.object({
  id,
  templateId: id,
  number: z.number(),
  contentHash: z.string(),
  paths: z.array(z.string()),
  schemaVersion: z.number(),
  createdById: z.string(),
  createdBy: z.object({ id: z.string(), name: z.string() }),
  createdAt: z.union([z.string(), z.date()]),
});
export const CommandSchema = z.object({
  record: TemplateSchema,
  revision: RevisionSchema.optional(),
});
export const DetailSchema = z.object({
  record: TemplateSchema,
  revisions: z.array(RevisionSchema),
  sourceReady: z.boolean(),
});
export const ListMeta = z.object({
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
});
