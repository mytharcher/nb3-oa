import { z } from 'zod';
export const Params = z.object({ id: z.uuid() }).strict();
export const Input = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().max(10000),
    startAt: z.iso.datetime({ offset: true }),
    endAt: z.iso.datetime({ offset: true }),
  })
  .strict();
export const Edit = Input.extend({
  expectedVersion: z.int().positive(),
}).strict();
export const Remove = z
  .object({ expectedVersion: z.int().positive() })
  .strict();
export const Schedule = z
  .object({
    id: z.uuid(),
    ownerUserId: z.string(),
    owner: z.object({ id: z.string(), name: z.string() }),
    title: z.string(),
    description: z.string(),
    startAt: z.iso.datetime(),
    endAt: z.iso.datetime(),
    version: z.int().positive(),
  })
  .strict();
