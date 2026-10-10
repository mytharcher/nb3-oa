import { z } from 'zod';

import {
  IMPORT_ERROR_CODES,
  IMPORT_KINDS,
  type ImportKind,
  type ImportReport,
  type ImportRowError,
  type ImportRun,
  type ImportRunDetail,
} from '../../providers/import/index.js';

// Each exported schema is annotated with the value it describes, so a documented response cannot drift from what the
// import service returns.

export const ImportKindSchema: z.ZodType<ImportKind> = z
  .enum(IMPORT_KINDS)
  .meta({
    ref: 'ImportKind',
    description:
      'What a workbook holds: `departments`, `positions`, `grades`, `employees` (archives) or `dutyRoleMembers`.',
  });

export interface TemplateParams {
  readonly kind: ImportKind;
}
export const TemplateParams: z.ZodType<TemplateParams> = z.object({
  kind: ImportKindSchema,
});

export interface ImportRunParams {
  readonly runId: string;
}
export const ImportRunParams: z.ZodType<ImportRunParams> = z.object({
  runId: z.string().min(1).max(64),
});

export interface ListImportRunsQuery {
  readonly kind?: ImportKind | undefined;
  readonly order?: 'asc' | 'desc' | undefined;
  readonly page: number;
  readonly pageSize: number;
}
export const ListImportRunsQuery: z.ZodType<ListImportRunsQuery> = z.object({
  kind: ImportKindSchema.optional(),
  order: z
    .enum(['asc', 'desc'])
    .optional()
    .meta({ description: 'By start time; `desc` (newest first) by default.' }),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const counts = {
  rowCount: z.number().int().meta({ description: 'Data rows read.' }),
  createdCount: z.number().int(),
  updatedCount: z.number().int(),
  unchangedCount: z.number().int(),
  errorCount: z.number().int().meta({
    description: 'Every problem found; `errors` lists the first 200.',
  }),
};

export const ImportRowErrorSchema: z.ZodType<ImportRowError> = z
  .object({
    row: z
      .number()
      .int()
      .nullable()
      .meta({ description: 'Excel row number; `null` for the whole file.' }),
    column: z.string().nullable().meta({ description: 'Column key.' }),
    header: z
      .string()
      .nullable()
      .meta({ description: "The column's header in the template." }),
    code: z.enum(IMPORT_ERROR_CODES),
    value: z.string().optional(),
    params: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
  })
  .meta({ ref: 'ImportRowError' });

export const ImportReportSchema: z.ZodType<ImportReport> = z
  .object({
    kind: ImportKindSchema,
    result: z.enum(['ok', 'invalid']).meta({
      description:
        '`ok`: the file applies as a whole; `invalid`: it has errors and nothing is written.',
    }),
    ...counts,
    errors: z.array(ImportRowErrorSchema),
  })
  .meta({ ref: 'ImportReport' });

const runFields = {
  id: z.string(),
  kind: ImportKindSchema,
  status: z.enum(['succeeded', 'failed']),
  filename: z.string(),
  file: z
    .object({
      id: z.string(),
      size: z.number(),
      contentUrl: z.string().meta({
        description:
          'Downloads the workbook as uploaded; needs the same `settings:oa.import` `read`.',
      }),
    })
    .nullable(),
  actor: z.object({ id: z.string(), name: z.string() }).nullable(),
  ...counts,
  createdAt: z.iso.datetime(),
  finishedAt: z.iso.datetime(),
};

export const ImportRunSchema: z.ZodType<ImportRun> = z
  .object(runFields)
  .meta({ ref: 'ImportRun' });

export const ImportRunDetailSchema: z.ZodType<ImportRunDetail> = z
  .object({ ...runFields, errors: z.array(ImportRowErrorSchema) })
  .meta({ ref: 'ImportRunDetail' });

export const PageMeta: z.ZodType<{
  total: number;
  page: number;
  pageSize: number;
}> = z.object({
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

/** The `multipart/form-data` body of the preview and import routes, as the API document shows it. */
export const ImportUploadBody: {
  type: 'object';
  required: string[];
  properties: Record<
    string,
    { type: 'string'; enum?: string[]; format?: string; description: string }
  >;
} = {
  type: 'object',
  required: ['kind', 'file'],
  properties: {
    kind: {
      type: 'string',
      enum: [...IMPORT_KINDS],
      description: 'What the workbook holds.',
    },
    file: {
      type: 'string',
      format: 'binary',
      description:
        'An `.xlsx` workbook of at most 5 MiB, laid out as the template.',
    },
  },
};
