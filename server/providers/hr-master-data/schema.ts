import { z } from 'zod';
const id = z.string().trim().min(1).max(160);
const base = {
  externalId: id,
  revision: z.number().int().positive().max(2147483647),
  localId: z.string().min(1).max(255).optional(),
  operation: z.enum(['upsert', 'deactivate']),
};
export const Item = z.discriminatedUnion('entity', [
  z
    .object({
      ...base,
      entity: z.literal('department'),
      data: z
        .object({
          title: z.string().trim().min(1).max(255),
          code: id.nullable().optional(),
          parentExternalId: id.nullable().optional(),
          sortOrder: z.number().int().optional(),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      ...base,
      entity: z.literal('grade'),
      data: z
        .object({
          code: id,
          title: z.string().trim().min(1).max(255),
          rank: z.number().int(),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      ...base,
      entity: z.literal('employee'),
      data: z
        .object({
          userId: z.string().min(1).max(255).optional(),
          code: id,
          name: z.string().trim().min(1).max(128),
          status: z.enum(['probation', 'regular']).optional(),
          managerExternalId: id.nullable().optional(),
          departmentExternalId: id.optional(),
          gradeExternalId: id.nullable().optional(),
          phone: z.string().max(100).nullable().optional(),
          email: z.string().max(255).nullable().optional(),
          workLocation: z.string().max(255).nullable().optional(),
        })
        .strict(),
    })
    .strict(),
]);
export const Batch = z
  .object({
    source: z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}$/),
    eventId: id,
    items: z.array(Item).min(1).max(100),
  })
  .strict();
export type BatchInput = z.infer<typeof Batch>;
export type SyncItem = z.infer<typeof Item>;
export const Source = z
  .object({
    id: z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}$/),
    name: z.string().trim().min(1).max(160),
    principalId: z.string().min(1).max(255),
    active: z.boolean(),
  })
  .strict();
