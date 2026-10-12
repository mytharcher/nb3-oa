import { z } from 'zod';
const id = z.string().min(1).max(64);
export const ListQuery = z.strictObject({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).default(''),
  enabled: z.enum(['all', 'true', 'false']).default('all'),
  sort: z.enum(['code', 'name', 'currentRevision']).default('code'),
  direction: z.enum(['asc', 'desc']).default('asc'),
});
export const Shift = z.strictObject({
  id,
  code: z.string(),
  name: z.string(),
  enabled: z.boolean(),
  currentRevision: z.number().int().positive(),
  version: z.number().int().nonnegative(),
});
export const ScheduleQuery = z.strictObject({
  departmentId: id,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  revision: z.coerce.number().int().positive().optional(),
});
export const Schedule = z.strictObject({
  id,
  departmentId: id,
  date: z.string(),
  version: z.number().int().nonnegative(),
  revision: z.strictObject({
    id,
    revision: z.number().int().positive(),
    shiftRevisionId: id.nullable(),
    restDay: z.boolean(),
    createdBy: z.strictObject({ id, name: z.string() }),
    reason: z.string(),
    createdAt: z.string().datetime(),
  }),
});

export const ShiftDefinition = z.strictObject({
  name: z.string().trim().min(1).max(200),
  timeZone: z.string().min(1).max(100),
  intervals: z
    .array(
      z.strictObject({
        start: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
        startDayOffset: z.union([z.literal(0), z.literal(1)]),
        end: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
        endDayOffset: z.union([z.literal(0), z.literal(1)]),
      }),
    )
    .min(1)
    .max(16),
  lateToleranceMinutes: z.number().int().safe().nonnegative(),
  earlyToleranceMinutes: z.number().int().safe().nonnegative(),
  absenceThresholdMinutes: z.number().int().safe().positive(),
});
export const SaveShift = z.strictObject({
  id: id.optional(),
  code: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/),
  definition: ShiftDefinition,
  enabled: z.boolean(),
  expectedVersion: z.number().int().nonnegative().max(2147483646).nullable(),
  reason: z.string().trim().min(1).max(2000),
});
export const SaveSchedule = ScheduleQuery.omit({ revision: true }).extend({
  shiftRevisionId: id.nullable(),
  restDay: z.boolean(),
  expectedVersion: z.number().int().nonnegative().max(2147483646).nullable(),
  reason: z.string().trim().min(1).max(2000),
});
export const RevisionQuery = z
  .strictObject({
    id: id.optional(),
    shiftId: id.optional(),
    revision: z.coerce.number().int().positive().optional(),
  })
  .refine((v) =>
    v.id ? !v.shiftId && !v.revision : !!v.shiftId && !!v.revision,
  );
export const ShiftRevision = ShiftDefinition.extend({
  id,
  shiftId: id,
  revision: z.number().int().positive(),
  createdBy: z.strictObject({ id, name: z.string() }),
  createdAt: z.string().datetime(),
});

export const ConfigurationContext = z.strictObject({ timeZone: z.string() });

export const ShiftParams = z.strictObject({ shiftId: id });
export const CurrentShift = z.strictObject({
  shift: Shift,
  revision: ShiftRevision,
});

export const IngestBatch = z.strictObject({
  rows: z
    .array(
      z.strictObject({
        userId: id,
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        punchKind: z.enum(['in', 'out']),
        punchedAt: z.string().max(100).nullable(),
        source: z.string().min(1).max(200),
        sourceKey: z.string().min(1).max(200),
        sourceData: z.record(z.string(), z.unknown()),
      }),
    )
    .min(1)
    .max(1000),
});
export const IngestReceipt = z.strictObject({
  recordIds: z.array(id),
  count: z.number().int().positive(),
});
